# VanguardOS 3 — SvelteKit + Tailwind v3 + Motion One

A compiled-framework mockup of the VanguardOS landing page. Same visual language as v1 and v2 (Midnight Vanguard palette, owl mark, "Gain. Leverage." hero, 3-product catalog) but uses Svelte's compile-time approach instead of React's runtime.

## Stack — and why

| Layer | Choice | Why |
|---|---|---|
| Framework | **SvelteKit 2 + Svelte 4** | Svelte compiles components to vanilla JS at build time — no virtual DOM, no runtime overhead. Smaller bundles than React (often 30–50% smaller). Reactive bindings (`let x = …` + reassign) work natively without `useState`. SvelteKit adds file-based routing, SSR, and `+page.svelte` convention. Distinct from v1's React + v2's Astro. |
| Styling | **Tailwind CSS v3** | Same Tailwind utility-class approach as v1 (intentionally — keeps the visual diff between the three versions small). Plays nicely with Svelte's scoped-CSS-by-default. |
| Animation | **Motion One** (`motion@11`) | Tiny modern animation library (~3.5 KB gzip, vs GSAP's ~40+ KB). Uses the Web Animations API under the hood. Hero uses it for the fade-up stagger. Distinct from v1's GSAP. |
| Scroll-reveal | **Native `IntersectionObserver`** | Zero deps. The `.reveal` class fades elements in as they enter the viewport. Pure CSS transitions handle the animation; JS only flips a class. Mobile-friendly and battery-cheap. |
| Build | **Vite 5** (via SvelteKit) | Same fast HMR as the React project. |

## Mobile-friendly + optimization protocols (carried over from v1)

- **Viewport meta with `viewport-fit=cover`** for notched devices.
- **`prefers-reduced-motion` respected** — Motion One animations are gated and `.reveal` elements appear immediately when reduced motion is on (no jitter, no waiting).
- **iOS Safari drawer fix** — mobile drawer is positioned with `transform: translateX(100%)` off-screen, not `opacity: 0`. Avoids the iOS hardware-culling bug.
- **Resize reset** — `window.innerWidth >= 1024` closes the mobile drawer on rotation/resize past the desktop breakpoint.
- **Passive scroll listeners** — `{ passive: true }` on the scroll handler so it never blocks compositor work.
- **Lazy + async images** — every `<img>` has `loading="lazy" decoding="async"`.
- **IntersectionObserver `unobserve`** — each `.reveal` is unobserved once it's animated in, so the observer doesn't keep firing as you scroll.
- **`data-sveltekit-preload-data="hover"`** — SvelteKit preloads next-page data on link hover so navigation feels instant. Mobile users on tap still see a hint-then-load.
- **Z-index ladder** — nav `z-[90]`, drawer `z-[95]`, backdrop `z-[92]`. No surprise overlaps.

## Run

```
cd ~/Desktop/Website\ Builder/VanguardOS\ 3
npm install
npm run dev
```

Opens at `http://localhost:5175/`.

## File layout

```
VanguardOS 3/
├── svelte.config.js              # SvelteKit config + adapter-auto
├── vite.config.js                # Port 5175
├── tailwind.config.js            # Midnight Vanguard tokens
├── postcss.config.js
├── package.json
├── static/
│   ├── brand/brand-mark-owl.svg
│   └── gumroad/{core,bundle,upgrade}-thumbnail.png
└── src/
    ├── app.html                  # HTML shell, fonts
    ├── app.css                   # Tailwind directives + reduced-motion + .reveal
    └── routes/
        ├── +layout.svelte        # Imports app.css
        └── +page.svelte          # The whole landing page
```

## How this compares to v1 and v2

| Concern | v1 (React) | v2 (Astro) | v3 (Svelte) |
|---|---|---|---|
| Rendering | Client-side SPA | SSR/SSG, near-zero JS | SSR + hydration, small runtime |
| Bundle size (typical) | ~120–180 KB JS | ~10–20 KB JS (Alpine only) | ~20–40 KB JS (Svelte compiled + Motion) |
| Animation library | GSAP (~40 KB) | None (CSS transitions) | Motion One (~3.5 KB) |
| Component model | React function components | `.astro` files (single file) | `.svelte` files (single file with scoped CSS) |
| Mobile state | React `useState` | Alpine `x-data` | Svelte `let` (reactive by reassignment) |
| Best at | Rich interactive features, large surface area | Content sites, perf-critical landing pages | Compact apps with smooth animations, low-overhead reactivity |

All three render identically to the eye. The interesting variable is what the browser has to download and execute to get there.
