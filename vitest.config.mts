import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup-env.ts"],
    // The smoke test boots a real `next dev` server; the first request
    // compiles the route, which is slow on cold caches.
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
