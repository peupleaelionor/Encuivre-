/**
 * Seed summary script — `npm run seed`.
 *
 * V1 has no external database: the "seed" is the typed dataset in lib/seed.
 * This script validates it loads and prints a CEO-style summary so you can see
 * at a glance that the demo data is coherent and the dashboard will be
 * "parlant" immediately.
 */

import { ceoKpis, todayActions, scoredOpenDeals } from "../lib/dashboard";
import { companies, sellOffers, buyRequests, deals } from "../lib/seed";

function main() {
  const now = new Date();

  console.log("=== EN CUIVRE OS — seed summary ===\n");
  console.log(
    `Sociétés: ${companies.length} · Offres: ${sellOffers.length} · Demandes: ${buyRequests.length} · Deals: ${deals.length}\n`,
  );

  console.log("KPIs CEO:");
  for (const k of ceoKpis(now)) {
    console.log(`  - ${k.label}: ${k.value}${k.hint ? ` (${k.hint})` : ""}`);
  }

  console.log("\nÀ faire aujourd'hui:");
  for (const a of todayActions(now)) {
    console.log(`  - ${a.title} — ${a.company} — ${a.potentialValue} — ${a.deadline}`);
  }

  console.log("\nTop deals (priorité):");
  for (const d of scoredOpenDeals(now).slice(0, 5)) {
    console.log(`  - [${d.priorityScore} ${d.priorityLevel}] ${d.title}`);
  }

  console.log("\nSeed OK.");
}

main();
