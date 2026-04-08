import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.pw.ts",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"], ["html"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      E2E_TEST_MODE: "true",
      NEXT_PUBLIC_E2E_TEST_MODE: "true",
      NEXT_TELEMETRY_DISABLED: "1",
      AUTH0_DOMAIN: "example.auth0.com",
      AUTH0_CLIENT_ID: "playwright-client-id",
      AUTH0_CLIENT_SECRET: "playwright-client-secret",
      AUTH0_SECRET: "playwright-test-secret-playwright-test-secret-123456",
      AUTH0_AUDIENCE: "https://empora.test/api",
      APP_BASE_URL: baseURL,
    },
  },
});
