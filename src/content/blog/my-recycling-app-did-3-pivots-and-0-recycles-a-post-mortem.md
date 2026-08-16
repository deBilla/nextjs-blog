---
title: "My Recycling App Did 3 Pivots and 0 Recycles. A Post-Mortem."
date: "2025-10-11"
readTime: "4 min"
preview: "I was gonna save the planet. With code. Here's how zylobin failed spectacularly."
mediumUrl: "https://billacode.medium.com/my-recycling-app-did-3-pivots-and-0-recycles-a-post-mortem-6430e4413f75"
---

I was gonna save the planet. With code.

Yeah, I know. Every developer has that one grand, world-changing idea they sketch out at 2 AM, fueled by cold pizza and delusion. Mine was **zylobin**. The name was cool, the mission was noble: solve recycling.

The plan was a full-stack, multi-platform, cloud-native ecosystem to connect people who have trash with places that want trash.

**The v0.1 Master Plan:**
1. A sleek mobile app for users: scan bottles, track recycling stats, find collection points on a map.
2. A powerful dashboard for industry: recycling companies manage bins and see real-time analytics.

A beautiful two-sided marketplace. The Uber for garbage. What could possibly go wrong?

## The First Pivot: "Make users do all the work"

Why bother with businesses when you can crowdsource it? I scrapped the entire dashboard. The new plan: let users add recycling bins to the map themselves.

The app went live. I waited for downloads. They didn't come.

A few friends added the bin outside their apartment and never opened the app again. I had built a solution to a problem that didn't exist. People who are motivated enough to recycle *already know where the bins are*.

## The Second Pivot: npm install more-features

My user count was flatlining. So I did what any good developer does when their product has zero market fit: I added more features.

If people don't want a bin finder, maybe they want a **marketplace for their trash**? A "Waste Sharing Marketplace" was born. Users could list their gently used cardboard for other users to claim.

I added a bidding system. User profiles. A rating system. Direct messaging. The codebase became a beautiful, tangled mess of spaghetti.

zylobin was now a bin finder, a social network, and a Craigslist for garbage — all rolled into one confusing, bloated app that solved precisely zero problems.

## The Inevitable End

After months of coding features nobody asked for, I burned out. The project died. zylobin now sits in a private GitHub repo, a digital monument to hubris. It never processed a single piece of recycled waste.

## What I Should Have Done

I was so in love with my *solution* that I never truly understood the *problem*. I coded for months without having a single real conversation with a user or a collection company.

**GET OUT OF THE EDITOR.** Talk to collection companies first. Their real problems are probably: trucks wasting fuel checking empty bins, bins overflowing before they can get to them, contamination costing them money.

**SOLVE ONE, TINY, PAINFUL THING.** A cheap IoT sensor that pings companies when a bin is 80% full — that's a product you can sell. A photo-based "YES, RECYCLE / NO, TRASH" classifier — that's an app people might actually use.

The lesson is brutal and simple: **Don't build features. Build solutions.** And you can't build a solution until you leave your ergonomic chair, walk outside, and ask people what their problems are.

---

*[Read the full article on Medium](https://billacode.medium.com/my-recycling-app-did-3-pivots-and-0-recycles-a-post-mortem-6430e4413f75)*
