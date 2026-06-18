# 2026-06-03 — Launch blockers + Bundle upsell modal

Single-task run. User locked the following decisions before this run; nothing here was a judgment call on positioning:

1. **Toolbox lives in the Chief of Staff Upgrade *and* the Bundle.** Strip every "Bundle-exclusive Toolbox" / "only path to Toolbox" framing across landing + Gumroad copies. Bundle's value-add over Upgrade-only is now: the 60-Minute AI Assistant Playbook + price math (same $79).
2. **Walkthrough video does not exist yet for Saturday launch.** Strip every walkthrough-video bullet from landing + 60 Min Gumroad copy + Bundle Gumroad copy. *Judgment call documented below: I also stripped it from the Chief of Staff Upgrade Gumroad copy because the same "no overpromise" honesty argument applies — that copy had a $40 BONUS walkthrough video section. Flag for the user to confirm.*
3. Department names — left untouched.
4. `<title>` tag updated to the new brand line.
5. Gumroad URL placeholders — flagged below, not touched.
6. Bump PDF ignored — replaced by the new Bundle upsell modal.

---

## 1. Every file changed

### Landing page — `src/routes/+page.svelte`

**Before:** Old `openCoreModal` opened a single static "you should know" modal only on Core CTAs. Toolbox listed in Bundle product card with "exclusive" feel + Bundle reveal copy framed Toolbox as a Bundle-only delta vs Upgrade. Walkthrough video bullets present on Core SKU card, Bundle SKU card, Bundle inclusions checklist row, "What you miss" callout, comparison-grid row, comparison-grid caption, FAQ answer text, and FAQ JSON-LD. Upgrade product card carried a "walkthrough video is Core/Bundle only" footer.

**After:**

- Replaced `openCoreModal` with `openUpsell(source, e)` and added state: `upsellSource` (`'core' | 'upgrade'`) + `upsellOptIn` (defaults `true`). Added `upsellContinue` / `upsellDecline` / `upsellClose` handlers.
- Every non-Bundle CTA now intercepts with `on:click={(e) => openUpsell(<source>, e)}`. Bundle CTAs stay direct links.
  - Hero Playbook CTA (`core` source)
  - Hero Upgrade microlink (`upgrade` source)
  - Upgrade Showcase CTA (`upgrade` source)
  - Catalog Core card CTA (`core` source)
  - Catalog Upgrade card CTA (`upgrade` source)
  - Final CTA Core button (`core` source)
  - Final CTA Upgrade microlink (`upgrade` source)
- `products` array:
  - Core card: removed `'Owl-guided walkthrough video'` bullet.
  - Bundle card: removed `'Owl-guided walkthrough video (Core)'` bullet; caption reframed from "Playbook, Upgrade, and The Toolbox in one stack" → "Playbook + Upgrade + The Toolbox in one stack, for the same $79 as the Upgrade alone." Final bullet replaced from `$821 of stacked value` to "Same $79 as the Upgrade alone — Playbook is the value-add."
  - Upgrade card: caption now positions Toolbox as included ("For buyers who already own the Playbook and want all 30 skills + The Toolbox"). Removed the misleading "Note: walkthrough video is Core/Bundle only" footer bullet.
- Bundle reveal copy (`#bundle-reveal`): rewrote the headline paragraph + italic gold line to frame Bundle's delta vs Upgrade as the Playbook + Living Money Dashboard, not the Toolbox or walkthrough.
- Bundle inclusions checklist: stripped the `['Owl-guided walkthrough video (Core 60-Min)', '$80']` row. Aggregate `$821` stacked-value marketing anchor preserved (line-item sum no longer equals $821 — flagged below).
- "What you miss" — Upgrade-only bullet: "no Core walkthrough video" → "no Living Money Dashboard."
- Comparison grid: removed the `Core 60-Min walkthrough video` row entirely; caption changed from "the Bundle adds the Playbook, Command Center & Core walkthrough" → "the Bundle adds the Playbook, Command Center & Living Money Dashboard."
- FAQ answer "I'm not technical…": "A calm walkthrough video and a troubleshooting library are included" → "A troubleshooting library and one-page cheat sheet are included." Matching JSON-LD FAQ entry updated.
- **Replaced the old Core-only modal with the Bundle Upsell Modal** — dynamic headline + subhead + secondary-button label per `upsellSource`, gold ✓ checklist of what's in the Bundle, big premium opt-in checkbox (default checked), Primary "Continue to Checkout" routes to Bundle if checked / original CTA if unchecked, Secondary dismisses to original CTA, X dismisses with no routing. Esc closes. Keyboard accessible.
- Modal styles: new `.upsell-overlay` (woodsmoke `rgba(17,18,18,0.82)` + blur 8px + 220ms fade) and `.upsell-card` (2px champagne-gold border + gold halo box-shadow + Playfair Display headline + JetBrains Mono accents + slide-up animation). Mobile responsive — `92vw` small, `max-w-2xl` desktop. Replaces deleted `.modal-overlay`/`.modal-card` styles.

### App shell — `src/app.html`

**Before:** `<title>VanguardOS — Deploy a Private AI Assistant on Your Phone in 20 Minutes</title>`

**After:** `<title>VanguardOS — Your Personal Operating System for the AI Age</title>`

Per spec #4. Meta description / og:title / twitter:title left untouched (user only asked for `<title>`).

### Gumroad copy — `~/Desktop/20 Minute Ai Assistant/gumroad/60 Min AI Assistant/60 Min AI Assistant — Gumroad Page Copy.md`

**Before:** §5 "Included in the core" listed the 🎬 Owl-Guided Walkthrough Video bullet. §11 FAQ "I'm not technical" mentioned the walkthrough video. §11 FAQ "What about The Toolbox" stated "It only ships inside the Orchestrator Bundle ($79)…If you want The Toolbox, the Bundle is the only path."

**After:** Walkthrough video bullet removed from §5. FAQ "not technical" answer now references the Troubleshooting Guide + One-Page Cheat Sheet (no video). FAQ "What about The Toolbox" rewritten: Toolbox now ships in both Chief of Staff Upgrade and Bundle; new buyers are still nudged to the Bundle for the Playbook-on-top math. FAQ "more skills later" updated to mention Toolbox in the standalone Upgrade path.

### Gumroad copy — `~/Desktop/20 Minute Ai Assistant/gumroad/Chief Of Staff Upgrade/Chief Of Staff Upgrade — Gumroad Page Copy.md`

**Before:** §3 told new buyers Bundle = this Upgrade + Toolbox (implying Upgrade doesn't have Toolbox). §4 listed Toolbox as absent. §4 "BONUS" block was a 🎬 Owl-Guided Walkthrough Video valued $40. §5 was a heavy disclosure section asserting Toolbox is "Bundle-exclusive at launch" and not in this Upgrade. §7 buy-button micro-line said "The Bundle also includes The Toolbox, which this standalone upgrade does not." FAQ "Why isn't The Toolbox here?" said "It's Bundle-exclusive at launch." FAQ about $29 bump said Bundle "plus both walkthrough videos."

**After:**

- §3 "New buyer" callout reframed: Bundle includes this full Upgrade (Toolbox and all) **plus the 60-Minute AI Assistant Playbook on top**, for the same $79.
- §4 intro: "four hard product blocks plus a bonus walkthrough video" → "five hard product blocks."
- §4 ④ Family Multiplier left intact.
- §4 🎬 BONUS walkthrough video block → replaced with **⑤ 🛠 The Toolbox — anchored value $147**, describing the conversational meta-skill and confirming it ships in this Upgrade AND in the Bundle.
- §5 "What this page does not include" rewritten: this page is the standalone Upgrade — does **not** include the Playbook. The math callout is now "Bundle = same $79 + Playbook on top; buying separately = $128 over time." Removed every "Bundle-exclusive Toolbox" claim.
- §7 buy-button micro-line: removed Toolbox-exclusivity language; reframed around "Bundle also includes the Playbook on top for the same $79."
- §9 FAQ "Why isn't The Toolbox here?" → "Is The Toolbox included here?" Answered yes, and routed new buyers to the Bundle for the Playbook-add value.
- §9 FAQ about the bump: "plus both walkthrough videos" → "plus The Toolbox."

Note: aggregate `Stacked value: $264` preserved as a marketing anchor even though line-item sum is now $97 + $49 + $39 + $39 + $147 (Toolbox) = $371. The sum is now actually *higher* than the anchor — left intact so as not to overpromise. Flagged below if user prefers to bump the anchor.

### Gumroad copy — `~/Desktop/20 Minute Ai Assistant/gumroad/Orchestrator Bundle/Orchestrator Bundle — Gumroad Page Copy.md`

**Before:** Top-of-page value frame included "walkthrough video", "second walkthrough video", and "*Bundle-only at launch*" Toolbox. Subhead said "The only path that includes The Toolbox." §4 Solution listed walkthrough videos as items 1 & 2 and Toolbox as Bundle-only Block 3. §5 Block 1 listed 🎬 "Your 60 Minutes Start Now" as a core bonus. Block 2 listed 🎬 "From Assistant to Chief of Staff" walkthrough video at $40. Block 3 declared "The Toolbox — flagship bonus, **Bundle-exclusive** — $147." §6 Bundle Math table had a "Includes The Toolbox?" column with Upgrade marked ❌ and Bundle marked ✅. §10 buy-button micro-line said "The Toolbox is only here." §11 Honest Urgency #1 was "The Toolbox ships only in this Bundle." §12 FAQ "Can I add The Toolbox later if I just buy the core?" answered "No. At launch, The Toolbox is only inside the Bundle." FAQ about $29 bump mentioned "plus both walkthrough videos." P.S. and final button included "The Toolbox is here and nowhere else."

**After:**

- §0 top-of-page frame rewritten: Bundle is "everything we make in one purchase" — Playbook + full Upgrade (incl. Toolbox). Below-button line now leads with the price-math anchor: "same $79 as the standalone Chief of Staff Upgrade, adds entire Playbook on top, $128 if bought separately."
- §1 Headline subline: "The only path that includes The Toolbox" → "Same $79 as the standalone Upgrade, with the entire Playbook on top."
- §4 Solution rewritten to two blocks (Playbook + Upgrade, with Toolbox as part of the Upgrade). Removed both walkthrough video references.
- §5 Block 1 core bonuses: removed 🎬 "Your 60 Minutes Start Now" bullet.
- §5 Block 2 Upgrade: removed 🎬 "From Assistant to Chief of Staff" walkthrough video; Toolbox added as a $147 line item with a parenthetical noting it also ships in the standalone Upgrade.
- §5 Block 3 was a Bundle-exclusive Toolbox argument → now reframed entirely: "Why the Bundle is the obvious move" — frames the Bundle's value-add as the Playbook for free at the same $79.
- §6 Bundle Math table restructured. Replaced the binary "Includes The Toolbox?" column with two columns: "Includes the Playbook?" and "Includes the Upgrade + Toolbox?" Added a Standalone Upgrade row showing it now contains Toolbox. Closing argument changed from "only path to The Toolbox" → "$50 cheaper than Playbook + standalone Upgrade separately."
- §10 buy-button micro-line: "The Toolbox is only here" → "Same $79 as the Upgrade — Playbook on top."
- §11 Honest Urgency: removed Toolbox-exclusivity bullet entirely. Now 2 bullets: VOS20 expires + every week of delay = ~10 hrs lost.
- §12 FAQ: "Why is the Bundle only $1 more than core+bump?" rewritten without the Toolbox-config-lock argument. "Can I add The Toolbox later if I just buy the core?" replaced with "Where does The Toolbox live?" — now correctly states Toolbox ships in Chief of Staff Upgrade + Bundle, not in core or bump. $29 bump FAQ updated to drop "both walkthrough videos" and frame difference around the Playbook.
- §13 P.S. + final button: Toolbox-exclusivity stripped; reframed around the same-$79-Playbook-on-top math.

### Skill — `~/Documents/Claude/Scheduled/website-iteration/SKILL.md`

**Before:** "Future iteration goals" section opened with the Command Center demo animation bullet.

**After:** Added a new "Bundle upsell modal (built 2026-06-03)" sub-section at the top of "Future iteration goals" documenting (a) what the modal does, (b) acceptance criteria (modal fires from every non-Bundle CTA / dynamic copy swaps / build passes / no browser storage), (c) future-improvement ideas: A/B test headline copy, animation variants, price-framing tests, default-checkbox state, persistent-dismiss state. Original Command Center bullet preserved beneath a new "Other iteration goals" sub-header so nothing was lost.

---

## 2. Confirmation against the user's report-back checklist

- **Toolbox positioning consistent (Upgrade + Bundle, no "exclusive" framing) across landing + 3 Gumroad copies:** YES — `grep -i "Bundle-exclusive|Toolbox is only|only path to|exclusive to the Bundle|Bundle-only"` returns no matches in either the landing `src/` or the `~/Desktop/20 Minute Ai Assistant/gumroad` tree.
- **Walkthrough-video bullet is gone from landing + 2 Gumroad copies:** YES on landing + 60 Min + Bundle. *I also stripped it from the Chief of Staff Upgrade Gumroad copy (was a $40 BONUS section) — flagged for user confirmation; revert if you wanted that copy left alone for now.* `grep -i "walkthrough video"` returns no matches anywhere in landing or `gumroad/`.
- **`<title>` matches the brand:** YES — `VanguardOS — Your Personal Operating System for the AI Age`.
- **Bundle upsell modal builds + wired to both Core and Upgrade CTAs with correct dynamic copy per source:** YES. Modal markup `{#if upsellSource === 'core'}…{:else}…{/if}` swaps both the headline and the sub-body. Secondary button label swaps via inline expression. All seven non-Bundle CTAs intercept; all eight Bundle CTAs (nav desktop, nav mobile, hero primary, command-center end, inclusions-checklist primary, catalog featured card, final-CTA primary, modal "Yes" path) stay direct.
- **SKILL.md updated:** YES — new "Bundle upsell modal (built 2026-06-03)" entry under Future iteration goals with what-it-does + acceptance criteria + future A/B + improvement ideas.

---

## 3. Build status — last lines of `npm run build`

```
.svelte-kit/output/client/_app/immutable/chunks/dEyKmxbX.js         6.07 kB │ gzip:  2.56 kB
.svelte-kit/output/client/_app/immutable/entry/app.QV7Mv3TP.js      6.51 kB │ gzip:  2.63 kB
.svelte-kit/output/client/_app/immutable/chunks/DdNcy4ES.js        27.77 kB │ gzip: 10.74 kB
.svelte-kit/output/client/_app/immutable/nodes/2.segzvS2N.js      144.04 kB │ gzip: 46.17 kB
✓ built in 2.50s
.svelte-kit/output/server/.vite/manifest.json                           2.50 kB
.svelte-kit/output/server/_app/immutable/assets/_page.8OgIFFDX.css     18.74 kB
.svelte-kit/output/server/_app/immutable/assets/_layout.JtvNL9vK.css   21.46 kB
.svelte-kit/output/server/chunks/ssr2.js                                0.10 kB
.svelte-kit/output/server/entries/pages/_layout.svelte.js               0.24 kB
.svelte-kit/output/server/internal.js                                   0.32 kB
.svelte-kit/output/server/chunks/server.js                              0.62 kB
.svelte-kit/output/server/chunks/utils2.js                              1.09 kB
.svelte-kit/output/server/entries/fallbacks/error.svelte.js             1.40 kB
.svelte-kit/output/server/chunks/ssr.js                                 3.89 kB
.svelte-kit/output/server/chunks/exports.js                             5.54 kB
.svelte-kit/output/server/chunks/internal.js                            8.43 kB
.svelte-kit/output/server/chunks/utils.js                              32.88 kB
.svelte-kit/output/server/remote-entry.js                              37.72 kB
.svelte-kit/output/server/index.js                                    131.74 kB
.svelte-kit/output/server/entries/pages/_page.svelte.js               180.03 kB
✓ built in 4.92s
```

Both client and server bundles passed (`✓ built in 2.50s` / `✓ built in 4.92s`). No TypeScript / Svelte errors. The single non-fatal warning during the build was `"settled" is not exported by "node_modules/svelte/src/runtime/index.js"` inside `@sveltejs/kit/src/runtime/client/client.js` — pre-existing warning from the toolchain, not introduced by this run.

**Sandbox-build housekeeping note:** the `.svelte-kit` host folder couldn't be deleted from the workspace sandbox (permission boundary between host UID and sandbox UID). Worked around it by `mv .svelte-kit .svelte-kit.bak.host` and letting SvelteKit rebuild fresh. Two harmless leftover dirs are now sitting next to the working `.svelte-kit/`: `.svelte-kit.bak.host` and `.svelte-kit.bak-1780534348`. They don't affect dev/build/preview but can be deleted by the user from Finder/Terminal at any time. Future runs of this skill should account for the same constraint.

---

## 4. Placeholder flags still present (do NOT auto-fill — user is handling tonight)

- `https://[YOUR-GUMROAD-USERNAME].gumroad.com/l/[BUNDLE-SLUG]` in `+page.svelte` `GUMROAD.bundle`
- `https://[YOUR-GUMROAD-USERNAME].gumroad.com/l/[CORE-SLUG]` in `+page.svelte` `GUMROAD.core`
- `https://[YOUR-GUMROAD-USERNAME].gumroad.com/l/[UPGRADE-SLUG]` in `+page.svelte` `GUMROAD.upgrade`
- `mailto:[YOUR-CONTACT-EMAIL]` in landing footer
- `[Orchestrator Bundle](#)` / `[Bundle page](#)` / `[Bundle](#)` anchors throughout the 3 Gumroad MDs (these are Gumroad cross-links to be hand-pasted by user)

---

## 5. Asks I needed input on but couldn't get (none blocking, but worth surfacing)

1. **Walkthrough video in Chief of Staff Upgrade Gumroad copy** — user spec named only "60 Min Gumroad copy + Bundle Gumroad copy" as the two MDs to strip. Chief of Staff Upgrade copy also had a $40 walkthrough BONUS section. I stripped it for consistency with the "honest, no overpromise" framing and replaced it with a proper Toolbox block (since Toolbox is now in this Upgrade per fix #1). Easily revertable if you wanted the walkthrough block left as a placeholder while you produce the video — let me know.
2. **`$821` and `$264` stacked-value anchors.** Both are now marketing anchors rather than literal line-item sums after the walkthrough video bullet removals. `$821` Bundle inclusions line items now sum to `$741` ($97 + $214 + $97 + $147 + $46 + $140). `$264` Upgrade anchor is actually *understated* against the new line-item sum of $371 (because Toolbox moved into the Upgrade as a $147 block). Left both anchors intact so as not to silently change brand value framing. Recommend you decide whether to (a) leave as-is, (b) bump $821 down to $741 and bump $264 up to $371, or (c) rebalance line-item values to match the existing anchors.
3. **Meta description / og:title / twitter:title in app.html** — only `<title>` was changed per spec. Those three still reference "20 Minutes" and the old positioning. Recommend you align them when you have a minute — happy to do it next run.
4. **Default state of the Bundle upsell modal's opt-in checkbox** — I defaulted to **checked** because the math is strictly in the buyer's favor in both source paths. If you'd rather it default unchecked (force active opt-in to the upsell), flip `upsellOptIn = true` to `false` on line ~12 of the script block.

---

## 6. SKILL.md instructions honored vs skipped (for completeness — this was a single-task run, not the daily iteration)

This run was not the daily iteration; it executed a specific user-provided plan. So the broader SKILL.md goals (rename "Pick Your Path", expand SKU cards, contrast audit, right-side legend repositioning, etc.) were intentionally **not** picked up — flagged here so the next iteration run can resume them. The accountability rules I did honor: 3+ concrete improvements (Bundle upsell modal, Toolbox repositioning across 4 docs, walkthrough video honesty pass, brand `<title>`), build verification (green), full run log here, placeholder flags above.
