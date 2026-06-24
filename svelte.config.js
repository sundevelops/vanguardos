import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    prerender: {
      // Single-route site: render '/' only, don't crawl hrefs.
      // (Crawling chokes on the bracketed Gumroad placeholder URLs.)
      crawl: false,
      entries: ['/'],
    },
  },
};
