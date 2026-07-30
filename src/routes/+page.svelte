<script>
  import { onMount, tick } from 'svelte';
  import { animate, stagger } from 'motion';

  let scrolled = false;
  let scrollProgress = 0;
  let showStickyCta = false;   // persistent mobile CTA — appears once hero scrolls away
  let stickyNearEnd = false;   // true once the FAQ / final CTA enters view — hide the sticky then
  let menuOpen = false;
  // The sticky mobile CTA is only shown when we're past the hero, not near the
  // closing conversion sections, and no overlay is open — so it never covers
  // the final CTA, the FAQ controls, or a modal (QA gate #15).
  $: stickyVisible = showStickyCta && !stickyNearEnd && !menuOpen && !contactOpen && !specimenModalOpen;
  // Scroll-linked progress for the 5-day journey scrollytelling rail (0→1).
  let fiveDayProgress = 0;

  // ── SPECIMEN MODAL ───────────────────────────────────────────────
  // Click a palette or type pairing in the #specimens section to expand
  // it: palettes reveal their hex values, type pairings render at display
  // size. Pure Svelte state — no deps, no routing.
  let specimenModalOpen = false;
  let specimenKind = null;      // 'palette' | 'type'
  let specimenData = null;
  let specimenLastFocus = null;
  // Specimen-only display faces (Fraunces, Source Serif 4, Geist,
  // Clash Display, Satoshi) used to be a render-blocking @import in the global
  // style block, fetched on every single pageview even though they only paint
  // inside the click-to-inspect specimen modal. Loaded lazily here, on first
  // open, instead: cuts two blocking font fetches off the critical path for
  // the ~everyone who never opens the modal (2026-07-03 Core Web Vitals pass).
  let specimenFontsLoaded = false;
  function loadSpecimenFonts() {
    if (specimenFontsLoaded || typeof document === 'undefined') return;
    specimenFontsLoaded = true;
    const urls = [
      // Display/body faces plus the three Accent/Mono kicker faces the pack
      // pairs with each scheme (Space Mono/JetBrains Mono/Geist Mono) —
      // added 2026-07-10 so the specimen cards and modal render all three
      // fonts per scheme instead of only Display + Body.
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Source+Serif+4:ital,wght@0,400;1,400&family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&family=Space+Mono:wght@700&family=JetBrains+Mono:wght@500&display=swap',
      'https://api.fontshare.com/v2/css?f[]=clash-display@500,600&f[]=satoshi@400,500&display=swap'
    ];
    urls.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }
  function openSpecimen(kind, data, e) {
    if (e) e.preventDefault();
    loadSpecimenFonts();
    specimenLastFocus = e?.currentTarget || (typeof document !== 'undefined' ? document.activeElement : null);
    specimenKind = kind;
    specimenData = data;
    specimenModalOpen = true;
  }
  function closeSpecimen() {
    specimenModalOpen = false;
    if (specimenLastFocus?.focus) specimenLastFocus.focus();
    specimenLastFocus = null;
  }

  // ── CONTACT MODAL ────────────────────────────────────────────────
  // Any "Contact" button opens a friendly popup with the support email
  // instead of firing a raw mailto. The mailto href stays as a no-JS fallback.
  let contactOpen = false;
  let contactLastFocus = null;
  let contactCopied = false;
  function openContact(e) {
    if (e) e.preventDefault();
    contactLastFocus = e?.currentTarget || (typeof document !== 'undefined' ? document.activeElement : null);
    menuOpen = false;
    contactOpen = true;
  }
  function closeContact() {
    contactOpen = false;
    contactCopied = false;
    if (contactLastFocus?.focus) contactLastFocus.focus();
    contactLastFocus = null;
  }
  async function copyContactEmail() {
    try {
      await navigator.clipboard.writeText('support@vanguardos.co');
      contactCopied = true;
      setTimeout(() => { contactCopied = false; }, 2000);
    } catch (_) {}
  }

  // ── GUMROAD FUNNEL ────────────────────────────────────────────────
  // 2026-07-11: dropped the Bundle Upsell Modal (upsellSource/upsellOptIn/
  // openUpsell/etc.) — it only ever served the old 60-Minute AI Assistant
  // Core/Upgrade CTAs, which were removed with the dead legacy block.
  // Every live CTA on this page links straight to GUMROAD.launchpad.
  // 2026-07-04: CTAs now go straight to the Gumroad checkout overlay
  // (?wanted=true) instead of the Gumroad product page. The landing page
  // already does the full sales job, so the product page was a redundant
  // extra step between "I want this" and paying, pure Effort & Sacrifice
  // with no upside. One click closer to checkout for every CTA on the page.
  const GUMROAD = {
    launchpad: 'https://vanguardos.gumroad.com/l/lgaxz?wanted=true'
  };

  // ── ANALYTICS ──────────────────────────────────────────────────────
  // One centralized hook every purchase CTA calls on click. The real work
  // happens in the delegated listener in app.html, which fires the standard
  // `InitiateCheckout` event and the diagnostic custom `CheckoutClick` event.
  // `data-event="checkout_click"` /
  // `data-analytics-id` are present in the markup so a Pixel, GA4, or GTM
  // container can bind to them declaratively instead of via this hook.
  function trackCheckoutClick(e) {
    // The delegated listener owns analytics so every checkout link follows
    // one contract without duplicate component-level calls.
  }

  // ── WHAT IS INCLUDED ───────────────────────────────────────────────
  // 2026-07-27: stacked-value arithmetic removed. No per-item dollar values,
  // no strikethrough "value", no bonus framing. Concrete deliverables only —
  // each piece exists because the next step in the sequence needs it.
  // launchpadStack[0] is THE CORE; everything after is a supporting system.
  const launchpadStack = [
    { name: 'The 5-Day Launchpad',                     img: '/products/stack-01.webp', blurb: 'The interactive, guided build system. Open it in your browser and it walks you from idea to launch-ready, one screen at a time, by Day 5.' },
    { name: 'The Vanguard Vault',                      img: '/products/stack-02.webp', blurb: '150 paste-and-go AI prompts. Paste one, answer up to three plain questions, get finished work. Runs in any major AI writing assistant.' },
    { name: '5 Cloneable Landing Page Templates',      img: '/products/stack-03.webp', blurb: 'One master prompt builds any of the five. Hero, offer, FAQ, CTAs, already wired.' },
    { name: 'The Brand Palette Pack',                  img: '/products/stack-04.webp', blurb: '20 ready-to-use palettes with the psychology behind each.' },
    { name: 'The Typography Pack',                     img: '/products/stack-05.webp', blurb: '20 free-to-use premium type systems for solo brands.' },
    { name: 'The Notion Operations OS',                img: '/products/stack-06.webp', blurb: 'One dashboard, four databases, duplicate it in under a minute. The operations room you run the business from after launch.' },
    { name: 'The Funnel Pattern Library',              img: '/products/stack-07.webp', blurb: 'Checkout upsell copy, a nine-email follow-up sequence, and CTA patterns for the complete buyer path. The conversion machinery.' }
  ];
  const coreItem  = launchpadStack[0];
  const bonusItems = launchpadStack.slice(1);

  // ── 5-DAY JOURNEY ────────────────────────────────────────────────
  // Restored as premium day cards 2026-07-13. The page needs to make the
  // buyer feel the sequence, not merely read a compressed checklist.
  const launchpadDays = [
    { num: '01', kicker: 'IDEATE',        line: 'Lock your idea, buyer, offer, and price.',  desc: 'Leave with one validated offer you can explain in a single sentence.' },
    { num: '02', kicker: 'BRAND',         line: 'Choose the name, voice, colors, type, and logo direction.', desc: 'Leave with a one-page brand system that keeps every asset consistent.' },
    { num: '03', kicker: 'BUILD',         line: 'Create the product, package it, and make the launch assets.', desc: 'Leave with the product file, cover, thumbnail, and social visuals ready.' },
    { num: '04', kicker: 'SELL',          line: 'Write and build the sales page, then publish it.', desc: 'Leave with a mobile-ready page at a live URL.' },
    { num: '05', kicker: 'LAUNCH',        line: 'Connect checkout, delivery, upsell, and follow-up.', desc: 'Leave with the full buyer path tested and ready to take payment.' }
  ];

  // ── ASSET-PACK SPECIMENS ─────────────────────────────────────────
  // The Brand Palette Pack + Typography Pack are in the offer stack but
  // invisible on the page. These render a *taste* of each, inline, with
  // pure CSS — no external image assets required. Proof of substance.
  const specimenPalettes = [
    { name: 'Equestrian',        colors: ['#1B1E2E', '#1F2C4A', '#6A3A1F', '#B59044', '#F2ECDD'] },
    { name: 'Cold Lab',          colors: ['#000000', '#141414', '#E6F84B', '#FF5C39', '#F5F5F4'] },
    { name: 'Atelier Noir',      colors: ['#0F0B09', '#1A1411', '#7A1F20', '#B8893A', '#F1E8D8'] },
    { name: 'Nightshift',        colors: ['#070B12', '#0C111B', '#5BC0EB', '#A0E7FF', '#E8ECF3'] },
    { name: 'Cobalt Operator',   colors: ['#0B1B3B', '#1644B0', '#13C2C2', '#6C7488', '#FFFFFF'] }
  ];
  // Three of the twenty schemes inside the Typography Pack, chosen to show
  // real body-font variety at preview size: a bold sans body (Modernist
  // Statement / Satoshi), a quiet serif body (Quiet Authority / Source Serif
  // 4), and a single-family engineering system (Tech Studio / Geist). Each
  // scheme in the pack ships three faces — Display, Body, and an optional
  // Accent/Mono reserved for uppercase kickers and small labels only, never
  // body copy — so every card/modal below renders all three, matching the
  // pack exactly. Verified against the actual Typography Pack PDF (Source
  // Markdown/_render bonus build) on 2026-07-10: Scheme 02 → Space Mono
  // (700), Scheme 03 → JetBrains Mono (500), Scheme 14 → Geist Mono (500).
  // fontDisplay / fontBody / fontAccent match the CSS font-family stack of
  // each face so the preview cards render in the actual scheme typeface,
  // not a fallback.
  const specimenType = [
    {
      schemeNo: 2,
      pair: 'Clash Display × Satoshi × Space Mono',
      display: 'Clash Display',
      body: 'Satoshi',
      accent: 'Space Mono',
      tag: 'Modernist Statement',
      fontDisplay: "'Clash Display', sans-serif",
      fontBody: "'Satoshi', sans-serif",
      fontAccent: "'Space Mono', ui-monospace, monospace",
      displayWeight: 600,
      accentWeight: 700,
      sample: 'The launch is the start, not the end.',
      kicker: 'FIVE DAYS TO LIVE',
      cardNote: 'Set in Satoshi, headlined in Clash Display, kickers in Space Mono. Free for commercial use.'
    },
    {
      schemeNo: 3,
      pair: 'Fraunces × Source Serif 4 × JetBrains Mono',
      display: 'Fraunces',
      body: 'Source Serif 4',
      accent: 'JetBrains Mono',
      tag: 'Quiet Authority',
      fontDisplay: "'Fraunces', serif",
      fontBody: "'Source Serif 4', Georgia, serif",
      fontAccent: "'JetBrains Mono', ui-monospace, monospace",
      displayWeight: 600,
      accentWeight: 500,
      sample: 'The launch is the start, not the end.',
      kicker: 'FIVE DAYS TO LIVE',
      cardNote: 'Set in Source Serif 4, headlined in Fraunces, kickers in JetBrains Mono. Free for commercial use.'
    },
    {
      schemeNo: 14,
      pair: 'Geist × Geist × Geist Mono',
      display: 'Geist',
      body: 'Geist',
      accent: 'Geist Mono',
      tag: 'Tech Studio',
      fontDisplay: "'Geist', sans-serif",
      fontBody: "'Geist', sans-serif",
      fontAccent: "'Geist Mono', ui-monospace, monospace",
      displayWeight: 600,
      accentWeight: 500,
      sample: 'The launch is the start, not the end.',
      kicker: 'FIVE DAYS TO LIVE',
      cardNote: 'Set in Geist throughout, with Geist Mono reserved for kickers and labels. Free for commercial use.'
    }
  ];

  // ── LAUNCHPAD FAQ ────────────────────────────────────────────────
  const launchpadFaq = [
    ['Do I need to be technical?', 'No. Every template, prompt, and pattern is copy-paste. The prompts ask you a few plain questions and do the rest. If you can follow a recipe, you can follow this.'],
    ["What if I don't have an idea yet?", "Yes, that's what Day 1 is for. Start with nothing more than a hunch, or a blank page: Day 1 is a sequenced way to surface, validate, and price an idea, and you finish it with a locked offer."],
    ['How much time does each day take?', 'One focused sitting, not a day off work. The Launchpad is 72 guided steps across Welcome plus five days, action-first, so most people finish a day in one to two hours after work. Plan on roughly 8 to 12 hours of hands-on building across the five days, and the AI does the heavy lifting inside each screen.'],
    ['How do I get it after I pay?', 'Instantly. The moment your $129 payment clears, the email lands with a single file: the Launchpad itself, an interactive build system you open in your browser, plus the six supporting guides and the prompt vault, ready to keep forever. No onboarding call, no waiting room, nothing to install. You can open Day 1 the same night.'],
    ['What tools do I need?', "The free path can complete the whole system. Each day names the exact free and premium option for that stage: an AI writing assistant for the prompts, a guided website builder and deployment stack for Day 4, and a checkout platform for Day 5, all with real free tiers. A paid AI tier (about $20 a month) is optional polish, not a requirement: it buys longer sessions and a stronger model, which shows up as better output. There is no VanguardOS subscription on top, ever."],
    ['How much extra will I spend on tools?', 'You can build and host on free tiers. Two upgrades are worth it: a paid AI tier for stronger output, and a custom domain (about $10 a year) so your site has a real, credible address you own. A checkout platform also charges a small transaction fee per sale. Neither upgrade is required to finish, but both are worth the small spend.'],
    ['Will this work for my niche?', "Yes. The system is niche-agnostic by design. The templates and patterns are the scaffolding; the Day 2 brand work and Day 4 landing copy are where your niche shapes the output."],
    ["What if I'm already mid-launch?", "Drop into whichever day matches where you are. Stuck on the offer? Day 1. Brand feels off? Day 2. No landing page? Day 4. The Launchpad is a system you re-enter whenever a leg is weak."],
    ['Refund policy?', 'A full 30 days. Try the complete five-day system, and if it is not the right fit, email us within 30 days for a refund. If you get stuck on a step, tell us where. We would rather help you finish.']
  ];

  // ── STRUCTURED DATA ─────────────────────────────────────────────────
  // Built as plain JS objects, then serialized via an @html block below.
  // A literal ld+json script tag written directly in Svelte markup does
  // NOT evaluate mustache expressions inside it, since HTML parsers treat
  // script tag content as raw text — so JSON.stringify(...) used to render
  // as literal unparsed text instead of real JSON. Wrapping a template
  // literal (built from these objects) in an @html directive is the fix:
  // Svelte evaluates the interpolation first, then injects the resulting
  // string as raw HTML, after the parser has already moved past this point.
  // NOTE: avoid writing the literal open/close script-tag substrings
  // anywhere in this comment block, even inside a JS comment — the HTML
  // tokenizer that finds this script block's own boundary scans for that
  // raw text and does not know this is a comment, so it will end the block
  // early if those substrings appear here.
  // The FAQPage schema below maps directly over launchpadFaq so the
  // visible FAQ accordion and the FAQ schema can never drift apart.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "The Vanguard Launchpad",
    "description": "The Vanguard Launchpad is an interactive five-day system that guides you from idea to a branded digital product, a live sales page, a working checkout, and a ready-to-connect follow-up email sequence.",
    "image": "https://vanguardos.co/og/og-card.jpg",
    "url": "https://vanguardos.co/",
    "brand": { "@type": "Brand", "name": "VanguardOS" },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "bestRating": "5",
      "worstRating": "1",
      "reviewCount": "3"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "author": { "@type": "Person", "name": "Verified Buyer" },
        "reviewBody": "Instead of spending months trying to figure things out on my own, I came away with a clearer direction, a stronger brand foundation, and a funnel that I could start using right away. For me, it was a worthwhile investment because it helped turn a lot of uncertainty into a concrete plan."
      },
      {
        "@type": "Review",
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "author": { "@type": "Person", "name": "Verified Buyer" },
        "reviewBody": "The system is super polished, easy to understand, and aesthetically it's a 10/10. It's been a great investment, and I would definitely recommend it to anyone hesitating to take the plunge."
      },
      {
        "@type": "Review",
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "author": { "@type": "Person", "name": "Verified Buyer" },
        "reviewBody": "It helped me go from overthinking my next move to following a system that lead me to actually starting that business that I had put off for years. Feels really good seeing my business on an actual website with a checkout system!"
      }
    ],
    "offers": [
      {
        "@type": "Offer",
        "name": "The Vanguard Launchpad",
        "price": "129",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://vanguardos.co/",
        "priceValidUntil": "2026-12-31",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "US",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 30,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        }
      }
    ]
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VanguardOS",
    "url": "https://vanguardos.co/",
    "logo": "https://vanguardos.co/brand/brand-mark-owl.svg",
    "description": "VanguardOS builds systems that launch solopreneurs into the digital economy. The Vanguard Launchpad is the first.",
    "email": "support@vanguardos.co"
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": launchpadFaq.map(([q, a]) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    }))
  };

  const jsonLdScripts =
    `<script type="application/ld+json">${JSON.stringify(productJsonLd)}<\/script>` +
    `<script type="application/ld+json">${JSON.stringify(organizationJsonLd)}<\/script>` +
    `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}<\/script>`;

  onMount(() => {
    const onScroll = () => {
      scrolled = window.scrollY > 20;
      // Reveal the persistent mobile CTA once the hero (and its inline CTA) is
      // mostly scrolled past, so there's always a tap-target without it
      // overlapping the hero's own button.
      showStickyCta = window.scrollY > window.innerHeight * 0.85;
      // Hide the sticky CTA once the FAQ or the final conversion section
      // enters the viewport, so it never overlaps those controls.
      const vh0 = window.innerHeight;
      let nearEnd = false;
      for (const id of ['faq', 'final-cta']) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top < vh0 * 0.92) { nearEnd = true; break; }
        }
      }
      stickyNearEnd = nearEnd;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      // 5-day journey rail: fill as the section travels through the viewport.
      const fd = document.getElementById('five-day');
      if (fd) {
        const r = fd.getBoundingClientRect();
        const vh = window.innerHeight;
        // Fill completes while the day cards are still on screen: the gauge
        // reaches 100% (5th dot lit) just before the section scrolls past.
        const span = r.height * 0.45 + vh * 0.45;
        const advanced = vh * 0.85 - r.top;
        fiveDayProgress = Math.max(0, Math.min(advanced / span, 1));
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        menuOpen = false;
      }
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (contactOpen) closeContact();
      else if (specimenModalOpen) closeSpecimen();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      animate('.hero-item', { opacity: [0, 1], y: [20, 0] },
        { duration: 0.9, delay: stagger(0.13), easing: [0.25, 0.46, 0.45, 0.94] });
    } else {
      document.querySelectorAll('.hero-item').forEach(el => { el.style.opacity = '1'; });
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Mobile day-card spotlight: the `.is-active-card` styles (below) light a
    // day card as it crosses the middle band of the viewport, so the five-day
    // sequence reads as a guided walk-through on touch devices where hover
    // doesn't exist. Wired 2026-07-13 — the CSS existed but nothing toggled it.
    let cardIo = null;
    if (!reducedMotion && window.matchMedia('(max-width: 1023px)').matches) {
      cardIo = new IntersectionObserver(entries => {
        entries.forEach(e => e.target.classList.toggle('is-active-card', e.isIntersecting));
      }, { rootMargin: '-38% 0px -38% 0px' });
      document.querySelectorAll('.day-card').forEach(el => cardIo.observe(el));
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      io.disconnect();
      if (cardIo) cardIo.disconnect();
    };
  });
</script>

<svelte:head>
  {@html jsonLdScripts}
</svelte:head>

<!-- Scroll progress — thin gold hairline along the very top (godly.website-style polish) -->
<div class="scroll-progress" aria-hidden="true">
  <div class="scroll-progress-fill" style="transform: scaleX({scrollProgress})"></div>
</div>

<!-- Navbar -->
<header class="fixed top-0 left-0 w-full z-[90] px-4 py-4">
  <div class="mx-auto max-w-[1180px] rounded-[2rem] px-6 py-4 flex justify-between items-center border transition-all duration-300 {scrolled ? 'bg-base/60 backdrop-blur-xl border-line' : 'bg-transparent border-transparent'}">
    <a href="#top" class="flex items-center gap-2 group" aria-label="VanguardOS home">
      <img src="/brand/brand-mark-owl.svg" alt="VanguardOS owl mark" class="w-8 h-8 transition-transform group-hover:scale-105" />
      <span class="font-display text-base md:text-lg leading-none">
        <span class="text-text">Vanguard</span><span class="italic text-gold">OS</span>
      </span>
    </a>
    <nav class="hidden lg:flex items-center gap-8">
      <a href="#offer-stack" class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">What's Inside</a>
      <a href="#five-day" class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">5-Day Journey</a>
      <a href="#faq" class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">FAQ</a>
      <a href="mailto:support@vanguardos.co" on:click|preventDefault={openContact} class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">Contact</a>
      <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="nav-cta" on:click={trackCheckoutClick} class="flex items-center gap-2 px-5 h-11 border border-gold-line hover:border-gold hover:bg-gold-soft text-gold text-xs font-semibold font-mono uppercase tracking-wider rounded-full transition hover:scale-[1.03]">
        <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        Start My 5-Day Build
      </a>
    </nav>
    <button class="lg:hidden text-muted hover:text-text p-1" on:click={() => menuOpen = !menuOpen} aria-label="Toggle menu">
      {#if menuOpen}
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      {:else}
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      {/if}
    </button>
  </div>
  <!-- Off-canvas mobile drawer is conditionally rendered (not translated
       off-screen) so a closed menu never extends the horizontal scroll area.
       A translateX(100%) parked panel is a classic source of the exact mobile
       overflow the QA gate checks for once body clipping is disabled. -->
  {#if menuOpen}
    <button on:click={() => menuOpen = false} type="button" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[92] lg:hidden" aria-label="Close menu"></button>
    <div class="menu-drawer fixed top-0 right-0 h-screen w-[280px] max-w-[86vw] bg-surface border-l border-line p-8 space-y-6 shadow-2xl z-[95] lg:hidden">
      <button on:click={() => menuOpen = false} class="ml-auto block text-muted hover:text-text" aria-label="Close">✕</button>
      <a href="#offer-stack" on:click={() => menuOpen = false} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">What's Inside</a>
      <a href="#five-day" on:click={() => menuOpen = false} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">5-Day Plan</a>
      <a href="#faq" on:click={() => menuOpen = false} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">FAQ</a>
      <a href="mailto:support@vanguardos.co" on:click|preventDefault={openContact} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">Contact</a>
      <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="mobile-nav-cta" on:click={(e) => { menuOpen = false; trackCheckoutClick(e); }} class="flex flex-nowrap items-center justify-center gap-2 h-12 bg-gold text-base-2 font-bold font-mono uppercase text-xs tracking-[0.04em] rounded-full">
        <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
      </a>
    </div>
  {/if}
</header>


<main id="top">
  <!-- HERO -->
  <section class="relative pt-24 pb-12 md:pt-28 md:pb-20 px-6 flex flex-col items-center text-center overflow-hidden"
    style="background-image: radial-gradient(ellipse at 80% -10%, rgba(212,175,55,0.10), transparent 60%);">
    <div class="hero-inner w-full min-w-0 max-w-[1100px] mx-auto space-y-5 md:space-y-6">
      <!-- Logo lockup hidden on mobile: the fixed navbar already carries the
           brand there, and every pixel of vertical space matters for
           getting the CTA into the first 390×844 viewport. -->
      <div class="hero-item hidden md:inline-flex items-center gap-3" style="opacity: 0">
        <img src="/brand/brand-mark-owl.svg" alt="VanguardOS owl mark" class="w-10 h-10" />
        <span class="font-display text-lg md:text-xl leading-none">
          <span class="text-text">Vanguard</span><span class="italic text-gold">OS</span>
        </span>
      </div>

      <!-- Eyebrow above the headline: names the category in one calm line. -->
      <div class="hero-item w-full min-w-0" style="opacity: 0">
        <span class="font-mono text-[11px] md:text-xs uppercase tracking-[0.28em] md:tracking-[0.3em] text-gold">
          The Interactive 5-Day Build System
        </span>
      </div>

      <!-- Headline
           This <h1> is the page's LCP candidate (largest painted text block
           above the fold), so it is excluded from the JS opacity fade and
           paints immediately at first paint; `.hero-h1` gives it a CSS-only
           transform-in entrance that never touches opacity. Only "with a live
           checkout." is set in champagne-gold italic; the rest stays platinum.
           Fixed rem sizes only (no viewport-width font sizing) so the two-line
           headline reads cleanly on a 390px viewport. -->
      <h1 class="hero-h1 font-display font-medium text-text leading-[1.02] md:leading-[0.98] w-full min-w-0 max-w-[1100px] mx-auto select-none">
        <span class="block text-[1.95rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] md:leading-[0.98]">
          Turn one unfinished idea into a branded digital product
        </span>
        <span class="block italic text-gold text-[1.95rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] md:leading-[0.98] mt-1.5 md:mt-3">
          and a live checkout in five days.
        </span>
      </h1>

      <!-- Supporting copy: names the exact sequence in one sentence. -->
      <p class="hero-item body-copy font-sans text-body text-[17px] md:text-2xl leading-[1.6] md:leading-snug w-full min-w-0 max-w-[820px] mx-auto" style="opacity: 0">
        The Vanguard Launchpad walks you through the offer, product, brand, sales page, checkout, and follow-up. One clear step at a time.
      </p>

      <!-- Mechanism line: the three-part rhythm of how the work happens. -->
      <p class="hero-item font-sans text-text text-base md:text-xl leading-relaxed w-full min-w-0 max-w-[720px] mx-auto" style="opacity: 0">
        Three guided prompts a day. Your progress saves as you build.
      </p>

      <!-- Primary CTA: gold, prominent. Secondary "See the 5-Day Plan" is the
           lower-commitment path: anchor-scrolls to the five-day section. On
           mobile the primary CTA is full-width within a sensible max so it
           lands inside the first 390×844 viewport without clipping. -->
      <div class="hero-item w-full min-w-0 flex flex-col items-center gap-4 pt-1 md:pt-2" style="opacity: 0">
        <div class="w-full min-w-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="hero-primary" on:click={trackCheckoutClick} class="btn-primary cta-btn cta-hero w-full sm:w-auto max-w-[360px] sm:max-w-none rounded-[2rem] font-mono text-sm md:text-base uppercase">
            <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
            <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
            <span class="cta-arrow" aria-hidden="true">→</span>
          </a>
          <a href="#five-day" class="btn-secondary cta-btn cta-hero w-full sm:w-auto max-w-[360px] sm:max-w-none rounded-[2rem] font-mono text-sm md:text-base uppercase">
            <span class="cta-label">See the 5-Day Plan</span>
          </a>
        </div>
      </div>

      <!-- Price + trust line: price shown clearly right under the CTA, then
           the reassurances a skeptical cold click needs before scrolling. -->
      <div class="hero-item w-full min-w-0 pt-1" style="opacity: 0">
        <p class="cta-price w-full min-w-0 max-w-[860px] mx-auto"><span class="price">$129</span> · one payment · yours forever</p>
        <p class="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.12em] md:tracking-[0.28em] text-muted-2 w-full min-w-0 max-w-[860px] mx-auto leading-relaxed mt-2">
          Instant access &nbsp;·&nbsp; Mobile and desktop &nbsp;·&nbsp; 30-day guarantee
        </p>
      </div>

      <!-- Hero visual: the restrained five-day-path animation (not a full
           screenshot). Answers one objection: "is this a real interactive
           system, not a PDF?" Ends on a static confirmation line. -->
      <div class="hero-item w-full min-w-0 pt-3 md:pt-6" style="opacity: 0">
        <div class="w-full min-w-0 max-w-[640px] mx-auto">
          <div class="motion-viz motion-panel rounded-[1.5rem] border border-line bg-surface/40">
            <span class="motion-label">Idea to live checkout</span>
            <div class="mv-day-row">
              <div class="mv-day-chip"><span>Day 1</span><strong>Idea</strong></div>
              <div class="mv-day-chip"><span>Day 2</span><strong>Brand</strong></div>
              <div class="mv-day-chip"><span>Day 3</span><strong>Product</strong></div>
              <div class="mv-day-chip"><span>Day 4</span><strong>Page</strong></div>
              <div class="mv-day-chip"><span>Day 5</span><strong>Checkout</strong></div>
            </div>
            <div class="mv-path-line"></div>
            <div class="mv-day-scan"><i></i></div>
          </div>
          <p class="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-muted mt-4">
            <span class="text-gold" aria-hidden="true">✓</span> Day 5 output: a checkout ready to publish.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       THE PROBLEM — pain before the reveal
       ═══════════════════════════════════════════════════════════════ -->
  <section id="problem" class="relative py-14 md:py-20 px-6 border-t border-line/60">
    <div class="max-w-[1100px] mx-auto reveal">
      <header class="text-center max-w-[860px] mx-auto mb-8 md:mb-10">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Why You Haven't Launched</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl leading-[0.98] text-text">
          The idea is not the hard part. <span class="italic text-gold">The unfinished middle is.</span>
        </h2>
        <p class="body-copy text-text/85 text-lg md:text-xl mt-6 leading-relaxed">
          What steals weeks is the chain between idea and payment: offer, product, brand, page, checkout, delivery, and follow-up.
        </p>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">01 · The Notes app trap</span>
          <p class="text-base md:text-lg text-text/90 leading-relaxed mt-3">You polish the idea, close the note, and still do not know the next move.</p>
        </div>
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">02 · The forty-decision fog</span>
          <p class="text-base md:text-lg text-text/90 leading-relaxed mt-3">Every choice feels small. All of them at once stop the launch.</p>
        </div>
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">03 · The missing money path</span>
          <p class="text-base md:text-lg text-text/90 leading-relaxed mt-3">A file cannot sell itself. It needs a page, checkout, delivery, and follow-up.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       THE 5-DAY JOURNEY — visual day-by-day outcomes
       ═══════════════════════════════════════════════════════════════ -->
  <section id="five-day" class="relative py-16 md:py-24 px-6 border-t border-line/60 overflow-hidden"
    style="background-image: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.08), transparent 60%);">
    <div class="max-w-[1180px] mx-auto">
      <header class="text-center max-w-[820px] mx-auto mb-10 md:mb-14 reveal">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">The 5-Day Journey</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">
          Five days. Five outcomes. <span class="italic text-gold">One launch-ready system.</span>
        </h2>
        <p class="body-copy text-body text-lg md:text-xl mt-6 leading-relaxed">
          Finish one piece each day. Every completed step unlocks the next. By Day 5, the full path from idea to payment is ready.
        </p>
      </header>

      <!-- The animated five-day-path panel used to repeat here (same markup
           as the hero visual). Removed 2026-07-13: within one section the
           sequence was told three times (panel + rail + cards). The rail and
           the day cards carry it now; the hero keeps the single animation. -->

      <!-- Scrollytelling rail — fills as the section scrolls past; day markers
           light up in sequence. -->
      <div class="five-day-rail block" aria-hidden="true">
        <div class="five-day-rail-track">
          <div class="five-day-rail-fill" style="transform: scaleX({fiveDayProgress})"></div>
        </div>
        <div class="five-day-rail-dots">
          {#each launchpadDays as day, idx}
            <span class="five-day-dot {fiveDayProgress >= (idx + 0.5) / launchpadDays.length ? 'is-lit' : ''}"></span>
          {/each}
        </div>
      </div>

      <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mt-10 md:mt-12">
        {#each launchpadDays as day, idx}
          <li class="day-card reveal rounded-[1.5rem] border border-line bg-surface/60 p-5 md:p-6 flex flex-col gap-4 transition"
            data-day-index={idx}
            style="transition-delay: {idx * 90}ms">
            <div class="day-visual relative aspect-square rounded-[1rem] overflow-hidden bg-base/40 border border-line/60">
              <div class="day-fallback absolute inset-0 p-3 select-none overflow-hidden"
                style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12), transparent 70%);" aria-hidden="true">
                <div class="absolute top-2 left-2.5 flex items-baseline gap-1 z-10">
                  <span class="font-mono font-bold text-base text-gold/90 leading-none tracking-tight">{day.num}</span>
                  <span class="font-mono text-[7px] uppercase tracking-[0.25em] text-muted-2">{day.kicker}</span>
                </div>
                {#if day.num === '01'}
                  <div class="absolute inset-0 flex flex-col justify-center gap-1.5 px-5 pt-5">
                    {#each [0,1,2] as r}
                      <div class="flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-gold/25 border border-gold/50 flex items-center justify-center text-gold text-[7px] leading-none">✓</span>
                        <span class="h-1.5 flex-1 rounded-full bg-gold/20"></span>
                      </div>
                    {/each}
                    <span class="mt-1.5 self-start text-[8px] font-mono text-gold/80 border border-gold/40 rounded px-1.5 py-0.5">Offer locked</span>
                  </div>
                {:else if day.num === '02'}
                  <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pt-4">
                    <div class="w-8 h-8 rounded-lg border border-gold/50 bg-gold/10 flex items-center justify-center font-display text-gold text-sm leading-none">V</div>
                    <div class="flex gap-1">
                      {#each ['#0A0B0B','#ECEAE4','#D4AF37','#7FB89A','#76766F'] as c}
                        <span class="w-3 h-3 rounded-sm" style="background:{c}"></span>
                      {/each}
                    </div>
                    <div class="flex flex-col items-center gap-1 mt-0.5">
                      <span class="h-1.5 w-16 rounded-full bg-text/30"></span>
                      <span class="h-1 w-11 rounded-full bg-text/15"></span>
                    </div>
                  </div>
                {:else if day.num === '03'}
                  <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5 p-4 pt-8">
                    <span class="rounded-md border border-gold/20 bg-gradient-to-br from-gold/25 to-transparent"></span>
                    <span class="rounded-md border border-line bg-gradient-to-br from-text/15 to-transparent"></span>
                    <span class="rounded-md border border-line bg-gradient-to-tr from-gold/15 to-transparent"></span>
                    <span class="rounded-md border border-gold/20 bg-gradient-to-tr from-text/20 to-transparent"></span>
                  </div>
                {:else if day.num === '04'}
                  <div class="absolute inset-0 flex flex-col gap-1.5 p-4 pt-8">
                    <div class="flex items-center justify-between">
                      <span class="w-4 h-1.5 rounded-full bg-gold/60"></span>
                      <span class="w-6 h-1.5 rounded-full bg-text/15"></span>
                    </div>
                    <span class="h-2 w-3/4 rounded bg-text/30 mt-1"></span>
                    <span class="h-1.5 w-1/2 rounded bg-text/15"></span>
                    <span class="mt-1 h-3 w-12 rounded-full bg-gold/70"></span>
                    <div class="mt-auto grid grid-cols-3 gap-1">
                      <span class="h-4 rounded bg-text/10"></span>
                      <span class="h-4 rounded bg-text/10"></span>
                      <span class="h-4 rounded bg-text/10"></span>
                    </div>
                  </div>
                {:else}
                  <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 pt-4">
                    <span class="h-2.5 w-20 rounded-sm bg-gold/60"></span>
                    <span class="h-2.5 w-14 rounded-sm bg-gold/40"></span>
                    <span class="h-2.5 w-9 rounded-sm bg-gold/25"></span>
                    <span class="mt-1.5 text-[8px] font-mono text-gold/80 border border-gold/40 rounded px-1.5 py-0.5">Checkout live</span>
                  </div>
                {/if}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] uppercase tracking-[0.4em] text-gold day-kicker">Day {day.num}</span>
              <span class="h-px flex-1 bg-gold-line/60"></span>
            </div>
            <h3 class="font-display text-2xl text-text leading-tight">{day.kicker}</h3>
            <p class="text-base text-text/90 leading-snug font-medium">{day.line}</p>
            <p class="text-sm text-muted leading-relaxed">{day.desc}</p>
          </li>
        {/each}
      </ol>

      <div class="text-center mt-12 reveal">
        <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="five-day-cta" on:click={trackCheckoutClick} class="btn-primary cta-btn w-full max-w-[480px] mx-auto rounded-[2rem] font-mono text-sm md:text-base uppercase">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
          <span class="cta-arrow" aria-hidden="true">→</span>
        </a>
        <p class="cta-price max-w-[480px] mx-auto">One payment · 30-day guarantee</p>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       SELECTIVE PRODUCT REVEAL — the page's one main real-product
       screenshot. Visual Reveal Rule: cropped/edge-masked, not a full
       screen, and not part of a gallery. Answers exactly one objection —
       "is this a real interactive product, and is it easy to follow?" —
       without showing the full prompt text, the complete navigation, or
       every screen. Condensed 2026-07-11 from a 5-row screenshot gallery.
       ═══════════════════════════════════════════════════════════════ -->
  <section id="reveal" class="relative py-16 md:py-20 px-6 border-t border-line/60">
    <div class="max-w-[900px] mx-auto reveal text-center">
      <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">A Real Day 1 Screen</span>
      <h2 class="font-display text-3xl md:text-5xl leading-tight text-text mt-3 mb-4">
        The work arrives <span class="italic text-gold">one step at a time.</span>
      </h2>
      <p class="body-copy text-text text-lg md:text-xl leading-relaxed max-w-[720px] mx-auto mb-8 md:mb-10">
        Three guided prompts carry each day. Copy one, answer a few plain questions, save the result, and move to the next screen.
      </p>
      <div class="product-peek relative max-w-[760px] mx-auto rounded-[1.25rem] md:rounded-[1.5rem] border border-gold-line/50 bg-surface/60 shadow-2xl shadow-black/40 overflow-hidden">
        <div class="product-peek-bar">
          <span>Day 1 · Ideate</span>
          <span><i aria-hidden="true"></i>15% saved</span>
        </div>
        <div class="product-peek-media">
          <img src="/screenshots/three-prompts.webp" alt="A focused glimpse inside Day 1 of the Vanguard Launchpad, showing the saved progress, guided navigation, and first prompt screen" class="product-peek-image" width="1200" height="917" loading="lazy" decoding="async" />
          <div class="product-peek-caption">
            <span>Prompt 1 of 3</span>
            <strong>One clear job. Then the next.</strong>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Verified-buyer proof appears immediately after the product reveal,
       before the offer. The quotes remain verbatim. -->
  <section id="testimonials" class="relative py-16 md:py-20 px-6 border-t border-line/60"
    style="background-image: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.07), transparent 55%);">
    <div class="max-w-[1180px] mx-auto reveal">
      <header class="text-center max-w-[780px] mx-auto mb-10 md:mb-12">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Verified Buyers</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text">
          From unfinished ideas <span class="italic text-gold">to something real.</span>
        </h2>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7 flex flex-col gap-4 hover:border-gold-line transition">
          <span class="text-gold text-lg tracking-[0.15em] leading-none" aria-label="Rated 5 out of 5 stars">★★★★★</span>
          <p class="text-text/90 text-base leading-relaxed flex-1">"Instead of spending months trying to figure things out on my own, I came away with a clearer direction, a stronger brand foundation, and a funnel that I could start using right away. For me, it was a worthwhile investment because it helped turn a lot of uncertainty into a concrete plan."</p>
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2 inline-flex items-center gap-1.5"><span class="text-gold" aria-hidden="true">✓</span> Verified Buyer</span>
        </div>
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7 flex flex-col gap-4 hover:border-gold-line transition">
          <span class="text-gold text-lg tracking-[0.15em] leading-none" aria-label="Rated 5 out of 5 stars">★★★★★</span>
          <p class="text-text/90 text-base leading-relaxed flex-1">"The system is super polished, easy to understand, and aesthetically it's a 10/10. It's been a great investment, and I would definitely recommend it to anyone hesitating to take the plunge."</p>
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2 inline-flex items-center gap-1.5"><span class="text-gold" aria-hidden="true">✓</span> Verified Buyer</span>
        </div>
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7 flex flex-col gap-4 hover:border-gold-line transition">
          <span class="text-gold text-lg tracking-[0.15em] leading-none" aria-label="Rated 5 out of 5 stars">★★★★★</span>
          <p class="text-text/90 text-base leading-relaxed flex-1">"It helped me go from overthinking my next move to following a system that lead me to actually starting that business that I had put off for years. Feels really good seeing my business on an actual website with a checkout system!"</p>
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2 inline-flex items-center gap-1.5"><span class="text-gold" aria-hidden="true">✓</span> Verified Buyer · Full-time college student</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       OFFER — high-impact stack, core system first, bonuses made tangible.
       ═══════════════════════════════════════════════════════════════ -->
  <section id="offer-stack" class="relative py-16 md:py-24 px-6 border-t border-line/60">
    <div class="max-w-[1100px] mx-auto reveal">
      <header class="text-center max-w-[820px] mx-auto mb-10 md:mb-14">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">One system. Everything in order.</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">
          What you need to move from idea <span class="italic text-gold">to live checkout.</span>
        </h2>
        <p class="body-copy text-text text-lg md:text-xl mt-6 leading-relaxed">
          The complete Launchpad plus the prompts, page system, brand tools, operations dashboard, and funnel patterns each step needs.
        </p>
      </header>

      <div class="reveal mb-8 md:mb-10 max-w-[820px] mx-auto rounded-[1.25rem] border-l-2 border-gold bg-surface/60 px-5 py-4 md:px-8 md:py-6">
        <p class="font-display italic text-lg md:text-xl text-text/90 leading-relaxed">
          <span class="text-gold not-italic font-semibold">72 guided steps</span> live inside one interactive app. You finish one screen, then move to the next. No giant manual to study first.
        </p>
      </div>

      <div class="reveal rounded-[1.75rem] border-2 border-gold bg-gold-soft/20 p-6 md:p-8"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12), transparent 70%);">
        <div class="flex items-center justify-between gap-4 mb-4">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">The core system</span>
        </div>
        <div class="flex items-start gap-4 md:gap-6">
          <img src={coreItem.img} alt="{coreItem.name} cover art" class="w-20 h-20 md:w-28 md:h-28 rounded-[1rem] border border-gold-line/60 object-cover shrink-0" loading="lazy" decoding="async" />
          <div class="flex flex-col gap-2 min-w-0">
            <h3 class="font-display text-2xl md:text-4xl text-text leading-tight">{coreItem.name}</h3>
            <p class="text-base md:text-lg text-text/85 leading-relaxed">{coreItem.blurb} This is the spine of the process. Everything below supports a step inside it.</p>
          </div>
        </div>
      </div>

      <div class="reveal flex items-center justify-center gap-4 my-8 md:my-10">
        <div class="h-px flex-1 bg-gold-line/40"></div>
        <span class="font-mono text-gold text-center bonus-header-text">The supporting systems, included</span>
        <div class="h-px flex-1 bg-gold-line/40"></div>
      </div>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {#each bonusItems as item}
          <li class="offer-support-card reveal rounded-[1.5rem] border border-line bg-surface/60 p-5 md:p-7 hover:border-gold-line transition flex flex-col gap-3">
            <div class="flex items-start gap-4">
              <img src={item.img} alt="{item.name} cover art" class="offer-support-image w-14 h-14 md:w-20 md:h-20 rounded-[0.75rem] md:rounded-[0.9rem] border border-line/60 object-cover shrink-0" loading="lazy" decoding="async" />
              <div class="flex flex-col gap-2 min-w-0">
                <h3 class="font-display text-xl md:text-[28px] text-text leading-tight">{item.name}</h3>
                <p class="offer-support-copy">{item.blurb}</p>
              </div>
            </div>
          </li>
        {/each}
      </ul>

      <div class="reveal flex items-center justify-center gap-4 mt-10 mb-4">
        <div class="h-px w-12 bg-gold-line/40"></div>
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-2">Open a sample before you buy</span>
        <div class="h-px w-12 bg-gold-line/40"></div>
      </div>
      <div class="reveal grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <button type="button" on:click={(e) => openSpecimen('palette', specimenPalettes[0], e)}
          class="specimen-row flex items-center gap-3 rounded-[1rem] border border-line bg-surface/60 px-5 py-4 text-left"
          aria-label="Expand a sample palette from the Brand Palette Pack">
          <div class="flex h-9 w-16 rounded-md overflow-hidden border border-line/60 shrink-0">
            {#each specimenPalettes[0].colors as c}
              <span class="flex-1" style="background-color: {c};"></span>
            {/each}
          </div>
          <span class="text-sm text-text/85">One of 20 palettes inside the Brand Palette Pack</span>
        </button>
        <button type="button" on:click={(e) => openSpecimen('type', specimenType[0], e)}
          class="specimen-row flex items-center gap-3 rounded-[1rem] border border-line bg-surface/60 px-5 py-4 text-left"
          aria-label="Expand a sample type pairing from the Typography Pack">
          <span class="font-display italic text-gold text-xl shrink-0" style="font-family: {specimenType[0].fontDisplay};">Aa</span>
          <span class="text-sm text-text/85">One of 20 type systems inside the Typography Pack</span>
        </button>
      </div>

      <div class="reveal mt-10 md:mt-12 rounded-[2rem] border-2 border-gold bg-gold-soft/20 p-8 md:p-10"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10), transparent 70%);">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 min-w-0">
          <span class="font-display text-2xl md:text-3xl text-text leading-tight min-w-0">The Vanguard Launchpad</span>
          <span class="font-mono font-bold text-3xl md:text-4xl text-gold tracking-tight min-w-0">$129<span class="font-normal text-sm md:text-base text-text/70 ml-2 whitespace-nowrap">· one payment</span></span>
        </div>
        <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="offer-stack-cta" on:click={trackCheckoutClick} class="btn-primary cta-btn w-full mt-7 rounded-[2rem] font-mono text-sm md:text-base uppercase">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
          <span class="cta-arrow" aria-hidden="true">→</span>
        </a>
        <p class="text-xs md:text-sm font-mono uppercase tracking-wide md:tracking-widest text-muted mt-3 text-center leading-relaxed">Instant access · Keep it for future launches · 30-day guarantee</p>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       WHO THIS IS FOR / NOT FOR — final qualification gate, placed after
       proof (mechanism + testimonials) and right before the guarantee/CTA
       push. Condensed to 3 points per side 2026-07-11 (was 5/6) so this
       reads as a fast, concrete final filter instead of another wall of
       copy — the buyer has already seen the offer and proof by this point.
       ═══════════════════════════════════════════════════════════════ -->
  <section id="for-who" class="relative py-16 md:py-20 px-6 border-t border-line/60">
    <div class="max-w-[1080px] mx-auto reveal">
      <header class="text-center max-w-[760px] mx-auto mb-10 md:mb-12">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Who This Is For</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text">
          Honest qualification, <span class="italic text-gold">both ways</span>.
        </h2>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 rounded-[1.5rem] border border-line bg-surface/60 overflow-hidden">
        <!-- For you if... -->
        <div class="p-7 md:p-10 md:border-r md:border-gold-line border-b md:border-b-0 border-gold-line">
          <div class="flex items-center gap-3 mb-5">
            <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">For you if</span>
          </div>
          <h3 class="font-display text-2xl md:text-3xl text-text leading-tight mb-6">
            This is for you if<span class="text-gold">...</span>
          </h3>
          <ul class="flex flex-col gap-4 text-base md:text-lg text-text/90 leading-relaxed">
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You have an unfinished idea and are ready to ship it.</span></li>
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You want the launch decisions placed in a clear order.</span></li>
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You want a real product, page, checkout, and follow-up ready by Day 5.</span></li>
          </ul>
        </div>
        <!-- NOT for you if... -->
        <div class="p-7 md:p-10">
          <div class="flex items-center gap-3 mb-5">
            <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Not for you if</span>
          </div>
          <h3 class="font-display text-2xl md:text-3xl text-text leading-tight mb-6">
            This is <span class="italic text-muted">not</span> for you if<span class="text-muted">...</span>
          </h3>
          <ul class="flex flex-col gap-4 text-base md:text-lg text-text/80 leading-relaxed">
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You want someone else to do every step for you.</span></li>
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You expect sales without showing people the offer.</span></li>
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You need inventory, shipping, or physical-product fulfillment.</span></li>
          </ul>
        </div>
      </div>
      <div class="text-center mt-8">
        <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="for-who-cta" on:click={trackCheckoutClick} class="inline-flex flex-nowrap items-center justify-center gap-2 px-6 sm:px-8 h-12 max-w-full border border-gold-line hover:border-gold hover:bg-gold-soft text-gold text-xs font-semibold font-mono uppercase tracking-[0.04em] sm:tracking-wider rounded-full transition hover:scale-[1.03]">
          <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
          <span class="cta-arrow shrink-0" aria-hidden="true">→</span>
        </a>
        <p class="cta-price max-w-[420px] mx-auto">One payment · 30-day guarantee</p>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       RISK REVERSAL — 30-day guarantee
       ═══════════════════════════════════════════════════════════════ -->
  <section class="relative py-16 md:py-20 px-6">
    <div class="max-w-[860px] mx-auto reveal">
      <div class="rounded-[2.5rem] border border-gold-line bg-gold-soft/30 p-8 md:p-12 text-center"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10), transparent 70%);">
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">30-Day Money-Back Guarantee</span>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text mt-4 mb-5">
          Build it. <span class="italic text-gold">Then decide.</span>
        </h2>
        <p class="text-text text-lg md:text-xl leading-relaxed max-w-[640px] mx-auto">
          <strong class="text-gold">30-day money-back guarantee.</strong> Try the complete five-day system. If it is not the right fit, email us within 30 days for a refund.
        </p>
        <p class="text-text text-base md:text-[17px] leading-relaxed max-w-[620px] mx-auto mt-4">
          If you get stuck on a step, tell us where. We would rather help you finish.
        </p>
      </div>

    </div>
  </section>


  <!-- ═══ MULTILINGUAL — IN YOUR LANGUAGE ═══ -->
  <section id="languages" class="relative py-20 md:py-24 px-6 border-t border-line/60 overflow-hidden">
    <div class="max-w-[1040px] mx-auto">
      <header class="text-center reveal">
        <div class="flex items-center justify-center gap-3 mb-8">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Six languages · One price</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl leading-[0.98] text-text">
          English isn't your first language? <span class="italic text-gold">You're covered.</span>
        </h2>
        <p class="body-copy text-body text-lg md:text-xl mt-6 max-w-[760px] mx-auto leading-relaxed">
          Choose the language you think and build in. Every edition includes the complete interactive Launchpad, the Website System, and all six supporting guides. Same download, same price, no add-on.
        </p>
      </header>

      <div class="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <!-- English -->
        <div class="reveal flex items-center gap-3.5 bg-surface/60 border border-line rounded-2xl px-5 py-4 transition hover:border-gold-line hover:bg-gold-soft/10">
          <span class="inline-block w-8 h-[21px] rounded-[3px] overflow-hidden ring-1 ring-black/25 shadow-sm flex-shrink-0">
            <svg viewBox="0 0 60 40" class="block w-full h-full"><rect width="60" height="40" fill="#fff"/><g fill="#B22234"><rect width="60" height="3.1"/><rect y="6.2" width="60" height="3.1"/><rect y="12.3" width="60" height="3.1"/><rect y="18.5" width="60" height="3.1"/><rect y="24.6" width="60" height="3.1"/><rect y="30.8" width="60" height="3.1"/><rect y="36.9" width="60" height="3.1"/></g><rect width="26" height="21.5" fill="#3C3B6E"/><g fill="#fff"><circle cx="5" cy="4" r="1"/><circle cx="11" cy="4" r="1"/><circle cx="17" cy="4" r="1"/><circle cx="23" cy="4" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="20" cy="8" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="11" cy="12" r="1"/><circle cx="17" cy="12" r="1"/><circle cx="23" cy="12" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="14" cy="16" r="1"/><circle cx="20" cy="16" r="1"/></g></svg>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg md:text-xl text-text">English</span>
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Complete edition</span>
          </span>
        </div>
        <!-- Español -->
        <div class="reveal flex items-center gap-3.5 bg-surface/60 border border-line rounded-2xl px-5 py-4 transition hover:border-gold-line hover:bg-gold-soft/10">
          <span class="inline-block w-8 h-[21px] rounded-[3px] overflow-hidden ring-1 ring-black/25 shadow-sm flex-shrink-0">
            <svg viewBox="0 0 60 40" class="block w-full h-full"><rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/></svg>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg md:text-xl text-text">Español</span>
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Edición completa</span>
          </span>
        </div>
        <!-- Português -->
        <div class="reveal flex items-center gap-3.5 bg-surface/60 border border-line rounded-2xl px-5 py-4 transition hover:border-gold-line hover:bg-gold-soft/10">
          <span class="inline-block w-8 h-[21px] rounded-[3px] overflow-hidden ring-1 ring-black/25 shadow-sm flex-shrink-0">
            <svg viewBox="0 0 60 40" class="block w-full h-full"><rect width="60" height="40" fill="#009C3B"/><polygon points="30,5 55,20 30,35 5,20" fill="#FFDF00"/><circle cx="30" cy="20" r="8" fill="#002776"/></svg>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg md:text-xl text-text">Português</span>
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Edição completa</span>
          </span>
        </div>
        <!-- Français -->
        <div class="reveal flex items-center gap-3.5 bg-surface/60 border border-line rounded-2xl px-5 py-4 transition hover:border-gold-line hover:bg-gold-soft/10">
          <span class="inline-block w-8 h-[21px] rounded-[3px] overflow-hidden ring-1 ring-black/25 shadow-sm flex-shrink-0">
            <svg viewBox="0 0 60 40" class="block w-full h-full"><rect width="20" height="40" fill="#0055A4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#EF4135"/></svg>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg md:text-xl text-text">Français</span>
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Édition complète</span>
          </span>
        </div>
        <!-- Deutsch -->
        <div class="reveal flex items-center gap-3.5 bg-surface/60 border border-line rounded-2xl px-5 py-4 transition hover:border-gold-line hover:bg-gold-soft/10">
          <span class="inline-block w-8 h-[21px] rounded-[3px] overflow-hidden ring-1 ring-black/25 shadow-sm flex-shrink-0">
            <svg viewBox="0 0 60 40" class="block w-full h-full"><rect width="60" height="13.33" fill="#000"/><rect y="13.33" width="60" height="13.33" fill="#DD0000"/><rect y="26.66" width="60" height="13.34" fill="#FFCE00"/></svg>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg md:text-xl text-text">Deutsch</span>
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Komplette Edition</span>
          </span>
        </div>
        <!-- 中文 -->
        <div class="reveal flex items-center gap-3.5 bg-surface/60 border border-line rounded-2xl px-5 py-4 transition hover:border-gold-line hover:bg-gold-soft/10">
          <span class="inline-block w-8 h-[21px] rounded-[3px] overflow-hidden ring-1 ring-black/25 shadow-sm flex-shrink-0">
            <svg viewBox="0 0 60 40" class="block w-full h-full"><rect width="60" height="40" fill="#DE2910"/><g fill="#FFDE00"><polygon points="12,4.5 13.9,10.4 20.1,10.4 15.1,14.0 17.0,19.9 12,16.3 7.0,19.9 8.9,14.0 3.9,10.4 10.1,10.4"/><circle cx="22" cy="5" r="1.2"/><circle cx="26" cy="8.5" r="1.2"/><circle cx="26" cy="13.5" r="1.2"/><circle cx="22" cy="17" r="1.2"/></g></svg>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg md:text-xl text-text">中文</span>
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">完整版</span>
          </span>
        </div>
      </div>

      <p class="text-center text-sm font-mono uppercase tracking-widest text-muted mt-10 reveal">
        Six languages · Same price · One download
      </p>
    </div>
  </section>

  <!-- FAQ — Launchpad -->
  <section id="faq" class="py-20 md:py-28 px-6 max-w-[820px] mx-auto border-t border-line/60">
    <h2 class="font-display text-3xl md:text-5xl text-text text-center mb-12 reveal">Straight answers.</h2>
    <div class="space-y-4">
      {#each launchpadFaq as qa}
        <details class="group reveal rounded-2xl border border-line bg-surface/50 p-6 md:p-7">
          <summary class="flex items-center justify-between cursor-pointer list-none font-display text-xl md:text-2xl text-text">
            {qa[0]}
            <span class="text-gold transition-transform group-open:rotate-45 text-2xl leading-none ml-4">+</span>
          </summary>
          <p class="text-text text-base md:text-[17px] leading-relaxed mt-4">{qa[1]}</p>
        </details>
      {/each}
    </div>
  </section>

  <!-- FINAL CTA — Launchpad -->
  <section id="final-cta" class="px-6 py-24 md:py-32 border-t border-line/60 text-center overflow-hidden"
    style="background-image: radial-gradient(ellipse at 50% 120%, rgba(212,175,55,0.12), transparent 60%);">
    <div class="max-w-[820px] mx-auto reveal space-y-8">
      <img src="/brand/brand-mark-owl.svg" alt="VanguardOS owl mark" class="w-12 h-12 mx-auto" />
      <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">Pick the idea you are tired of carrying. <span class="italic text-gold">Give it five ordered days.</span></h2>
      <p class="text-text text-lg md:text-xl max-w-[680px] mx-auto leading-relaxed">
        The Launchpad turns the next launch into a sequence you can follow: brand, product, page, checkout, and follow-up.
      </p>


      <div class="flex flex-col items-center gap-4">
        <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="final-cta" on:click={trackCheckoutClick} class="btn-primary cta-btn w-full max-w-[480px] mx-auto rounded-[2rem] font-mono text-sm md:text-base uppercase">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
          <span class="cta-arrow" aria-hidden="true">→</span>
        </a>
        <p class="cta-price max-w-[480px] mx-auto"><span class="price">$129</span> · one payment · 30-day guarantee</p>
        <a href="#five-day" class="text-sm font-mono uppercase tracking-widest text-muted hover:text-text transition border-b border-gold-line/40 hover:border-gold pb-1">See the 5-Day Plan</a>
        <p class="text-xs md:text-sm font-mono uppercase tracking-wide md:tracking-wider text-muted-2 pt-2 text-center leading-relaxed">Instant access · start Day 1 today</p>
      </div>
    </div>
  </section>
</main>

<!-- Footer -->
<footer class="pt-16 pb-32 md:pb-16 bg-base-2 border-t border-line rounded-t-[4rem]">
  <div class="max-w-[1180px] mx-auto px-6 space-y-12">
    <div class="flex flex-col items-center text-center space-y-4">
      <div class="flex items-center gap-3">
        <img src="/brand/brand-mark-owl.svg" alt="VanguardOS owl mark" class="w-8 h-8" />
        <span class="font-display text-xl md:text-2xl leading-none"><span class="text-text">Vanguard</span><span class="italic text-gold">OS</span></span>
      </div>
      <p class="font-display italic text-sm md:text-base" style="color: #D6D4CC;">Systems that ship.</p>
    </div>
    <div class="pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="text-[10px] font-mono uppercase tracking-widest" style="color: #B5B5AE;">© 2026 VanguardOS</div>
      <div class="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-mono uppercase tracking-wider" style="color: #B5B5AE;">
        <a href="#offer-stack" class="hover:text-text transition">What's Inside</a>
        <a href="#five-day" class="hover:text-text transition">5-Day Journey</a>
        <a href="#testimonials" class="hover:text-text transition">Reviews</a>
        <a href="#faq" class="hover:text-text transition">FAQ</a>
        <a href="mailto:support@vanguardos.co" on:click|preventDefault={openContact} class="hover:text-text transition">Contact</a>
        <a href="#top" class="hover:text-text transition">Back to Top ↑</a>
      </div>
    </div>
  </div>
</footer>

<!-- PERSISTENT MOBILE CTA — appears once the hero scrolls away; mobile only -->
<div class="sticky-cta lg:hidden {stickyVisible ? 'sticky-cta-show' : ''}" aria-hidden={!stickyVisible}>
  <div class="sticky-cta-inner">
    <div class="sticky-cta-copy">
      <span class="sticky-cta-price">$129</span>
      <span class="sticky-cta-sub">One payment</span>
    </div>
    <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="sticky-cta" on:click={trackCheckoutClick} class="btn-primary cta-btn sticky-cta-btn" tabindex={stickyVisible ? 0 : -1}>
      <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
      <span class="cta-arrow" aria-hidden="true">→</span>
    </a>
  </div>
</div>

<!-- SPECIMEN MODAL — expands a palette (hex values) or type pairing (display size) -->
{#if specimenModalOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="upsell-overlay" on:click={closeSpecimen}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="specimen-card" on:click|stopPropagation role="dialog" aria-modal="true" aria-label="Specimen detail" tabindex="-1">
      <button class="upsell-x" on:click={closeSpecimen} aria-label="Close">✕</button>

      {#if specimenKind === 'palette'}
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Brand Palette Pack</span>
        <h3 class="font-display text-3xl text-text mt-2 mb-5">{specimenData.name}</h3>
        <div class="flex h-20 rounded-xl overflow-hidden border border-line/60 mb-5">
          {#each specimenData.colors as c}
            <span class="flex-1" style="background-color: {c};"></span>
          {/each}
        </div>
        <ul class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {#each specimenData.colors as c}
            <li class="flex flex-col items-center gap-2 rounded-lg border border-line/60 bg-base/30 px-2 py-3">
              <span class="w-8 h-8 rounded-md border border-line/60" style="background-color: {c};"></span>
              <span class="font-mono text-[10px] uppercase tracking-wider text-muted">{c}</span>
            </li>
          {/each}
        </ul>
        <p class="text-sm text-muted leading-relaxed mt-5">A 5-tone system (base, surface, accent, highlight, and light) balanced for contrast. One of 20 ready-to-use palettes inside the pack.</p>
      {:else if specimenKind === 'type'}
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Typography Pack · Scheme {String(specimenData.schemeNo).padStart(2,'0')}</span>
        <h3 class="font-display text-3xl text-text mt-2 mb-1">{specimenData.tag}</h3>
        <span class="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-2">{specimenData.display} × {specimenData.body} × {specimenData.accent}</span>
        <div class="rounded-[1rem] border border-line/60 bg-base/30 px-6 py-7 mt-5 space-y-3">
          <p class="text-4xl md:text-5xl text-text leading-tight" style="font-family: {specimenData.fontDisplay}; font-weight: {specimenData.displayWeight}; letter-spacing: -0.02em;">{specimenData.sample}</p>
          <p class="text-base text-text/85 leading-relaxed" style="font-family: {specimenData.fontBody};">Set in {specimenData.body}. Engineered to carry long-form body copy without fatigue while {specimenData.display} does the heavy lifting in headlines.</p>
          <p class="font-mono text-[10px] uppercase tracking-[0.22em] text-gold pt-1" style="font-family: {specimenData.fontAccent}; font-weight: {specimenData.accentWeight};">{specimenData.kicker}</p>
        </div>
        <p class="text-sm text-muted leading-relaxed mt-5">Display: <span class="text-text/90">{specimenData.display}</span> · Body: <span class="text-text/90">{specimenData.body}</span> · Accent/Mono: <span class="text-text/90">{specimenData.accent}</span> (kickers and labels only). One of 20 type systems inside the pack. Sources: Fontshare + Google Fonts + The League of Moveable Type.</p>
      {/if}

      <a href={GUMROAD.launchpad} data-event="checkout_click" data-analytics-id="specimen-modal-cta" on:click={trackCheckoutClick} class="btn-primary cta-btn w-full mt-7 rounded-[2rem] font-mono text-sm md:text-base uppercase">
        <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        <span class="cta-label"><span class="cta-label-full">Start My 5-Day Build</span><span class="cta-label-short">Start My Build</span></span>
        <span class="cta-arrow" aria-hidden="true">→</span>
      </a>
      <p class="cta-price">One payment · 30-day guarantee</p>
    </div>
  </div>
{/if}

{#if contactOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="upsell-overlay" on:click={closeContact}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="upsell-card" on:click|stopPropagation role="dialog" aria-modal="true" aria-labelledby="contact-title" tabindex="-1">
      <button class="upsell-x" on:click={closeContact} aria-label="Close">✕</button>
      <img src="/brand/brand-mark-owl.svg" alt="" class="w-10 h-10 mx-auto mb-4" />
      <h3 id="contact-title" class="upsell-headline">Happy to <em>help</em>.</h3>
      <p class="upsell-sub">
        A real person reads every message. Whether it's a question about the Launchpad, choosing your language edition, your download, or a refund, reach out and we'll get you sorted, usually within a day. We're glad to help with <strong class="upsell-gold">anything</strong>.
      </p>
      <div class="upsell-actions">
        <a href="mailto:support@vanguardos.co" class="btn-primary upsell-primary flex items-center justify-center gap-2">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          support@vanguardos.co
        </a>
        <button on:click={copyContactEmail} class="upsell-secondary">
          {contactCopied ? '✓ Copied to clipboard' : 'Copy email address'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* === HERO H1 — CSS-only entrance (no opacity gate, see LCP note above) ===
     Transform-only keyframe: never sets opacity, so the element is a valid
     LCP paint from the very first frame regardless of JS/hydration timing. */
  .hero-h1 {
    animation: heroH1In 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }
  @keyframes heroH1In {
    from { transform: translateY(14px); }
    to { transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-h1 { animation: none; }
  }

  /* === TYPOGRAPHY PACK SPECIMEN FONTS ===
     Loads the actual display + body faces used by the three featured schemes
     so the preview cards render in the real typeface, not a fallback. The
     three are picked for body-font variety: sans (Satoshi), serif (Source
     Serif 4), and a single-family engineering system (Geist, used for both
     display and body in scheme 14 — Geist Mono is never loaded here since
     the pack only uses it for kickers/labels, not body copy). Sources:
     Google Fonts (Fraunces, Source Serif 4, Geist) + Fontshare (Clash
     Display, Satoshi). All licenses verified in the pack.
     2026-07-03: these were a render-blocking @import fetched unconditionally
     on every pageview. Moved to lazy <link> injection in loadSpecimenFonts()
     (script section), triggered only when the specimen modal is actually
     opened. Do not re-add an eager @import here. */

  .scheme-preview {
    transition: transform 0.18s ease, border-color 0.18s ease;
  }
  .scheme-preview:hover {
    border-color: rgba(212,175,55,0.45);
  }
  .scheme-preview .display {
    font-size: 26px;
    line-height: 1.08;
    letter-spacing: -0.015em;
    margin: 4px 0 6px 0;
  }
  .scheme-preview .body {
    font-size: 13.5px;
    line-height: 1.55;
    margin: 0;
  }
  .scheme-preview .meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #D4AF37;
  }
  @media (min-width: 768px) {
    .scheme-preview .display { font-size: 30px; }
    .scheme-preview .body { font-size: 14px; }
  }

  /* === SCROLL PROGRESS HAIRLINE === */
  .scroll-progress {
    position: fixed; top: 0; left: 0; right: 0;
    height: 2px; z-index: 100;
    background: transparent;
    pointer-events: none;
  }
  .scroll-progress-fill {
    height: 100%; width: 100%;
    transform-origin: left;
    background: linear-gradient(90deg, #B8941F 0%, #D4AF37 60%, #E7C66A 100%);
    box-shadow: 0 0 8px rgba(212,175,55,0.55);
    will-change: transform;
  }

  /* === PHONE MOCKUP === */
  .phone-shell {
    position: relative; width: 100%; max-width: 340px; aspect-ratio: 9 / 19;
    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
    border-radius: 44px; padding: 14px;
    box-shadow: 0 0 0 1px rgba(212,175,55,0.18), 0 24px 64px -16px rgba(212,175,55,0.18),
      0 8px 32px -8px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.03);
  }
  .phone-notch { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 100px; height: 26px; background: #000; border-radius: 18px; z-index: 2; }
  .phone-glow { position: absolute; inset: -40px; background: radial-gradient(ellipse at center, rgba(212,175,55,0.12), transparent 65%); z-index: -1; pointer-events: none; }
  .phone-screen { background: #0F0F10; border-radius: 32px; height: 100%; overflow: hidden; display: flex; flex-direction: column; position: relative; }
  .status-bar { padding: 14px 28px 6px; display: flex; justify-content: space-between; align-items: center; color: #ECEAE4; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .status-icons { display: flex; gap: 2px; }
  .status-icons span { width: 4px; height: 4px; background: #ECEAE4; border-radius: 50%; display: inline-block; }
  .chat-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid rgba(236,234,228,0.06); background: rgba(28,29,31,0.6); backdrop-filter: blur(8px); }
  .back { background: none; border: none; color: #D4AF37; font-size: 22px; line-height: 1; padding: 0 4px; cursor: default; }
  .avatar { width: 34px; height: 34px; background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.32); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .avatar img { width: 20px; height: 20px; }
  .who { flex: 1; min-width: 0; }
  .who-name { font-family: 'Playfair Display', serif; font-size: 14px; line-height: 1.1; font-weight: 500; }
  .who-status { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #D4AF37; margin-top: 2px; }
  .chat-body { flex: 1; padding: 14px 14px 4px; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
  .bubble { max-width: 78%; padding: 7px 12px; border-radius: 16px; font-size: 12px; line-height: 1.35; word-wrap: break-word; will-change: opacity, transform; }
  .bubble.bot { align-self: flex-start; background: rgba(236,234,228,0.07); color: #ECEAE4; border-bottom-left-radius: 4px; border: 1px solid rgba(236,234,228,0.06); }
  .bubble.user { align-self: flex-end; background: linear-gradient(135deg, #D4AF37 0%, #E7C66A 100%); color: #111212; border-bottom-right-radius: 4px; font-weight: 500; }
  .chat-input { margin: 8px 12px 14px; display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(236,234,228,0.05); border: 1px solid rgba(236,234,228,0.08); border-radius: 22px; font-size: 12px; }
  .input-placeholder { color: #8C8C86; font-family: 'Source Serif 4', serif; }
  .input-mic { color: #D4AF37; font-size: 14px; }

  /* === COMMAND CENTER POINTER CHAT === */
  .avatar-sm { width: 26px; height: 26px; background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.32); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .avatar-sm img { width: 15px; height: 15px; }
  .cc-bubble { font-size: 13px; line-height: 1.4; padding: 9px 13px; border-radius: 14px; max-width: 92%; }
  .cc-bubble.user { align-self: flex-end; margin-left: auto; background: linear-gradient(135deg, #D4AF37 0%, #E7C66A 100%); color: #111212; font-weight: 500; width: fit-content; }
  .cc-bubble.bot { background: rgba(236,234,228,0.07); color: #ECEAE4; border: 1px solid rgba(236,234,228,0.06); }

  /* === DASHBOARD === */
  .dash { background: linear-gradient(180deg, #16171A 0%, #0E0F10 100%); border: 1px solid rgba(212,175,55,0.22); border-radius: 24px; padding: 18px; box-shadow: 0 24px 64px -20px rgba(212,175,55,0.16), 0 8px 32px -8px rgba(0,0,0,0.6); }
  .dash-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid rgba(236,234,228,0.08); }
  .dash-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 14px 0; }
  .dash-card { background: rgba(236,234,228,0.04); border: 1px solid rgba(236,234,228,0.08); border-radius: 14px; padding: 12px 14px; }
  .dc-head { display: flex; align-items: baseline; justify-content: space-between; font-size: 12px; color: #ECEAE4; font-weight: 600; gap: 8px; }
  .dc-num { font-family: 'JetBrains Mono Numbers', 'Playfair Display', serif; color: #D4AF37; font-size: 16px; white-space: nowrap; }
  .dc-sub { font-size: 11px; color: #A6A6A1; line-height: 1.4; margin-top: 6px; }
  .dm-title { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .dm-grid { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: center; }
  .dm-donut { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .dm-legend { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; width: 100%; }
  .dm-legend li { display: flex; align-items: center; font-size: 11px; color: #A6A6A1; }
  .dm-legend .dot { width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; display: inline-block; }
  .dm-legend em { font-style: normal; color: #ECEAE4; margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 10px; }
  .dm-right { display: flex; flex-direction: column; gap: 14px; }
  .dm-bars { display: flex; align-items: flex-end; gap: 8px; height: 110px; padding: 6px 2px 0; border-bottom: 1px solid rgba(236,234,228,0.08); }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 6px; }
  .bar { width: 100%; max-width: 26px; background: linear-gradient(180deg, #E7C66A 0%, #D4AF37 100%); border-radius: 5px 5px 0 0; min-height: 6px; transform-origin: bottom; }
  .bar-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #9A9A93; text-transform: uppercase; }
  .dm-vendors { display: flex; flex-direction: column; gap: 5px; }
  .dv-title { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #9A9A93; margin-bottom: 2px; }
  .dv-row { display: flex; justify-content: space-between; font-size: 12px; color: #A6A6A1; }
  .dv-row em { font-style: normal; color: #ECEAE4; font-family: 'JetBrains Mono', monospace; font-size: 11px; }

  @media (max-width: 640px) {
    .dash-cards { grid-template-columns: 1fr; }
    .dm-grid { grid-template-columns: 1fr; }
    .dm-legend { grid-template-columns: 1fr 1fr; }
  }

  /* === COMMAND CENTER REGENERATE DEMO === */
  .cc-demo { max-width: 760px; margin: 40px auto 0; display: flex; flex-direction: column; gap: 16px; }
  .cc-demo-flow { display: flex; flex-direction: column; gap: 8px; }
  .cc-demo-bubble { font-size: 13px; line-height: 1.4; padding: 9px 14px; border-radius: 14px; max-width: 80%; opacity: 0; }
  .cc-demo-bubble.user { align-self: flex-end; background: linear-gradient(135deg, #D4AF37 0%, #E7C66A 100%); color: #111212; font-weight: 600; }
  .cc-demo-bubble.bot { align-self: flex-start; background: rgba(236,234,228,0.07); color: #ECEAE4; border: 1px solid rgba(236,234,228,0.06); }
  .cc-demo-save { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; opacity: 0; padding-top: 4px; }
  .cc-file-chip { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #ECEAE4; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.34); border-radius: 999px; padding: 8px 16px; transition: box-shadow 0.4s ease, border-color 0.4s ease; }
  .cc-file-chip.glow { box-shadow: 0 0 0 1px rgba(212,175,55,0.5), 0 0 28px -4px rgba(212,175,55,0.6); border-color: #D4AF37; }
  .cc-file-ic { font-size: 14px; }
  .cc-demo-caption { font-size: 12px; color: #A6A6A1; max-width: 420px; line-height: 1.45; }

  /* === BUNDLE UPSELL MODAL === */
  .upsell-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(17,18,18,0.82);             /* woodsmoke #111212 */
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: upsellFade 0.22s ease;
  }
  .upsell-card {
    position: relative;
    width: 92vw; max-width: 640px;                 /* mobile 92vw → desktop max-w-2xl */
    background: #1C1D1F;
    border: 2px solid #D4AF37;                     /* champagne-gold */
    border-radius: 28px;
    padding: 38px 30px 32px;
    box-shadow:
      0 0 0 1px rgba(212,175,55,0.22),
      0 0 60px -10px rgba(212,175,55,0.40),        /* gold halo */
      0 36px 90px -22px rgba(0,0,0,0.85);
    animation: upsellSlide 0.22s cubic-bezier(0.25,0.46,0.45,0.94);
    max-height: 92vh; overflow-y: auto;
  }
  .upsell-x {
    position: absolute; top: 14px; right: 16px;
    background: none; border: none;
    color: #A6A6A1; font-size: 18px; cursor: pointer;
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.2s ease, background 0.2s ease;
  }
  .upsell-x:hover { color: #ECEAE4; background: rgba(236,234,228,0.06); }
  .upsell-headline {
    font-family: 'JetBrains Mono Numbers', 'Playfair Display', serif;
    font-weight: 600;
    font-size: 26px; line-height: 1.15;
    color: #ECEAE4;                                /* platinum */
    text-align: center;
    letter-spacing: 0;
  }
  .upsell-headline em { font-style: italic; color: #D4AF37; }
  @media (min-width: 768px) { .upsell-headline { font-size: 32px; } }
  .upsell-sub {
    color: #ECEAE4; opacity: 0.92;
    font-size: 16px; line-height: 1.55;
    text-align: center;
    margin-top: 14px;
    max-width: 540px; margin-left: auto; margin-right: auto;
  }
  .upsell-sub strong { color: #ECEAE4; font-weight: 600; }
  .upsell-sub .upsell-gold { color: #D4AF37; font-weight: 700; }

  .upsell-stack {
    margin-top: 22px;
    background: rgba(212,175,55,0.06);
    border: 1px solid rgba(212,175,55,0.28);
    border-radius: 16px;
    padding: 16px 18px;
  }
  .upsell-stack-title {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.28em;
    color: #D4AF37;
    margin-bottom: 10px;
  }
  .upsell-stack-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 10px;
  }
  .upsell-stack-list li {
    display: flex; align-items: flex-start; gap: 10px;
    color: #ECEAE4; font-size: 14.5px; line-height: 1.45;
  }
  .upsell-check { color: #D4AF37; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

  .upsell-optin {
    margin-top: 22px;
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px;
    background: rgba(212,175,55,0.10);
    border: 1.5px solid rgba(212,175,55,0.45);
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .upsell-optin:hover { border-color: #D4AF37; background: rgba(212,175,55,0.14); }
  .upsell-optin.checked {
    border-color: #D4AF37;
    background: rgba(212,175,55,0.16);
    box-shadow: 0 0 0 1px rgba(212,175,55,0.35), 0 0 22px -4px rgba(212,175,55,0.4);
  }
  .upsell-optin input[type="checkbox"] {
    position: absolute; opacity: 0; pointer-events: none;
  }
  .upsell-optin-box {
    width: 26px; height: 26px;
    border-radius: 7px;
    border: 1.5px solid #D4AF37;
    background: #1C1D1F;
    display: inline-flex; align-items: center; justify-content: center;
    color: #111212; font-weight: 800; font-size: 16px;
    flex-shrink: 0;
    transition: background 0.2s ease;
  }
  .upsell-optin.checked .upsell-optin-box {
    background: linear-gradient(135deg, #D4AF37 0%, #E7C66A 100%);
  }
  .upsell-optin-text {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700; font-size: 14px;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #ECEAE4;
  }

  .upsell-actions {
    margin-top: 22px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .upsell-primary {
    padding: 16px 20px;
    border-radius: 999px;
    font-size: 15px;
  }
  .upsell-secondary {
    padding: 13px 20px;
    background: transparent;
    border: 1px solid rgba(236,234,228,0.16);
    color: #A6A6A1;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600; font-size: 12.5px;
    text-transform: uppercase; letter-spacing: 0.1em;
    border-radius: 999px;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }
  .upsell-secondary:hover { color: #ECEAE4; border-color: rgba(236,234,228,0.32); background: rgba(236,234,228,0.04); }

  @keyframes upsellFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes upsellSlide { from { opacity: 0; transform: translateY(18px) scale(0.985); } to { opacity: 1; transform: none; } }

  @media (max-width: 640px) {
    .upsell-card { padding: 32px 22px 26px; border-radius: 22px; }
    .upsell-headline { font-size: 22px; }
    .upsell-sub { font-size: 15px; }
    .upsell-stack-list li { font-size: 13.5px; }
  }

  /* Responsive — smaller phone on tablet/mobile */
  @media (max-width: 1023px) { .phone-shell { max-width: 300px; } }
  @media (max-width: 640px) { .phone-shell { max-width: 280px; } .bubble { font-size: 11.5px; } }

  /* === ANCHOR STRIP — two-tier typography + gold hairline dividers === */
  .anchor-strip { position: relative; }
  .anchor-item { position: relative; }
  .anchor-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.3;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #ECEAE4;
    margin-top: 10px;
  }
  @media (min-width: 768px) {
    .anchor-label { font-size: 13px; }
    .anchor-strip > .anchor-item + .anchor-item::before {
      content: '';
      position: absolute;
      left: -28px;
      top: 10%;
      bottom: 10%;
      width: 1px;
      background: rgba(212,175,55,0.25);
    }
  }

  /* === BUTTON SYSTEM — bigger, bolder, all-caps, hover glow === */
  :global(.btn-primary) {
    background: linear-gradient(135deg, #D4AF37 0%, #E7C66A 100%);
    color: #111212;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1.5px solid #D4AF37;
    box-shadow: 0 4px 18px -4px rgba(212,175,55,0.35);
    transition: transform 0.2s ease, box-shadow 0.3s ease, background 0.3s ease;
  }
  :global(.btn-primary:hover) {
    transform: scale(1.02);
    box-shadow: 0 0 24px rgba(212,175,55,0.45), 0 6px 22px -4px rgba(212,175,55,0.5);
    background: linear-gradient(135deg, #E7C66A 0%, #D4AF37 100%);
  }
  :global(.btn-secondary) {
    background: transparent;
    color: #D4AF37;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1.5px solid rgba(212,175,55,0.55);
    transition: transform 0.2s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
  }
  :global(.btn-secondary:hover) {
    transform: scale(1.02);
    border-color: #D4AF37;
    background: rgba(212,175,55,0.10);
    box-shadow: 0 0 22px rgba(212,175,55,0.30);
  }
  @media (min-width: 768px) {
    :global(.btn-primary), :global(.btn-secondary) { font-size: 16px; }
  }

  /* === STABLE CTA ROW (icon · label · arrow) ===
     Every primary purchase CTA uses this: a non-wrapping flex row with the
     owl mark on the left, the label in the middle, and the arrow on the right
     as its own flex child so it can never drop below the text. Padding, gap,
     min-height, and letter-spacing are owned here (not by inline utilities) so
     the mobile execution is identical everywhere. */
  :global(.cta-btn) {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
    line-height: 1.1;
    padding: 19px 34px;
    letter-spacing: 0.1em;
  }
  :global(.cta-btn .cta-label) { min-width: 0; line-height: 1.1; white-space: nowrap; }
  :global(.cta-btn .cta-arrow) { flex-shrink: 0; line-height: 1; font-size: 1.05em; }
  :global(.cta-btn .owl-logo-cta) { flex-shrink: 0; }

  /* Price line under every CTA — the button carries the action, this shows
     the price clearly at every width (the mobile button label is shortened,
     so the price must live here, not on the button). */
  :global(.cta-price) {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    text-transform: uppercase;
    text-align: center;
    color: #A6A6A1;
    letter-spacing: 0.08em;
    font-size: 12px;
    line-height: 1.55;
    margin-top: 12px;
  }
  :global(.cta-price .price) { color: #D4AF37; font-weight: 700; font-size: 1.18em; letter-spacing: 0.04em; }
  @media (min-width: 768px) {
    :global(.cta-price) { font-size: 13px; letter-spacing: 0.14em; }
  }

  /* Responsive label: short on phones, full at tablet/desktop. */
  :global(.cta-label-full) { display: none; }
  :global(.cta-label-short) { display: inline; }
  @media (min-width: 768px) {
    :global(.cta-label-full) { display: inline; }
    :global(.cta-label-short) { display: none; }
  }

  /* Mobile execution: tighter tracking, roomy-but-not-oversized padding,
     stable tap height. This is the fix for the cramped/wrapping CTA. */
  @media (max-width: 767px) {
    :global(.cta-btn) {
      gap: 9px;
      padding: 18px 20px;
      min-height: 64px;
      letter-spacing: 0.02em;
    }
  }
  /* Narrowest phones (≤400px): trim padding/tracking and drop the label a
     touch so the shortened label + icon + arrow always fit the full-width
     offer/specimen buttons with room to spare, even at 320px. */
  @media (max-width: 400px) {
    :global(.cta-btn) {
      gap: 7px;
      padding: 17px 14px;
      font-size: 13px;
      letter-spacing: 0.01em;
    }
  }

  /* === OWL LOGO IN CTA === */
  :global(.owl-logo-cta) {
    width: 20px !important;
    height: 20px !important;
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.25s ease;
  }
  :global(.btn-primary .owl-logo-cta), :global(.bg-gold .owl-logo-cta) {
    color: #111212;
    filter: drop-shadow(0 0 2px rgba(212, 175, 55, 0.55));
  }
  :global(.btn-secondary .owl-logo-cta) {
    color: #D4AF37;
    filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.45));
  }
  :global(.btn-primary:hover .owl-logo-cta), :global(.bg-gold:hover .owl-logo-cta) {
    transform: scale(1.15) rotate(-5deg);
    filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.85));
  }
  :global(.btn-secondary:hover .owl-logo-cta), :global(.border-gold-line:hover .owl-logo-cta) {
    transform: scale(1.15) rotate(5deg);
    filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.8));
  }

  /* === BUNDLE BEST-VALUE BADGE === */
  .bundle-best-badge {
    display: inline-block;
    background: linear-gradient(135deg, #D4AF37 0%, #E7C66A 100%);
    color: #111212;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    padding: 10px 18px;
    border-radius: 999px;
    box-shadow: 0 0 0 1px rgba(212,175,55,0.5), 0 0 24px rgba(212,175,55,0.55);
  }

  /* === COMPARISON TABLE === */
  .cmp-table {
    width: 100%;
    border-collapse: collapse;
    background: rgba(28,29,31,0.6);
    font-size: 15px;
    color: #ECEAE4;
  }
  .cmp-table thead th {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 18px 14px;
    text-align: center;
    border-bottom: 1px solid rgba(212,175,55,0.34);
    color: #ECEAE4;
    background: #1C1D1F;
  }
  .cmp-table thead th.cmp-feat { text-align: left; color: #A6A6A1; }
  .cmp-table thead th.cmp-best {
    color: #D4AF37;
    background: rgba(212,175,55,0.08);
    position: relative;
  }
  .cmp-best-pill {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #D4AF37;
    color: #111212;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    vertical-align: middle;
  }
  .cmp-table tbody td {
    padding: 16px 14px;
    text-align: center;
    border-bottom: 1px solid rgba(236,234,228,0.08);
    font-size: 15px;
  }
  .cmp-table tbody td.cmp-feat {
    text-align: left;
    color: #ECEAE4;
    font-size: 15px;
  }
  .cmp-table tbody td.cmp-best {
    background: rgba(212,175,55,0.06);
    border-left: 1px solid rgba(212,175,55,0.18);
    border-right: 1px solid rgba(212,175,55,0.18);
  }
  .cmp-table tbody tr:last-child td { border-bottom: none; }
  .cmp-table tbody tr:last-child td.cmp-best { border-bottom: 1px solid rgba(212,175,55,0.18); }
  .cmp-yes { color: #D4AF37; font-size: 20px; font-weight: 700; }
  .cmp-no { color: #5E5A4E; font-size: 18px; }
  @media (max-width: 640px) {
    .cmp-table { font-size: 13px; }
    .cmp-table thead th { font-size: 11px; padding: 12px 8px; }
    .cmp-table tbody td { padding: 12px 8px; font-size: 13px; }
    .cmp-table tbody td.cmp-feat { font-size: 13px; }
  }

  /* === HERO DAY-5 OUTCOME CHIPS === */
  .day5-chip {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(244,236,210,0.92);
    background-color: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.30);
    border-radius: 9999px;
    padding: 5px 13px;
    white-space: nowrap;
    transition: border-color 0.25s ease, background-color 0.25s ease;
  }
  .day5-chip::before {
    content: '✓';
    color: #D4AF37;
    margin-right: 6px;
    font-weight: 700;
  }
  .day5-chip:hover {
    border-color: rgba(212,175,55,0.6);
    background-color: rgba(212,175,55,0.14);
  }

  /* === AVATAR SELECTOR === */
  .avatar-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
  }
  .avatar-card:hover {
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(212,175,55,0.55);
    box-shadow: 0 0 0 1px rgba(212,175,55,0.25), 0 12px 30px -12px rgba(212,175,55,0.35);
  }
  .avatar-card:focus-visible {
    outline: none;
    border-color: #D4AF37;
    box-shadow: 0 0 0 2px rgba(212,175,55,0.55);
  }
  .avatar-card-active {
    background-color: rgba(212,175,55,0.10);
    box-shadow: 0 0 0 1px rgba(212,175,55,0.45), 0 14px 34px -14px rgba(212,175,55,0.45);
  }
  .promise-panel { animation: promiseIn 0.45s cubic-bezier(0.25,0.46,0.45,0.94) both; }
  @keyframes promiseIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* === 5-DAY SCROLLYTELLING RAIL === */
  .five-day-rail {
    position: relative;
    max-width: 92%;
    margin: 0 auto 2.25rem;
  }
  .five-day-rail-track {
    height: 2px;
    background: rgba(212,175,55,0.16);
    border-radius: 2px;
    overflow: hidden;
  }
  .five-day-rail-fill {
    height: 100%;
    width: 100%;
    transform-origin: left;
    background: linear-gradient(90deg, #B8941F 0%, #D4AF37 60%, #E7C66A 100%);
    box-shadow: 0 0 10px rgba(212,175,55,0.5);
    will-change: transform;
  }
  .five-day-rail-dots {
    position: absolute;
    top: 1px; left: 0; right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    padding: 0 9%;
  }
  .five-day-dot {
    width: 11px; height: 11px;
    border-radius: 50%;
    background: #1A1916;
    border: 2px solid rgba(212,175,55,0.35);
    transition: background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
  }
  .five-day-dot.is-lit {
    background: #D4AF37;
    border-color: #E7C66A;
    box-shadow: 0 0 14px rgba(212,175,55,0.7);
    transform: scale(1.18);
  }

  /* === DAY CARD === */
  .day-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
  }
  .day-card:hover {
    transform: translateY(-4px);
    border-color: rgba(212,175,55,0.55);
    box-shadow: 0 0 0 1px rgba(212,175,55,0.22), 0 18px 40px -18px rgba(212,175,55,0.40);
  }
  /* On mobile/touch devices, highlight the active card on scroll */
  @media (max-width: 1023px) {
    :global(.day-card.is-active-card) {
      border-color: rgba(212,175,55,0.7);
      box-shadow: 0 0 0 1px rgba(212,175,55,0.3), 0 12px 30px -12px rgba(212,175,55,0.5);
      background-color: rgba(30, 27, 20, 0.8);
      transform: translateY(-2px);
    }
    :global(.day-card.is-active-card) .day-img {
      transform: scale(1.04);
    }
    :global(.day-card.is-active-card) .day-kicker {
      color: #E7C66A;
      text-shadow: 0 0 12px rgba(212,175,55,0.5);
    }
  }
  .day-img {
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
    will-change: transform;
  }
  .day-card:hover .day-img { transform: scale(1.06); }
  .day-kicker { transition: color 0.25s ease, text-shadow 0.25s ease; }
  .day-card:hover .day-kicker {
    color: #E7C66A;
    text-shadow: 0 0 12px rgba(212,175,55,0.5);
  }
  @media (max-width: 639px) {
    .day-card {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      grid-template-rows: auto auto auto auto;
      align-items: start;
      column-gap: 14px;
      row-gap: 7px;
      padding: 16px;
    }
    .day-card .day-visual {
      grid-column: 1;
      grid-row: 1 / span 4;
      width: 96px;
      height: 96px;
    }
    .day-card > :not(.day-visual) { grid-column: 2; }
    .day-card h3 { margin: 0; }
    .offer-support-card { border-radius: 1rem; }
  }

  /* === SPECIMEN ROWS + MODAL === */
  .specimen-row {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .specimen-row:hover { transform: translateX(2px); }
  .specimen-row:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(212,175,55,0.55);
    border-radius: 0.6rem;
  }
  .specimen-card {
    position: relative;
    width: 92vw; max-width: 560px;
    background: #1C1D1F;
    border: 2px solid #D4AF37;
    border-radius: 28px;
    padding: 38px 30px 32px;
    box-shadow:
      0 0 0 1px rgba(212,175,55,0.22),
      0 0 60px -10px rgba(212,175,55,0.40),
      0 36px 90px -22px rgba(0,0,0,0.85);
    animation: upsellSlide 0.22s cubic-bezier(0.25,0.46,0.45,0.94);
    max-height: 92vh; overflow-y: auto;
  }

  /* === PERSISTENT MOBILE CTA === */
  .sticky-cta {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 85;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    background: rgba(17,18,18,0.92);
    backdrop-filter: blur(14px);
    border-top: 1px solid rgba(212,175,55,0.28);
    transform: translateY(120%);
    transition: transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94);
    will-change: transform;
  }
  .sticky-cta-show { transform: translateY(0); }
  .sticky-cta-inner { display: flex; align-items: center; gap: 12px; max-width: 520px; margin: 0 auto; }
  .sticky-cta-copy { display: flex; flex-direction: column; line-height: 1.1; }
  .sticky-cta-price { font-family: 'JetBrains Mono Numbers', 'Playfair Display', serif; font-size: 22px; color: #D4AF37; }
  .sticky-cta-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #A6A6A1; margin-top: 2px; }
  .sticky-cta-btn { flex: 1; text-align: center; padding: 14px 18px; min-height: 52px; border-radius: 2rem; white-space: nowrap; }
  @media (max-width: 380px) {
    .sticky-cta-btn {
      font-size: 12px !important;
      letter-spacing: 0.04em !important;
      padding: 12px 10px !important;
    }
  }

  /* === MOBILE MENU DRAWER === */
  .menu-drawer { animation: drawerIn 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @media (prefers-reduced-motion: reduce) { .menu-drawer { animation: none; } }

  /* === MOTION ASSETS — restrained CSS-only mockups, ported from the
     "Vanguard Launchpad Motion Previews" reference pack (landing-page-motion-assets/
     onboarding-motion-previews.html). Colors are remapped to this site's real
     Tailwind tokens (see tailwind.config.js) rather than the reference's own
     hex values, so they stay locked to the live VanguardOS palette:
       --bg → base-2, --panel → surface, --ink → text, --muted → muted,
       --dim → muted-2, --gold → gold, --gold2 → gold-hi,
       --emerald → brand-rule "success only" soft emerald #7FB89A
       (no Tailwind token exists for this — it's brand-rule-only, so it's
       defined here directly, same as the site's other one-off hex usages
       above), --line → gold-line, hairline borders → line.
     Each panel is a secondary/companion visual paired with a real product
     screenshot, never a replacement for one. Class names are prefixed
     `mv-`/`motion-` to avoid colliding with the unrelated `.day-card` /
     `.phone-shell` classes already used elsewhere on this page. */
  /* One real product glimpse, art-directed by viewport. The desktop crop
     establishes the app's depth; mobile zooms into the active prompt so the
     proof remains legible instead of becoming a tiny full-screen thumbnail. */
  .product-peek { isolation: isolate; }
  .product-peek-bar {
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.22);
    color: #A6A6A1;
    font: 500 9px 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .product-peek-bar span:last-child {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #D4AF37;
  }
  .product-peek-bar i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #7FB89A;
    box-shadow: 0 0 12px rgba(127, 184, 154, 0.5);
  }
  .product-peek-media {
    position: relative;
    aspect-ratio: 16 / 8.7;
    overflow: hidden;
    background: #0A0B0B;
  }
  .product-peek-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 8%;
  }
  .product-peek-media::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, transparent 46%, rgba(10, 11, 11, 0.18) 66%, rgba(10, 11, 11, 0.96) 100%);
  }
  .product-peek-caption {
    position: absolute;
    z-index: 2;
    left: 18px;
    right: 18px;
    bottom: 16px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    text-align: left;
  }
  .product-peek-caption span {
    color: #D4AF37;
    font: 500 9px 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .product-peek-caption strong {
    color: #ECEAE4;
    font: 500 20px 'Playfair Display', Georgia, serif;
    line-height: 1.15;
  }
  @media (max-width: 640px) {
    .product-peek-bar { min-height: 38px; padding: 0 12px; font-size: 8px; }
    .product-peek-media { aspect-ratio: 4 / 3; }
    .product-peek-image {
      transform: scale(1.52);
      transform-origin: 72% 18%;
    }
    .product-peek-caption {
      left: 12px;
      right: 12px;
      bottom: 11px;
      align-items: start;
      flex-direction: column;
      gap: 3px;
    }
    .product-peek-caption strong { font-size: 17px; }
  }
  .motion-viz {
    --mv-bg: #0A0B0B;
    --mv-panel: #1C1D1F;
    --mv-ink: #ECEAE4;
    --mv-muted: #ADADA7;
    --mv-dim: #8F8F88;
    --mv-gold: #D4AF37;
    --mv-gold2: #E7C66A;
    --mv-emerald: #7FB89A;
    --mv-line: rgba(212, 175, 55, 0.34);
    --mv-hair: rgba(236, 234, 228, 0.10);
  }
  .motion-panel {
    position: relative;
    overflow: hidden;
    min-height: 190px;
    padding: 40px 20px 22px;
    background: radial-gradient(circle at 72% 12%, rgba(212, 175, 55, 0.10), transparent 55%), var(--mv-panel);
  }
  .motion-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.05;
    background-image: radial-gradient(circle, rgba(236, 234, 228, 0.4) 0 1px, transparent 1.4px);
    background-size: 26px 26px;
    pointer-events: none;
  }
  .motion-label {
    position: absolute;
    left: 20px;
    top: 16px;
    color: var(--mv-gold);
    font: 600 9px 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    z-index: 3;
  }

  /* Five-day path — five equal, shrinkable columns so every chip (including
     "Product" and "Checkout") stays inside its card with visible padding at
     every width. Grid with minmax(0, 1fr) is what prevents the flex-basis
     overflow the old `flex: 1` layout produced on narrow phones. */
  .mv-day-row { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .mv-day-chip {
    min-width: 0;
    box-sizing: border-box;
    padding: 9px 6px;
    text-align: center;
    border: 1px solid var(--mv-hair);
    background: rgba(236, 234, 228, 0.045);
    animation: mvFloat 4.2s ease-in-out infinite;
  }
  .mv-day-chip:nth-child(2) { animation-delay: .15s; }
  .mv-day-chip:nth-child(3) { animation-delay: .3s; }
  .mv-day-chip:nth-child(4) { animation-delay: .45s; }
  .mv-day-chip:nth-child(5) { animation-delay: .6s; }
  .mv-day-chip span { display: block; color: var(--mv-gold); font: 600 8px 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.12em; text-transform: uppercase; }
  .mv-day-chip strong { display: block; margin-top: 6px; font: 600 16px/1 'Playfair Display', Georgia, serif; color: var(--mv-ink); white-space: nowrap; letter-spacing: 0; }
  .mv-path-line { position: relative; z-index: 2; margin-top: 26px; height: 1px; background: linear-gradient(90deg, transparent, var(--mv-gold), transparent); }
  .mv-day-scan { position: relative; z-index: 2; height: 14px; margin-top: -7px; }
  .mv-day-scan i {
    position: absolute; top: 0; left: 0; width: 14px; height: 14px; border-radius: 50%;
    background: var(--mv-gold2);
    box-shadow: 0 0 20px rgba(231, 198, 106, 0.55);
    animation: mvScanDays 5s ease-in-out infinite;
  }
  @keyframes mvFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes mvScanDays {
    0% { left: 0%; }
    20% { left: 22%; }
    40% { left: 45%; }
    60% { left: 68%; }
    80%, 100% { left: calc(100% - 14px); }
  }

  /* Three-prompt system */
  .mv-prompt-list { position: relative; z-index: 2; display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
  .mv-prompt-card {
    padding: 12px 14px;
    border: 1px solid var(--mv-hair);
    background: rgba(236, 234, 228, 0.045);
    animation: mvPromptLift 4.8s ease-in-out infinite;
  }
  .mv-prompt-card:nth-child(2) { animation-delay: .35s; }
  .mv-prompt-card:nth-child(3) { animation-delay: .7s; }
  .mv-prompt-card span { display: block; color: var(--mv-gold); font: 600 8px 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.14em; text-transform: uppercase; }
  .mv-prompt-card strong { display: block; margin-top: 6px; font: 600 16px/1.15 'Playfair Display', Georgia, serif; color: var(--mv-ink); }
  @keyframes mvPromptLift { 0%, 100% { opacity: .72; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }

  /* Backup and restore */
  .mv-devices { position: relative; z-index: 2; display: flex; justify-content: space-between; gap: 8px; margin-top: 24px; }
  .mv-device {
    flex: 1; min-width: 0; max-width: 150px;
    padding: 9px 11px;
    border: 1px solid var(--mv-hair);
    background: rgba(236, 234, 228, 0.045);
    color: var(--mv-ink);
    font: 600 8px 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .mv-device-mid { text-align: center; }
  .mv-device:last-child { text-align: right; }
  .mv-device i { display: block; height: 3px; margin-top: 7px; background: rgba(236, 234, 228, 0.16); }
  .mv-transfer-track { position: relative; z-index: 2; height: 24px; margin-top: 10px; }
  .mv-transfer-track::before {
    content: ""; position: absolute; left: 4%; right: 4%; top: 50%; height: 1px;
    background: var(--mv-gold); opacity: .4;
  }
  .mv-file-token {
    position: absolute; top: 50%; left: 0; width: 18px; height: 24px; transform: translateY(-50%);
    border: 1px solid var(--mv-gold);
    background: rgba(212, 175, 55, 0.14);
    animation: mvFileTravel 4.5s ease-in-out infinite;
  }
  @keyframes mvFileTravel {
    0%, 8% { left: 0%; opacity: .85; }
    46%, 54% { left: calc(50% - 9px); opacity: 1; }
    92%, 100% { left: calc(100% - 18px); opacity: .85; }
  }

  /* Mobile friendly */
  .mv-phone { position: relative; z-index: 2; display: flex; justify-content: center; padding-top: 4px; }
  .mv-phone-shell {
    position: relative; width: 118px; height: 196px;
    border: 1px solid var(--mv-line);
    border-radius: 18px;
    background: var(--mv-bg);
    padding: 16px 9px 9px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
  }
  .mv-phone-notch { position: absolute; left: 50%; top: 7px; width: 30px; height: 3px; transform: translateX(-50%); background: rgba(236, 234, 228, 0.22); border-radius: 999px; }
  .mv-phone-progress { height: 4px; background: rgba(236, 234, 228, 0.14); margin-bottom: 10px; overflow: hidden; }
  .mv-phone-progress i { display: block; width: 100%; height: 100%; background: linear-gradient(90deg, var(--mv-gold), var(--mv-emerald)); transform-origin: left; animation: mvGaugeBreath 3.2s ease-in-out infinite; }
  .mv-phone-step { height: 46px; border: 1px solid var(--mv-hair); background: rgba(236, 234, 228, 0.035); margin-bottom: 7px; }
  .mv-phone-step.short { height: 26px; }
  .mv-phone-action {
    position: relative;
    height: 24px; display: grid; place-items: center;
    border: 1px solid var(--mv-line);
    color: var(--mv-gold);
    font: 600 8px 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .mv-phone-signal {
    position: absolute; inset: 0;
    border: 1px solid var(--mv-gold);
    opacity: .34;
    animation: mvSignalPulse 3s ease-out infinite;
  }
  .mv-phone-signal.s2 { animation-delay: .65s; }
  @keyframes mvGaugeBreath { 0%, 100% { transform: scaleX(.35); } 50% { transform: scaleX(1); } }
  @keyframes mvSignalPulse { 0% { transform: scale(1); opacity: .38; } 100% { transform: scale(1.5); opacity: 0; } }

  @media (max-width: 640px) {
    .motion-panel { min-height: 170px; padding: 36px 12px 18px; }
    .mv-day-chip { padding: 8px 5px; }
    .mv-day-chip strong { font-size: 13px; }
    .mv-day-chip span { font-size: 7px; }
    .mv-prompt-card strong { font-size: 15px; }
    .mv-device { font-size: 7px; padding: 8px 8px; }
    .mv-phone-shell { width: 100px; height: 172px; }
  }
  /* Narrow phones: shrink the five-day chips further so "Product" and
     "Checkout" always sit inside their cards with padding, never touching
     the border or overflowing. Fixed px sizes only — no viewport-width units. */
  @media (max-width: 430px) {
    .motion-panel { padding: 32px 10px 16px; }
    .mv-day-row { gap: 4px; }
    .mv-day-chip { padding: 6px 4px; }
    .mv-day-chip strong { font-size: 11px; }
    .mv-day-chip span { font-size: 7px; letter-spacing: 0.08em; }
  }
  @media (max-width: 360px) {
    .motion-panel { padding: 30px 8px 14px; }
    .mv-day-chip { padding: 6px 3px; }
    .mv-day-chip strong { font-size: 9px; }
    .mv-day-chip span { font-size: 6px; }
  }

  .bonus-header-text {
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .offer-support-copy {
    color: #D8D6D0;
    font-size: 15px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  @media (min-width: 768px) {
    .bonus-header-text {
      font-size: 12px;
    }
    .offer-support-copy {
      font-size: 16px;
    }
  }
  @media (max-width: 420px) {
    .offer-support-card > div {
      gap: 12px;
    }
    .offer-support-image {
      width: 52px;
      height: 52px;
    }
  }
  @media (max-width: 360px) {
    .bonus-header-text {
      font-size: 9px;
      letter-spacing: 0.16em;
      white-space: normal;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .avatar-card, .day-card, .specimen-row, .day-img, .five-day-dot, .five-day-rail-fill { transition: none; }
    .avatar-card:hover, .day-card:hover, .specimen-row:hover, :global(.day-card.is-active-card) { transform: none; }
    .day-card:hover .day-img, :global(.day-card.is-active-card) .day-img { transform: none; }
    .day-card:hover .day-kicker, :global(.day-card.is-active-card) .day-kicker { text-shadow: none; }
    .promise-panel { animation: none; }
    .specimen-card { animation: none; }
    .sticky-cta { transition: none; }
    .mv-day-chip, .mv-prompt-card, .mv-day-scan i, .mv-file-token, .mv-phone-progress i, .mv-phone-signal {
      animation: none;
    }
  }
</style>
