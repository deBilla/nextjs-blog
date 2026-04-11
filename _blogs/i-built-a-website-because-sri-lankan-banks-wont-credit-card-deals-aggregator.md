---
title: "I Built a Website Because Sri Lankan Banks Won't (Credit Card Deals Aggregator)"
date: "2025-10-07"
readTime: "4 min"
preview: "Tired of missing credit card promotions in Sri Lanka, I scraped 50 bank websites and built CardPromotions.org — using Python, Playwright, and local AI."
mediumUrl: "https://python.plainenglish.io/i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator-1c265f63f9a4"
---

Every developer has that "WTF" moment — that moment of pure, unadulterated frustration with a problem so annoying that you finally decide: "Fine. I'll just build it myself." For me, that moment arrived, repeatedly, at the dinner table.

Picture this: You're at a restaurant in Sri Lanka. The bill arrives. You have three credit cards in your wallet, and you have **no idea** which one gives you a discount here. It's a guessing game, every single time.

## The Actual Problem: A Digital Scavenger Hunt

Credit card promotions in Sri Lanka are everywhere. Restaurants, shopping, movies, travel — you name it. But they're scattered across **50 different bank websites**, each designed like it's still 2008.

Every time I wanted to know "which card should I use?", my routine was maddening:
- Open five browser tabs.
- Click through three poorly labeled menus.
- Pray the promotion was still valid, because expiration dates are often buried deep or just wrong.

## Web Scraping Hell + Local AI to the Rescue

Every single bank website was a unique nightmare. Some hid promotions in PDFs. Some used complex JavaScript rendering. One bank literally had their deals listed as text within an **image file**.

So I wrote a Python scraper. Then I wrote fifty Python scrapers.

At some point I thought: "What about using AI to extract structured data from these messy HTML pages?" I looked into commercial AI APIs. $0.02 per call, times 50 banks, times debugging a hundred times? No.

So I downloaded [Llama 3](https://llama.meta.com/llama3/) and ran it locally on my laptop.

And it worked! Mostly. Llama 3 could read chaotic HTML pages and give me clean JSON data. Except sometimes it got creative — like when it called a 25% discount "a generous spiritual offering." Or when it confidently asserted that "Bank of Ceylon might be fictional."

## It Actually Works

After two weeks of chaos, spaghetti code, AI hallucinations, and more coffee than I care to admit: [CardPromotions.org](https://www.cardpromotions.org/).

You pick your credit cards and it shows you every single promotion you qualify for. No more tab-hopping. No more missed deals.

Is the code perfect? Absolutely not. Will I have to maintain this collection of scrapers forever, playing whack-a-mole with bank website updates? Probably. But does it save me money every week? **Absolutely.**

## The Takeaway

Not perfect code. Not elegant architecture. Just solving a real, tangible problem that annoyed me (and likely thousands of other Sri Lankans).

Build messy stuff that actually works. Sometimes the most impactful projects come from solving your own "WTF" moments.

---

*[Read the full article on Medium](https://python.plainenglish.io/i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator-1c265f63f9a4)*
