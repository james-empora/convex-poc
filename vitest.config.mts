import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Integration tests talk to a real database — give them time
    testTimeout: 15_000,
    hookTimeout: 30_000,
    setupFiles: ["./vitest.setup.ts"],
  },
});
