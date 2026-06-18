/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Midnight Vanguard canonical (mirrors VanguardOS v1 tailwind.config.js)
        base:        '#111212',
        'base-2':    '#0A0B0B',
        surface:     '#1C1D1F',
        'surface-hi':'#26282B',
        text:        '#ECEAE4',
        muted:       '#ADADA7',
        'muted-2':   '#8F8F88',
        gold:        '#D4AF37',
        'gold-hi':   '#E7C66A',
        'gold-soft': 'rgba(212, 175, 55, 0.13)',
        'gold-line': 'rgba(212, 175, 55, 0.34)',
        line:        'rgba(236, 234, 228, 0.10)',
        'line-hi':   'rgba(236, 234, 228, 0.18)',
      },
      fontFamily: {
        display: ['JetBrains Mono Numbers', 'Playfair Display', 'Georgia', 'serif'],
        sans:    ['JetBrains Mono Numbers', 'Alegreya', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
