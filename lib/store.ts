/**
 * Repository abstraction over the data source (now asynchronous, PostgreSQL-backed).
 *
 * The read/write contract is the single seam between the app and persistence.
 * `repo` is the Postgres (Drizzle) implementation; PGlite in dev/test, real
 * Postgres in production (see lib/db/*). Business engines never import the ORM —
 * they receive plain data (Sprint §15).
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
  companies(): Promise<Company[]>;
  company(id: string): Promise<Company | undefined>;
  contacts(): Promise<Contact[]>;
  sellOffers(): Promise<SellOffer[]>;
  buyRequests(): Promise<BuyRequest[]>;
  deals(): Promise<Deal[]>;
  deal(id: string): Promise<Deal | undefined>;
  documents(): Promise<TrackedDocument[]>;
  followUps(): Promise<FollowUp[]>;
  quotes(): Promise<Quote[]>;
  decisions(): Promise<Decision[]>;
}

/** Write side — kept minimal and explicit. */
export interface WritableRepository extends Repository {
  createSellOffer(input: Omit<SellOffer, "id" | "createdAt">): Promise<SellOffer>;
  createBuyRequest(input: Omit<BuyRequest, "id" | "createdAt">): Promise<BuyRequest>;
  createDeal(input: Omit<Deal, "id" | "createdAt">): Promise<Deal>;
  createQuote(input: Omit<Quote, "id" | "createdAt">): Promise<Quote>;
  createDecision(input: Omit<Decision, "id" | "createdAt">): Promise<Decision>;
  updateDealStage(id: string, stage: Deal["stage"]): Promise<Deal | undefined>;
}

import { pgRepository } from "./db/repository";

export const repo: WritableRepository = pgRepository;

// Convenience role filters (async).
export async function suppliers(r: Repository = repo): Promise<Company[]> {
  return (await r.companies()).filter((c) => c.role === "SUPPLIER" || c.role === "BOTH");
}

export async function buyers(r: Repository = repo): Promise<Company[]> {
  return (await r.companies()).filter((c) => c.role === "BUYER" || c.role === "BOTH");
}
