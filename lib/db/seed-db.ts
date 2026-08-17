/**
 * First-run seeding: load the typed seed dataset (lib/seed) into the database.
 * Runs once, inside a single transaction, only when the DB is empty.
 */

import type Database from "better-sqlite3";
import * as seed from "../seed";
import {
  buyRequestToRow,
  companyToRow,
  contactToRow,
  dealToRow,
  decisionToRow,
  documentToRow,
  followUpToRow,
  quoteToRow,
  sellOfferToRow,
} from "./mappers";

function insertAll(
  db: Database.Database,
  table: string,
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map((c) => `@${c}`).join(", ");
  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`);
  for (const row of rows) stmt.run(row);
}

export function seedDatabase(db: Database.Database): void {
  const tx = db.transaction(() => {
    insertAll(db, "companies", seed.companies.map(companyToRow));
    insertAll(db, "contacts", seed.contacts.map(contactToRow));
    insertAll(db, "sell_offers", seed.sellOffers.map(sellOfferToRow));
    insertAll(db, "buy_requests", seed.buyRequests.map(buyRequestToRow));
    insertAll(db, "deals", seed.deals.map(dealToRow));
    insertAll(db, "documents", seed.documents.map(documentToRow));
    insertAll(db, "follow_ups", seed.followUps.map(followUpToRow));
    insertAll(db, "quotes", seed.quotes.map(quoteToRow));
    insertAll(db, "decisions", seed.decisions.map(decisionToRow));
  });
  tx();
}
