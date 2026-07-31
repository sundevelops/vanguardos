// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Landing-page QA gate for the VanguardOS Launchpad page.
 *
 * `npm run qa:landing` (which runs `playwright test` against this config)
 * builds the app, boots the local preview, runs the focused landing-page
 * audit in qa/landing.spec.js at every required viewport under both normal
 * and reduced motion, and exits non-zero if any check fails.
 *
 * The webServer block is what satisfies the brief's "build the app, start the
 * local preview, run the checks" requirement in a single command: Playwright
 * runs `npm run build && npm run preview`, waits for the preview URL, then
 * executes the tests. If the build or any assertion fails, the process exits
 * non-zero.
 */

const PREVIEW_URL = 'http://127.0.0.1:5187';

// The eight viewports the brief requires. Each spec parametrizes over these.
export const VIEWPORTS = [
  { name: '320x568',   width: 320,  height: 568 },
  { name: '360x800',   width: 360,  height: 800 },
  { name: '375x667',   width: 375,  height: 667 },
  { name: '390x844',   width: 390,  height: 844 },
  { name: '393x852',   width: 393,  height: 852 },
  { name: '412x915',   width: 412,  height: 915 },
  { name: '430x932',   width: 430,  height: 932 },
  { name: '768x1024',  width: 768,  height: 1024 },
  { name: '820x1180',  width: 820,  height: 1180 },
  { name: '912x1368',  width: 912,  height: 1368 },
  { name: '1024x768',  width: 1024, height: 768 },
  { name: '1280x800',  width: 1280, height: 800 },
  { name: '1366x768',  width: 1366, height: 768 },
  { name: '1440x900',  width: 1440, height: 900 },
  { name: '1536x864',  width: 1536, height: 864 },
];

export default defineConfig({
  testDir: './qa',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  outputDir: './qa/.artifacts',
  use: {
    baseURL: PREVIEW_URL,
    // Fail loudly on bad TLS etc.; we're local so keep defaults otherwise.
    trace: 'retain-on-failure',
  },
  // Run the whole audit twice: once with normal motion, once with reduced
  // motion (brief QA gate #12). Screenshots are captured only in the
  // normal-motion project to avoid duplicate artifacts.
  projects: [
    {
      name: 'motion',
      use: { ...devices['Desktop Chrome'], reducedMotion: 'no-preference' },
    },
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 5187',
    url: PREVIEW_URL,
    reuseExistingServer: false,
    timeout: 240 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
