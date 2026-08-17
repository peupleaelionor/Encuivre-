/**
 * Seed summary script — `npm run seed`.
 *
 * Initializes the database (PGlite by default, or DATABASE_URL if set), applies
 * migrations, seeds it if empty, and prints a CEO-style summary read back FROM
 * THE DATABASE so you can confirm the persisted dataset is coherent.
 */

import { ceoKpis, todayActions, scoredOpenDeals } from "../lib/dashboard";
import { repo } from "../lib/store";

async function main() {
  const now = new Date();

  const [companies, sellOffers, buyRequests, deals] = await Promise.all([
    repo.companies(),
    repo.sellOffers(),
    repo.buyRequests(),
    repo.deals(),
  ]);

  console.log("=== EN CUIVRE OS — seed summary (from database) ===\n");
  console.log(
    `Sociétés: ${companies.length} · Offres: ${sellOffers.length} · Demandes: ${buyRequests.length} · Deals: ${deals.length}\n`,
  );

  console.log("KPIs CEO:");
  for (const k of await ceoKpis(now)) {
    console.log(`  - ${k.label}: ${k.value}${k.hint ? ` (${k.hint})` : ""}`);
  }

  console.log("\nÀ faire aujourd'hui:");
  for (const a of await todayActions(now)) {
    console.log(`  - ${a.title} — ${a.company} — ${a.potentialValue} — ${a.deadline}`);
  }

  console.log("\nTop deals (priorité):");
  for (const d of (await scoredOpenDeals(now)).slice(0, 5)) {
    console.log(`  - [${d.priorityScore} ${d.priorityLevel}] ${d.title}`);
  }

  console.log("\nSeed OK.");
}

main().then(() => process.exit(0));
