# Improvement backlog — VanguardOS landing

Running list of done work + surfaced ideas. (Reconstructed 2026-06-29; file was missing.)

## Done (recent)
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

## Ideas to pick from (next runs)
- Second CLOSER pass: spot-check whether the-math's value-stack recap (right before the
  guarantee) still earns its place, or whether it now reads as a third Overview beat after
  offer-stack and the avatar promise panel. Also re-check avatar selector default (2026-07-02)
  and Label move (2026-07-02) are actually lifting engagement once real data exists. [NEXT BITE]
- Refresh the `og-card.jpg` social image (and its alt text) to visually echo the new
  "How to launch... even if..." hook now used in the title/meta, currently still says
  the old "Systems that ship solopreneurs" framing in the image art itself.
- Consider giving the new speed-to-value strip an id + an in-page anchor from the final
  CTA reassurance ("see how fast you start ↓") if it tests well.
- Social proof: the founding-buyer placeholder still has no real quotes; swap in the
  first real testimonial the moment one exists (schema-ready).
- Avatar selector default A/B: default to the "paralyzed solopreneur" promise for
  non-clickers vs current neutral state.
- Core Web Vitals: re-check LCP of hero (radial-gradient + owl SVG) and the day mockups.
- Swap real day-N.png mockups into the 5-Day Journey when they land (hooks ready).
- Consider a "time per day" micro-stat in the anchor strip (e.g. "~2 hrs/day").
- Add BreadcrumbList / sitewide nav schema for SEO entity confidence.

## Standing reminders
- SKILL.md still pins core value at $199 and core-split numbers; standing launch
  decision (memory: launch_decisions) overrides to $129 with the $811 split. Don't revert.
- Legacy 60-Minute / Bundle content lives dormant in `{#if false}` (lines ~1256-1763).
  Keep dormant; never leak into rendered copy.
