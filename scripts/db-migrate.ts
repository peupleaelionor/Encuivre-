/**
 * Applies migrations to the configured database (DATABASE_URL, or PGlite).
 * Intended as a deploy step: `npm run db:migrate`. Seeding runs only when
 * ENCUIVRE_SEED="true" for a real Postgres (see lib/db/client.ts).
 */

import { getDb } from "../lib/db/client";

async function main() {
  await getDb(); // triggers migration (+ seed when enabled)
  console.log("Migrations applied.");
}

main().then(() => process.exit(0));
