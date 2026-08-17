/**
 * SqliteRepository — reads and writes backed by SQLite (better-sqlite3).
 *
 * Implements the synchronous Repository/WritableRepository contract so the UI
 * and engines stay unchanged. Writes generate ids and default timestamps, then
 * persist via the same mappers used for seeding.
 */

import { getDb } from "./connection";
import * as m from "./mappers";
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

type Row = Record<string, unknown>;

function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${rand}`;
}

function insert(table: string, row: Row): void {
  const db = getDb();
  const cols = Object.keys(row);
  const placeholders = cols.map((c) => `@${c}`).join(", ");
  db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`).run(row);
}

export class SqliteRepository implements WritableRepository {
  // ---------- reads ----------
  companies(): Company[] {
    return (getDb().prepare(`SELECT * FROM companies`).all() as Row[]).map(m.rowToCompany);
  }
  company(id: string): Company | undefined {
    const r = getDb().prepare(`SELECT * FROM companies WHERE id = ?`).get(id) as Row | undefined;
    return r ? m.rowToCompany(r) : undefined;
  }
  contacts(): Contact[] {
    return (getDb().prepare(`SELECT * FROM contacts`).all() as Row[]).map(m.rowToContact);
  }
  sellOffers(): SellOffer[] {
    return (getDb().prepare(`SELECT * FROM sell_offers ORDER BY createdAt DESC`).all() as Row[]).map(
      m.rowToSellOffer,
    );
  }
  buyRequests(): BuyRequest[] {
    return (getDb().prepare(`SELECT * FROM buy_requests ORDER BY createdAt DESC`).all() as Row[]).map(
      m.rowToBuyRequest,
    );
  }
  deals(): Deal[] {
    return (getDb().prepare(`SELECT * FROM deals ORDER BY createdAt DESC`).all() as Row[]).map(
      m.rowToDeal,
    );
  }
  deal(id: string): Deal | undefined {
    const r = getDb().prepare(`SELECT * FROM deals WHERE id = ?`).get(id) as Row | undefined;
    return r ? m.rowToDeal(r) : undefined;
  }
  documents(): TrackedDocument[] {
    return (getDb().prepare(`SELECT * FROM documents`).all() as Row[]).map(m.rowToDocument);
  }
  followUps(): FollowUp[] {
    return (getDb().prepare(`SELECT * FROM follow_ups`).all() as Row[]).map(m.rowToFollowUp);
  }
  quotes(): Quote[] {
    return (getDb().prepare(`SELECT * FROM quotes ORDER BY createdAt DESC`).all() as Row[]).map(
      m.rowToQuote,
    );
  }
  decisions(): Decision[] {
    return (getDb().prepare(`SELECT * FROM decisions ORDER BY createdAt DESC`).all() as Row[]).map(
      m.rowToDecision,
    );
  }

  // ---------- writes ----------
  createSellOffer(input: Omit<SellOffer, "id" | "createdAt">): SellOffer {
    const offer: SellOffer = { ...input, id: newId("so"), createdAt: new Date().toISOString() };
    insert("sell_offers", m.sellOfferToRow(offer));
    return offer;
  }

  createBuyRequest(input: Omit<BuyRequest, "id" | "createdAt">): BuyRequest {
    const request: BuyRequest = { ...input, id: newId("br"), createdAt: new Date().toISOString() };
    insert("buy_requests", m.buyRequestToRow(request));
    return request;
  }

  createDeal(input: Omit<Deal, "id" | "createdAt">): Deal {
    const deal: Deal = { ...input, id: newId("deal"), createdAt: new Date().toISOString() };
    insert("deals", m.dealToRow(deal));
    return deal;
  }

  createQuote(input: Omit<Quote, "id" | "createdAt">): Quote {
    const quote: Quote = { ...input, id: newId("q"), createdAt: new Date().toISOString() };
    insert("quotes", m.quoteToRow(quote));
    return quote;
  }

  createDecision(input: Omit<Decision, "id" | "createdAt">): Decision {
    const decision: Decision = { ...input, id: newId("dec"), createdAt: new Date().toISOString() };
    insert("decisions", m.decisionToRow(decision));
    return decision;
  }

  updateDealStage(id: string, stage: Deal["stage"]): Deal | undefined {
    getDb()
      .prepare(`UPDATE deals SET stage = ?, lastContactAt = ? WHERE id = ?`)
      .run(stage, new Date().toISOString(), id);
    return this.deal(id);
  }
}

export const sqliteRepo: Repository & WritableRepository = new SqliteRepository();
