// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS } from '../playwright.config.js';

/**
 * VanguardOS Launchpad — landing-page QA gate.
 *
 * Runs the brief's production QA checks at every required viewport under both
 * normal and reduced motion. The whole suite is designed to FAIL LOUDLY on any
 * regression: mobile overflow, clipped CTAs, embargoed tool names, inconsistent
 * CTA labels, console errors, failed asset loads, broken controls, or a sticky
 * CTA that overlaps the closing conversion sections.
 *
 * The overflow checks temporarily disable the body's `overflow-x: hidden` so
 * hidden layout defects become real failures instead of being clipped away.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// The approved checkout destination. Every purchase CTA must point here.
const CHECKOUT_URL_FRAGMENT = 'vanguardos.gumroad.com/l/lgaxz';

// The single approved primary CTA label, normalized (arrows and non-breaking
// spaces stripped, whitespace collapsed).
const CANONICAL_CTA = 'Start My 5-Day Build · $129';

// Third-party tool / platform / model / host / service names that must never
// appear in public copy, metadata, structured data, alt text, or animation
// labels. NOTE: "Notion" is deliberately NOT in this list — "The Notion
// Operations OS" is the proper name of a bonus product the buyer duplicates in
// Notion, and the brief forbids renaming the customer product. All other stack
// names are embargoed. (Flagged for founder review.)
const EMBARGO = [
  'gumroad', 'chatgpt', 'openai', 'claude', 'anthropic', 'gemini', 'bard',
  'leonardo', 'ideogram', 'midjourney', 'dall-e', 'dalle', 'stable diffusion',
  'antigravity', 'github', 'cloudflare', 'vercel', 'netlify', 'wrangler',
  'higgsfield', 'recraft', 'figma', 'canva', 'loom', 'mailchimp', 'mailerlite',
  'convertkit', 'kit.com', 'stripe', 'paypal', 'lemon squeezy', 'lemonsqueezy',
  'cursor', 'vs code', 'vscode', 'replit', 'framer', 'webflow', 'wordpress',
];

function normalizeLabel(text) {
  return (text || '')
    .replace(/ /g, ' ')   // non-breaking spaces → normal
    .replace(/[→↑↓←]/g, ' ')   // strip directional arrows
    .replace(/\s+/g, ' ')
    .trim();
}

// Relative luminance (0..255-ish average is fine for our threshold check).
function channelAvgFromRgb(rgbString) {
  const m = rgbString.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  const [r, g, b, a = 1] = parts;
  // Composite over the page background #111212 ≈ (17,18,18) using alpha.
  const bg = [17, 18, 18];
  const comp = [r, g, b].map((c, i) => c * a + bg[i] * (1 - a));
  return (comp[0] + comp[1] + comp[2]) / 3;
}

// Readable-body floor: #C8C6BF averages ≈ 196; text-text/85 ≈ 200. We require
// essential paragraphs to sit at or above ~188 so faint greys fail.
const READABLE_AVG_FLOOR = 188;

async function collectPageProblems(page) {
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  page.on('requestfailed', (req) => {
    const url = req.url();
    // Analytics/pixel endpoints may be blocked by the environment; they are not
    // page assets and must not flake the gate.
    if (/facebook|fbcdn|connect\.facebook/i.test(url)) return;
    failedRequests.push(`${url} :: ${req.failure()?.errorText}`);
  });
  return { consoleErrors, failedRequests };
}

// Disable the body's overflow clip so hidden horizontal defects surface, and
// force scroll-reveal elements to their settled (opacity:1) state so we measure
// final rendering, not the pre-animation frame.
async function prepPage(page) {
  await page.addStyleTag({
    content: `
      html, body { overflow-x: visible !important; }
      .reveal { opacity: 1 !important; transform: none !important; }
    `,
  });
  // Let fonts + layout settle.
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(400);
}

// ─────────────────────────────────────────────────────────────────────────
// Per-viewport geometric + content audit
// ─────────────────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test(`layout @ ${vp.name}`, async ({ page }) => {
    const { consoleErrors, failedRequests } = await collectPageProblems(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/', { waitUntil: 'networkidle' });
    await prepPage(page);

    // (1) No horizontal scroll at the document level.
    const horiz = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      horiz.scrollWidth,
      `documentElement.scrollWidth (${horiz.scrollWidth}) exceeds innerWidth (${horiz.innerWidth}) at ${vp.name}`
    ).toBeLessThanOrEqual(horiz.innerWidth + 1);

    // (2 + 3) No visible element extends beyond the viewport, and no text
    // container overflows its own box (no clipped/withheld text).
    const overflow = await page.evaluate(() => {
      const iw = window.innerWidth;
      const out = { beyond: [], textOverflow: [] };
      const sel = 'h1,h2,h3,h4,p,a,button,li,span,.mv-day-chip,.mv-day-chip strong,.motion-label,[class*="cta"]';
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Off-screen fixed drawers are conditionally unmounted, so anything
        // visible must sit within the viewport horizontally.
        if (r.right > iw + 1.5 || r.left < -1.5) {
          out.beyond.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 60), right: Math.round(r.right), left: Math.round(r.left), iw });
        }
        // Text containers must not hide overflow horizontally.
        if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== 'auto' && style.overflowX !== 'scroll') {
          const txt = (el.textContent || '').trim().slice(0, 40);
          if (txt) out.textOverflow.push({ txt, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, cls: el.className?.toString?.().slice(0, 60) });
        }
      }
      return out;
    });
    expect(overflow.beyond, `Elements beyond viewport at ${vp.name}: ${JSON.stringify(overflow.beyond).slice(0, 600)}`).toEqual([]);
    expect(overflow.textOverflow, `Text overflow at ${vp.name}: ${JSON.stringify(overflow.textOverflow).slice(0, 600)}`).toEqual([]);

    // (4) "Product" and "Checkout" (and every day chip) fit inside their
    // animation cards with visible internal padding.
    const chips = await page.evaluate(() => {
      const res = [];
      for (const chip of Array.from(document.querySelectorAll('.mv-day-chip'))) {
        const strong = chip.querySelector('strong');
        if (!strong) continue;
        const cr = chip.getBoundingClientRect();
        const sr = strong.getBoundingClientRect();
        res.push({
          label: strong.textContent.trim(),
          padLeft: sr.left - cr.left,
          padRight: cr.right - sr.right,
          overflow: strong.scrollWidth - strong.clientWidth,
        });
      }
      return res;
    });
    expect(chips.length).toBeGreaterThan(0);
    for (const c of chips) {
      expect(c.overflow, `Chip "${c.label}" text overflows its box at ${vp.name}`).toBeLessThanOrEqual(1);
      expect(c.padLeft, `Chip "${c.label}" has no left padding at ${vp.name}`).toBeGreaterThanOrEqual(1.5);
      expect(c.padRight, `Chip "${c.label}" has no right padding at ${vp.name}`).toBeGreaterThanOrEqual(1.5);
    }

    // (5) Every purchase CTA is fully visible, >= 44px tall, points to the
    // approved checkout URL.
    const ctas = await page.evaluate(() => {
      const iw = window.innerWidth;
      return Array.from(document.querySelectorAll('a[href*="gumroad.com"]')).map((a) => {
        const r = a.getBoundingClientRect();
        const style = getComputedStyle(a);
        return {
          href: a.getAttribute('href'),
          text: a.textContent,
          height: r.height,
          withinX: r.left >= -1 && r.right <= iw + 1,
          visible: style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0,
        };
      });
    });
    for (const c of ctas) {
      if (!c.visible) continue;
      expect(c.href, `CTA points to wrong URL at ${vp.name}: ${c.href}`).toContain(CHECKOUT_URL_FRAGMENT);
      expect(c.height, `CTA under 44px tall at ${vp.name}`).toBeGreaterThanOrEqual(43.5);
      expect(c.withinX, `CTA clipped horizontally at ${vp.name}: "${normalizeLabel(c.text)}"`).toBeTruthy();
    }

    // (8) No failed asset requests; (9) no console errors — checked at the end
    // once the page has fully loaded and settled.
    await page.waitForTimeout(200);
    expect(failedRequests, `Failed requests at ${vp.name}: ${failedRequests.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `Console errors at ${vp.name}: ${consoleErrors.join(' | ')}`).toEqual([]);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// (6) Mobile primary CTA inside the 390×844 first viewport
// ─────────────────────────────────────────────────────────────────────────
test('mobile primary CTA is inside the 390x844 first viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(500);
  const cta = await page.evaluate(() => {
    const el = document.querySelector('a[data-analytics-id="hero-primary"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height };
  });
  expect(cta, 'hero primary CTA not found').not.toBeNull();
  expect(cta.top, 'hero CTA top above fold').toBeGreaterThanOrEqual(0);
  expect(cta.bottom, `hero CTA bottom (${cta.bottom}) below the 844 fold`).toBeLessThanOrEqual(844);
  expect(cta.left).toBeGreaterThanOrEqual(0);
  expect(cta.right).toBeLessThanOrEqual(390 + 1);
  expect(cta.h).toBeGreaterThanOrEqual(43.5);
});

// ─────────────────────────────────────────────────────────────────────────
// (7) Essential body text stays readable (no faint opacity/color after settle)
// ─────────────────────────────────────────────────────────────────────────
test('essential body copy is readable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await prepPage(page);
  const samples = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('p.body-copy')).map((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, opacity: parseFloat(s.opacity), text: (el.textContent || '').trim().slice(0, 40) };
    });
  });
  expect(samples.length, 'no .body-copy paragraphs found').toBeGreaterThan(3);
  for (const s of samples) {
    expect(s.opacity, `faint opacity on "${s.text}"`).toBeGreaterThanOrEqual(0.99);
    const avg = channelAvgFromRgb(s.color);
    expect(avg, `unreadable color ${s.color} on "${s.text}"`).toBeGreaterThanOrEqual(READABLE_AVG_FLOOR);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// (13) Tool-name embargo across all public surfaces
// ─────────────────────────────────────────────────────────────────────────
test('no embargoed tool names in public copy, metadata, or structured data', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const surfaces = await page.evaluate(() => {
    const metas = Array.from(document.querySelectorAll('meta[name], meta[property]'))
      .map((m) => m.getAttribute('content') || '').join('\n');
    const title = document.title;
    const alts = Array.from(document.querySelectorAll('img[alt], [aria-label]'))
      .map((el) => (el.getAttribute('alt') || '') + ' ' + (el.getAttribute('aria-label') || '')).join('\n');
    const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((s) => s.textContent || '').join('\n');
    // textContent (not innerText) so collapsed <details> FAQ answers and any
    // aria-hidden animation labels are still scanned.
    const bodyText = document.body.textContent || '';
    return { metas, title, alts, jsonLd, bodyText };
  });
  const haystack = [surfaces.bodyText, surfaces.metas, surfaces.title, surfaces.alts, surfaces.jsonLd]
    .join('\n').toLowerCase();
  // Word-boundary matching so legitimate words like "canvas" don't trip
  // "canva" and "keyboard" doesn't trip a tool name.
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = EMBARGO.filter((term) => new RegExp(`(^|[^a-z0-9])${escapeRe(term)}([^a-z0-9]|$)`, 'i').test(haystack));
  expect(hits, `Embargoed names found in public surfaces: ${hits.join(', ')}`).toEqual([]);
});

// ─────────────────────────────────────────────────────────────────────────
// (14) Primary CTA label consistent across every purchase link
// ─────────────────────────────────────────────────────────────────────────
test('primary CTA label is consistent across every purchase link', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const labels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="gumroad.com"]')).map((a) => a.textContent);
  });
  expect(labels.length).toBeGreaterThan(4);
  for (const raw of labels) {
    expect(normalizeLabel(raw)).toBe(CANONICAL_CTA);
  }
  // The lone secondary label must be the single approved one.
  const secondary = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href="#five-day"]')).map((a) => a.textContent.trim())
  );
  expect(secondary.some((t) => normalizeLabel(t) === 'See the 5-Day Plan')).toBeTruthy();
});

// ─────────────────────────────────────────────────────────────────────────
// (10 + 11) Interactive controls + keyboard/Escape behavior
// ─────────────────────────────────────────────────────────────────────────
test('menu, FAQ, specimens, and contact modal all work by clicking the full control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Mobile menu opens and closes.
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await expect(page.locator('.menu-drawer')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).first().click();
  await expect(page.locator('.menu-drawer')).toHaveCount(0);

  // FAQ accordion toggles by clicking the summary surface.
  const firstFaq = page.locator('#faq details').first();
  await firstFaq.locator('summary').click();
  await expect(firstFaq).toHaveJSProperty('open', true);
  await firstFaq.locator('summary').click();
  await expect(firstFaq).toHaveJSProperty('open', false);

  // Palette specimen opens and closes with its X.
  await page.locator('button[aria-label*="palette"]').click();
  await expect(page.locator('.specimen-card')).toBeVisible();
  await page.locator('.specimen-card .upsell-x').click();
  await expect(page.locator('.specimen-card')).toHaveCount(0);

  // Type specimen opens and closes with Escape.
  await page.locator('button[aria-label*="type pairing"]').click();
  await expect(page.locator('.specimen-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.specimen-card')).toHaveCount(0);

  // Contact modal opens from the footer Contact and closes via X + Escape.
  await page.locator('footer a[href^="mailto:"]').click();
  await expect(page.locator('#contact-title')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#contact-title')).toHaveCount(0);

  // Keyboard focus lands somewhere focusable (focus visible baseline).
  await page.keyboard.press('Tab');
  const active = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
  expect(active).not.toBe('BODY');
});

// ─────────────────────────────────────────────────────────────────────────
// (15) Sticky mobile CTA never overlaps the FAQ or final conversion section
// ─────────────────────────────────────────────────────────────────────────
test('sticky mobile CTA hides near the FAQ and final CTA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Mid-page: sticky CTA should be showing.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
  await page.waitForTimeout(400);
  await expect(page.locator('.sticky-cta.sticky-cta-show')).toHaveCount(1);

  // Scroll to the final CTA: sticky must be hidden so it can't overlap it.
  await page.locator('#final-cta').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const overlaps = await page.evaluate(() => {
    const sticky = document.querySelector('.sticky-cta');
    const finalCta = document.querySelector('#final-cta a[href*="gumroad.com"]');
    if (!sticky || !finalCta) return { hidden: true, intersect: false };
    const sr = sticky.getBoundingClientRect();
    const shown = sticky.classList.contains('sticky-cta-show');
    const fr = finalCta.getBoundingClientRect();
    const intersect = !(sr.bottom < fr.top || sr.top > fr.bottom);
    return { hidden: !shown, intersect: shown && intersect };
  });
  expect(overlaps.hidden, 'sticky CTA still visible over the final CTA').toBeTruthy();
  expect(overlaps.intersect, 'sticky CTA overlaps the final CTA').toBeFalsy();
});

// ─────────────────────────────────────────────────────────────────────────
// Screenshots (captured only under normal motion)
// ─────────────────────────────────────────────────────────────────────────
test('capture hero + full-page screenshots', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'motion', 'screenshots captured once, under normal motion');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  for (const { w, h, tag } of [
    { w: 390, h: 844, tag: '390x844' },
    { w: 1440, h: 900, tag: '1440x900' },
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `hero-${tag}.png`) });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `full-${tag}.png`), fullPage: true });
  }
});
