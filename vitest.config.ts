import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Vercel build machines are slower than dev laptops, and the in-memory Postgres
    // (PGlite) finance suites share the CPU with the rest of the run; 5s was too tight.
    testTimeout: 30_000,
  },
});
