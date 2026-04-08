/**
 * Vitest global setup — runs before every test file.
 *
 * Sets minimal environment variables so that `@/env` (t3-oss/env-nextjs)
 * validates during tests.
 */

process.env.AUTH0_DOMAIN ??= "test.auth0.com";
process.env.AUTH0_CLIENT_ID ??= "test-client-id";
process.env.AUTH0_CLIENT_SECRET ??= "test-client-secret";
process.env.AUTH0_SECRET ??= "test-secret-at-least-32-characters-long!!";
process.env.AUTH0_AUDIENCE ??= "https://test.api.empora.com";
