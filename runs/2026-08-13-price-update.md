# 2026-08-13 — Launchpad price update

## Completed

- Updated the live Gumroad product `The Vanguard Launchpad` from $129 to $27.
- Updated Gumroad description, summary, product detail, price field, and live checkout display.
- Updated the landing-page source price, structured-data offer price, and Meta Pixel value from 129 to 27.
- Updated landing QA assertions for the new $27 price.
- Kept the $811 figure only as a stacked-value description; it is not the selling price.
- Existing Launchpad cover and banner assets contain no price text, so no raster replacement was required for those files.

## Verification

- `npm run build` passed with existing Svelte accessibility and unused-CSS warnings.
- Live Gumroad checkout verified at `https://vanguardos.gumroad.com/l/lgaxz?wanted=true`: US$27 subtotal and total.
- Public landing page still showed the cached $129 version at the time of this run. The updated Svelte source is ready for the existing Cloudflare/Antigravity deployment workflow.

## Release note

Do not change Meta ads or budgets as part of this price update. After deployment, run the public-page QA and verify every CTA lands on the $27 Gumroad checkout.
