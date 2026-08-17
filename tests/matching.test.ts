import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { findMatches } from "@/lib/matching";
import type { BuyRequest, Company, SellOffer } from "@/lib/types";

const supplierMetrics = {
  pricing: 75,
  quality: 80,
  reliability: 80,
  availability: 75,
  compliance: 75,
  speed: 75,
  communication: 75,
  terms: 75,
};

const buyerMetrics = {
  buyingVolumeKg: 30000,
  frequency: 8,
  paymentReliability: 85,
  closingSpeed: 75,
  grossMarginGeneratedCents: eur(30000),
  relationship: 75,
  repeatPurchases: 8,
};

function makeSupplier(id: string, over: Partial<Company> = {}): Company {
  return {
    id,
    legalName: id,
    displayName: id,
    role: "SUPPLIER",
    country: "France",
    businessLine: "TRADE",
    verification: "VERIFIED",
    materials: ["COPPER_MILLBERRY"],
    grades: ["A"],
    supplierMetrics,
    ...over,
  };
}

function makeBuyer(id: string, over: Partial<Company> = {}): Company {
  return {
    id,
    legalName: id,
    displayName: id,
    role: "BUYER",
    country: "France",
    businessLine: "TRADE",
    verification: "VERIFIED",
    materials: ["COPPER_MILLBERRY"],
    grades: ["A"],
    buyerMetrics,
    ...over,
  };
}

const offer: SellOffer = {
  id: "o1",
  supplierId: "s1",
  material: "COPPER_MILLBERRY",
  grade: "A",
  provenance: "LOCAL_SCRAP",
  quantityKg: 3000,
  pricePerTonneCents: eur(7500),
  location: "Lyon",
  country: "France",
  documents: ["COA", "INVOICE", "ORIGIN"],
  createdAt: new Date().toISOString(),
};

const request: BuyRequest = {
  id: "r1",
  buyerId: "b1",
  material: "COPPER_MILLBERRY",
  minGrade: "A",
  quantityKg: 3000,
  targetPricePerTonneCents: eur(8100),
  location: "Lyon",
  country: "France",
  createdAt: new Date().toISOString(),
};

describe("matching engine", () => {
  it("matches same material, compatible grade, positive margin", () => {
    const matches = findMatches([offer], [request], [makeSupplier("s1"), makeBuyer("b1")]);
    expect(matches).toHaveLength(1);
    const m = matches[0];
    expect(m.matchableQuantityKg).toBe(3000);
    expect(m.grossMarginCents).toBeGreaterThan(0);
    expect(m.compatibilityScore).toBeGreaterThan(50);
    expect(m.reasons.some((x) => x.toLowerCase().includes("localisation"))).toBe(true);
  });

  it("never matches a BLOCKED supplier (hard rule)", () => {
    const blocked = makeSupplier("s1", { notes: "[BLOCKED] fraude suspectée" });
    const matches = findMatches([offer], [request], [blocked, makeBuyer("b1")]);
    expect(matches).toHaveLength(0);
  });

  it("does not match different materials", () => {
    const otherReq: BuyRequest = { ...request, material: "BRASS" };
    const matches = findMatches([offer], [otherReq], [makeSupplier("s1"), makeBuyer("b1")]);
    expect(matches).toHaveLength(0);
  });

  it("enforces grade compatibility (offer must satisfy min grade)", () => {
    const bOffer: SellOffer = { ...offer, grade: "B" };
    const aReq: BuyRequest = { ...request, minGrade: "A" };
    const matches = findMatches([bOffer], [aReq], [makeSupplier("s1"), makeBuyer("b1")]);
    expect(matches).toHaveLength(0);
  });

  it("excludes negative-margin matches by default", () => {
    const priceyOffer: SellOffer = { ...offer, pricePerTonneCents: eur(8500) };
    const matches = findMatches([priceyOffer], [request], [makeSupplier("s1"), makeBuyer("b1")]);
    expect(matches).toHaveLength(0);
  });

  it("raises risk for an unverified supplier", () => {
    const unverified = makeSupplier("s1", { verification: "PENDING" });
    const matches = findMatches([offer], [request], [unverified, makeBuyer("b1")]);
    expect(matches[0].riskScore).toBeGreaterThan(0);
  });
});
