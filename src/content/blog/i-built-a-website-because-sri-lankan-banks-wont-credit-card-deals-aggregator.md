---
title: "I Built a Website Because Sri Lankan Banks Won't (Credit Card Deals Aggregator)"
date: "2025-10-07"
preview: "Tired of missing credit card promotions in Sri Lanka, I scraped 50 bank websites and built CardPromotions.org — using Python, Playwright, and local AI."
description: "Scraping 50 Sri Lankan bank sites with Python, Playwright, and a local LLM to build a credit card promotions aggregator — and what broke along the way."
tags: ["python", "scraping", "side-projects"]
mediumUrl: "https://python.plainenglish.io/i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator-1c265f63f9a4"
---
**Tired of missing credit card promotions in Sri Lanka, I scraped 50 bank websites and built CardPromotions.org — using Python, Playwright, and local AI. Here’s how it went wrong (and right).**

Every developer has that one “WTF” moment. That moment of pure, unadulterated frustration with a problem so annoying, so persistent, that you finally decide: “Fine. I’ll just build it myself.” For me, that moment arrived, repeatedly, at the dinner table.

Picture this: You’re at a restaurant in Sri Lanka. The bill arrives. You have three credit cards in your wallet, and you have **NO idea** which one gives you a discount here. Do they take Amex? What about Commercial Bank? It’s a guessing game, every single time.

![Before-and-after comparison: on the left a shopper faces a wall of bank promotion pages holding a fan of credit cards, on the right the CardPromotions.org dashboard lists the matching offers for a single chosen card.](./images/i-built-a-website-because-sri-lankan-banks-wont-credit-card-deals-aggregator/cardpromotions-before-after.png)

## The Actual Problem: A Digital Scavenger Hunt

Credit card promotions in Sri Lanka are everywhere. Restaurants, shopping, movies, travel — you name it. But here’s the catch: they’re scattered across **50 different bank websites**, each one designed like it’s still 2008.

Every time I wanted to know “which card should I use?”, my routine was maddening:

- Open five browser tabs.
- Click through three poorly labeled menus.
- And then, pray the promotion was still valid, because expiration dates are often buried deep or just plain wrong.

More often than not, I’d give up. I’d use the wrong card, miss a 20% discount, and kick myself later. The sheer mental overhead of managing these deals was enough to make me just… not bother.

## The Solution (That Became a Problem)

My thought process was simple: What if there was **ONE website** that showed ALL the credit card deals in Sri Lanka? You’d just select your cards, and it would tell you exactly where to use them.

The plan seemed straightforward:

- Get the data from bank websites.
- Put it in a searchable database.
- Build a clean UI.
- Never miss a discount again.

_Record scratch._

“Getting that data from 50 banks…” That was Step One. And it took two weeks of my life.

## Web Scraping Hell + AI to the “Rescue”

Every single bank website was a unique nightmare.

- Some hid promotions in PDFs that were impossible to parse.
- Some used complex JavaScript rendering that standard scrapers choked on.
- One bank literally had their deals listed as text within an **image file**. Yes, an image file.

So, I wrote a Python scraper. Then I wrote fifty Python scrapers. Because every single bank was different, requiring a bespoke approach. My code became a sprawling, messy testament to digital frustration.

At some point, I thought, “You know what would be smart? Using AI to extract structured data from these messy HTML pages.” I looked into commercial AI APIs for this task. Until I saw the price: $0.02 per call. Times 50 banks. Times debugging a hundred times because web pages change. Yeah, no. That budget would evaporate faster than a freebie discount.

So, I did what any self-respecting developer on a mission would do: I downloaded [Llama 3](https://llama.meta.com/llama3/) and ran it locally on my laptop.

And it worked! Mostly.

Llama 3, running right on my machine, could read those chaotic HTML pages and give me clean JSON data. It was a revelation! Except, sometimes it got… creative. Like when it called a 25% discount “a generous spiritual offering.” Or when it confidently asserted that “Bank of Ceylon might be fictional.” It certainly added some comedic relief to the debugging process.

## It Actually Works! (Mostly)

After two weeks of chaos, spaghetti code, AI hallucinations, and more coffee than I care to admit, I finally finished it.

Introducing [CardPromotions.org](https://www.cardpromotions.org/).

You pick your credit cards, and it shows you every single promotion you qualify for. Restaurants, shopping, travel — everything. No more tab-hopping. No more missed deals.

Is the code perfect? Absolutely not. Will I have to maintain this sprawling collection of scrapers forever, playing whack-a-mole with bank website updates? Probably. But does it save me money every week and eliminate a major source of personal annoyance? **Absolutely.**

And honestly? That’s what matters. Not perfect code. Not elegant architecture. Just solving a real, tangible problem that annoyed me (and likely thousands of other Sri Lankans).

## The Takeaway: Build Messy Stuff That Works

So yeah, that’s CardPromotions.org. Built out of pure frustration. Powered by Python, Playwright, Llama 3 running locally, and way too much coffee.

If you’re in Sri Lanka and you’re tired of missing credit card deals, check it out.

If you’re a developer who’s tired of “perfect” being the enemy of “done” — I encourage you to build messy stuff that actually works. Sometimes, the most impactful projects come from solving your own infuriating “WTF” moments.

**I’m Billa — this was my WTF moment. Subscribe for more chaotic projects that actually solve things.**

🔗 Visit [https://www.cardpromotions.org/](https://www.cardpromotions.org/)

#python #webscraping #ai #srilanka #creditcards #developer #llama3 #sideproject #codingstory
