# assets-src — original image masters (NOT shipped)

These are the full-resolution PNG masters (~199 MB) that used to live in `static/`.
Nothing on the page references them — the site serves the optimized `.webp` / `.jpg`
derivatives in `static/products/` and `static/og/`. They were moved here on
2026-06-05 so builds and deploys stop copying ~200 MB of dead weight.

- `products/` — 4K banners + thumbnails (source for the .webp derivatives)
- `brand/` — profile avatar + cover masters
- `gumroad/` — Gumroad-page thumbnails (kept "just in case" by an earlier run)

To regenerate a web derivative, downscale + convert from here (e.g. ImageMagick:
`magick products/core-thumbnail.png -resize 900x900 -quality 82 ../static/products/core-thumbnail.webp`).

Safe to archive or move out of the project entirely — just don't move them back into `static/`.
