import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Hermetic, file-less database for tests.
    env: {
      ENCUIVRE_DB_PATH: ":memory:",
    },
  },
});
