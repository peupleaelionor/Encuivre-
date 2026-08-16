import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { classifyBuyOpportunity } from "@/lib/buy-opportunities";
import type { BuyRequest, Company, SellOffer } from "@/lib/types";

const verifiedSupplier: Company = {
  id: "s1",
  legalName: "s1",
  displayName: "s1",
  role: "SUPPLIER",
  country: "France",
  businessLine: "TRADE",
  verification: "VERIFIED",
  materials: ["COPPER_MILLBERRY"],
  grades: ["A"],
  provenance: "INDUSTRIAL_OFFCUT",
  supplierMetrics: {
    pricing: 80,
    quality: 80,
    reliability: 80,
    availability: 80,
    compliance: 80,
    speed: 80,
    communication: 80,
    terms: 80,
  },
};

const cheapOffer: SellOffer = {
  id: "o1",
  supplierId: "s1",
  material: "COPPER_MILLBERRY",
  grade: "A",
  provenance: "INDUSTRIAL_OFFCUT",
  quantityKg: 800,
  pricePerTonneCents: eur(7000),
  location: "Lyon",
  country: "France",
  documents: ["INVOICE"],
  createdAt: new Date().toISOString(),
};

const liveRequest: BuyRequest = {
  id: "r1",
  buyerId: "b1",
  material: "COPPER_MILLBERRY",
  minGrade: "A",
  quantityKg: 800,
  targetPricePerTonneCents: eur(8100),
  location: "Lyon",
  country: "France",
  createdAt: new Date().toISOString(),
};

describe("buy-opportunity classifier (buyer before inventory)", () => {
  it("recommends BUY when there is live demand + attractive price + verified supplier", () => {
    const r = classifyBuyOpportunity({
      offer: cheapOffer,
      requests: [liveRequest],
      supplier: verifiedSupplier,
    });
    expect(r.recommendation).toBe("BUY");
    expect(r.reasons[0].toLowerCase()).toContain("acheteur identifié");
    expect(r.lowCapital).toBe(true);
  });

  it("AVOIDs a blind buy with no demand and no rotation", () => {
    const r = classifyBuyOpportunity({
      offer: cheapOffer,
      requests: [],
      supplier: verifiedSupplier,
    });
    expect(r.recommendation).toBe("AVOID");
  });

  it("AVOIDs anything from a BLOCKED supplier", () => {
    const blocked = { ...verifiedSupplier, notes: "[BLOCKED]" };
    const r = classifyBuyOpportunity({
      offer: cheapOffer,
      requests: [liveRequest],
      supplier: blocked,
    });
    expect(r.recommendation).toBe("AVOID");
  });

  it("WATCHes when rotation + price are good but no live demand", () => {
    const r = classifyBuyOpportunity({
      offer: cheapOffer,
      requests: [],
      supplier: verifiedSupplier,
      historicalRotationKg: 5000,
    });
    expect(r.recommendation).toBe("WATCH");
  });

  it("flags low-capital provenance and quantity", () => {
    const r = classifyBuyOpportunity({
      offer: cheapOffer,
      requests: [liveRequest],
      supplier: verifiedSupplier,
    });
    expect(r.lowCapital).toBe(true);
    expect(r.capitalRequiredCents).toBe(eur(5600)); // 7000 * 0.8t
  });
});
