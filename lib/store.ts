/**
 * Repository abstraction over the data source.
 *
 * V1 backs this with the in-repo typed seed dataset (lib/seed). The interface is
 * deliberately narrow and synchronous-friendly so a real async database
 * (Prisma/Postgres) can replace `SeedRepository` later without touching the UI
 * or the engines. See docs/copilot-audit.md ("Dette volontaire").
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
import * as seed from "./seed";

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

class SeedRepository implements Repository {
  companies() {
    return seed.companies;
  }
  company(id: string) {
    return seed.companies.find((c) => c.id === id);
  }
  contacts() {
    return seed.contacts;
  }
  sellOffers() {
    return seed.sellOffers;
  }
  buyRequests() {
    return seed.buyRequests;
  }
  deals() {
    return seed.deals;
  }
  deal(id: string) {
    return seed.deals.find((d) => d.id === id);
  }
  documents() {
    return seed.documents;
  }
  followUps() {
    return seed.followUps;
  }
  quotes() {
    return seed.quotes;
  }
  decisions() {
    return seed.decisions;
  }
}

export const repo: Repository = new SeedRepository();

// Convenience re-exports for company-role filtering.
export function suppliers(r: Repository = repo): Company[] {
  return r.companies().filter((c) => c.role === "SUPPLIER" || c.role === "BOTH");
}

export function buyers(r: Repository = repo): Company[] {
  return r.companies().filter((c) => c.role === "BUYER" || c.role === "BOTH");
}
