# Hormozi study log — VanguardOS landing

This file tracks one Hormozi "bite" per run so we never re-study and always advance.
(Reconstructed 2026-06-29: the file was missing/empty on disk. Prior runs applied,
across early-to-mid June: the Value Equation generally, the high-impact offer + value
stacking / $811 vs $129 anchoring, the 30-day guarantee / risk reversal, pain + avatar
+ cost-of-inaction framing, naming, and hooks/SEO. So the bottom-two of the Value
Equation, Time Delay and Effort, were the natural next bite.)

---

## 2026-06-29 — Value Equation: Time Delay + Effort & Sacrifice (the bottom two)
Source: Hormozi "$100M Offers" Value Equation, via creatoreconomy.so and uplify.ai summaries
(search 2026-06-29).

Value = (Dream Outcome x Perceived Likelihood) / (Time Delay x Effort & Sacrifice).

Takeaways (applied):
1. Most pages over-invest in the top of the equation (dream + proof) and ignore the
   bottom. The bottom is where the easy wins are: shrink Time Delay and Effort and the
   whole value number rises without touching price.
2. Time Delay = how long until the buyer sees the result. Name a fast, concrete first
   result and the time to value collapses. "Start Day 1 today" beats "in 5 days" because
   it moves first value to tonight.
3. Effort & Sacrifice = everything beyond money the buyer must give up: hours, energy,
   stress, learning curve. State the real, honest effort in small, swallowable units
   ("one focused sitting a day," "about six pages") so it reads as light, not scary.
4. Honesty raises Perceived Likelihood at the same time: a believable "8 to 12 hours
   across five days" is more persuasive than an unbelievable "effortless one-click."
5. Put the effort/time answer where the objection fires: in the hero subhead (first
   glance) and as its own FAQ (the moment they go looking).

Next bite: Speed-to-value / removing friction from the buyer's path (post-purchase
"what happens the moment you buy"), then $100M Leads hooks (more/better/new) for the
hero eyebrow.

---

## 2026-06-30 — Speed-to-value / removing friction from the buyer's path
Source: Hormozi "$100M Offers" Value Equation applications, via uplify.ai
(hormozi-value-equation-made-easy and alex-hormozi-offer-breakdown summaries; search
2026-06-30).

Takeaways (applied):
1. Friction at onboarding predicts friction throughout the engagement. The first steps
   after "buy" are where intent leaks out, so the page should pre-walk that path and make
   it feel frictionless before the click, not after.
2. Easy always wins. Make buying, starting, and succeeding feel simple. Show the buyer a
   short, concrete sequence ("pay, get the email, open Day 1") so the path reads as
   already-solved, lowering the Effort & Sacrifice term.
3. Speed to value: name the fast first result. Collapse Time Delay by showing first value
   arriving in the same sitting, not "someday after onboarding."
4. Ready-to-use beats build-from-scratch: emphasize that the system, templates, and prompts
   are handed over done, so the buyer's job is to run, not to assemble.
5. Put the path at the moment of decision (right after the guarantee, before the final CTA)
   so the last thing a hesitant buyer reads is how easy the next 10 minutes are.

Next bite: $100M Leads hooks (more/better/new) for the hero eyebrow, then the CLOSER /
value-first copy-order pass.

---

## 2026-07-01 — $100M Leads: hooks, "more, better, new," Hook-Retain-Reward
Source: web search on Hormozi's hook-writing method and the "more, better, new" scaling
multiplier (creator-economy summaries and a landing-page application piece; search
2026-07-01).

Takeaways (applied):
1. The hook is the first five seconds of attention. For an organic visitor, that is the
   literal search-result title and snippet, not the hero. A weak hook there means the buyer
   never reaches the on-page copy at all.
2. Winning pattern: "How to [dream outcome], even if [biggest insecurity]." The page's own
   H1 already nails this; the `<title>`/meta description did not, they were a flat, unhooked
   feature list, a weaker fallback hook living right next to a proven strong one.
3. Call out the specific avatar by name. The locked avatar language ("solopreneur paralyzed
   by all the steps") is a sharper hook than a generic "solopreneurs."
4. "More, better, new": once a hook works, repeat it in more places rather than inventing a
   second, weaker one per surface. Applied here by echoing the hero's exact hook into title,
   OG, Twitter, and schema description instead of writing each independently.
5. Naming the guarantee and price inside the hook description pre-qualifies the click,
   raising completed-purchase rate per click even when raw CTR is flat.

Next bite: CLOSER / value-first copy-order pass, checking the page reads problem → dream →
proof → offer → risk reversal → path in the optimal order.

---

## 2026-07-02 — C.L.O.S.E.R.: the sales-script copy order applied to the page

Source: web search on Alex Hormozi's C.L.O.S.E.R. framework (Clarify, Label, Overview,
Sell the vacation, Explain away concerns, Reinforce the decision), via Accelerator
University / Whatbox Digital summaries and Hormozi's own framework thread (search
2026-07-02). Direct landing-page mapping guidance was thin in the sources, so the mapping
below is my own application of the six beats to a one-page funnel.

Takeaways (applied):
1. C.L.O.S.E.R. is a live sales-call script, but its beat order maps cleanly to a landing
   page: Clarify (name the pain) should be immediately followed by Label (identify the
   serious, right-fit buyer) BEFORE Overview (what's actually included) and Sell (the
   dream). Labeling early raises commitment going into the pitch; labeling late, after the
   buyer already saw the full offer, is a weaker, redundant beat.
2. Auditing the live page found the Label beat (the "for you if / not for you if"
   qualification section) sitting AFTER Overview (offer-stack) and AFTER Brand Work proof,
   sandwiched awkwardly between Brand Work and the Five-Day Journey (Sell). That is
   C-O-Proof-L-S order, not C-L-O-S. Moved the qualification section to sit directly after
   the Problem section and before the offer reveal.
2b. A second, weaker Label beat existed further down (the "Built For" avatar-tap section),
   effectively re-qualifying a buyer who was already qualified once. Once real Labeling
   happens early, later avatar-selection UI should read as Sell (a personalized dream
   outcome), not a second qualification gate. Reframed its header copy accordingly rather
   than removing the interactive element.
3. Sell the vacation should cost the buyer nothing to see. Gating the personalized dream
   outcome behind a required click adds Effort for zero reason once the buyer has already
   scrolled past two Label beats. Defaulted the avatar promise panel to the locked primary
   avatar ("solopreneur paralyzed by all the steps") so the personalized sell renders on
   load; the buyer can still tap a different avatar to see their own.
4. Full-section reorders are the highest-risk edit type for a "small, focused" daily task:
   verified first that `.reveal` and section-scroll animations use per-element
   IntersectionObserver (order-independent) before moving anything, and confirmed no other
   part of the page anchors to the moved section by DOM position.

Next bite: continue the CLOSER pass (spot-check whether Overview/Sell/Explain/Reinforce
sub-order is now clean, e.g. whether the-math's second value-stack beat still earns its
place right before the guarantee) — or, if that reads clean on the next audit, move to
look-and-feel polish or Core Web Vitals (both still unstudied bites on the original
rotation).

---

## 2026-07-03 — Scarcity and urgency, HONEST only

Source: web search on Hormozi's `$100M Offers` scarcity/urgency framework (loxie.app,
minchowcoders.com, thepowermoves.com summaries; search 2026-07-03).

Takeaways:
1. Three legitimate levers: limited supply ("only N spots"), limited time ("price rises
   Friday"), limited bonuses ("first N buyers get X"). All three are real, checkable
   constraints, never a UI trick.
2. Honest scarcity outperforms fake scarcity over time; every claim must be true or it is
   the fastest way to destroy trust, especially for a brand voice built on premium, calm
   conviction rather than hype.
3. Scarcity (how many) and urgency (how long) are different levers; don't blur them into a
   vague "act now."
4. Audited the live page against this: it currently has zero fake urgency (good, matches
   the hard lock), but it also has none of the three real constraints, unlimited digital
   delivery, no announced price-increase date, no time-boxed bonus stack, so there is
   currently no honest scarcity/urgency lever available to pull.
5. Did not add scarcity/urgency copy this run since inventing any of the three would be
   fiction. Logged as a backlog idea for if/when a real constraint exists (e.g., if Jamil
   confirms the current $811 bonus stack is specific to this launch and future VanguardOS
   systems will ship their own stack, that would be an honest, checkable scarcity angle).

Next bite: Lead magnets / give-before-you-ask (the only remaining unstudied curriculum
item), or a second CLOSER audit pass if that reads higher-leverage first.
