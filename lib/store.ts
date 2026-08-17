/**
 * Repository abstraction over the data source.
 *
 * The default `repo` is now backed by a real SQLite database (better-sqlite3),
 * seeded on first run from the typed dataset in `lib/seed`. The synchronous
 * contract is unchanged, so pages and engines are untouched. See
 * `lib/db/*` and `docs/database.md`.
 */

import type {
  BuyRequest,
  Company,
  Contact,
  Deal,
  Decision,
  FollowUp,
  Quote,
  SellOffer,
  TrackedDocument,
} from "./types";

/** Read side of the data source. */
export interface Repository {
  companies(): Company[];
  company(id: string): Company | undefined;
  contacts(): Contact[];
  sellOffers(): SellOffer[];
  buyRequests(): BuyRequest[];
  deals(): Deal[];
  deal(id: string): Deal | undefined;
  documents(): TrackedDocument[];
  followUps(): FollowUp[];
  quotes(): Quote[];
  decisions(): Decision[];
}

/** Write side — kept minimal and explicit. */
export interface WritableRepository extends Repository {
  createSellOffer(input: Omit<SellOffer, "id" | "createdAt">): SellOffer;
  createBuyRequest(input: Omit<BuyRequest, "id" | "createdAt">): BuyRequest;
  createDeal(input: Omit<Deal, "id" | "createdAt">): Deal;
  createQuote(input: Omit<Quote, "id" | "createdAt">): Quote;
  createDecision(input: Omit<Decision, "id" | "createdAt">): Decision;
  updateDealStage(id: string, stage: Deal["stage"]): Deal | undefined;
}

// The SQLite-backed implementation is the single source of truth at runtime.
// Imported lazily-safe: repository.ts only type-imports from this module.
import { sqliteRepo } from "./db/repository";

export const repo: WritableRepository = sqliteRepo;

// Convenience re-exports for company-role filtering.
export function suppliers(r: Repository = repo): Company[] {
  return r.companies().filter((c) => c.role === "SUPPLIER" || c.role === "BOTH");
}

export function buyers(r: Repository = repo): Company[] {
  return r.companies().filter((c) => c.role === "BUYER" || c.role === "BOTH");
}
