import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    // E2E_BASE_URL decides the target. Default is the LOCAL dev stack
    // (docker-compose.dev.yml + `npm run dev` in frontend on :5174) so a
    // plain `npx playwright test` from a dev checkout never hits production.
    // Run against prod explicitly: E2E_BASE_URL=https://hushroom.io npx playwright test
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5174',
    ignoreHTTPSErrors: true,
    // Sprint 18.2 — fake media devices so WebRTC tests can publish/subscribe
    // without prompting for camera/mic permissions. `--use-fake-ui-for-media-stream`
    // auto-allows getUserMedia; `--use-fake-device-for-media-stream` swaps in
    // synthetic audio/video tracks.
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
