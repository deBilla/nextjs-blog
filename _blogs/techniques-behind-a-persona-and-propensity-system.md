---
title: "From Raw Events to Per-User Intelligence: The Techniques Behind a Persona & Propensity System"
date: "2026-07-06"
readTime: "12 min"
preview: "A field guide to the techniques that turn billions of behavioural events into per-user personas and forward-looking scores — identity resolution, RFM, quantile bucketing, time-share archetyping, temporal validation, leakage control, and transparent composite scoring."
---

Most consumer products sit on a mountain of behavioural data and almost no understanding of the individual people generating it. You have events — sessions, screen views, purchases, streaks — but a stakeholder doesn't want events. They want to know *who this person is*, *what they use the product for*, *whether they'll pay*, and *whether they're about to leave*.

Bridging that gap is a stack of techniques, not a single model. This is a field guide to the ones that matter, in the order you actually apply them: resolve identity, build features, describe, predict, and activate. None of it is product-specific — these techniques transfer to any app with users and events.

## Layer 0: Identity resolution — the unglamorous prerequisite

Before any modelling, you need to answer a deceptively hard question: *who is a person?*

Analytics platforms key events on an anonymous device/client identifier. Your application database keys on a canonical account ID. One human generates both — across multiple devices, reinstalls, and logged-out sessions. If you skip this step, you double-count, you fragment histories, and every downstream metric is quietly wrong.

The technique is to build an **identity spine**: a table with exactly one row per *person*, unifying the two id spaces. The core move is resolving each anonymous id to an account id where one exists, then choosing a stable key:

```sql
-- one row per anonymous id, resolving to the most recent known account
resolved_account_id =
  ARRAY_AGG(account_id IGNORE NULLS ORDER BY event_date DESC LIMIT 1)[SAFE_OFFSET(0)]

-- keep everyone: known users collapse to their account, anonymous keep their device id
person_key = COALESCE(resolved_account_id, anonymous_id)
is_anonymous = resolved_account_id IS NULL
```

Two design choices are worth calling out. First, `COALESCE` to the anonymous id means you *keep* logged-out users instead of dropping them — they're usually the top of your funnel and often the majority. Second, resolving to the **most recent** non-null account id (rather than the first) handles shared devices and account switches sanely.

The output is a single grain — one row per `person_key` — that everything else joins to. Get this wrong and no amount of modelling saves you.

## Layer 1: The feature store — entity-centric aggregation

Once you can name a person, you describe them with **features**: one wide row per person, assembled from many sources.

The technique that keeps this sane is **pre-aggregate, then join**. Each source is collapsed to one row per entity *before* joining, so a person who has 400 sessions contributes one row, not 400:

```sql
quran_activity AS (
  SELECT account_id,
         COUNT(DISTINCT session_id) AS sessions,
         SUM(duration_seconds)      AS seconds
  FROM sessions GROUP BY account_id
)
-- then: spine LEFT JOIN quran_activity USING (account_id)
```

The subtle trap here is **join-key coverage**. If your behavioural tables key on the account id but your engagement-time table keys on the anonymous id, they cover *different populations*. Anonymous users will have engagement time but null behavioural counts. That's not a bug to hide — it's a real property to document, because it dictates which signals exist for which users. Always know, per feature, which key it joins on and therefore who it can describe.

A good feature store is also **grain-disciplined**: `LEFT JOIN` from the spine (never inner, or you silently drop people), and `COALESCE(..., 0)` the numeric features so "no activity" reads as zero, not null.

## The descriptive layer: RFM, the technique that refuses to die

With features in hand, the first question is *how engaged is this person?* The oldest answer is still one of the best: **RFM — Recency, Frequency, Monetary.**

- **Recency** — how long since they were last active. The single strongest predictor of whether someone comes back.
- **Frequency** — how often they engage (e.g. distinct active days in a window).
- **Monetary** — how much value they represent (spend, or a proxy).

RFM endures because it's cheap, interpretable, and shockingly predictive. You don't need a neural network to know that someone who was active on 200 days and opened the app yesterday is more valuable than someone last seen 8 months ago. Two columns capture most of the signal:

```sql
recency_days  = DATE_DIFF(as_of_date, last_active_date, DAY)   -- R
active_days   = COUNT(DISTINCT active_date)                    -- F
```

Note `as_of_date`, not `CURRENT_DATE()` — more on that later. Recency measured against the wrong anchor is a classic silent error.

## Quantile bucketing: turning numbers into tiers

Raw RFM numbers aren't a story; *tiers* are. The technique for converting a continuous metric into labelled tiers is **quantile bucketing** — rank the population and cut it into equal-sized groups:

```sql
r_q = NTILE(4) OVER (ORDER BY recency_days DESC)  -- quartile 4 = most recent
f_q = NTILE(4) OVER (ORDER BY active_days ASC)    -- quartile 4 = most active

tier = CASE
  WHEN r_q >= 3 AND f_q = 4 THEN 'Power'
  WHEN r_q >= 3 AND f_q = 3 THEN 'Core'
  WHEN r_q >= 2             THEN 'Casual'
  ELSE 'Dormant'
END
```

The key decision is **relative vs absolute thresholds**, and it's a real tradeoff:

- **Quantile (relative) tiers** self-calibrate to your population — you always get a well-sized "top" group, no matter how the base shifts. The cost: the definition *moves*. A "Power user" this month may need more activity than last month, so the bar isn't stable over time.
- **Absolute thresholds** ("Power = 60+ active days") are stable and easy to explain to a business, but they drift out of calibration as the product grows and can leave buckets lopsided.

There's no universally right answer — but you must *choose deliberately* and tell your stakeholders which one they're looking at. A tier whose definition silently moves between refreshes will burn you in a review.

One more nuance: **partition your quantiles** when a subgroup would otherwise dominate. If 80% of your base is anonymous, quantiles computed over everyone are meaningless for the 20% that matter. Computing `NTILE(...) OVER (PARTITION BY is_anonymous ...)` ranks each cohort against its own kind.

## Time-share archetyping: what someone actually does

Engagement tier tells you *how much*; archetype tells you *what for*. The technique here is **time-share (or "dominant activity") classification** — label each person by the feature they spend the most engagement time on:

```sql
archetype = CASE
  WHEN reading_seconds  = GREATEST(reading_seconds, social_seconds, media_seconds) THEN 'Reader'
  WHEN social_seconds   = GREATEST(reading_seconds, social_seconds, media_seconds) THEN 'Social'
  WHEN media_seconds    = GREATEST(reading_seconds, social_seconds, media_seconds) THEN 'Viewer'
  ELSE 'Minimal'
END
```

This is a deliberate choice of **transparent rules over black-box clustering**. K-means on feature vectors would also produce groups, but nobody can explain to a marketer why user X landed in cluster 3. An arg-max over time spent is trivially explainable — "they spend most of their time reading, so they're a Reader" — and explainability is what gets a segmentation *adopted*.

Two refinements make it robust: **overrides** for signals that have no time component (someone enrolled in a course is a "Learner" regardless of screen time), and a **fallback** for users with no recent time signal at all (classify them by raw counts instead of returning null).

## The predictive layer: propensity with gradient-boosted trees

Descriptive labels answer "what are they." Propensity models answer "what next" — *will this person convert? churn?* For tabular, per-user features, **gradient-boosted decision trees** are the reliable workhorse. They handle mixed numeric/categorical inputs, non-linear interactions, and missing values without heavy preprocessing, and they consistently outperform deep learning on this kind of structured data.

You frame each question as **binary classification** producing a probability: `P(converts)`, `P(churns in next 30 days)`. But *how* you build the training set is where most projects quietly fail. Two forms of leakage will give you a beautiful model that's useless in production.

### Trap 1: target leakage

Target leakage is when a feature encodes the answer. If you're predicting who will subscribe and you leave "subscription entitlement" in the feature set, the model learns the tautology "subscribers are subscribers" and scores 0.99 — then falls apart on the free users you actually wanted to rank. **Exclude every feature that is a consequence or definition of the label.** If a column would only be known *because* the outcome happened, it can't be an input.

### Trap 2: temporal leakage

Behaviour predicting the future must respect time. If you predict 30-day churn but compute features over a window that overlaps the label period, you're using the future to predict the future. The fix is a **temporal training frame**: pick a cutoff, build features from *before* it, and define the label from *after* it.

```
cutoff date ──────────────►
[  features: activity up to cutoff  ] | [ label window: active in next 30d? ]
        (inputs)                              (outcome: churned = not active)
```

At scoring time you slide the same construction to the present: features up to today, and the model projects the label forward. This "look at the past, check what actually happened later" discipline is the difference between a model that predicts and one that merely describes.

### Class imbalance

Churners and converters are usually rare — maybe 5–10% of the population. Trained naively, a model can score everyone "won't convert," be 92% accurate, and be worthless. **Class weighting** (up-weighting the minority class during training) forces the model to care about the rare positives. Most gradient-boosting implementations expose this as a single flag.

## Evaluating honestly: held-out data and ROC-AUC

A model's score on its own training data is marketing, not measurement. Evaluate on a **held-out split** the model never saw during training. And for imbalanced classification, don't report accuracy — report **ROC-AUC**.

AUC has a clean interpretation: it's the probability that the model ranks a random true-positive above a random true-negative. 0.5 is a coin flip; 1.0 is perfect. An AUC of 0.85 means that ~85% of the time, the model correctly orders a converter above a non-converter. That framing matters because propensity scores are almost always used to *prioritise* — "who do we contact first" — and ranking quality is exactly what AUC measures. Accuracy answers a question you're not asking.

## The activation layer: from scores to a decision

A probability isn't an action. The last set of techniques turns scores into something a team can *use*.

### Transparent composite scoring

Alongside the models, it's worth having one **model-free, fully transparent index** — a "value score" — that anyone can audit. The technique is **percentile normalization plus a weighted blend**: convert each raw metric to a 0–1 percentile rank (so scales are comparable), then combine with explicit weights.

```sql
eng_pct   = PERCENT_RANK() OVER (ORDER BY active_days)
depth_pct = PERCENT_RANK() OVER (ORDER BY total_time)

value_score = ROUND(100 * (0.45*eng_pct + 0.25*depth_pct + 0.30*monetization))
```

Because the weights are visible, this survives the "how was this computed?" question in a way a boosted tree can't. Keep both: the model for predictive power, the transparent index for trust.

### Decile ranking

To hand a team a targeting list, rank the population into **deciles** on the relevant score (`NTILE(10)`). "Decile 10 on conversion propensity" is an instantly actionable instruction, and plotting average outcome by decile is also a free model sanity check — a monotonic ladder means the model is ranking correctly.

### Rule-based next-best-action routing

Finally, collapse everything — the two probabilities plus current state — into **one recommended action per person** via priority-ordered rules:

```
if is_anonymous                         -> Activate
if is_paying AND churn_risk high        -> Protect       (defend revenue)
if free  AND conversion_propensity high -> Upsell
if was_paying AND lapsed                -> Win back
else                                    -> Nurture
```

The ordering encodes business priority (protecting revenue outranks nurturing), and "exactly one action per person" is what makes the output operational rather than another dashboard.

## Cross-cutting: the disciplines that make it trustworthy

Two practices run through every layer.

**Point-in-time snapshots.** Anchor everything to an explicit *as-of date* — typically `MAX(event_date)` of your source — not the wall clock. Recency, windows, and labels all measure against that anchor. This makes builds reproducible (re-running gives the same answer) and prevents the subtle bug where "days since last active" quietly changes just because the clock ticked. A snapshot is a frozen, complete recomputation, stamped with the date it ran.

**In-warehouse ELT.** Notice that nearly every technique above is expressible in SQL — quantiles, arg-max, percentile blends, even the tree models via in-database ML. Keeping the whole pipeline in the warehouse means one source of truth, no data movement, and the same query runs in exploration and in production. Pair it with cost discipline (partitioned scans, dry-run byte estimates, hard byte caps) and the platform stays cheap as it scales.

## The meta-lesson

There's no single algorithm behind per-user intelligence. It's a **layered pipeline** — identity, features, description, prediction, activation — where each layer has a technique matched to its job, and the boring layers (identity, point-in-time discipline) protect the interesting ones. Favour **explainable methods** where a human has to trust the output, reserve **learned models** for genuine prediction, and keep both **reproducible** by building against a fixed snapshot.

Do that, and a mountain of events becomes something far more useful: a clear answer to *who is this person, and what should we do next.*
