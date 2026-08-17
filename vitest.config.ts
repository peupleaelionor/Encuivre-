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
    // Hermetic DB: force PGlite in-memory (no external Postgres, no DATABASE_URL).
    env: {
      DATABASE_URL: "",
      ENCUIVRE_DB_PATH: ":memory:",
    },
  },
});
