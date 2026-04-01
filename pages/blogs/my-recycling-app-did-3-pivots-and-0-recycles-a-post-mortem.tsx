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
        <title>My Recycling App Did 3 Pivots and 0 Recycles. A Post-Mortem. — {data.name}</title>
        <meta name="description" content="
I was gonna save the planet. With code.
Yeah, I know. Every developer has that one grand, world-changing idea they sketch out at 2 AM, fueled by cold pizza and" />
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
            {["failure","postmortem","recycling","product-market-fit"].map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            My Recycling App Did 3 Pivots and 0 Recycles. A Post-Mortem.
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-400 dark:text-gray-600">
            <span>October 12, 2025</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>4 min read</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <a href="https://billacode.medium.com/my-recycling-app-did-3-pivots-and-0-recycles-a-post-mortem-6430e4413f75?source=rss-46f1692aa552------2" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
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
<p>I was gonna save the planet. With code.</p>
<p>Yeah, I know. Every developer has that one grand, world-changing idea they sketch out at 2 AM, fueled by cold pizza and delusion. Mine was zylobin. The name was cool, the mission was noble: solve recycling.</p>
<p>The plan was brilliant. A full-stack, multi-platform, cloud-native, blockchain-ready (okay, maybe not blockchain) ecosystem to connect people who have trash with places that want trash.</p>
<p><strong>The </strong><strong>v0.1 Master Plan 🚀:</strong></p>
<ol>
<li>
<strong>A sleek mobile app for the People™:</strong> Users would religiously scan every plastic bottle and cardboard box, track their recycling stats like a high score, and feel smug about their carbon footprint. When it was time to drop off, they’d find a collection point on the map, scan a QR code on the bin, drop their stuff, and get rewarded with glorious, gamified points.</li>
<li>
<strong>A powerful dashboard for the Industry™:</strong> Recycling collection companies would log into their web portal, manage their fleet of bins across the city, update waste types, and see real-time analytics.</li>
</ol>
<p>It was a perfect two-sided marketplace. A beautiful, symbiotic relationship. The Uber for your garbage. What could possibly go wrong?</p>
<p>Well, step one of a two-sided marketplace is talking to… you know… <em>both sides</em>. And talking to actual collection companies sounded like phone calls. And meetings. And spreadsheets. It sounded a lot like <em>work</em>.</p>
<p>My developer brain found a much more elegant solution.</p>
<h3>The First Pivot: git commit -m "feat: make users do all the work"</h3>
<p>Why bother with businesses when you can just crowdsource it?</p>
<p>I yeeted the entire dashboard web app into the digital void. The new plan was simple: let users add the recycling bins to the map themselves. They could pin a location, add a photo, and report what kind of waste it accepts.</p>
<p>Brilliant, right? I just cut my workload in half. zylobin was no longer a complex B2B2C platform. It was now a Waze for trash cans. A bin finder.</p>
<p>The app went live. I waited for the downloads to pour in. And they… didn’t.</p>
<p>A few friends downloaded it, added the bin outside their apartment, and never opened the app again. I had built a solution to a problem that didn’t exist. People who are motivated enough to recycle <em>already know where the bins are</em>. People who aren’t motivated aren’t going to download an app to find one.</p>
<p>The app had exactly one use case: you’ve just moved to a new city, you’re holding a single empty bottle, and you’re irrationally passionate about not throwing it in a regular trash can. The total addressable market was maybe… 7 people.</p>
<h3>The Second Pivot: npm install more-features</h3>
<figure><img alt="" src="https://cdn-images-1.medium.com/max/524/1*UYZWOhtA6VBHJhmDomBGTQ.jpeg"/></figure><p>My app was failing. My user count was flatlining. My motivation was draining.</p>
<p>So I did what any good developer does when their product has zero market fit: I added more features.</p>
<p>If people don’t want a bin finder, maybe they want… a marketplace for their trash?</p>
<p>Yes. A “Waste Sharing Marketplace” was born. Users could now list their “gently used cardboard” or “artisanal glass bottles” for other users to claim. Maybe someone needed boxes for moving? Maybe a crafter needed bottle caps?</p>
<p>I went all in. I added a bidding system. User profiles. A rating system. A direct messaging feature. The codebase became a beautiful, tangled mess of spaghetti that would make an Italian chef weep.</p>
<p>zylobin was now a bin finder, a social network, and a Craigslist for garbage, all rolled into one confusing, bloated app that solved precisely zero problems for zero people.</p>
<h3>The Inevitable End: The rm -rf / of Motivation</h3>
<p>After months of coding features nobody asked for, for an app nobody needed, I finally burned out.</p>
<p>The project was dead. I stopped working on it. zylobin now sits in a private GitHub repo, a digital monument to my own hubris. It never processed a single piece of recycled waste.</p>
<h3>So, What Was the Actual Problem?</h3>
<p>Looking back, the failure was obvious. I was so in love with my <em>solution</em> that I never truly understood the <em>problem</em>. I coded for months without having a single real conversation with a user or a collection company.</p>
<p>If I were to start over, here’s what I would have done:</p>
<p><strong>GET OUT OF THE EDITOR.</strong> Forget the code. The first step is to go talk to the actual players.</p>
<ul>
<li>
<strong>Talk to Collection Companies:</strong> What sucks about their job? I’d bet my bottom dollar their problem isn’t “not enough people know where our bins are.” It’s probably something like:</li>
<li>“Our trucks waste fuel checking on empty bins.”</li>
<li>“Our bins are constantly overflowing before we can get to them.”</li>
<li>“People contaminate the recycling with actual garbage, costing us a fortune.”</li>
<li>
<strong>Talk to People:</strong> Why don’t they recycle more?</li>
<li>“I have no idea what’s actually recyclable.”</li>
<li>“It’s inconvenient.”</li>
<li>“Does it even make a difference?”</li>
</ul>
<p><strong>SOLVE ONE, TINY, PAINFUL THING.</strong> Instead of building an “ecosystem,” I could have built a single, razor-focused tool.</p>
<ul>
<li>
<strong>For companies:</strong> What if I built a simple system with cheap IoT sensors that just pings them when a bin is 80% full? That’s it. No user app. Just a dashboard that optimizes their truck routes, saving them thousands on fuel and time. <strong>That’s a product you can sell.</strong>
</li>
<li>
<strong>For people:</strong> What if the app did only one thing: you take a picture of an item, and it tells you “YES, RECYCLE” or “NO, TRASH.” Use a simple ML model. It solves the problem of confusion and contamination. <strong>That’s an app people might actually use.</strong>
</li>
</ul>
<p>The lesson is brutal and simple. Don’t build features. Build solutions. And you can’t build a solution until you leave your ergonomic chair, walk outside, and ask people what their problems are.</p>
<p>Otherwise, you’ll just end up like me, with a perfectly engineered, feature-rich app in a digital landfill.</p>
<img src="https://medium.com/_/stat?event=post.clientViewed&amp;referrerSource=full_rss&amp;postId=6430e4413f75" width="1" height="1" alt=""/>
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
