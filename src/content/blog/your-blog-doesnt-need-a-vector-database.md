---
title: "Your blog doesn't need a vector database"
date: "2026-08-20"
preview: "I wanted to ask my own archive questions. The obvious 2026 answer is embeddings, a vector store and an LLM on top — so I measured the corpus first, and the numbers made all three look ridiculous…"
description: "Search over 97 posts in 160KB with no model and no server: what measuring the corpus first changes, and the three bugs that cost the most time."
tags: ["ai", "llm", "architecture"]
---

I have five years of posts on this site and I could not answer questions about my own writing. Not "where is the Bento4 article" — I can find that. More like "what was that yt-dlp flag that fixed Instagram playback", where I know I wrote it down, I know roughly when, and finding it means opening four tabs and using Ctrl+F on each.

The obvious 2026 answer is RAG. Chunk the posts, embed them, put the vectors in a store, retrieve on query, hand the passages to a model, get an answer. Every tutorial ends there, and every one of them ends with an API key and a monthly bill.

Before building any of it I measured the corpus. That is the whole story of this post, because the numbers made most of that architecture look ridiculous.

---

## 97 posts is not a big data problem

Here is the entire corpus:

- **97 posts**
- **102,504 words**
- **804 passages** after chunking at roughly 110 words

Now price the "proper" solution against that. MiniLM embeddings at 384 dimensions, quantised to int8, come to **0.3 MB** for all 804 passages. Scoring a query against them is 804 dot products of 384 dimensions — about 300,000 multiply-adds. That is **under a millisecond** in plain JavaScript.

So what exactly would the vector database be doing? HNSW indexes, IVF partitioning, the entire approximate-nearest-neighbour field exists because you cannot afford to compare against every vector when you have ten million of them. I have eight hundred. An approximate index would let me skip work that takes less time than the animation frame it happens inside.

The honest data structure for this problem is a flat array and a `for` loop. Anything else is architecture you carry forever to solve a problem you do not have.

This is the part people skip. "Vector database" has become the default noun in that sentence, so the question of whether the corpus needs one never gets asked. Measure first and most personal sites land in the same place mine did: three orders of magnitude below where the interesting engineering starts.

---

## Then I removed the model too

If the storage layer was overkill, the next question was whether I needed embeddings at all — and after that, whether I needed a generative model.

The second question has a hard answer. **Without an LLM you cannot synthesise.** You can retrieve the passage that answers the question and show it verbatim; you cannot rephrase it to match how the question was asked, combine two posts into one answer, or handle a follow-up. That's not a limitation to design around. That *is* the difference between retrieval and generation.

Which means the honest product is not a chatbot, and the most important decision I made was refusing to draw one. The moment there is a chat bubble on the page, someone types "what should I use for video transcoding?" and expects prose. They get a paragraph from 2023 that mentions ffmpeg, and it reads as broken.

Framed instead as **"Ask the archive"** — you ask, you get the passage that answers it, quoted, with a link to where it came from — the same engine reads as sharp. Identical retrieval, opposite impression. The expectations you set are part of the system.

On embeddings: I skipped them for now too, because lexical search is far stronger on a technical corpus than its reputation suggests. My vocabulary is distinctive. Nobody searching "widevine" or "cfargotunnel" or "bento4" needs semantic matching — those words appear in exactly the posts they should. BM25 nails them. Where it will eventually lose is paraphrase: "how do I shrink video files" shares no words with a post about transcoding. That is the day I add static embeddings and fuse the rankings. Not before.

---

## Ship the text, not the index

First working version emitted the posting lists at build time and shipped them alongside the passages. Total: **262 KB gzipped**, split as 159 KB of passage text and 100 KB of posting lists.

Then I deleted the posting lists and rebuilt them in the browser on load. Indexing 804 passages takes **about 20 ms**. That trade — 20 ms of one-off CPU to avoid 100 KB of transfer — is obviously right on mobile, where 100 KB costs a lot more than 20 ms does.

But bandwidth is the smaller half of the win. The bigger one:

> An index built by a different tokeniser than the one asking the questions is the classic way for a search box to quietly return nothing.

If documents are tokenised at build time and queries at runtime, those are two code paths that must agree forever. Change the stemmer on one side and the box keeps working, just worse, with no error anywhere. Building both from one function in one place makes that failure impossible rather than unlikely.

The shipped file is now passages only: **546 KB raw, 160 KB gzipped**, fetched on first focus of the input rather than on page load, so visitors who never search pay nothing.

---

## The word "constructor" broke my index

First build after wiring it up:

```
TypeError: postings[term].push is not a function
```

The offending line is one most of us have written a hundred times:

```js
(postings[term] ??= []).push([i, tf]);
```

Nullish assignment only assigns when the left side is `null` or `undefined`. On a plain object, `postings["constructor"]` is neither — it resolves up the prototype chain to `Object.prototype.constructor`, a perfectly real function. So no array gets created, and `.push` explodes.

I write about object-oriented design. The word "constructor" is all over this corpus, along with "prototype" and "toString". A `Map` fixes it in one character of thought:

```js
const list = postings.get(term);
if (list) list.push([i, tf]);
else postings.set(term, [[i, tf]]);
```

What makes this worth writing down is how it fails on the other side. A crash during the build is the *lucky* outcome. Had my code used a plain `if (!postings[term])` guard instead, the lookup would have silently returned a function, the term would have been dropped, and I'd have shipped an index that just never matches certain words — with nothing in any log to explain why.

---

## "Where does he work now" is not a search query

I also index the public part of my résumé, so questions about my work get answered rather than ignored. Testing that is where the design actually got hard.

"where does he work now" returned a five-year-old post about uploading files to Cloud Storage.

Look at what BM25 has to work with. Strip stopwords and the query is roughly `work`, `now`. The word "work" appears in hundreds of my posts, so its IDF is close to nothing. The correct answer — one short passage naming my current employer — is competing against 800 documents that use the same low-value term more often. **On term statistics alone, the right answer cannot win, and no amount of tuning changes that.**

My first fix was a score multiplier on résumé passages. It moved "what is his current job" to the right answer and left "where does he work now" still wrong, which is the signature of a hack: it fixes the example you tested and not the class of problem.

So I stopped fighting the ranking and changed the rule instead. Detect that the *question* is about a person — `job`, `role`, `employer`, `experience`, `hire`, `skills`, `background` — and when it is, the résumé answer takes the top slots outright, with related writing underneath. Predictable beats clever. A visitor asking about my experience should get the same answer every time, not one that depends on how many times the word "work" appears in a post from 2021.

Then that fix produced its own bug. I'd triggered the behaviour whenever a résumé passage appeared anywhere in the results, and one of my project entries mentions Kafka — so "kafka saga pattern", a pure content question, started answering with "see my resume". A non-sequitur, from a rule that was right in spirit and wrong in trigger. The signal has to come from the question's intent, never from what happened to match.

---

## One passage per post

Last thing testing caught. Asking about Kubernetes returned three results, all from the same article — three consecutive chunks of one post, each perfectly relevant.

Three passages from one post is one answer wearing three hats. Deduplicating to the best passage per document turned that into three different posts, and the result list went from repetitive to genuinely useful in about four lines of code.

Retrieval quality is not only about ranking the right thing first. It is also about what the other slots do.

---

## What it costs

- **160 KB gzipped**, lazy-loaded on first focus
- **~20 ms** to index 804 passages in the browser
- **0.05–1.5 ms** per query
- **$0/month**, no API key, no server, nothing to rotate or renew
- Queries never leave the browser, and it works offline once loaded

There is no vendor in that list, which means there is nothing to shut down, deprecate, or start charging for. The most valuable property of the whole thing is that I will not have to think about it again.

And it is not a dead end. The index is the expensive part and it is model-agnostic: static embeddings can be fused in later for paraphrase queries, or the same retrieved passages can be handed to an LLM the day I want real synthesis. Neither requires rebuilding what exists.

---

The lesson I'd keep is smaller than the architecture debate. **Measure the corpus before choosing the tools.** Every default in 2026 points toward a model, a vector store and a monthly bill, and for a hundred thousand words those defaults are three orders of magnitude away from the actual problem.

Reach for the model last. Sometimes the answer is 160 KB and a `for` loop.
