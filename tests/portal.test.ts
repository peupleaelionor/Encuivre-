/**
 * Sprint 2 — portal scoping, ownership and deal redaction, against seeded PGlite.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { eur } from "@/lib/money";
import { loadContext } from "@/lib/auth/queries";
import { SUPPLIER_ORG_ID } from "@/lib/db/seed-db";
import {
  createSellOfferFor,
  getPortalCompany,
  getPortalDeals,
  getVisibleOffers,
  getVisibleRequests,
  redactDealForPortal,
} from "@/lib/services/data";
import type { AuthContext } from "@/lib/auth/rbac";
import type { Deal } from "@/lib/types";

let ceo: AuthContext;
let supplier: AuthContext;
let buyer: AuthContext;

beforeAll(async () => {
  ceo = (await loadContext("user-ceo"))!;
  supplier = (await loadContext("user-metalsud"))!;
  buyer = (await loadContext("user-cableplus"))!;
});

describe("portal read scope", () => {
  it("a supplier sees only its own offers", async () => {
    const offers = await getVisibleOffers(supplier);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => o.supplierId === "sup-metalsud")).toBe(true);
    // Internal sees strictly more.
    expect((await getVisibleOffers(ceo)).length).toBeGreaterThan(offers.length);
  });

  it("a buyer sees only its own requests", async () => {
    const reqs = await getVisibleRequests(buyer);
    expect(reqs.length).toBeGreaterThan(0);
    expect(reqs.every((r) => r.buyerId === "buy-cableplus")).toBe(true);
  });

  it("getPortalCompany returns the counterparty's own company", async () => {
    expect((await getPortalCompany(supplier))?.id).toBe("sup-metalsud");
    expect((await getPortalCompany(buyer))?.id).toBe("buy-cableplus");
    expect(await getPortalCompany(ceo)).toBeUndefined();
  });
});

describe("portal ownership on write", () => {
  it("a supplier can create an offer for its own company, owned by its org", async () => {
    const offer = await createSellOfferFor(supplier, {
      supplierId: "sup-metalsud",
      material: "COPPER_BARS_BUSBARS",
      grade: "A",
      provenance: "DISTRIBUTOR",
      quantityKg: 3000,
      pricePerTonneCents: eur(9300),
      location: "Marseille",
      country: "France",
      documents: [],
    });
    expect(offer.ownerOrganizationId).toBe(SUPPLIER_ORG_ID);
    // Internal now sees this portal-submitted offer.
    expect((await getVisibleOffers(ceo)).some((o) => o.id === offer.id)).toBe(true);
    // And the supplier sees it among its own.
    expect((await getVisibleOffers(supplier)).some((o) => o.id === offer.id)).toBe(true);
  });

  it("a supplier cannot create an offer for another company", async () => {
    await expect(
      createSellOfferFor(supplier, {
        supplierId: "sup-brassco",
        material: "BRASS",
        grade: "A",
        provenance: "TRADER",
        quantityKg: 1000,
        pricePerTonneCents: eur(5000),
        location: "x",
        country: "France",
        documents: [],
      }),
    ).rejects.toThrow();
  });

  it("a buyer cannot create a sell offer at all", async () => {
    await expect(
      createSellOfferFor(buyer, {
        supplierId: "buy-cableplus",
        material: "BRASS",
        grade: "A",
        provenance: "TRADER",
        quantityKg: 1000,
        pricePerTonneCents: eur(5000),
        location: "x",
        country: "France",
        documents: [],
      }),
    ).rejects.toThrow();
  });
});

describe("portal deal redaction", () => {
  it("redactDealForPortal drops internal cost/margin fields", () => {
    const deal: Deal = {
      id: "d",
      title: "t",
      buyerId: "buy-cableplus",
      supplierId: "sup-metalsud",
      material: "COPPER_BARS_BUSBARS",
      quantityKg: 10000,
      stage: "QUOTED",
      salePricePerTonneCents: eur(10200),
      purchasePricePerTonneCents: eur(9350),
      closeProbability: 0.7,
      ownerId: "ceo",
      createdAt: new Date().toISOString(),
      documents: [],
      riskFlags: [],
      businessLine: "TRADE",
    };
    const view = redactDealForPortal(deal);
    expect(view.salePricePerTonneCents).toBe(eur(10200));
    expect((view as unknown as Record<string, unknown>).purchasePricePerTonneCents).toBeUndefined();
    expect((view as unknown as Record<string, unknown>).closeProbability).toBeUndefined();
  });

  it("a buyer's portal deals never expose purchase price", async () => {
    const deals = await getPortalDeals(buyer);
    expect(deals.length).toBeGreaterThan(0);
    for (const d of deals) {
      expect((d as unknown as Record<string, unknown>).purchasePricePerTonneCents).toBeUndefined();
    }
  });
});
