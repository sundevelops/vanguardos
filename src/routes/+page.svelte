<script>
  import { onMount, tick } from 'svelte';
  import { animate, stagger } from 'motion';

  let scrolled = false;
  let scrollProgress = 0;
  let showStickyCta = false;   // persistent mobile CTA — appears once hero scrolls away
  let menuOpen = false;
  let currentSection = 0;
  let modalOpen = false;
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
  function openSpecimen(kind, data, e) {
    if (e) e.preventDefault();
    specimenLastFocus = typeof document !== 'undefined' ? document.activeElement : null;
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
    contactLastFocus = typeof document !== 'undefined' ? document.activeElement : null;
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

  // 'core' or 'upgrade' — drives dynamic modal copy + the original-CTA fallback URL
  let upsellSource = 'core';
  // Big premium opt-in checkbox; defaults to checked because the upsell math is
  // strictly in the buyer's favor ($30 more for both products / same price + more product).
  let upsellOptIn = true;

  // ── GUMROAD FUNNEL ────────────────────────────────────────────────
  // Replace the bracketed placeholders with your real Gumroad URLs.
  // LAUNCHPAD is the current flagship product. Legacy slugs (core/bundle/upgrade)
  // are retained because the old AI Assistant offer code is commented out, not deleted,
  // so re-enabling those sections later still finds the URLs in one place.
  const GUMROAD = {
    launchpad: 'https://store.vanguardos.co/',
    // bundle/core/upgrade point at the Launchpad until those SKUs go live; sweep in real URLs later.
    bundle:    'https://store.vanguardos.co/',
    core:      'https://store.vanguardos.co/',
    upgrade:   'https://store.vanguardos.co/'
  };

  // ── LAUNCHPAD OFFER STACK (high-impact) ───────────────────────────
  // 1 core system ($129) + 6 bonuses ($682). Total stacked $811, sells for $129.
  // launchpadStack[0] is THE CORE; everything after is a stacked-on bonus.
  const launchpadStack = [
    { name: 'The 5-Day Launchpad',                     value: '$197', img: '/products/stack-01.webp', blurb: 'The day-by-day build manual. Idea to launch-ready by Day 5.' },
    { name: 'The Vanguard Vault',                      value: '$147', img: '/products/stack-02.webp', blurb: '150 paste-and-go AI prompts. Paste one, answer up to three plain questions, get finished work. Works with ChatGPT, Claude, and Gemini.' },
    { name: '5 Cloneable Landing Page Templates',      value: '$149', img: '/products/stack-03.webp', blurb: 'One master prompt builds any of the five. Hero, offer, FAQ, CTAs, already wired.' },
    { name: 'The Brand Palette Pack',                  value: '$79',  img: '/products/stack-04.webp', blurb: '20 ready-to-use palettes with the psychology behind each.' },
    { name: 'The Typography Pack',                     value: '$79',  img: '/products/stack-05.webp', blurb: '20 free-to-use premium type systems for solo brands.' },
    { name: 'The Notion Operations OS',                value: '$61',  img: '/products/stack-06.webp', blurb: 'A 45-minute click-by-click build of the workspace you run the business from after launch.' },
    { name: 'The Funnel Pattern Library',              value: '$99',  img: '/products/stack-07.webp', blurb: 'Modal code, the 9-email sequence, 13 order bumps. The conversion machinery.' }
  ];
  // Core vs bonus split + self-summing values (keeps the math honest: 197 + 614 = 811).
  const coreItem  = launchpadStack[0];
  const bonusItems = launchpadStack.slice(1);
  const dollars = (v) => parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
  const bonusValue = bonusItems.reduce((sum, i) => sum + dollars(i.value), 0);   // 614
  const stackValue = launchpadStack.reduce((sum, i) => sum + dollars(i.value), 0); // 811

  // ── 5-DAY JOURNEY ────────────────────────────────────────────────
  const launchpadDays = [
    { num: '01', kicker: 'IDEATE',        line: 'Lock your idea, validate, price.',         desc: 'Run the Problem-Validation Matrix to pick the one idea worth shipping, sketch a one-page portrait of the buyer who pays at 11pm, and set a price you can say out loud. You leave Day 1 with a locked offer in a single sentence.', img: '/products/day-1.png' },
    { num: '02', kicker: 'BRAND',         line: 'Name, voice, colors, fonts, logo.',        desc: 'Name it, find its voice in three words, and lock the palette and type from 20 ready-made pairings instead of a blank canvas. One page, one day, a brand book your future self will actually obey.', img: '/products/day-2.png' },
    { num: '03', kicker: 'ASSETS',        line: 'Covers, banners, social. Premium.',        desc: 'Generate a hero image, a product mockup, and a full social set, all brand-locked, in one studio session. Art-directed to look like a brand a stranger remembers, not stock-photo filler.', img: '/products/day-3.png' },
    { num: '04', kicker: 'LANDING PAGE',  line: 'Hero, offer, CTAs, mobile.',                desc: 'Build a real page in plain English with a free AI builder, no code, then deploy it on a live URL. Hero, high-impact offer, proof, and CTAs, mobile-first, by tonight.', img: '/products/day-4.png' },
    { num: '05', kicker: 'FUNNEL',        line: 'Checkout, upsell, emails. Ready.',         desc: 'Wire the whole path from click to welcome: Gumroad checkout, an order bump, a bundle upsell, and a written email sequence. Make a test purchase, refund yourself, and you are shipped.', img: '/products/day-5.png' }
  ];

  // ── HERO DAY-5 OUTCOME CHIPS ─────────────────────────────────────
  // Concrete, tactile proof of the "5 deliverables in 5 days" promise.
  // Rendered as a row of checked chips directly under the hero subhead.
  const day5Outcomes = [
    'Brand + logo',
    'Landing page live',
    'High-impact offer',
    'Payment-ready funnel',
    'Email sequence'
  ];

  // ── ASSET-PACK SPECIMENS ─────────────────────────────────────────
  // The Brand Palette Pack + Typography Pack are in the offer stack but
  // invisible on the page. These render a *taste* of each, inline, with
  // pure CSS — no external image assets required. Proof of substance.
  const specimenPalettes = [
    { name: 'Ironclad',       colors: ['#0B0F14', '#16202B', '#3E6E8E', '#7FB0CB', '#E8F1F6'] },
    { name: 'Terracotta',     colors: ['#1A120E', '#2E1D16', '#C56B3F', '#E0A176', '#F5E6DA'] },
    { name: 'Evergreen',      colors: ['#0C120E', '#16241B', '#2F7D54', '#6FB58C', '#E4F1E9'] },
    { name: 'Plum Noir',      colors: ['#120E16', '#221A2B', '#6E4A8E', '#A988C6', '#EFE7F6'] },
    { name: 'Signal Coral',   colors: ['#160E0E', '#2B1818', '#C53F4F', '#E07684', '#F6E7E9'] }
  ];
  // Three of the twenty schemes inside the Typography Pack, chosen to show
  // real body-font variety at preview size: a bold sans body (Modernist
  // Statement / Satoshi), a quiet serif body (Quiet Authority / Source Serif
  // 4), and an engineering monospace body (Tech Studio / Geist Mono). Sans /
  // serif / mono is the most legible spread for a three-card glance.
  // fontDisplay / fontBody match the CSS font-family stack of each face so
  // the preview cards render in the actual scheme typeface, not a fallback.
  const specimenType = [
    {
      schemeNo: 2,
      pair: 'Clash Display × Satoshi',
      display: 'Clash Display',
      body: 'Satoshi',
      tag: 'Modernist Statement',
      fontDisplay: "'Clash Display', sans-serif",
      fontBody: "'Satoshi', sans-serif",
      displayWeight: 600,
      sample: 'The launch is the start, not the end.'
    },
    {
      schemeNo: 3,
      pair: 'Fraunces × Source Serif 4',
      display: 'Fraunces',
      body: 'Source Serif 4',
      tag: 'Quiet Authority',
      fontDisplay: "'Fraunces', serif",
      fontBody: "'Source Serif 4', Georgia, serif",
      displayWeight: 600,
      sample: 'The launch is the start, not the end.'
    },
    {
      schemeNo: 14,
      pair: 'Geist × Geist Mono',
      display: 'Geist',
      body: 'Geist Mono',
      tag: 'Tech Studio',
      fontDisplay: "'Geist', sans-serif",
      fontBody: "'Geist Mono', 'JetBrains Mono', monospace",
      displayWeight: 600,
      sample: 'The launch is the start, not the end.'
    }
  ];

  // ── AUDIENCE AVATARS ─────────────────────────────────────────────
  // Each avatar is clickable; selecting one swaps the promise paragraph below
  // to copy tuned for that path. Pure Svelte state — no server, no tracking.
  const launchpadAvatars = [
    { icon: '💼', label: 'Busy professional with an idea',
      promise: "You don't have nights and weekends to burn learning design, copywriting, and funnels. You have an idea and a narrow window. The Launchpad collapses the whole build into five focused sessions, so the thing in your head is live on the internet before the window closes." },
    { icon: '🎨', label: 'Aspiring creator',
      promise: "You can make the thing. What stops you is the machinery around it: the brand, the page, the offer, the checkout. The Launchpad hands you that machinery pre-wired. You bring the taste; it brings the system. By Day 5 your work has a storefront, not just a folder." },
    { icon: '🧗', label: 'Solopreneur paralyzed by all the steps',
      promise: "The reason you haven't shipped isn't laziness. 'Launch a product' is forty invisible decisions stacked on top of each other. The Launchpad turns the pile into one ordered path: do today's day, get today's deliverable, move on. Paralysis dies when the next step is the only step." },
    { icon: '🚪', label: 'Knowledge worker leaving corporate',
      promise: "You're trading a salary for a question mark, and the scariest part is not knowing if the thing will even stand up. The Launchpad gives you a real brand, a real page, and a real funnel: proof you can hold up before you hand in notice. Build it on the side; walk out with it already live." },
    { icon: '⚡', label: 'Side hustler turning serious',
      promise: "Your side thing works, but it looks like a side thing: duct-taped pages, no real offer, no funnel. The Launchpad upgrades it into something that reads as a real business, with a high-impact offer, a clean landing page, and an email sequence that runs while you sleep." }
  ];
  // Index of the currently selected avatar; -1 = none selected (neutral prompt shown).
  let selectedAvatar = -1;
  async function selectAvatar(i) {
    selectedAvatar = selectedAvatar === i ? -1 : i;
    if (selectedAvatar !== -1) {
      await tick();
      const el = document.getElementById('promise-container');
      if (el) {
        const yOffset = -100; // offset for sticky header
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

  // ── LAUNCHPAD FAQ ────────────────────────────────────────────────
  const launchpadFaq = [
    ['Do I need to be technical?', 'No. Every template, prompt, and pattern is copy-paste. The prompts ask you a few plain questions and do the rest. If you can follow a recipe, you can follow this.'],
    ["What if I don't have an idea yet?", 'Day 1 is the ideation system itself: a sequenced way to surface, validate, and price an idea you actually want to ship. You can start with nothing more than a hunch, or a blank page, and finish Day 1 with a locked offer.'],
    ['What AI tools do I need?', 'Just one capable model. The prompts work with ChatGPT, Claude, or Gemini, and Day 4 builds your landing page in Google Antigravity, which is free to start. Free tiers can complete the 5 days, but we strongly recommend a paid tier of one model (about $20 a month): you get longer sessions and access to the stronger models, and a stronger model means noticeably better output across all five days. There is no VanguardOS subscription on top.'],
    ['How much extra will I spend on tools?', 'You can build and host for $0. Two upgrades are worth it: a paid AI tier for stronger output, and a custom domain (about $10 a year) so your site has a real, credible address you own. Neither is strictly required to finish, but both are worth the small spend.'],
    ['Will this work for my niche?', "Yes. The system is niche-agnostic by design. The templates and patterns are the scaffolding; the Day 2 brand work and Day 4 landing copy are where your niche shapes the output."],
    ["What if I'm already mid-launch?", "Drop into whichever day matches where you are. Stuck on the offer? Day 1. Brand feels off? Day 2. No landing page? Day 4. The Launchpad is a system you re-enter whenever a leg is weak."],
    ['Refund policy?', 'A full 30 days, no questions asked. Buy it, go through it, and if the Launchpad is not for you for any reason, email us within 30 days for a full refund. No forms, no hoops, no explanation needed.']
  ];

  // Any non-Bundle CTA (Core or Upgrade) opens the Bundle upsell modal first.
  // The user can opt in to the Bundle or decline and continue to their original CTA.
  // Focus management — keyboard users land inside the modal on open and
  // return to the CTA they clicked when it closes (a11y + zero-friction UX).
  let upsellPrimaryBtn;
  let lastFocusedEl = null;
  function openUpsell(source, e) {
    if (e) e.preventDefault();
    lastFocusedEl = typeof document !== 'undefined' ? document.activeElement : null;
    upsellSource = source;
    upsellOptIn = true;          // reset to default each open
    modalOpen = true;
    tick().then(() => upsellPrimaryBtn?.focus());
  }
  function restoreFocus() {
    if (lastFocusedEl?.focus) lastFocusedEl.focus();
    lastFocusedEl = null;
  }
  function go(url) { window.location.href = url; }
  function originalCtaUrl() {
    return upsellSource === 'core' ? GUMROAD.core : GUMROAD.upgrade;
  }
  function upsellContinue() {
    modalOpen = false;
    go(upsellOptIn ? GUMROAD.bundle : originalCtaUrl());
  }
  function upsellDecline() {
    modalOpen = false;
    go(originalCtaUrl());
  }
  function upsellClose() {
    modalOpen = false;            // X — pure dismiss, no routing
    restoreFocus();
  }

  // Each painkiller is a long-form editorial spread with a Telegram-style chat mockup.
  const painkillers = [
    {
      num: '01',
      kicker: 'INBOX',
      title: 'The Ghostwritten Inbox',
      trigger: `"what's urgent"`,
      lede: 'Three reply drafts waiting in Gmail before your coffee cools.',
      body: 'You text two words. It reads every unread email, finds the three that actually need you, and writes the replies in your voice. You glance and send. The other 208 emails never touch your morning.',
      time: '9:14',
      messages: [
        { from: 'user', text: `what's urgent` },
        { from: 'bot', text: '211 unread. 3 actually need you today —' },
        { from: 'bot', text: '📧 Sarah — contract expires 5PM · draft ready' },
        { from: 'bot', text: '📧 Daniel (board) — Q3 deck by EOD · draft ready' },
        { from: 'bot', text: '📧 IRS — response due Fri · draft ready' },
        { from: 'bot', text: 'All three replies written in your voice, in Drafts. You spend 90 seconds. The other 208 emails never touch your morning.' }
      ]
    },
    {
      num: '02',
      kicker: 'TAX',
      title: 'The 1-Text Tax Vault',
      trigger: 'Send a receipt photo',
      lede: 'One photo in. One clean line in your expense log out.',
      body: 'Snap the receipt the second it hits your hand. It reads the vendor, amount, and category, and files it forever. By April, the shoebox is empty and the year is already done.',
      time: '12:48',
      messages: [
        { from: 'user', text: '🧾 [receipt photo]' },
        { from: 'bot', text: '🧾 Logged: Delta — $148.20 (Travel).' },
        { from: 'bot', text: 'Filed, categorized, tax-ready. YTD: $17,280.' },
        { from: 'bot', text: "That's one fewer line your accountant bills you to chase in April. The shoebox is already empty." },
        { from: 'user', text: 'show me my money' },
        { from: 'bot', text: '📊 Dashboard open on your screen — $2,940 this month. Scroll down, this is the exact view.' }
      ]
    },
    {
      num: '03',
      kicker: 'TRAVEL',
      title: 'The Flight Lifeline',
      trigger: 'Forward your confirmation',
      lede: 'Never refresh an airline app at 11 PM again.',
      body: 'Forward one confirmation email and forget it exists. It watches the check-in window, opens it the moment it can, and texts you the seat. The next time you think about check-in is when your phone buzzes with the boarding pass.',
      time: '6:02',
      messages: [
        { from: 'bot', text: '✈ Tracking Delta 1422 — JFK → SFO, Thu.' },
        { from: 'bot', text: "I'll open check-in the exact second the window does. You can stop thinking about it now." },
        { from: 'bot', text: '✅ Checked in. Seat 4C — aisle, like you prefer. Boarding pass on your phone.' },
        { from: 'user', text: "didn't even think about it 🙏" },
        { from: 'bot', text: "That's the whole point. No 11PM app-refresh. No middle seat." }
      ]
    },
    {
      num: '04',
      kicker: 'EVENING',
      title: 'Date-Night Auto-Pilot',
      trigger: `"plan date night"`,
      lede: 'A real, bookable evening — built before you finish the question.',
      body: 'Romance does not die from lack of love. It dies from lack of logistics. It scans what is open near you, fits it to your sitter window, and hands you a plan with live booking links. You make the final tap.',
      time: '4:21',
      messages: [
        { from: 'user', text: 'plan date night' },
        { from: 'bot', text: 'On it. Friday, your area, ~7PM?' },
        { from: 'user', text: 'yes' },
        { from: 'bot', text: '🌙 One plan, two backups —' },
        { from: 'bot', text: '🍽 Osteria Marco · 7:00 · cozy → Reserve ›' },
        { from: 'bot', text: '🎬 Dune III · 9:15 · AMC 16 → Tickets ›' },
        { from: 'bot', text: 'Fits your sitter window. Home by 11:30. You make the final tap — 8 seconds vs. 12 browser tabs.' }
      ]
    },
    {
      num: '05',
      kicker: 'BRAND',
      title: 'The Drive-Time Brand Engine',
      trigger: 'Send a voice memo',
      lede: 'Talk for two minutes on the drive home. Park with two finished drafts.',
      body: 'Your best ideas hit in the car and evaporate by the time you are parked. Hold the mic, ramble for a minute. It pulls out the one real idea and writes a LinkedIn post and a newsletter — in your voice, ready to publish.',
      time: '5:47',
      messages: [
        { from: 'user', text: '🎙 [voice memo · 2:04]' },
        { from: 'bot', text: 'Got it. Found your one real idea in the ramble.' },
        { from: 'bot', text: '✍ LinkedIn post (340 w) — in Drafts' },
        { from: 'bot', text: '📰 Newsletter + subject line — in Drafts' },
        { from: 'bot', text: 'A ghostwriter charges $300 for this. You did it from the car. Twice a week = ~100 posts a year, for free.' }
      ]
    },
    {
      num: '06',
      kicker: 'COMMAND',
      title: 'The Command Center',
      trigger: `"morning briefing"`,
      lede: 'Your inbox, money, flights, and day — assembled in one calm screen.',
      body: 'The flagship. Everything the other five do, rolled into one morning standup the way a great chief of staff slides it across your desk with your coffee. One text, and your whole day is handled before you open the laptop.',
      time: '6:42',
      flagship: true,
      messages: [
        { from: 'user', text: 'morning briefing' },
        { from: 'bot', text: "Your whole day — handled before you opened the laptop:" },
        { from: 'bot', text: '📩 Inbox · 3 need you · all drafted' },
        { from: 'bot', text: '💰 Money · $2,940 this month · $17,280 YTD' },
        { from: 'bot', text: '✈ Travel · SFO Thu · check-in handled' },
        { from: 'bot', text: '📅 10a board · 2p Liz · 4:15 pickup' },
        { from: 'bot', text: '📊 Full Command Center is live in your browser → scroll down, this is the exact screen.' }
      ]
    }
  ];

  // Living Money Dashboard data (real figures from the product).
  const categories = [
    { name: 'Travel',   amt: 5420, len: 157.7, off: 0,     color: '#D4AF37' },
    { name: 'Meals',    amt: 3810, len: 110.8, off: -157.7, color: '#E7C66A' },
    { name: 'Software', amt: 3120, len: 90.8,  off: -268.5, color: '#B8941F' },
    { name: 'Office',   amt: 2740, len: 79.7,  off: -359.3, color: '#8C6E1E' },
    { name: 'Other',    amt: 2190, len: 63.7,  off: -439.0, color: '#5E5A4E' }
  ];
  const months = [
    { m: 'Jan', v: 2480 }, { m: 'Feb', v: 2910 }, { m: 'Mar', v: 3050 },
    { m: 'Apr', v: 2760 }, { m: 'May', v: 3140 }, { m: 'Jun', v: 2940 }
  ];
  const maxMonth = 3140;

  const products = [
    { key: 'core', src: '/products/core-thumbnail.webp', name: 'The 60-Minute AI Assistant', retail: '$410', price: '$49',
      caption: 'The fastest way from "I should use AI" to staff on your phone tonight.',
      cta: 'Learn More — $49',
      includes: [
        'The 8-chapter playbook (zero coding)',
        '5 painkiller skills — Inbox, Tax Vault, Flights, Date-Night, Brand Engine',
        'The Command Center + Living Money Dashboard',
        'The Ironclad Privacy Lock',
        'One-Page Cheat Sheet + Troubleshooting Guide'
      ] },
    { key: 'bundle', src: '/products/bundle-thumbnail.webp', name: 'The Orchestrator Bundle', retail: '$821', price: '$79',
      caption: 'Everything we make — Playbook + Upgrade + The Toolbox in one stack, for the same $79 as the Upgrade alone.',
      cta: 'Deploy Your System', featured: true,
      includes: [
        'Everything in the 60-Minute AI Assistant Playbook',
        'Everything in the Chief of Staff Upgrade (30 skills total)',
        '★ The Toolbox — builds new skills just by talking',
        'Family Multiplier License + Always-On Kit',
        'Same $79 as the Upgrade alone — Playbook is the value-add'
      ] },
    { key: 'upgrade', src: '/products/upgrade-thumbnail.webp', name: 'The Chief of Staff Upgrade', retail: '$264', price: '$79',
      caption: 'For buyers who already own the Playbook and want all 30 skills + The Toolbox.',
      cta: 'Claim the Upgrade',
      includes: [
        'The 25-Skill Mega-Vault across six departments',
        'Done-Tonight Activation Guide (7-day rollout)',
        '★ The Toolbox — builds new skills just by talking',
        'The Always-On & Usage-Smart Kit',
        'The Family Multiplier License'
      ] }
  ];

  function ctaHref(key) { return key === 'core' ? GUMROAD.core : key === 'bundle' ? GUMROAD.bundle : GUMROAD.upgrade; }

  onMount(() => {
    const onScroll = () => {
      scrolled = window.scrollY > 20;
      // Reveal the persistent mobile CTA once the hero (and its inline CTA) is
      // mostly scrolled past, so there's always a tap-target without it
      // overlapping the hero's own button.
      showStickyCta = window.scrollY > window.innerHeight * 0.85;
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
        document.querySelectorAll('.day-card').forEach(el => el.classList.remove('is-active-card'));
      }
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (contactOpen) closeContact();
      else if (specimenModalOpen) closeSpecimen();
      else if (modalOpen) upsellClose();
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

    const chatIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const bubbles = e.target.querySelectorAll('.bubble');
          if (!reducedMotion) {
            animate(bubbles, { opacity: [0, 1], y: [12, 0] },
              { duration: 0.45, delay: stagger(0.22), easing: [0.25, 0.46, 0.45, 0.94] });
          } else {
            bubbles.forEach(b => { b.style.opacity = '1'; });
          }
          chatIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('.chat-window').forEach(el => chatIo.observe(el));

    const sectionIo = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) currentSection = parseInt(e.target.dataset.index, 10); });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-section-index]').forEach(el => sectionIo.observe(el));

    // Command Center "regenerate on trigger" demo — plays once on scroll into view.
    const ccDemoIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        ccDemoIo.unobserve(e.target);
        const b1 = e.target.querySelector('[data-cc="b1"]');
        const b2 = e.target.querySelector('[data-cc="b2"]');
        const save = e.target.querySelector('[data-cc="save"]');
        const chip = e.target.querySelector('[data-cc="chip"]');
        const bars = document.querySelectorAll('#command .bar');
        if (reducedMotion) {
          [b1, b2, save].forEach(el => el && (el.style.opacity = '1'));
          chip && chip.classList.add('glow');
          return;
        }
        const seq = async () => {
          await animate(b1, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4 }).finished;
          await animate(b2, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4, delay: 0.45 }).finished;
          // dashboard rebuilds: bars redraw from the baseline
          animate(bars, { scaleY: [0.12, 1] }, { duration: 0.7, delay: stagger(0.07), easing: [0.25, 0.46, 0.45, 0.94] });
          chip && chip.classList.add('glow');
          await animate(save, { opacity: [0, 1], y: [8, 0] }, { duration: 0.5, delay: 0.25 }).finished;
        };
        seq();
      });
    }, { threshold: 0.45 });
    document.querySelectorAll('[data-cc-demo]').forEach(el => ccDemoIo.observe(el));

    // Highlight day cards as they scroll into the viewport center on mobile/tablet
    const cardObserver = new IntersectionObserver(entries => {
      const isMobile = window.innerWidth < 1024;
      entries.forEach(e => {
        if (isMobile && e.isIntersecting) {
          document.querySelectorAll('.day-card').forEach(el => el.classList.remove('is-active-card'));
          e.target.classList.add('is-active-card');
        } else {
          e.target.classList.remove('is-active-card');
        }
      });
    }, {
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    });
    document.querySelectorAll('.day-card').forEach(el => cardObserver.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      io.disconnect(); chatIo.disconnect(); sectionIo.disconnect(); ccDemoIo.disconnect();
      cardObserver.disconnect();
    };
  });
</script>

<svelte:head>
  <script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "The Vanguard Launchpad",
    "description": "A 5-day system that takes solopreneurs from idea to launch-ready: brand, assets, landing page, high-impact offer, and complete funnel, all built with you. Systems that launchpad solopreneurs into the digital economy.",
    "image": "https://vanguardos.co/og/og-card.jpg",
    "url": "https://vanguardos.co/",
    "brand": { "@type": "Brand", "name": "VanguardOS" },
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
  })}
  </script>
  <script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VanguardOS",
    "url": "https://vanguardos.co/",
    "logo": "https://vanguardos.co/brand/brand-mark-owl.svg",
    "description": "VanguardOS builds systems that launch solopreneurs into the digital economy. The Vanguard Launchpad is the first.",
    "email": "support@vanguardos.co"
  })}
  </script>
  <script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Do I need to be technical?", "acceptedAnswer": { "@type": "Answer", "text": "No. Every template, prompt, and pattern is copy-paste. The prompts ask you a few plain questions and do the rest. If you can follow a recipe, you can follow this." } },
      { "@type": "Question", "name": "What if I don't have an idea yet?", "acceptedAnswer": { "@type": "Answer", "text": "Day 1 is the ideation system itself: a sequenced way to surface, validate, and price an idea you actually want to ship. You can start with nothing more than a hunch, or a blank page, and finish Day 1 with a locked offer." } },
      { "@type": "Question", "name": "What AI tools do I need?", "acceptedAnswer": { "@type": "Answer", "text": "Just one capable model. The prompts work with ChatGPT, Claude, or Gemini, and Day 4 builds your landing page in Google Antigravity, which is free to start. Free tiers can complete the 5 days, but we strongly recommend a paid tier of one model (about $20 a month): you get longer sessions and access to the stronger models, and a stronger model means noticeably better output across all five days. There is no VanguardOS subscription on top." } },
      { "@type": "Question", "name": "How much extra will I spend on tools?", "acceptedAnswer": { "@type": "Answer", "text": "You can build and host for $0. Two upgrades are worth it: a paid AI tier for stronger output, and a custom domain (about $10 a year) so your site has a real, credible address you own. Neither is strictly required to finish, but both are worth the small spend." } },
      { "@type": "Question", "name": "Will this work for my niche?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The system is niche-agnostic by design. The templates and patterns are the scaffolding; the Day 2 brand work and Day 4 landing copy are where your niche shapes the output." } },
      { "@type": "Question", "name": "What if I'm already mid-launch?", "acceptedAnswer": { "@type": "Answer", "text": "Drop into whichever day matches where you are. Stuck on the offer? Day 1. Brand feels off? Day 2. No landing page? Day 4. The Launchpad is a system you re-enter whenever a leg is weak." } },
      { "@type": "Question", "name": "Refund policy?", "acceptedAnswer": { "@type": "Answer", "text": "A full 30 days, no questions asked. Buy it, go through it, and if the Launchpad is not for you for any reason, email us within 30 days for a full refund. No forms, no hoops, no explanation needed." } }
    ]
  })}
  </script>
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
    <nav class="hidden md:flex items-center gap-8">
      <a href="#offer-stack" class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">What's Inside</a>
      <a href="#five-day" class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">5-Day Journey</a>
      <a href="#faq" class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">FAQ</a>
      <a href="mailto:support@vanguardos.co" on:click|preventDefault={openContact} class="text-xs font-mono uppercase tracking-wider text-muted hover:text-text transition">Contact</a>
      <a href={GUMROAD.launchpad} class="flex items-center gap-2 px-5 py-2 border border-gold-line hover:border-gold hover:bg-gold-soft text-gold text-xs font-semibold font-mono uppercase tracking-wider rounded-full transition hover:scale-[1.03]">
        <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        Get The Launchpad →
      </a>
    </nav>
    <button class="md:hidden text-muted hover:text-text p-1" on:click={() => menuOpen = !menuOpen} aria-label="Toggle menu">
      {#if menuOpen}
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      {:else}
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      {/if}
    </button>
  </div>
  <div class="fixed top-0 right-0 h-screen w-[280px] bg-surface border-l border-line p-8 space-y-6 shadow-2xl transition-transform duration-300 z-[95] md:hidden" style="transform: translateX({menuOpen ? '0' : '100%'})">
    <button on:click={() => menuOpen = false} class="ml-auto block text-muted hover:text-text" aria-label="Close">✕</button>
    <a href="#offer-stack" on:click={() => menuOpen = false} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">What's Inside</a>
    <a href="#five-day" on:click={() => menuOpen = false} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">5-Day Journey</a>
    <a href="#faq" on:click={() => menuOpen = false} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">FAQ</a>
    <a href="mailto:support@vanguardos.co" on:click|preventDefault={openContact} class="block text-sm font-mono uppercase tracking-wider text-muted hover:text-text">Contact</a>
    <a href={GUMROAD.launchpad} on:click={() => menuOpen = false} class="flex items-center justify-center gap-2 py-3 bg-gold text-base-2 font-bold font-mono uppercase text-xs tracking-wide rounded-full">
      <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      Get The Launchpad →
    </a>
  </div>
  {#if menuOpen}
    <button on:click={() => menuOpen = false} type="button" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[92] md:hidden" aria-label="Close menu"></button>
  {/if}
</header>

<!-- Floating section indicator -->
<aside class="hidden min-[1480px]:flex fixed right-6 2xl:right-10 top-1/2 -translate-y-1/2 z-[80] flex-col gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-2 select-none pointer-events-none">
  {#each painkillers as p, i}
    <div class="flex items-center gap-2 transition-all duration-300 {currentSection === i ? 'text-gold' : ''}">
      <span class="block h-px transition-all duration-300 {currentSection === i ? 'w-8 bg-gold' : 'w-3 bg-muted-2'}"></span>
      <span>{p.num} · {p.kicker}</span>
    </div>
  {/each}
</aside>

<main id="top">
  <!-- HERO -->
  <section class="relative pt-36 pb-28 md:pt-44 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden"
    style="background-image: radial-gradient(ellipse at 80% -10%, rgba(212,175,55,0.10), transparent 60%);">
    <div class="max-w-[1100px] mx-auto space-y-9">
      <div class="hero-item inline-flex items-center gap-3" style="opacity: 0">
        <img src="/brand/brand-mark-owl.svg" alt="VanguardOS owl mark" class="w-10 h-10" />
        <span class="font-display text-lg md:text-xl leading-none">
          <span class="text-text">Vanguard</span><span class="italic text-gold">OS</span>
        </span>
      </div>
      <!-- Pain eyebrow: leads with the pattern the buyer recognizes -->
      <div class="hero-item" style="opacity: 0">
        <span class="font-mono text-[11px] md:text-xs uppercase tracking-[0.3em] text-gold">
          You don't need another course. You need to ship the one you already paid for.
        </span>
      </div>

      <!-- Headline: How to [outcome], even if [pain] -->
      <h1 class="hero-item font-display font-medium text-text leading-[0.95] max-w-[1100px] mx-auto select-none" style="opacity: 0; letter-spacing: -0.025em;">
        <span class="block text-[2.75rem] sm:text-5xl md:text-7xl lg:text-[5.25rem] xl:text-[6rem]">
          How to launch a premium digital product in 5 days,
        </span>
        <span class="block italic text-gold text-[2.25rem] sm:text-4xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem] mt-3 md:mt-5">
          even if you've never shipped anything before.
        </span>
      </h1>

      <!-- Subhead: calmer, body serif -->
      <p class="hero-item font-sans text-muted text-lg md:text-2xl leading-snug max-w-[820px] mx-auto" style="opacity: 0">
        A 5-day system. 7 designer-grade PDFs. The exact stack we use. For builders done planning.
      </p>

      <!-- Day-5 outcomes: tactile proof of the five deliverables you keep.
           Renders day5Outcomes so the hero promise is concrete, not abstract.
           The full day-by-day process lives in the dedicated 5-Day Journey section. -->
      <div class="hero-item flex flex-col items-center gap-3 pt-1" style="opacity: 0">
        <span class="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-muted-2">By Day 5, you'll have</span>
        <ul class="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 max-w-[780px] mx-auto">
          {#each day5Outcomes as outcome}
            <li class="inline-flex items-center gap-1.5 rounded-full border border-gold-line/60 bg-gold-soft/15 px-3 py-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-text/90">
              <span class="text-gold leading-none" aria-hidden="true">✓</span>{outcome}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Primary CTA: gold, prominent, all caps -->
      <div class="hero-item flex flex-col items-center gap-4 pt-3" style="opacity: 0">
        <a href={GUMROAD.launchpad} class="btn-primary inline-flex items-center justify-center gap-3 px-12 py-5 rounded-[2rem] font-mono text-sm md:text-base uppercase tracking-[0.18em]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Get The Launchpad &nbsp;·&nbsp; $129 →
        </a>
        <p class="text-xs md:text-sm font-mono uppercase tracking-wider text-muted">
          One payment. No subscription. Yours forever.
        </p>
      </div>

      <!-- Trust strip: small mono row of credibility anchors -->
      <div class="hero-item pt-4" style="opacity: 0">
        <p class="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-muted-2 max-w-[860px] mx-auto leading-relaxed">
          Instant download &nbsp;·&nbsp; $811 value, six bonuses included &nbsp;·&nbsp; No code required &nbsp;·&nbsp; 30-day guarantee
        </p>
      </div>
    </div>
  </section>

  <!-- PROOF / ANCHOR STRIP -->
  <section class="border-y border-line/60 bg-base-2/40 reveal">
    <div class="max-w-[1180px] mx-auto px-6 py-14 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14 text-center anchor-strip">
      <div class="anchor-item">
        <div class="font-display text-4xl md:text-5xl text-gold leading-none">5 days</div>
        <div class="anchor-label">Idea to launch-ready</div>
      </div>
      <div class="anchor-item">
        <div class="font-display text-4xl md:text-5xl text-gold leading-none">1 system</div>
        <div class="anchor-label">Endlessly reusable</div>
      </div>
      <div class="anchor-item">
        <div class="font-display text-4xl md:text-5xl text-gold leading-none">Universal</div>
        <div class="anchor-label">ChatGPT · Claude · Gemini</div>
      </div>
      <div class="anchor-item">
        <div class="font-display text-4xl md:text-5xl text-gold leading-none">Yours forever</div>
        <div class="anchor-label">No subscription</div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       THE PROBLEM — pain before the reveal
       ═══════════════════════════════════════════════════════════════ -->
  <section id="problem" class="relative py-20 md:py-24 px-6 border-t border-line/60">
    <div class="max-w-[1100px] mx-auto reveal">
      <header class="text-center max-w-[860px] mx-auto mb-10 md:mb-14">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Why You Haven't Launched</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl leading-[0.98] text-text">
          You don't have an idea problem. <span class="italic text-gold">You have a packaging problem.</span>
        </h2>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">01 · The forty decisions</span>
          <p class="text-base md:text-lg text-text/90 leading-relaxed mt-3">Name, palette, fonts, logo, voice, page, price, guarantee, checkout, emails. Every one of them can stall you for a week, and none of them is the actual product.</p>
        </div>
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">02 · The expert tax</span>
          <p class="text-base md:text-lg text-text/90 leading-relaxed mt-3">A brand designer quotes $1,500. A copywriter $1,200. A developer $2,500. For an idea that hasn't earned its first dollar, that math kills the launch before it starts.</p>
        </div>
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">03 · The quiet death</span>
          <p class="text-base md:text-lg text-text/90 leading-relaxed mt-3">So the idea sits in your notes app, aging. Meanwhile someone with half your insight ships theirs, because they had a system and you had a to-do list.</p>
        </div>
      </div>
      <p class="text-center text-lg md:text-xl text-text leading-relaxed max-w-[760px] mx-auto mt-10">
        The Launchpad is the total solution: every decision pre-made, every asset built with you, in order, in five days. You bring the idea. The system does the packaging.
      </p>
      <div class="text-center mt-7">
        <a href="#offer-stack" class="text-sm font-mono uppercase tracking-widest text-gold hover:text-gold-hi transition border-b border-gold-line hover:border-gold pb-1">See the whole system ↓</a>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       LAUNCHPAD OFFER STACK — The high-impact value reveal
       ═══════════════════════════════════════════════════════════════ -->
  <section id="offer-stack" class="relative py-20 md:py-28 px-6 border-t border-line/60">
    <div class="max-w-[1100px] mx-auto reveal">
      <header class="text-center max-w-[820px] mx-auto mb-12 md:mb-16">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">What's In The Launchpad</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">
          The system, <span class="italic text-gold">plus six bonuses.</span>
        </h2>
        <p class="text-text text-lg md:text-xl mt-6 leading-relaxed">
          The 5-Day Launchpad is the core: the whole path from a hunch in your notes app to a checkout page live on the internet, with the forty small decisions that stall most people already made for you. Then six finished systems stack on top, free. Each is something you would otherwise pay for, or lose a weekend building. Together they are the difference between launching someday and sending a friend the link this week.
        </p>
      </header>

      <!-- Conciseness callout -->
      <div class="reveal mb-10 md:mb-12 max-w-[820px] mx-auto rounded-[1.25rem] border-l-2 border-gold bg-surface/60 px-6 py-5 md:px-8 md:py-6">
        <p class="font-display italic text-lg md:text-xl text-text/90 leading-relaxed">
          The entire Launchpad guide is <span class="text-gold not-italic font-semibold">exactly 32 pages</span>, split across the 5 days. Not 250. That is about six pages a day, action-first. You're meant to finish a day in a single sitting, not study it for a week.
        </p>
      </div>

      <!-- THE CORE SYSTEM: visually dominant, the one thing you came for -->
      <div class="reveal rounded-[1.75rem] border-2 border-gold bg-gold-soft/20 p-6 md:p-8"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12), transparent 70%);">
        <div class="flex items-center justify-between gap-4 mb-4">
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">The core system</span>
          <span class="font-mono text-base text-gold/70 line-through whitespace-nowrap">Value {coreItem.value}</span>
        </div>
        <div class="flex items-start gap-4 md:gap-6">
          <img src={coreItem.img} alt="{coreItem.name} cover art" class="w-20 h-20 md:w-28 md:h-28 rounded-[1rem] border border-gold-line/60 object-cover shrink-0" loading="lazy" decoding="async" />
          <div class="flex flex-col gap-2 min-w-0">
            <h3 class="font-display text-2xl md:text-4xl text-text leading-tight">{coreItem.name}</h3>
            <p class="text-base md:text-lg text-text/85 leading-relaxed">{coreItem.blurb} This is the whole system. The six below are stacked on top of it.</p>
          </div>
        </div>
      </div>

      <!-- BONUS-STACK DIVIDER: makes the pile-on unmistakable to a skimmer -->
      <div class="reveal flex items-center justify-center gap-4 my-8 md:my-10">
        <div class="h-px flex-1 bg-gold-line/40"></div>
        <span class="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold text-center whitespace-nowrap">Then six bonuses, free · {'$' + bonusValue} of value</span>
        <div class="h-px flex-1 bg-gold-line/40"></div>
      </div>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {#each bonusItems as item}
          <li class="reveal rounded-[1.5rem] border border-line bg-surface/60 p-6 md:p-7 hover:border-gold-line transition flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <span class="font-mono text-[9px] uppercase tracking-[0.25em] text-gold border border-gold/40 bg-gold-soft/20 rounded-full px-2.5 py-1">Bonus</span>
              <span class="font-mono text-base text-gold/60 line-through whitespace-nowrap">Value {item.value}</span>
            </div>
            <div class="flex items-start gap-4">
              <img src={item.img} alt="{item.name} cover art" class="w-16 h-16 md:w-20 md:h-20 rounded-[0.9rem] border border-line/60 object-cover shrink-0" loading="lazy" decoding="async" />
              <div class="flex flex-col gap-2 min-w-0">
                <h3 class="font-display text-2xl md:text-[28px] text-text leading-tight">{item.name}</h3>
                <p class="text-base text-text/85 leading-relaxed">{item.blurb}</p>
              </div>
            </div>
          </li>
        {/each}
      </ul>

      <!-- Value math: core $129 + six bonuses $682 = $811 stacked → today $129 -->
      <div class="reveal mt-10 md:mt-12 rounded-[2rem] border-2 border-gold bg-gold-soft/20 p-8 md:p-10"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10), transparent 70%);">
        <div class="flex items-baseline justify-between text-text/80">
          <span class="font-mono text-sm uppercase tracking-widest">The 5-day system</span>
          <span class="font-mono text-base md:text-lg tracking-tight">{coreItem.value}</span>
        </div>
        <div class="flex items-baseline justify-between mt-2.5 text-text/80">
          <span class="font-mono text-sm uppercase tracking-widest">Six bonuses, stacked on top</span>
          <span class="font-mono text-base md:text-lg tracking-tight">{'+$' + bonusValue}</span>
        </div>
        <div class="flex items-baseline justify-between mt-3 pt-3 border-t border-gold-line/40">
          <span class="font-mono text-sm uppercase tracking-widest text-muted">Stacked value</span>
          <span class="font-mono font-bold text-2xl md:text-3xl text-gold/60 line-through tracking-tight">{'$' + stackValue}</span>
        </div>
        <div class="flex items-baseline justify-between mt-3 pt-3 border-t border-gold-line/40">
          <span class="font-mono text-sm uppercase tracking-widest text-text">Today, one payment</span>
          <span class="font-mono font-bold text-4xl md:text-5xl text-gold tracking-tight">$129</span>
        </div>
        <p class="text-base text-text/85 leading-relaxed mt-5 text-center">
          Counted on their own, the six bonuses come to {'$' + bonusValue}, more than five times the price, and they are free. You pay $129 for the system and keep all {'$' + stackValue}.
        </p>
        <a href={GUMROAD.launchpad} class="btn-primary flex items-center justify-center gap-2.5 mt-7 py-5 rounded-[2rem]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Get The Launchpad · $129 →
        </a>
        <p class="text-sm font-mono uppercase tracking-widest text-muted mt-3 text-center">One payment. Universal AI. Yours forever.</p>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       ASSET-PACK SPECIMENS — make the Palette + Typography packs visible
       ═══════════════════════════════════════════════════════════════ -->
  <section id="brand-work" class="relative py-20 md:py-24 px-6 border-t border-line/60">
    <div class="max-w-[1100px] mx-auto reveal">
      <header class="text-center max-w-[760px] mx-auto mb-10 md:mb-14">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Brand Work</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text">
          The brand work, <span class="italic text-gold">already done for you</span>.
        </h2>
        <p class="text-text text-lg md:text-xl mt-5 leading-relaxed">
          Two of the seven systems are pure design firepower: palettes and type pairings you'd otherwise pay a brand studio for. Here's a sample of what's inside.
        </p>
        <p class="text-gold text-base md:text-lg mt-5 font-medium">Go ahead and click any palette or type pairing below to open it and inspect the exact hex codes, fonts, and weights.</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <!-- Brand Palette Pack specimen -->
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-5 sm:p-6 md:p-8 flex flex-col h-full">
          <div class="flex items-baseline justify-between gap-4 mb-5">
            <h3 class="font-display text-2xl text-text leading-tight">The Brand Palette Pack</h3>
            <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold whitespace-nowrap">5 of 20</span>
          </div>
          <ul class="flex flex-col justify-between flex-1 gap-4 lg:gap-0">
            {#each specimenPalettes as palette}
              <li>
                <button type="button" on:click={(e) => openSpecimen('palette', palette, e)}
                  class="specimen-row flex items-center gap-3 w-full text-left rounded-lg py-1 sm:py-1.5"
                  aria-label="Expand the {palette.name} palette to see its hex values">
                  <div class="flex flex-1 h-10 sm:h-12 rounded-lg overflow-hidden border border-line/60">
                    {#each palette.colors as c}
                      <span class="flex-1" style="background-color: {c};"></span>
                    {/each}
                  </div>
                  <span class="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted w-24 sm:w-28 text-right shrink-0 whitespace-nowrap">{palette.name}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Typography Pack specimen -->
        <div class="rounded-[1.5rem] border border-line bg-surface/60 p-5 sm:p-6 md:p-8 flex flex-col h-full">
          <div class="flex items-baseline justify-between gap-4 mb-5">
            <h3 class="font-display text-2xl text-text leading-tight">The Typography Pack</h3>
            <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold whitespace-nowrap">3 of 20 inside</span>
          </div>
          <ul class="flex flex-col gap-4">
            {#each specimenType as t}
              <li>
                <button type="button" on:click={(e) => openSpecimen('type', t, e)}
                  class="specimen-row scheme-preview rounded-[1rem] border border-line/60 bg-base/30 px-4 py-4 sm:px-5 sm:py-5 w-full text-left"
                  aria-label="Expand the {t.pair} type pairing to see it at display size">
                  <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3 mb-2 sm:mb-1">
                    <span class="meta">Scheme {String(t.schemeNo).padStart(2,'0')} · {t.tag}</span>
                    <span class="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-2 whitespace-nowrap">{t.display} × {t.body}</span>
                  </div>
                  <p class="display text-text" style="font-family: {t.fontDisplay}; font-weight: {t.displayWeight};">{t.sample}</p>
                  <p class="body text-muted" style="font-family: {t.fontBody};">Set in {t.body}. Set in {t.display}. Free for commercial use.</p>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      </div>
      <p class="text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted-2 mt-8">
        20 palettes + 20 type systems ship inside the Launchpad · Sources: Fontshare + Google Fonts + The League of Moveable Type
      </p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       WHO THIS IS FOR / NOT FOR — qualification before the 5-day journey
       ═══════════════════════════════════════════════════════════════ -->
  <section id="for-who" class="relative py-20 md:py-28 px-6 border-t border-line/60">
    <div class="max-w-[1080px] mx-auto reveal">
      <header class="text-center max-w-[760px] mx-auto mb-12 md:mb-16">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Section · Who This Is For</span>
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
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You have a folder of unfinished ideas in your notes app, and you are ready to stop planning and get your first offer out of your head and onto a real page on the internet.</span></li>
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You keep buying courses and watching tutorials but never ship, and you want a strict, step-by-step path that makes you build instead of just consume.</span></li>
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You are overwhelmed by the volume of decisions a launch demands: naming, colors, type, copy, layout. You want a system that makes those calls for you.</span></li>
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You refuse to launch a cheap, amateur-looking storefront, but you don't have $5,000 to waste on a brand designer or copywriter just to validate a brand-new idea.</span></li>
            <li class="flex gap-3"><span class="text-gold mt-1">·</span><span>You want a real, payment-ready storefront, a structured funnel, and automated emails running on a live custom URL by Day 5, so you have something tangible to sell next week.</span></li>
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
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You are looking for an agency to build it for you. We give you the complete machinery, but you have to turn the key. If you want white-glove service, you should pay a $12,000 agency invoice instead.</span></li>
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You enjoy planning and buying domains more than shipping. This system exists to end the stalling and put your name on a live checkout, which can feel scary.</span></li>
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You expect sales to happen automatically without promotion. The Launchpad builds the storefront and checkout funnel; driving traffic is your job, and we would rather be honest about that upfront.</span></li>
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You want an effortless one-click button. The system is fast, but it still takes 8 to 12 hours of focused, hands-on work. Fast is not the same as effortless.</span></li>
            <li class="flex gap-3"><span class="text-muted mt-1">·</span><span>You are hunting a get-rich-quick, passive-income loophole. This builds a real product you own, not a temporary hype funnel.</span></li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       THE 5-DAY JOURNEY — visual day-by-day outcomes
       ═══════════════════════════════════════════════════════════════ -->
  <section id="five-day" class="relative py-20 md:py-28 px-6 border-t border-line/60 overflow-hidden"
    style="background-image: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.08), transparent 60%);">
    <div class="max-w-[1180px] mx-auto">
      <header class="text-center max-w-[820px] mx-auto mb-12 md:mb-16 reveal">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">The 5-Day Journey</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">
          Five days. Five outcomes. <span class="italic text-gold">One launch-ready system.</span>
        </h2>
        <p class="text-text text-lg md:text-xl mt-6 leading-relaxed">
          The Launchpad is not a course. It's a sequence. Each day produces a finished piece of your business. By Day 5 you have a real, live, take-the-money-today system.
        </p>
      </header>

      <!-- Scrollytelling rail — fills as the section scrolls past; day markers
           light up in sequence. Shown on all breakpoints: on mobile it reads as a
           standalone 5-step progress indicator above the stacked day cards. -->
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

      <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        {#each launchpadDays as day, idx}
          <li class="day-card reveal rounded-[1.5rem] border border-line bg-surface/60 p-5 md:p-6 flex flex-col gap-4 transition"
            data-day-index={idx}
            style="transition-delay: {idx * 90}ms">
            <div class="relative aspect-square rounded-[1rem] overflow-hidden bg-base/40 border border-line/60">
              <!-- Branded artifact preview — pure-CSS mini-mockup of the day's deliverable.
                   Shows as visual proof until a real day-N.png mockup replaces it. -->
              <div class="day-fallback absolute inset-0 p-3 select-none overflow-hidden"
                style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12), transparent 70%);" aria-hidden="true">
                <div class="absolute top-2 left-2.5 flex items-baseline gap-1 z-10">
                  <span class="font-mono font-bold text-base text-gold/90 leading-none tracking-tight">{day.num}</span>
                  <span class="font-mono text-[7px] uppercase tracking-[0.25em] text-muted-2">{day.kicker}</span>
                </div>
                {#if day.num === '01'}
                  <!-- IDEATE: validated-idea checklist + price -->
                  <div class="absolute inset-0 flex flex-col justify-center gap-1.5 px-5 pt-5">
                    {#each [0,1,2] as r}
                      <div class="flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-gold/25 border border-gold/50 flex items-center justify-center text-gold text-[7px] leading-none">✓</span>
                        <span class="h-1.5 flex-1 rounded-full bg-gold/20"></span>
                      </div>
                    {/each}
                    <span class="mt-1.5 self-start text-[8px] font-mono text-gold/80 border border-gold/40 rounded px-1.5 py-0.5">$129 · validated</span>
                  </div>
                {:else if day.num === '02'}
                  <!-- BRAND: monogram + palette swatches + type lines -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pt-4">
                    <div class="w-8 h-8 rounded-lg border border-gold/50 bg-gold/10 flex items-center justify-center font-display text-gold text-sm leading-none">V</div>
                    <div class="flex gap-1">
                      {#each ['#0B0F14','#3E6E8E','#7FB0CB','#D4AF37','#E8F1F6'] as c}
                        <span class="w-3 h-3 rounded-sm" style="background:{c}"></span>
                      {/each}
                    </div>
                    <div class="flex flex-col items-center gap-1 mt-0.5">
                      <span class="h-1.5 w-16 rounded-full bg-text/30"></span>
                      <span class="h-1 w-11 rounded-full bg-text/15"></span>
                    </div>
                  </div>
                {:else if day.num === '03'}
                  <!-- ASSETS: grid of generated asset tiles -->
                  <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5 p-4 pt-8">
                    <span class="rounded-md border border-gold/20 bg-gradient-to-br from-gold/25 to-transparent"></span>
                    <span class="rounded-md border border-line bg-gradient-to-br from-text/15 to-transparent"></span>
                    <span class="rounded-md border border-line bg-gradient-to-tr from-gold/15 to-transparent"></span>
                    <span class="rounded-md border border-gold/20 bg-gradient-to-tr from-text/20 to-transparent"></span>
                  </div>
                {:else if day.num === '04'}
                  <!-- LANDING PAGE: wireframe with hero, gold CTA, content rows -->
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
                  <!-- FUNNEL: descending funnel bars + checkout chip -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 pt-4">
                    <span class="h-2.5 w-20 rounded-sm bg-gold/60"></span>
                    <span class="h-2.5 w-14 rounded-sm bg-gold/40"></span>
                    <span class="h-2.5 w-9 rounded-sm bg-gold/25"></span>
                    <span class="mt-1.5 text-[8px] font-mono text-gold/80 border border-gold/40 rounded px-1.5 py-0.5">Checkout ✓</span>
                  </div>
                {/if}
              </div>
              <img src={day.img} alt="Day {idx + 1}: {day.kicker}" class="day-img relative w-full h-full object-cover" loading="lazy" decoding="async" on:error={(e) => e.currentTarget.style.opacity='0'} />
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
        <a href={GUMROAD.launchpad} class="btn-primary inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-[2rem]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Start The 5-Day Build · $129 →
        </a>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       WHO THIS IS FOR — avatar selector
       ═══════════════════════════════════════════════════════════════ -->
  <section id="who" class="relative py-20 md:py-24 px-6 border-t border-line/60">
    <div class="max-w-[1180px] mx-auto reveal">
      <header class="text-center max-w-[760px] mx-auto mb-10 md:mb-14">
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Built For</span>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text mt-3">
          If any of these is you, <span class="italic text-gold">this is your system</span>.
        </h2>
      </header>

      <ul class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {#each launchpadAvatars as avatar, i}
          <li class="reveal">
            <button
              type="button"
              on:click={() => selectAvatar(i)}
              aria-pressed={selectedAvatar === i}
              class="avatar-card w-full h-full rounded-[1.25rem] border bg-surface/60 p-5 md:p-6 text-center flex flex-col items-center gap-3 cursor-pointer {selectedAvatar === i ? 'border-gold avatar-card-active' : 'border-line'}">
              <span class="text-3xl md:text-4xl leading-none" aria-hidden="true">{avatar.icon}</span>
              <p class="text-sm md:text-base text-text leading-snug" style="color: #ECEAE4;">{avatar.label}</p>
            </button>
          </li>
        {/each}
      </ul>

      <!-- Tuned promise panel — swaps copy to the selected path; pure client state -->
      <div id="promise-container" class="mt-6 md:mt-8" aria-live="polite">
        {#if selectedAvatar === -1}
          <p class="text-center font-mono text-xs uppercase tracking-[0.25em] text-muted-2">
            Tap the one that's you ↑ and see exactly what the Launchpad does for your path.
          </p>
        {:else}
          {#key selectedAvatar}
            <div class="promise-panel max-w-[760px] mx-auto rounded-[1.5rem] border border-gold-line bg-gold-soft/20 p-6 md:p-8 text-center"
              style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10), transparent 70%);">
              <div class="flex items-center justify-center gap-3 mb-4">
                <span class="text-2xl md:text-3xl leading-none" aria-hidden="true">{launchpadAvatars[selectedAvatar].icon}</span>
                <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">{launchpadAvatars[selectedAvatar].label}</span>
              </div>
              <p class="text-text text-lg md:text-xl leading-relaxed">{launchpadAvatars[selectedAvatar].promise}</p>
              <a href={GUMROAD.launchpad} class="btn-primary inline-flex items-center justify-center gap-2.5 mt-6 px-8 py-4 rounded-[2rem]">
                <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
                Get The Launchpad · $129 →
              </a>
            </div>
          {/key}
        {/if}
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       THE MATH — what hiring this out costs vs the Launchpad
       ═══════════════════════════════════════════════════════════════ -->
  <section id="the-math" class="relative py-16 md:py-20 px-6 border-t border-line/60">
    <div class="max-w-[860px] mx-auto reveal">
      <header class="text-center mb-8 md:mb-10">
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Do The Math</span>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text mt-3">
          What hiring this out <span class="italic text-gold">actually costs.</span>
        </h2>
      </header>
      <div class="rounded-[2rem] border border-line bg-surface/60 p-7 md:p-10">
        <ul class="space-y-3.5">
          {#each [
            ['Brand identity from a designer', '$1,500+'],
            ['Landing page copy from a copywriter', '$1,200+'],
            ['Page design and build from a developer', '$2,500+'],
            ['Funnel and email setup from a consultant', '$1,000+']
          ] as row}
            <li class="flex items-baseline justify-between gap-4 border-b border-line/60 pb-3">
              <span class="text-text text-base md:text-[17px]">{row[0]}</span>
              <span class="font-mono font-bold text-base text-muted whitespace-nowrap tracking-tight">{row[1]}</span>
            </li>
          {/each}
        </ul>
        <div class="flex items-baseline justify-between mt-5">
          <span class="font-mono text-sm uppercase tracking-widest text-muted">Hired out</span>
          <span class="font-mono font-bold text-2xl md:text-3xl text-gold/60 line-through tracking-tight">$6,200+</span>
        </div>
        <div class="flex items-baseline justify-between mt-3 pt-3 border-t border-gold-line/40">
          <span class="font-mono text-sm uppercase tracking-widest text-text">The Launchpad, built with you</span>
          <span class="font-mono font-bold text-4xl md:text-5xl text-gold tracking-tight">$129</span>
        </div>
        <p class="text-base text-text/85 leading-relaxed mt-5 text-center">
          Same deliverables, and you keep the system. Every product you launch after this one rides the same rails for free.
        </p>
        <a href={GUMROAD.launchpad} class="btn-primary flex items-center justify-center gap-2.5 mt-6 py-5 rounded-[2rem]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Get The Launchpad · $129 →
        </a>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       RISK REVERSAL — 30-day guarantee
       ═══════════════════════════════════════════════════════════════ -->
  <section class="relative py-20 md:py-24 px-6">
    <div class="max-w-[860px] mx-auto reveal">
      <div class="rounded-[2.5rem] border border-gold-line bg-gold-soft/30 p-8 md:p-12 text-center"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10), transparent 70%);">
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">30-Day Money-Back Guarantee</span>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text mt-4 mb-5">
          Build it. <span class="italic text-gold">Then decide.</span>
        </h2>
        <p class="text-text text-lg md:text-xl leading-relaxed max-w-[640px] mx-auto">
          <strong class="text-gold">30-day money-back guarantee, no questions asked.</strong> Buy it, run the 5 days, and if the Launchpad is not for you, email us for a full refund. No forms, no hoops, no "sorry to see you go" sequence.
        </p>
        <p class="text-text text-base md:text-[17px] leading-relaxed max-w-[620px] mx-auto mt-4">
          And if you get stuck on a step, tell us where. We'd rather you finish your launch than have your money back.
        </p>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════
       LEGACY: 60-Minute AI Assistant sections — hidden via {#if false}
       Kept in source for re-enable / future relaunch. Do not delete.
       Sections wrapped: Prompted-not-autonomous · Beat 1 Core ·
       Editorial opener + 6 painkillers · Command Center ·
       Beat 2 Upgrade · Beat 3 Bundle reveal · Value stack +
       comparison + guarantee · Comparison grid · Catalog (Pick Your Path)
       ═══════════════════════════════════════════════════════════════ -->
  {#if false}
  <!-- PROMPTED, NOT AUTONOMOUS -->
  <section class="relative py-20 md:py-28 px-6">
    <div class="max-w-[1000px] mx-auto reveal">
      <div class="rounded-[2.5rem] border border-gold-line bg-gold-soft/40 p-8 md:p-14 text-center space-y-6"
        style="background-image: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10), transparent 70%);">
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">The one rule that keeps you in control</span>
        <h2 class="font-display text-3xl md:text-5xl leading-tight text-text">
          It runs when <span class="italic text-gold">you say so</span>. Not a second before.
        </h2>
        <p class="text-text text-lg md:text-xl leading-relaxed max-w-[760px] mx-auto">
          This is not an autonomous agent loose in your accounts. It is <strong class="text-gold">prompted</strong> — you send the trigger, it does the job, then it waits. Nothing fires on its own. It never spends a cent without your tap, and it answers only to your phone. It is your assistant when you need it — silent the rest of the time.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span class="font-mono text-xs uppercase tracking-wide text-gold bg-base/40 border border-gold-line rounded-full px-4 py-1.5">You trigger it</span>
          <span class="font-mono text-xs uppercase tracking-wide text-gold bg-base/40 border border-gold-line rounded-full px-4 py-1.5">It acts</span>
          <span class="font-mono text-xs uppercase tracking-wide text-gold bg-base/40 border border-gold-line rounded-full px-4 py-1.5">It waits</span>
        </div>
      </div>
    </div>
  </section>

  <!-- BEAT 1 — THE CORE -->
  <section class="relative pt-20 md:pt-28 px-6 max-w-[900px] mx-auto reveal text-center">
    <span class="font-mono text-xs uppercase tracking-[0.45em] text-muted">VanguardOS introduces</span>
    <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text mt-4">
      The <span class="italic text-gold">60-Minute AI&nbsp;Assistant</span>.
    </h2>
    <p class="text-text text-lg md:text-xl mt-5 max-w-[640px] mx-auto leading-relaxed">
      Where it starts. Five jobs off your plate, a live Command Center, and your money rendered beautifully — for <strong class="text-gold">$49, once</strong>.
    </p>
  </section>

  <!-- EDITORIAL OPENER -->
  <section id="painkillers" class="relative py-14 md:py-20 px-6 max-w-[1180px] mx-auto reveal">
    <div class="flex items-center gap-4 mb-12 md:mb-16">
      <div class="h-px flex-1 bg-gold-line"></div>
      <span class="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold whitespace-nowrap">The Five Painkillers + the Command Center</span>
      <div class="h-px flex-1 bg-gold-line"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
      <div class="md:col-span-7">
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">
          Six jobs off your plate <span class="italic text-gold">the moment you ask</span>.
        </h2>
      </div>
      <div class="md:col-span-5 md:pl-6 md:border-l border-gold-line">
        <p class="text-text text-lg md:text-xl leading-relaxed">
          Each one is a copy-paste skill with a single trigger. You text it, it returns finished work. Install once, use forever. Read the texts below — this is exactly what it looks like on your phone.
        </p>
        <p class="font-mono text-sm uppercase tracking-widest text-muted mt-6 pt-6 border-t border-line">
          06 skills · ~60 min total install · $0/mo to run
        </p>
      </div>
    </div>
  </section>

  <!-- THE SIX EDITORIAL SPREADS -->
  {#each painkillers as p, i}
    <section data-section-index={i} class="relative px-6 py-20 md:py-28 lg:py-32 border-t border-line/60 overflow-hidden" class:bg-base-2={i % 2 === 1}>
      <div class="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <div class="lg:col-span-6 reveal {i % 2 === 0 ? 'lg:order-1' : 'lg:order-2'} space-y-7">
          <div class="flex items-center gap-3">
            <span class="font-mono text-[10px] uppercase tracking-[0.4em] text-gold">N° {p.num}</span>
            <span class="h-px w-12 bg-gold-line"></span>
            <span class="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-2">{p.kicker}</span>
          </div>
          <h3 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">
            {p.title}{#if p.flagship}<span class="text-gold">.</span>{/if}
          </h3>
          <p class="font-display italic text-2xl md:text-3xl text-text/90 leading-snug">{p.lede}</p>
          <p class="text-text text-lg md:text-xl leading-relaxed max-w-[540px]">{p.body}</p>
          <div class="inline-flex items-center gap-3 pt-2">
            <span class="font-mono text-[10px] uppercase tracking-widest text-muted-2">Your trigger</span>
            <span class="font-mono text-xs uppercase tracking-wide text-gold bg-gold-soft border border-gold-line rounded-full px-4 py-1.5">{p.trigger}</span>
          </div>
          {#if p.flagship}
            <div class="pt-2">
              <a href="#command" class="inline-flex items-center gap-2 text-gold font-mono text-xs uppercase tracking-widest border-b border-gold-line hover:border-gold pb-0.5 transition">See the screen it builds ↓</a>
            </div>
          {/if}
        </div>

        <div class="lg:col-span-6 reveal {i % 2 === 0 ? 'lg:order-2' : 'lg:order-1'} flex justify-center">
          <div class="phone-shell">
            <div class="phone-notch"></div>
            <div class="phone-screen chat-window">
              <div class="status-bar">
                <span class="font-mono">{p.time}</span>
                <div class="status-icons"><span>•</span><span>•</span><span>•</span></div>
              </div>
              <div class="chat-header">
                <button class="back" aria-label="Back">‹</button>
                <div class="avatar"><img src="/brand/brand-mark-owl.svg" alt="VanguardOS" /></div>
                <div class="who">
                  <div class="who-name"><span class="text-text">Vanguard</span><span class="italic text-gold">OS</span></div>
                  <div class="who-status">online</div>
                </div>
              </div>
              <div class="chat-body">
                {#each p.messages as msg}
                  <div class="bubble {msg.from}" style="opacity: 0">{msg.text}</div>
                {/each}
              </div>
              <div class="chat-input">
                <span class="input-placeholder">Message</span>
                <span class="input-mic">🎙</span>
              </div>
            </div>
            <div class="phone-glow"></div>
          </div>
        </div>
      </div>
    </section>
  {/each}

  <!-- COMMAND CENTER SHOWCASE -->
  <section id="command" class="relative px-6 py-24 md:py-32 border-t border-line/60 overflow-hidden"
    style="background-image: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.08), transparent 60%);">
    <div class="max-w-[1180px] mx-auto">
      <header class="text-center mb-12 md:mb-16 reveal">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">The Payoff</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text max-w-[900px] mx-auto">
          One text. Your <span class="italic text-gold">entire day</span>, on one screen.
        </h2>
        <p class="text-text text-lg md:text-xl mt-6 max-w-[740px] mx-auto leading-relaxed">
          Text <span class="text-gold font-mono">"morning briefing"</span> and the Command Center builds itself — live, from your real data. This is the exact screen that opens in your browser. Your assistant even tells you where it saved it.
        </p>
      </header>

      <!-- The bot pointer + the dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <!-- Pointer chat -->
        <div class="lg:col-span-4 reveal">
          <div class="rounded-[2rem] border border-line bg-surface/70 p-5 space-y-3">
            <div class="flex items-center gap-2 pb-2 border-b border-line">
              <div class="avatar-sm"><img src="/brand/brand-mark-owl.svg" alt="VanguardOS" /></div>
              <span class="font-display text-sm"><span class="text-text">Vanguard</span><span class="italic text-gold">OS</span></span>
              <span class="who-status ml-auto">online</span>
            </div>
            <div class="cc-bubble user">morning briefing</div>
            <div class="cc-bubble bot">🧭 Command Center open — 3 urgent, next flight Thu, $2,940 spent this month.</div>
            <div class="cc-bubble bot">It's live in your browser now. 👉</div>
            <div class="cc-bubble bot">Saved as <strong>Command-Center.html</strong> in your <strong>Documents → AI-Assistant</strong> folder. Double-click to reopen it anytime.</div>
          </div>
        </div>

        <!-- The dashboard the customer sees -->
        <div class="lg:col-span-8 reveal">
          <div class="dash">
            <div class="dash-top">
              <div class="flex items-center gap-2">
                <img src="/brand/brand-mark-owl.svg" alt="" class="w-5 h-5" />
                <span class="font-display text-sm">Command Center</span>
              </div>
              <span class="font-mono text-[10px] uppercase tracking-widest text-muted">Jun 2026</span>
            </div>

            <!-- four status cards -->
            <div class="dash-cards">
              <div class="dash-card">
                <div class="dc-head"><span>🔴 Urgent Inbox</span><span class="dc-num">3</span></div>
                <p class="dc-sub">Sarah · contract 5PM — Board · Q3 deck — IRS · Fri. All drafted.</p>
              </div>
              <div class="dash-card">
                <div class="dc-head"><span>💰 Money</span><span class="dc-num">$2,940</span></div>
                <p class="dc-sub">This month · $17,280 YTD · top: Travel, Meals, Software</p>
              </div>
              <div class="dash-card">
                <div class="dc-head"><span>✈ Travel</span><span class="dc-num">DL 1422</span></div>
                <p class="dc-sub">Thu · JFK → SFO · check-in handled · seat 4C</p>
              </div>
              <div class="dash-card">
                <div class="dc-head"><span>✍ Content</span><span class="dc-num">2</span></div>
                <p class="dc-sub">LinkedIn post + newsletter · waiting for your review</p>
              </div>
            </div>

            <!-- Living money dashboard: donut + bars -->
            <div class="dash-money">
              <div class="dm-title">
                <span class="font-display text-base text-text">Living Money Dashboard</span>
                <span class="font-mono text-[10px] uppercase tracking-widest text-muted">Built from your real receipts</span>
              </div>
              <div class="dm-grid">
                <!-- Donut -->
                <div class="dm-donut">
                  <svg viewBox="0 0 200 200" width="170" height="170" role="img" aria-label="Spending by category donut chart">
                    <g transform="rotate(-90 100 100)" fill="none" stroke-width="26">
                      {#each categories as c}
                        <circle cx="100" cy="100" r="80" stroke={c.color}
                          stroke-dasharray="{c.len} {502.65 - c.len}" stroke-dashoffset={c.off} />
                      {/each}
                    </g>
                    <text x="100" y="94" text-anchor="middle" fill="#ECEAE4" font-family="JetBrains Mono, monospace" font-size="26">$17,280</text>
                    <text x="100" y="116" text-anchor="middle" fill="#A6A6A1" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.5">YTD SPEND</text>
                  </svg>
                  <ul class="dm-legend">
                    {#each categories as c}
                      <li><span class="dot" style="background:{c.color}"></span>{c.name}<em>${c.amt.toLocaleString()}</em></li>
                    {/each}
                  </ul>
                </div>
                <!-- Bars + vendors -->
                <div class="dm-right">
                  <div class="dm-bars" aria-label="Spending by month">
                    {#each months as mo}
                      <div class="bar-col">
                        <div class="bar" style="height: {Math.round((mo.v / maxMonth) * 100)}%"></div>
                        <span class="bar-label">{mo.m}</span>
                      </div>
                    {/each}
                  </div>
                  <div class="dm-vendors">
                    <span class="dv-title">Top vendors</span>
                    <div class="dv-row"><span>Delta Air Lines</span><em>$2,180</em></div>
                    <div class="dv-row"><span>Marriott</span><em>$1,640</em></div>
                    <div class="dv-row"><span>Adobe Cloud</span><em>$1,290</em></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Regenerate-on-trigger demo -->
      <div class="cc-demo reveal" data-cc-demo>
        <div class="cc-demo-flow">
          <div class="cc-demo-bubble user" data-cc="b1">update my dashboard</div>
          <div class="cc-demo-bubble bot" data-cc="b2">On it — pulling this month's receipts and rebuilding the screen above. ↑</div>
        </div>
        <div class="cc-demo-save" data-cc="save">
          <span class="cc-file-chip" data-cc="chip">
            <span class="cc-file-ic">📄</span> Command-Center.html
          </span>
          <span class="cc-demo-caption">Saved to your <strong>Documents → AI-Assistant</strong> folder — double-click to reopen anytime.</span>
        </div>
      </div>

      <div class="text-center mt-12 reveal">
        <a href={GUMROAD.bundle} class="btn-primary inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-[2rem]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Get the Bundle — $79 →
        </a>
        <p class="text-sm font-mono uppercase tracking-widest text-muted mt-4">Read-only · it never acts, sends, or spends — it only shows you what's already done</p>
      </div>
    </div>
  </section>

  <!-- BEAT 2 — THE UPGRADE -->
  <section id="upgrade-showcase" class="relative px-6 py-24 md:py-32 border-t border-line/60 overflow-hidden"
    style="background-image: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.07), transparent 60%);">
    <div class="max-w-[1180px] mx-auto">
      <header class="text-center mb-12 md:mb-16 reveal max-w-[780px] mx-auto">
        <span class="font-mono text-xs uppercase tracking-[0.45em] text-muted">And the next step</span>
        <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text mt-4">
          The <span class="italic text-gold">Chief of Staff</span> Upgrade.
        </h2>
        <p class="text-text text-lg md:text-xl mt-5 leading-relaxed">
          The same assistant — fully staffed. Your five skills become <strong class="text-gold">thirty</strong>, organized into six departments. Includes <strong class="text-gold">The Toolbox</strong> — the skill that builds new skills just by talking. You stop texting one helper and start running a back office from your pocket.
        </p>
        <div class="inline-flex flex-wrap items-center justify-center gap-3 mt-6 font-mono text-sm uppercase tracking-widest">
          <span class="text-muted">5 skills</span>
          <span class="text-gold">→</span>
          <span class="text-gold bg-gold-soft border border-gold-line rounded-full px-4 py-1.5">30 skills · 6 departments · Toolbox</span>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 reveal">
        {#each [
          ['📥', 'Inbox & Comms', 'Meeting recaps, follow-up nudges, polite-no replies, contact context before a call.'],
          ['💼', 'Money & Ops', 'Invoice drafting, recurring-bill watch, quote generators, refund-claim chasers.'],
          ['🧭', 'Travel & Logistics', 'Full itinerary builder, packing lists, OOO drafts, restaurant recon.'],
          ['🏡', 'Family Ops', 'Appointment juggler, school-form watcher, gift-idea bench, meal-plan pings.'],
          ['📣', 'Brand & Content', 'Repurpose mode — one video into 5 platforms — idea log, content calendar.'],
          ['🧠', 'Personal Intelligence', 'Daily summary, weekly review, and a big-decision worksheet.']
        ] as dept}
          <div class="rounded-[1.5rem] border border-line bg-surface/60 p-6 hover:border-gold-line transition">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl leading-none">{dept[0]}</span>
              <h3 class="font-display text-xl md:text-2xl text-text">{dept[1]}</h3>
            </div>
            <p class="text-base text-text/85 leading-relaxed">{dept[2]}</p>
          </div>
        {/each}
      </div>

      <div class="flex flex-col items-center gap-4 mt-12 reveal">
        <div class="flex items-baseline gap-3">
          <span class="font-mono text-base line-through text-gold-line">$264 value</span>
          <span class="font-display text-5xl text-gold">$79</span>
          <span class="font-mono text-sm uppercase tracking-widest text-muted">standalone</span>
        </div>
        <a href={GUMROAD.upgrade} on:click={(e) => openUpsell('upgrade', e)} class="btn-secondary inline-flex items-center justify-center gap-2 px-10 py-5 rounded-[2rem]">
          See the Upgrade — $79 →
        </a>
        <p class="text-sm font-mono uppercase tracking-widest text-muted text-center">Includes The Toolbox · Always-On Kit · Family Multiplier License</p>
      </div>
    </div>
  </section>

  <!-- BEAT 3 — THE BUNDLE REVEAL -->
  <section id="bundle-reveal" class="relative px-6 pt-24 md:pt-32 max-w-[1180px] mx-auto reveal">
    <div class="text-center max-w-[820px] mx-auto">
      <span class="font-mono text-xs uppercase tracking-[0.45em] text-muted">For the same price as the upgrade alone</span>
      <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text mt-4">
        The <span class="italic text-gold">Orchestrator Bundle</span>.
      </h2>
      <p class="text-text text-lg md:text-xl mt-5 leading-relaxed">
        Here's the part that ends the debate. The Bundle is <strong class="text-gold">$79</strong> — the exact same price as the Upgrade alone. The Bundle just adds the full <strong class="text-gold">60-Minute AI Assistant Playbook</strong> on top: the 5 painkiller skills, the Command Center, the Living Money Dashboard, and the Privacy Lock. Same $79 — the Playbook is the free add.
      </p>
      <p class="font-display italic text-2xl md:text-3xl text-gold mt-6">Same $79. One gets you 30 skills. The other gets you the same 30 skills <em>and</em> the Playbook that taught the first five.</p>
    </div>

    <!-- Bundle hero banner -->
    <div class="mt-12 md:mt-16 relative rounded-[2.5rem] overflow-hidden border-2 border-gold shadow-2xl shadow-gold/20"
      style="box-shadow: 0 0 0 1px rgba(212,175,55,0.34), 0 30px 80px -20px rgba(212,175,55,0.30), 0 8px 32px -8px rgba(0,0,0,0.6);">
      <span class="absolute top-4 left-4 md:top-6 md:left-6 z-10 bundle-best-badge">★ Best Value</span>
      <img src="/products/bundle-banner.webp" alt="The Orchestrator Bundle — everything in one stack" class="w-full block" width="1800" height="1005" loading="lazy" decoding="async" />
    </div>
  </section>

  <!-- VALUE STACK + COMPARISON + GUARANTEE -->
  <section class="px-6 pt-12 pb-12 md:pt-16 md:pb-16">
    <div class="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 reveal">
      <!-- Inclusions checklist -->
      <div class="rounded-[2rem] border-2 border-gold bg-gold-soft/20 p-8 md:p-10 relative"
        style="background-image: radial-gradient(ellipse at 0% 0%, rgba(212,175,55,0.10), transparent 60%);">
        <span class="font-mono text-xs uppercase tracking-[0.3em] text-gold">★ Everything Included</span>
        <h3 class="font-display text-3xl md:text-4xl text-text mt-3 mb-6 leading-tight">What's inside the Bundle</h3>
        <ul class="space-y-3.5">
          {#each [
            ['The 60-Minute AI Assistant Playbook', '$97'],
            ['5 painkiller skills + the Command Center', '$214'],
            ['25-skill Chief of Staff Upgrade', '$97'],
            ['★ The Toolbox — build new skills by talking', '$147'],
            ['Privacy Lock + Cheat Sheet + Troubleshooting', '$46'],
            ['Family Multiplier License + Always-On Kit', '$140']
          ] as row}
            <li class="flex items-baseline justify-between gap-4 border-b border-gold-line/40 pb-3">
              <span class="flex items-baseline gap-2.5 text-text text-base md:text-[17px]">
                <span class="text-gold flex-shrink-0">✓</span>
                <span>{row[0]}</span>
              </span>
              <span class="font-mono text-base text-gold-line line-through whitespace-nowrap">{row[1]}</span>
            </li>
          {/each}
        </ul>
        <!-- Value math callout -->
        <div class="mt-7 rounded-2xl border border-gold-line bg-base/40 p-5">
          <div class="flex items-baseline justify-between">
            <span class="font-mono text-sm uppercase tracking-widest text-muted">Stacked value</span>
            <span class="font-display text-3xl text-gold-line line-through">$821</span>
          </div>
          <div class="flex items-baseline justify-between mt-2 pt-2 border-t border-gold-line/30">
            <span class="font-mono text-sm uppercase tracking-widest text-text">Today, one payment</span>
            <span class="font-display text-6xl text-gold">$79</span>
          </div>
        </div>
        <a href={GUMROAD.bundle} class="btn-primary flex items-center justify-center gap-2.5 mt-6 py-5 rounded-[2rem]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Get the Bundle — $79 →
        </a>
        <p class="text-sm font-mono uppercase tracking-widest text-muted mt-3 text-center">One payment. No subscription. Ever.</p>
      </div>

      <!-- "What you miss" callout + guarantee -->
      <div class="flex flex-col gap-6">
        <div class="rounded-[2rem] border border-line bg-surface/60 p-8 md:p-10">
          <span class="font-mono text-xs uppercase tracking-[0.3em] text-muted">If you pick differently</span>
          <h3 class="font-display text-2xl md:text-3xl text-text mt-3 mb-5 leading-tight">What you miss by skipping the Bundle</h3>
          <ul class="space-y-3 text-base md:text-[17px]">
            <li class="flex items-start gap-3 text-text">
              <span class="text-muted-2 mt-0.5">✗</span>
              <span><strong class="text-text">Core only ($49):</strong> no Toolbox, no 25 extra skills, no Family License, no Always-On Kit.</span>
            </li>
            <li class="flex items-start gap-3 text-text">
              <span class="text-muted-2 mt-0.5">✗</span>
              <span><strong class="text-text">Upgrade only ($79):</strong> no Playbook, no Command Center, no Living Money Dashboard — you need the Playbook to run it.</span>
            </li>
            <li class="flex items-start gap-3 text-text">
              <span class="text-gold mt-0.5">✓</span>
              <span><strong class="text-gold">Bundle ($79):</strong> same $79, everything in. The arithmetic is not subtle.</span>
            </li>
          </ul>
        </div>
        <div class="rounded-[2rem] border border-gold-line bg-gold-soft/30 p-8 md:p-10 flex flex-col justify-center">
          <span class="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">The Promise</span>
          <h3 class="font-display text-2xl md:text-3xl text-text mb-4 leading-tight">Set it up, then decide.<br/>30 days.</h3>
          <p class="text-text text-base md:text-[17px] leading-relaxed">
            Buy it, follow the 60-minute setup, and live with your assistant for 30 days. If it doesn't save you more time than it cost — email us and we'll refund every cent, no questions, no hoops.
          </p>
          <p class="text-text text-base md:text-[17px] leading-relaxed mt-4">
            And if you get stuck installing it, tell us the step. We'd rather you have a working assistant than your money back.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- COMPARISON GRID -->
  <section class="px-6 py-16 md:py-24">
    <div class="max-w-[1100px] mx-auto reveal">
      <header class="text-center mb-10">
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="h-px w-16 bg-gold-line"></div>
          <span class="font-mono text-xs uppercase tracking-[0.3em] text-gold">Side By Side</span>
          <div class="h-px w-16 bg-gold-line"></div>
        </div>
        <h2 class="font-display text-3xl md:text-5xl text-text leading-tight">Exactly what each product includes.</h2>
      </header>
      <div class="overflow-x-auto rounded-[1.5rem] border border-line">
        <table class="cmp-table">
          <thead>
            <tr>
              <th class="cmp-feat">What's included</th>
              <th>Core — $49</th>
              <th>Upgrade — $79</th>
              <th class="cmp-best">Bundle — $79 <span class="cmp-best-pill">★ BEST</span></th>
            </tr>
          </thead>
          <tbody>
            {#each [
              ['8-chapter Playbook',          true,  false, true],
              ['5 painkiller skills + Command Center', true, false, true],
              ['25-skill Chief of Staff Upgrade (30 total)', false, true, true],
              ['★ The Toolbox — builds new skills by talking', false, true, true],
              ['Always-On Kit + Family Multiplier License', false, true, true],
              ['Privacy Lock + Cheat Sheet + Troubleshooting', true, false, true]
            ] as row}
              <tr>
                <td class="cmp-feat">{row[0]}</td>
                <td>{#if row[1]}<span class="cmp-yes">✓</span>{:else}<span class="cmp-no">✗</span>{/if}</td>
                <td>{#if row[2]}<span class="cmp-yes">✓</span>{:else}<span class="cmp-no">✗</span>{/if}</td>
                <td class="cmp-best">{#if row[3]}<span class="cmp-yes">✓</span>{:else}<span class="cmp-no">✗</span>{/if}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="text-center text-sm font-mono uppercase tracking-widest text-muted mt-6">
        Same $79 as the Upgrade alone — the Bundle adds the Playbook, Command Center & Living Money Dashboard.
      </p>
    </div>
  </section>

  <!-- CATALOG -->
  <section id="catalog" class="py-20 md:py-28 px-6 max-w-[1180px] mx-auto border-t border-line/60">
    <header class="text-center mb-6 reveal">
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="h-px w-16 bg-gold-line"></div>
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">Choose Your Vanguard</span>
        <div class="h-px w-16 bg-gold-line"></div>
      </div>
      <h2 class="font-display text-4xl md:text-6xl text-text">Same price. Very different stacks.</h2>
      <p class="text-text text-lg md:text-xl mt-6 max-w-[720px] mx-auto leading-relaxed">You've seen what it does. Now pick the one that's actually the deal — the Bundle is the same $79 as the standalone Upgrade, and includes everything.</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {#each products as p}
        <div class="reveal relative bg-surface border-2 rounded-[2rem] p-6 md:p-8 space-y-4 transition {p.featured ? 'border-gold lg:-translate-y-4 shadow-2xl shadow-gold/20' : 'border-line'}">
          {#if p.featured}<div class="absolute -top-4 left-6 bg-gold text-base-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest font-black shadow-lg shadow-gold/30">★ Best Value</div>{/if}
          <img src={p.src} alt={p.name} class="w-full aspect-square object-cover rounded-[1.5rem]" width="900" height="900" loading="lazy" decoding="async" />
          <h3 class="font-display text-2xl md:text-3xl text-text">{p.name}</h3>
          <p class="text-base text-text/85 leading-snug">{p.caption}</p>
          <div class="pt-1">
            <span class="font-mono text-xs uppercase tracking-[0.25em] text-gold">Includes</span>
            <ul class="mt-3 space-y-2.5">
              {#each p.includes as item}
                <li class="flex items-start gap-2.5 text-[15px] leading-snug text-text">
                  <span class="text-gold mt-0.5 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="flex items-baseline gap-3 pt-3">
            <span class="font-mono text-base line-through text-gold-line">{p.retail}</span>
            <span class="font-display text-5xl text-gold">{p.price}</span>
          </div>
          {#if p.key === 'core'}
            <a href={ctaHref(p.key)} on:click={(e) => openUpsell('core', e)} class="btn-secondary flex items-center justify-center gap-2 py-4 rounded-full">
              <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
              {p.cta} →
            </a>
          {:else if p.featured}
            <a href={ctaHref(p.key)} class="btn-primary flex items-center justify-center gap-2 py-4 rounded-full">
              <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
              {p.cta} — $79 →
            </a>
          {:else}
            <a href={ctaHref(p.key)} on:click={(e) => openUpsell('upgrade', e)} class="btn-secondary flex items-center justify-center gap-2 py-4 rounded-full">
              <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
              {p.cta} — $79 →
            </a>
          {/if}
        </div>
      {/each}
    </div>
    <p class="text-center text-base text-text/85 mt-12 max-w-[720px] mx-auto leading-relaxed reveal">
      Powered by your <strong style="color:#D4AF37">Claude</strong> plan. A free Claude account works to start; a basic monthly plan unlocks the full setup. We charge nothing on top — ever.
    </p>
  </section>
  {/if}
  <!-- ═══════════════════════════════════════════════════════════════
       END LEGACY BLOCK
       ═══════════════════════════════════════════════════════════════ -->

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
        <p class="text-text text-lg md:text-xl mt-6 max-w-[760px] mx-auto leading-relaxed">
          The entire Launchpad is fully translated, not machine-skimmed. Every page of the 5-day guide, all six bonuses, the Notion Operations OS, and the Website System build file ship in your language. Same download, same $129, no add-on. Choose your language and build in it.
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
        Fully translated · Same price · One download
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
  <section class="px-6 py-24 md:py-32 border-t border-line/60 text-center overflow-hidden"
    style="background-image: radial-gradient(ellipse at 50% 120%, rgba(212,175,55,0.12), transparent 60%);">
    <div class="max-w-[820px] mx-auto reveal space-y-8">
      <img src="/brand/brand-mark-owl.svg" alt="VanguardOS owl mark" class="w-12 h-12 mx-auto" />
      <h2 class="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-text">Five days from now, <span class="italic text-gold">it's live.</span></h2>
      <p class="text-text text-lg md:text-xl max-w-[680px] mx-auto leading-relaxed">
        Brand, assets, landing page, offer, funnel: the five things every solo launch needs, all built with you, all yours forever. The core system plus six bonuses, {'$' + stackValue} of value. <strong class="text-gold">$129, once.</strong>
      </p>


      <div class="flex flex-col items-center gap-4">
        <a href={GUMROAD.launchpad} class="btn-primary inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-[2rem]">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Get The Launchpad · $129 →
        </a>
        <a href="#offer-stack" class="text-sm font-mono uppercase tracking-widest text-muted hover:text-text transition border-b border-gold-line/40 hover:border-gold pb-1">See what's inside ↓</a>
        <p class="text-sm font-mono uppercase tracking-wider text-muted pt-2">30-day guarantee · One payment · Yours forever</p>
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
      <p class="font-display italic text-sm md:text-base" style="color: #D6D4CC;">Systems that launchpad solopreneurs into the digital economy.</p>
    </div>
    <div class="pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="text-[10px] font-mono uppercase tracking-widest" style="color: #B5B5AE;">© 2026 VanguardOS</div>
      <div class="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-mono uppercase tracking-wider" style="color: #B5B5AE;">
        <a href="#offer-stack" class="hover:text-text transition">What's Inside</a>
        <a href="#brand-work" class="hover:text-text transition">Brand Work</a>
        <a href="#five-day" class="hover:text-text transition">5-Day Journey</a>
        <a href="#faq" class="hover:text-text transition">FAQ</a>
        <a href="mailto:support@vanguardos.co" on:click|preventDefault={openContact} class="hover:text-text transition">Contact</a>
      </div>
    </div>
  </div>
</footer>

<!-- PERSISTENT MOBILE CTA — appears once the hero scrolls away; mobile only -->
<div class="sticky-cta md:hidden {showStickyCta ? 'sticky-cta-show' : ''}" aria-hidden={!showStickyCta}>
  <div class="sticky-cta-inner">
    <div class="sticky-cta-copy">
      <span class="sticky-cta-price">$129</span>
      <span class="sticky-cta-sub">One payment · Yours forever</span>
    </div>
    <a href={GUMROAD.launchpad} class="btn-primary sticky-cta-btn flex items-center justify-center gap-2" tabindex={showStickyCta ? 0 : -1}>
      <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      Get The Launchpad →
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
        <span class="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-2">{specimenData.display} × {specimenData.body}</span>
        <div class="rounded-[1rem] border border-line/60 bg-base/30 px-6 py-7 mt-5 space-y-3">
          <p class="text-4xl md:text-5xl text-text leading-tight" style="font-family: {specimenData.fontDisplay}; font-weight: {specimenData.displayWeight}; letter-spacing: -0.02em;">{specimenData.sample}</p>
          <p class="text-base text-text/85 leading-relaxed" style="font-family: {specimenData.fontBody};">Set in {specimenData.body}. Engineered to carry long-form body copy without fatigue while {specimenData.display} does the heavy lifting in headlines.</p>
        </div>
        <p class="text-sm text-muted leading-relaxed mt-5">Display: <span class="text-text/90">{specimenData.display}</span> · Body: <span class="text-text/90">{specimenData.body}</span>. One of 20 type systems inside the pack. Sources: Fontshare + Google Fonts + The League of Moveable Type.</p>
      {/if}

      <a href={GUMROAD.launchpad} class="btn-primary flex items-center justify-center gap-2.5 mt-7 py-4 rounded-[2rem]">
        <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        Get The Launchpad · $129 →
      </a>
    </div>
  </div>
{/if}

<!-- BUNDLE UPSELL MODAL — intercepts non-Bundle CTAs (Core + Upgrade) before Gumroad -->
{#if modalOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="upsell-overlay" on:click={upsellClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="upsell-card" on:click|stopPropagation role="dialog" aria-modal="true" aria-labelledby="upsell-title" tabindex="-1">
      <button class="upsell-x" on:click={upsellClose} aria-label="Close">✕</button>
      <img src="/brand/brand-mark-owl.svg" alt="" class="w-10 h-10 mx-auto mb-4" />

      {#if upsellSource === 'core'}
        <h3 id="upsell-title" class="upsell-headline">Want <em>both</em> products for just $30 more?</h3>
        <p class="upsell-sub">
          You're about to grab the Playbook for <strong>$49</strong>. The Bundle gives you the Playbook <em>and</em> the Chief of Staff Upgrade for <strong>$79</strong> — that's <strong class="upsell-gold">both products for $30 over your current cart</strong>, and $49 less than buying them separately.
        </p>
      {:else}
        <h3 id="upsell-title" class="upsell-headline">Add the 60-Minute AI Assistant Playbook for <em>$0</em> — same price.</h3>
        <p class="upsell-sub">
          You're about to grab the Chief of Staff Upgrade for <strong>$79</strong>. The Bundle is the <strong>same $79</strong> — and includes the 60-Minute AI Assistant Playbook on top. <strong class="upsell-gold">Same price, more product.</strong>
        </p>
      {/if}

      <div class="upsell-stack">
        <span class="upsell-stack-title">What's in the Bundle</span>
        <ul class="upsell-stack-list">
          <li><span class="upsell-check">✓</span><span>The 60-Minute AI Assistant Playbook — 5 painkiller skills, Command Center, Money Dashboard, Privacy Lock</span></li>
          <li><span class="upsell-check">✓</span><span>The Chief of Staff Upgrade — 25-Skill Mega-Vault, Always-On Kit, Family License</span></li>
          <li><span class="upsell-check">✓</span><span>The Toolbox — conversational meta-skill that builds new skills on demand</span></li>
        </ul>
      </div>

      <label class="upsell-optin" class:checked={upsellOptIn}>
        <input type="checkbox" bind:checked={upsellOptIn} />
        <span class="upsell-optin-box" aria-hidden="true">{upsellOptIn ? '✓' : ''}</span>
        <span class="upsell-optin-text">Yes, upgrade me to the Bundle</span>
      </label>

      <div class="upsell-actions">
        <button bind:this={upsellPrimaryBtn} on:click={upsellContinue} class="btn-primary upsell-primary flex items-center justify-center gap-2">
          <svg class="owl-logo-cta" width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 15 L9 24 Q9 31 20 33 Q31 31 31 24 L31 15 Q26 10 20 13 Q14 10 9 15 Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="24.5" cy="19" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="19" r=".7" fill="currentColor"/><circle cx="24.5" cy="19" r=".7" fill="currentColor"/><path d="M20 22 L18 25 L22 25 Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          Continue to Checkout →
        </button>
        <button on:click={upsellDecline} class="upsell-secondary">
          No thanks, just the {upsellSource === 'core' ? 'Playbook' : 'Upgrade'}
        </button>
      </div>
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
  /* === TYPOGRAPHY PACK SPECIMEN FONTS ===
     Loads the actual display + body faces used by the three featured schemes
     so the preview cards render in the real typeface, not a fallback. The
     three are picked for body-font variety: sans (Satoshi), serif (Source
     Serif 4), mono (Geist Mono). Sources: Google Fonts (Fraunces, Source
     Serif 4, Geist, Geist Mono) + Fontshare (Clash Display, Satoshi). All
     licenses verified in the pack. */
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Source+Serif+4:ital,wght@0,400;1,400&family=Geist:wght@500;600&family=Geist+Mono:wght@400;500&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600&f[]=satoshi@400,500&display=swap');

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
  .input-placeholder { color: #8C8C86; font-family: 'Alegreya', serif; }
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
    letter-spacing: -0.01em;
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
  .sticky-cta-btn { flex: 1; text-align: center; padding: 14px 18px; border-radius: 2rem; white-space: nowrap; }

  @media (prefers-reduced-motion: reduce) {
    .avatar-card, .day-card, .specimen-row, .day-img, .five-day-dot, .five-day-rail-fill { transition: none; }
    .avatar-card:hover, .day-card:hover, .specimen-row:hover, :global(.day-card.is-active-card) { transform: none; }
    .day-card:hover .day-img, :global(.day-card.is-active-card) .day-img { transform: none; }
    .day-card:hover .day-kicker, :global(.day-card.is-active-card) .day-kicker { text-shadow: none; }
    .promise-panel { animation: none; }
    .specimen-card { animation: none; }
    .sticky-cta { transition: none; }
  }
</style>
