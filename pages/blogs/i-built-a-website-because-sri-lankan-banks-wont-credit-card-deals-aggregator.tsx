import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import data from "../../data/portfolio.json";

const Article: React.FC = () => {
  return (
    <>
      <Head>
        <title>I Built a Website Because Sri Lankan Banks Won’t (Credit Card Deals Aggregator) — {data.name}</title>
        <meta name="description" content="
Tired of missing credit card promotions in Sri Lanka, I scraped 50 bank websites and built CardPromotions.org — using Python, Playwright, and local AI. Here’s " />
      </Head>

      <div className="bg-glow" />
      <div className="bg-glow-2" />

      <div className="relative z-10">
        <Navbar />

        <article className="max-w-3xl mx-auto px-6 pt-6 pb-20">
          <Link href="/blogs">
            <a className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to blogs
            </a>
          </Link>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {["codingstorytime","ai","llama-3","side-project","python"].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            I Built a Website Because Sri Lankan Banks Won’t (Credit Card Deals Aggregator)
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>October 7, 2025</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>4 min read</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <a href="https://python.plainenglish.io/i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator-1c265f63f9a4?source=rss-46f1692aa552------2" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
              Read on Medium
            </a>
          </div>

          <div
            className="mt-8 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(var(--accent), 0.3), transparent)",
            }}
          />

          <div
            className="markdown-class"
            dangerouslySetInnerHTML={{ __html: `
<p><strong>Tired of missing credit card promotions in Sri Lanka, I scraped 50 bank websites and built CardPromotions.org — using Python, Playwright, and local AI. Here’s how it went wrong (and right).</strong></p>
<p>Every developer has that one “WTF” moment. That moment of pure, unadulterated frustration with a problem so annoying, so persistent, that you finally decide: “Fine. I’ll just build it myself.” For me, that moment arrived, repeatedly, at the dinner table.</p>
<p>Picture this: You’re at a restaurant in Sri Lanka. The bill arrives. You have three credit cards in your wallet, and you have <strong>NO idea</strong> which one gives you a discount here. Do they take Amex? What about Commercial Bank? It’s a guessing game, every single time.</p>
<figure><img alt="" src="https://cdn-images-1.medium.com/max/1024/1*B9gyt7D-ne3Xc7a_kUTG8w.png"/></figure><h3>The Actual Problem: A Digital Scavenger Hunt</h3>
<p>Credit card promotions in Sri Lanka are everywhere. Restaurants, shopping, movies, travel — you name it. But here’s the catch: they’re scattered across <strong>50 different bank websites</strong>, each one designed like it’s still 2008.</p>
<p>Every time I wanted to know “which card should I use?”, my routine was maddening:</p>
<ul>
<li>Open five browser tabs.</li>
<li>Click through three poorly labeled menus.</li>
<li>And then, pray the promotion was still valid, because expiration dates are often buried deep or just plain wrong.</li>
</ul>
<p>More often than not, I’d give up. I’d use the wrong card, miss a 20% discount, and kick myself later. The sheer mental overhead of managing these deals was enough to make me just… not bother.</p>
<h3>The Solution (That Became a Problem)</h3>
<p>My thought process was simple: What if there was <strong>ONE website</strong> that showed ALL the credit card deals in Sri Lanka? You’d just select your cards, and it would tell you exactly where to use them.</p>
<p>The plan seemed straightforward:</p>
<ol>
<li>Get the data from bank websites.</li>
<li>Put it in a searchable database.</li>
<li>Build a clean UI.</li>
<li>Never miss a discount again.</li>
</ol>
<p><em>Record scratch.</em></p>
<p>“Getting that data from 50 banks…” That was Step One. And it took two weeks of my life.</p>
<h3>Web Scraping Hell + AI to the “Rescue”</h3>
<p>Every single bank website was a unique nightmare.</p>
<ul>
<li>Some hid promotions in PDFs that were impossible to parse.</li>
<li>Some used complex JavaScript rendering that standard scrapers choked on.</li>
<li>One bank literally had their deals listed as text within an <strong>image file</strong>. Yes, an image file.</li>
</ul>
<p>So, I wrote a Python scraper. Then I wrote fifty Python scrapers. Because every single bank was different, requiring a bespoke approach. My code became a sprawling, messy testament to digital frustration.</p>
<p>At some point, I thought, “You know what would be smart? Using AI to extract structured data from these messy HTML pages.” I looked into commercial AI APIs for this task. Until I saw the price: \$0.02 per call. Times 50 banks. Times debugging a hundred times because web pages change. Yeah, no. That budget would evaporate faster than a freebie discount.</p>
<p>So, I did what any self-respecting developer on a mission would do: I downloaded <a href="https://llama.meta.com/llama3/">Llama 3</a> and ran it locally on my laptop.</p>
<p>And it worked! Mostly.</p>
<p>Llama 3, running right on my machine, could read those chaotic HTML pages and give me clean JSON data. It was a revelation! Except, sometimes it got… creative. Like when it called a 25% discount “a generous spiritual offering.” Or when it confidently asserted that “Bank of Ceylon might be fictional.” It certainly added some comedic relief to the debugging process.</p>
<h3>It Actually Works! (Mostly)</h3>
<p>After two weeks of chaos, spaghetti code, AI hallucinations, and more coffee than I care to admit, I finally finished it.</p>
<p>Introducing <a href="https://www.cardpromotions.org/">CardPromotions.org</a>.</p>
<p>You pick your credit cards, and it shows you every single promotion you qualify for. Restaurants, shopping, travel — everything. No more tab-hopping. No more missed deals.</p>
<p>Is the code perfect? Absolutely not. Will I have to maintain this sprawling collection of scrapers forever, playing whack-a-mole with bank website updates? Probably. But does it save me money every week and eliminate a major source of personal annoyance? <strong>Absolutely.</strong></p>
<p>And honestly? That’s what matters. Not perfect code. Not elegant architecture. Just solving a real, tangible problem that annoyed me (and likely thousands of other Sri Lankans).</p>
<h3>The Takeaway: Build Messy Stuff That Works</h3>
<p>So yeah, that’s CardPromotions.org. Built out of pure frustration. Powered by Python, Playwright, Llama 3 running locally, and way too much coffee.</p>
<p>If you’re in Sri Lanka and you’re tired of missing credit card deals, check it out.</p>
<p>If you’re a developer who’s tired of “perfect” being the enemy of “done” — I encourage you to build messy stuff that actually works. Sometimes, the most impactful projects come from solving your own infuriating “WTF” moments.</p>
<p><strong>I’m Billa — this was my WTF moment. Subscribe for more chaotic projects that actually solve things.</strong></p>
<p>🔗 Visit <a href="https://www.cardpromotions.org/">https://www.cardpromotions.org/</a></p>
<p>#python #webscraping #ai #srilanka #creditcards #developer #llama3 #sideproject #codingstory</p>
<h3>A message from our Founder</h3>
<p><strong>Hey, </strong><a href="https://linkedin.com/in/sunilsandhu"><strong>Sunil</strong></a><strong> here.</strong> I wanted to take a moment to thank you for reading until the end and for being a part of this community.</p>
<p>Did you know that our team run these publications as a volunteer effort to over 3.5m monthly readers? <strong>We don’t receive any funding, we do this to support the community. ❤️</strong></p>
<p>If you want to show some love, please take a moment to <strong>follow me on </strong><a href="https://linkedin.com/in/sunilsandhu"><strong>LinkedIn</strong></a><strong>, </strong><a href="https://tiktok.com/@messyfounder"><strong>TikTok</strong></a>, <a href="https://instagram.com/sunilsandhu"><strong>Instagram</strong></a>. You can also subscribe to our <a href="https://newsletter.plainenglish.io/"><strong>weekly newsletter</strong></a>.</p>
<p>And before you go, don’t forget to <strong>clap</strong> and <strong>follow</strong> the writer️!</p>
<img src="https://medium.com/_/stat?event=post.clientViewed&amp;referrerSource=full_rss&amp;postId=1c265f63f9a4" width="1" height="1" alt=""/><hr/>
<p><a href="https://python.plainenglish.io/i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator-1c265f63f9a4">I Built a Website Because Sri Lankan Banks Won’t (Credit Card Deals Aggregator)</a> was originally published in <a href="https://python.plainenglish.io/">Python in Plain English</a> on Medium, where people are continuing the conversation by highlighting and responding to this story.</p>
` }}
          />
        </article>

        <div className="max-w-3xl mx-auto px-6">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Article;
