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

const PREVIEW_URL = 'http://localhost:5175';

// The eight viewports the brief requires. Each spec parametrizes over these.
export const VIEWPORTS = [
  { name: '320x568',   width: 320,  height: 568 },
  { name: '360x800',   width: 360,  height: 800 },
  { name: '390x844',   width: 390,  height: 844 },
  { name: '430x932',   width: 430,  height: 932 },
  { name: '768x1024',  width: 768,  height: 1024 },
  { name: '1024x768',  width: 1024, height: 768 },
  { name: '1280x800',  width: 1280, height: 800 },
  { name: '1440x900',  width: 1440, height: 900 },
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
    command: 'npm run build && npm run preview',
    url: PREVIEW_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
