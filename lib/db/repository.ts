/**
 * PostgresRepository — async reads and writes via Drizzle (PGlite/Postgres).
 * Implements the Repository/WritableRepository contract. Org scoping and
 * permission checks live in the services layer (lib/services), not here.
 */

import { eq } from "drizzle-orm";
import { getDb } from "./client";
import * as t from "./schema";
import * as m from "./mappers";
import { prefixedId } from "./ids";
import { INTERNAL_ORG_ID } from "./seed-db";
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
} from "../types";
import type { Repository, WritableRepository } from "../store";

class PostgresRepository implements WritableRepository {
  // ---------- reads ----------
  async companies(): Promise<Company[]> {
    const db = await getDb();
    return (await db.select().from(t.companies)).map(m.rowToCompany);
  }
  async company(id: string): Promise<Company | undefined> {
    const db = await getDb();
    const rows = await db.select().from(t.companies).where(eq(t.companies.id, id)).limit(1);
    return rows[0] ? m.rowToCompany(rows[0]) : undefined;
  }
  async contacts(): Promise<Contact[]> {
    const db = await getDb();
    return (await db.select().from(t.contacts)).map(m.rowToContact);
  }
  async sellOffers(): Promise<SellOffer[]> {
    const db = await getDb();
    return (await db.select().from(t.sellOffers)).map(m.rowToSellOffer);
  }
  async buyRequests(): Promise<BuyRequest[]> {
    const db = await getDb();
    return (await db.select().from(t.buyRequests)).map(m.rowToBuyRequest);
  }
  async deals(): Promise<Deal[]> {
    const db = await getDb();
    return (await db.select().from(t.deals)).map(m.rowToDeal);
  }
  async deal(id: string): Promise<Deal | undefined> {
    const db = await getDb();
    const rows = await db.select().from(t.deals).where(eq(t.deals.id, id)).limit(1);
    return rows[0] ? m.rowToDeal(rows[0]) : undefined;
  }
  async documents(): Promise<TrackedDocument[]> {
    const db = await getDb();
    return (await db.select().from(t.documents)).map(m.rowToDocument);
  }
  async followUps(): Promise<FollowUp[]> {
    const db = await getDb();
    return (await db.select().from(t.followUps)).map(m.rowToFollowUp);
  }
  async quotes(): Promise<Quote[]> {
    const db = await getDb();
    return (await db.select().from(t.quotes)).map(m.rowToQuote);
  }
  async decisions(): Promise<Decision[]> {
    const db = await getDb();
    return (await db.select().from(t.decisions)).map(m.rowToDecision);
  }

  // ---------- writes ----------
  async createSellOffer(input: Omit<SellOffer, "id" | "createdAt">): Promise<SellOffer> {
    const db = await getDb();
    const offer: SellOffer = { ...input, id: prefixedId("so"), createdAt: new Date().toISOString() };
    await db.insert(t.sellOffers).values({ ...offer, ownerOrganizationId: INTERNAL_ORG_ID });
    return offer;
  }

  async createBuyRequest(input: Omit<BuyRequest, "id" | "createdAt">): Promise<BuyRequest> {
    const db = await getDb();
    const request: BuyRequest = { ...input, id: prefixedId("br"), createdAt: new Date().toISOString() };
    await db.insert(t.buyRequests).values({ ...request, ownerOrganizationId: INTERNAL_ORG_ID });
    return request;
  }

  async createDeal(input: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
    const db = await getDb();
    const deal: Deal = { ...input, id: prefixedId("deal"), createdAt: new Date().toISOString() };
    await db.insert(t.deals).values({ ...deal, ownerOrganizationId: INTERNAL_ORG_ID });
    return deal;
  }

  async createQuote(input: Omit<Quote, "id" | "createdAt">): Promise<Quote> {
    const db = await getDb();
    const quote: Quote = { ...input, id: prefixedId("q"), createdAt: new Date().toISOString() };
    await db.insert(t.quotes).values({ ...quote, organizationId: INTERNAL_ORG_ID });
    return quote;
  }

  async createDecision(input: Omit<Decision, "id" | "createdAt">): Promise<Decision> {
    const db = await getDb();
    const decision: Decision = { ...input, id: prefixedId("dec"), createdAt: new Date().toISOString() };
    await db.insert(t.decisions).values({ ...decision, organizationId: INTERNAL_ORG_ID });
    return decision;
  }

  async updateDealStage(id: string, stage: Deal["stage"]): Promise<Deal | undefined> {
    const db = await getDb();
    await db
      .update(t.deals)
      .set({ stage, lastContactAt: new Date().toISOString() })
      .where(eq(t.deals.id, id));
    return this.deal(id);
  }
}

export const pgRepository: Repository & WritableRepository = new PostgresRepository();
