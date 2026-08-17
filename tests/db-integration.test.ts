/**
 * DB integration tests against seeded PGlite: writes through the services layer,
 * persisted data feeding the engines, and invariants that must survive persistence.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { eur } from "@/lib/money";
import { repo } from "@/lib/store";
import { loadContext } from "@/lib/auth/queries";
import { createBuyRequestFor, createDealFor, createSellOfferFor } from "@/lib/services/data";
import { findMatches } from "@/lib/matching";
import { documentExpiryAlerts } from "@/lib/risk";
import { scoreSupplierCompany } from "@/lib/supplier-score";
import type { AuthContext } from "@/lib/auth/rbac";

let ceo: AuthContext;
let buyer: AuthContext;

beforeAll(async () => {
  ceo = (await loadContext("user-ceo"))!;
  buyer = (await loadContext("user-cableplus"))!;
});

describe("writes via services persist", () => {
  it("CEO creates a sell offer and it is read back", async () => {
    const before = (await repo.sellOffers()).length;
    const offer = await createSellOfferFor(ceo, {
      supplierId: "sup-metalsud",
      material: "COPPER_BARS_BUSBARS",
      grade: "A",
      provenance: "DISTRIBUTOR",
      quantityKg: 4000,
      pricePerTonneCents: eur(9400),
      location: "Marseille",
      country: "France",
      documents: ["COA", "INVOICE"],
    });
    const after = await repo.sellOffers();
    expect(after.length).toBe(before + 1);
    expect(after.find((o) => o.id === offer.id)?.pricePerTonneCents).toBe(eur(9400));
  });

  it("CEO creates a buy request and a deal", async () => {
    const req = await createBuyRequestFor(ceo, {
      buyerId: "buy-cableplus",
      material: "COPPER_CATHODE_GRADE_A",
      minGrade: "A",
      quantityKg: 10000,
      targetPricePerTonneCents: eur(8900),
      location: "Paris",
      country: "France",
    });
    expect((await repo.buyRequests()).some((r) => r.id === req.id)).toBe(true);

    const deal = await createDealFor(ceo, {
      title: "Integration deal",
      buyerId: "buy-cableplus",
      supplierId: "sup-metalsud",
      material: "COPPER_BARS_BUSBARS",
      quantityKg: 4000,
      stage: "QUALIFIED",
      salePricePerTonneCents: eur(10200),
      purchasePricePerTonneCents: eur(9400),
      closeProbability: 0.6,
      ownerId: ceo.user.id,
      documents: ["COA"],
      riskFlags: [],
      businessLine: "TRADE",
    });
    expect((await repo.deal(deal.id))?.stage).toBe("QUALIFIED");
  });

  it("a buyer portal cannot create a sell offer", async () => {
    await expect(
      createSellOfferFor(buyer, {
        supplierId: "sup-metalsud",
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

describe("persisted data feeds the engines", () => {
  it("matching runs over persisted offers/requests and excludes the blocked supplier", async () => {
    const [offers, requests, companies] = await Promise.all([
      repo.sellOffers(),
      repo.buyRequests(),
      repo.companies(),
    ]);
    const matches = findMatches(offers, requests, companies);
    expect(matches.length).toBeGreaterThan(0);
    // GlobalScrap is BLOCKED in the seed and must never appear in a match.
    expect(matches.every((m) => m.supplier.id !== "sup-globalscrap")).toBe(true);
  });

  it("the seeded blocked supplier remains blocked after persistence", async () => {
    const blocked = (await repo.company("sup-globalscrap"))!;
    expect(scoreSupplierCompany(blocked).blocked).toBe(true);
  });

  it("risk document-expiry alerts read from the persisted documents", async () => {
    const alerts = await documentExpiryAlerts(new Date());
    expect(alerts.some((a) => a.status === "EXPIRED" || a.status === "EXPIRING_SOON")).toBe(true);
  });
});
