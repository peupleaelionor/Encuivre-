import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { repo } from "@/lib/store";

describe("SqliteRepository (write layer, in-memory DB)", () => {
  it("is seeded on first access", () => {
    expect(repo.companies().length).toBe(15);
    expect(repo.deals().length).toBeGreaterThanOrEqual(8);
  });

  it("creates and reads back a sell offer", () => {
    const before = repo.sellOffers().length;
    const offer = repo.createSellOffer({
      supplierId: "sup-metalsud",
      material: "COPPER_BARS_BUSBARS",
      grade: "A",
      provenance: "DISTRIBUTOR",
      quantityKg: 5000,
      pricePerTonneCents: eur(9400),
      location: "Marseille",
      country: "France",
      documents: ["COA", "INVOICE"],
    });
    expect(offer.id).toMatch(/^so-/);
    expect(repo.sellOffers().length).toBe(before + 1);
    const found = repo.sellOffers().find((o) => o.id === offer.id);
    expect(found?.documents).toEqual(["COA", "INVOICE"]);
    expect(found?.pricePerTonneCents).toBe(eur(9400));
  });

  it("creates and reads back a buy request", () => {
    const req = repo.createBuyRequest({
      buyerId: "buy-cableplus",
      material: "COPPER_CATHODE_GRADE_A",
      minGrade: "A",
      quantityKg: 12000,
      targetPricePerTonneCents: eur(8900),
      location: "Paris",
      country: "France",
    });
    expect(repo.buyRequests().some((r) => r.id === req.id)).toBe(true);
  });

  it("creates a deal and updates its stage", () => {
    const deal = repo.createDeal({
      title: "Test deal",
      buyerId: "buy-cableplus",
      supplierId: "sup-metalsud",
      material: "COPPER_BARS_BUSBARS",
      quantityKg: 5000,
      stage: "QUALIFIED",
      salePricePerTonneCents: eur(10200),
      purchasePricePerTonneCents: eur(9400),
      closeProbability: 0.6,
      ownerId: "ceo",
      documents: ["COA"],
      riskFlags: [],
      businessLine: "TRADE",
    });
    expect(repo.deal(deal.id)?.stage).toBe("QUALIFIED");
    const updated = repo.updateDealStage(deal.id, "QUOTED");
    expect(updated?.stage).toBe("QUOTED");
    expect(repo.deal(deal.id)?.stage).toBe("QUOTED");
  });

  it("creates a quote with all cost components persisted as integer cents", () => {
    const q = repo.createQuote({
      supplierId: "sup-metalsud",
      buyerId: "buy-cableplus",
      material: "COPPER_BARS_BUSBARS",
      grade: "A",
      quantityKg: 10000,
      purchasePricePerTonneCents: eur(9350),
      transportCents: eur(850),
      insuranceCents: eur(120),
      customsFeesCents: eur(0),
      financingCents: eur(300),
      otherCostsCents: eur(80),
      desiredMarginPercent: 9,
    });
    const found = repo.quotes().find((x) => x.id === q.id);
    expect(found?.transportCents).toBe(eur(850));
    expect(found?.desiredMarginPercent).toBe(9);
  });

  it("preserves company value objects through the JSON columns", () => {
    const c = repo.company("both-recupro");
    expect(c?.role).toBe("BOTH");
    expect(c?.supplierMetrics?.pricing).toBeTypeOf("number");
    expect(c?.buyerMetrics?.buyingVolumeKg).toBeTypeOf("number");
    expect(Array.isArray(c?.materials)).toBe(true);
  });
});
