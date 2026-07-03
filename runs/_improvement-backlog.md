# Improvement backlog — VanguardOS landing

Running list of done work + surfaced ideas. (Reconstructed 2026-06-29; file was missing.)

## Done (recent)
- 2026-07-03: Core Web Vitals bite. Hero `<h1>` (the page's actual LCP element) was gated
  behind `.hero-item`'s post-hydration JS opacity fade; pulled it out into its own
  `.hero-h1` class with a transform-only CSS keyframe (no opacity in the animation), so it
  paints at first frame regardless of JS timing. Also moved the Typography/Palette specimen
  modal's two Google Fonts/Fontshare families off a render-blocking `@import` (fetched on
  every pageview) onto a lazy `<link>` injected only when the specimen modal is first
  opened. Hormozi bite studied: honest scarcity/urgency, audited the page (currently has
  none of the three real levers: supply, time, or bonus caps) and deliberately did not
  invent fake urgency copy; logged as a future idea instead.
- 2026-07-02: CLOSER copy-order bite. Moved the "for-who" qualification section (Label)
  from after Brand Work/before Five-Day Journey to directly after Problem/before
  Offer-Stack, matching Clarify-then-Label-then-Overview. Reframed the "who" avatar
  section's header copy ("Built For" / "If any of these is you...") to "See Your Outcome"
  / "Tap your starting point, see your exact outcome" so it reads as Sell, not a second
  Label. Defaulted `selectedAvatar` to 1 (the locked "paralyzed solopreneur" avatar) so the
  personalized promise panel renders on load instead of behind a required click.
- 2026-07-01: $100M Leads hooks bite. Rewrote `<title>`/`og:title`/`twitter:title` and the
  three descriptions in `src/app.html` to echo the hero's proven "How to launch... even if
  you've never shipped anything before" hook plus the "paralyzed by planning" avatar
  call-out and the guarantee, up front; synced the Product JSON-LD `description` in
  `+page.svelte` to match. No pricing/FAQ changes.
- 2026-06-30: Speed-to-value bite. New "What happens the moment you buy" 3-step strip
  (check out / everything lands / open Day 1) after the guarantee, before the dormant
  block; matching "How do I get it after I pay?" FAQ (array + JSON-LD synced, 9 items).
- 2026-06-29: Time Delay + Effort bite. Hero subhead now states "one focused sitting a
  day"; final CTA adds "Instant access, start Day 1 today"; new "How much time does each
  day take?" FAQ (array + JSON-LD in sync).
- 2026-06-20: Tactile Day-5 outcome pills in hero; Offer return-policy + priceValidUntil
  JSON-LD; Organization schema.
- 2026-06-19: Bonus pile-on / stacked value math ($811 vs $129) hardened.
- 2026-06-18: Offer-stack value ledger; guarantee eyebrow.

## Resolved / now stale (no longer needed)
- ~~Social proof: swap in the first real testimonial~~ — DONE, sometime between 2026-07-02
  and 2026-07-03 (likely Jamil/Antigravity direct edit, not a scheduled run). The
  `#testimonials` section now has 3 real, verified-buyer quotes with a badge. Confirmed live
  on 2026-07-03.

## Ideas to pick from (next runs)
- Second CLOSER pass: spot-check whether the-math's value-stack recap (right before the
  guarantee) still earns its place, or whether it now reads as a third Overview beat after
  offer-stack and the avatar promise panel. Also re-check avatar selector default (2026-07-02)
  and Label move (2026-07-02) are actually lifting engagement once real data exists.
- Lead magnets / give-before-you-ask: the last unstudied item on the original Hormozi
  curriculum rotation. [NEXT BITE candidate]
- Honest scarcity/urgency (studied 2026-07-03, not applied): only becomes usable if Jamil
  confirms a real constraint exists, e.g. framing the current $811 bonus stack as specific
  to this launch, with future VanguardOS systems shipping their own separate stack. Do not
  apply without that confirmation, inventing it would be fake scarcity.
- Dead-but-live-looking Bundle Upsell Modal markup (found 2026-07-03): `{#if modalOpen}`
  modal (~lines 2092-2320) and its CSS are still in the file and unreachable (both
  remaining `openUpsell()` call sites are inside the `{#if false}` legacy block, so
  `modalOpen` can never flip true from anything a visitor can click), but the modal itself
  isn't wrapped in `{#if false}` or commented as dormant like the rest of the legacy
  content. Zero buyer-facing risk, but it's unnecessary CSS/JS weight on every pageview and
  contradicts the SKILL.md's "bundle upsell modal... fully removed" claim. Candidate for a
  dedicated cleanup pass (bigger diff than one daily "small, focused" run should attempt).
- Font brand-lock discrepancy (found 2026-07-03): SKILL.md hard-locks the body font as
  "Source Serif 4," but the live site's real body font (`tailwind.config.js` → `font-sans`)
  is Alegreya. Source Serif 4 only shows up as example content inside the Typography Pack
  specimen data. Needs Jamil's call: update the SKILL.md lock to Alegreya, or have a future
  run actually restore Source Serif 4 sitewide. Don't guess; don't touch fonts sitewide on
  a hunch.
- Refresh the `og-card.jpg` social image (and its alt text) to visually echo the current H1
  ("Your online business up and running in 5 days..."), still shows older hook wording.
- Consider giving the speed-to-value strip an id + an in-page anchor from the final CTA
  reassurance ("see how fast you start ↓") if it tests well.
- Avatar selector default A/B: default to the "paralyzed solopreneur" promise for
  non-clickers vs current neutral state.
- Core Web Vitals follow-up: the day-N mockup images and the radial-gradient hero
  background are still worth a pass (image weight / paint cost), now that the hero `<h1>`
  itself is fixed (2026-07-03).
- Swap real day-N.png mockups into the 5-Day Journey when they land (hooks ready).
- Consider a "time per day" micro-stat in the anchor strip (e.g. "~2 hrs/day").
- Add BreadcrumbList / sitewide nav schema for SEO entity confidence.

## Standing reminders
- SKILL.md still pins core value at $199 and core-split numbers; standing launch
  decision (memory: launch_decisions) overrides to $129 with the $811 split. Don't revert.
- Legacy 60-Minute / Bundle content lives dormant in `{#if false}` (lines ~1373-1880 as of
  2026-07-03; shifts slightly release to release). Keep dormant; never leak into rendered
  copy. Note: the Bundle Upsell Modal markup itself sits just outside that block and is
  reachable only in theory (see backlog idea above), treat it as dormant too, don't wire
  anything new into `openUpsell()`.
- SKILL.md's font brand lock (Source Serif 4) does not match the live site (Alegreya); see
  backlog idea above. Don't "fix" one to match the other without Jamil's call.
