/**
 * Permission + multi-tenant tests against the seeded PGlite database.
 * Loads real auth contexts (CEO, supplier portal, buyer portal) and exercises
 * the services authorization boundary.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { loadContext, authenticate } from "@/lib/auth/queries";
import { DEV_PASSWORD } from "@/lib/db/seed-db";
import {
  canViewInternalMargin,
  getCompanyFor,
  getVisibleCompanies,
  getVisibleDeals,
} from "@/lib/services/data";
import type { AuthContext } from "@/lib/auth/rbac";

let ceo: AuthContext;
let supplier: AuthContext;
let buyer: AuthContext;

beforeAll(async () => {
  ceo = (await loadContext("user-ceo"))!;
  supplier = (await loadContext("user-metalsud"))!;
  buyer = (await loadContext("user-cableplus"))!;
});

describe("seeded organizations & memberships", () => {
  it("loads a CEO context in the internal org", () => {
    expect(ceo).toBeTruthy();
    expect(ceo.memberships.some((m) => m.role === "CEO" && m.organizationId === "org-encuivre")).toBe(true);
  });

  it("authenticates with the dev password and rejects a bad one", async () => {
    expect(await authenticate("ceo@encuivre.example", DEV_PASSWORD)).toBeTruthy();
    expect(await authenticate("ceo@encuivre.example", "wrong")).toBeNull();
    expect(await authenticate("nobody@example.com", DEV_PASSWORD)).toBeNull();
  });
});

describe("multi-tenant read scope", () => {
  it("CEO can access all companies", async () => {
    const companies = await getVisibleCompanies(ceo);
    expect(companies.length).toBe(15);
  });

  it("a supplier portal sees only its own company", async () => {
    const companies = await getVisibleCompanies(supplier);
    expect(companies.map((c) => c.id)).toEqual(["sup-metalsud"]);
  });

  it("a supplier cannot read another supplier", async () => {
    expect(await getCompanyFor(supplier, "sup-brassco")).toBeUndefined();
    expect(await getCompanyFor(supplier, "sup-metalsud")).toBeTruthy();
  });

  it("a buyer cannot read internal margin; CEO and finance-like roles can", () => {
    expect(canViewInternalMargin(buyer)).toBe(false);
    expect(canViewInternalMargin(ceo)).toBe(true);
  });

  it("a buyer portal only sees deals involving its own company", async () => {
    const deals = await getVisibleDeals(buyer);
    expect(deals.length).toBeGreaterThan(0);
    expect(deals.every((d) => d.buyerId === "buy-cableplus" || d.supplierId === "buy-cableplus")).toBe(true);
    // CEO sees strictly more (all open+closed).
    const ceoDeals = await getVisibleDeals(ceo);
    expect(ceoDeals.length).toBeGreaterThan(deals.length);
  });
});
