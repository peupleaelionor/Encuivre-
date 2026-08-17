import type { Config } from "drizzle-kit";

/** drizzle-kit config — generates SQL migrations from lib/db/schema.ts. */
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
} satisfies Config;
