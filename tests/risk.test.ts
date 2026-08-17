import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { deriveRiskFlags, documentExpiryAlerts, requiresHumanReview } from "@/lib/risk";
import { referencePrice } from "@/lib/market";
import type { Company, Deal, SellOffer, TrackedDocument } from "@/lib/types";

const supplier: Company = {
  id: "s1",
  legalName: "s1",
  displayName: "s1",
  role: "SUPPLIER",
  country: "France",
  businessLine: "TRADE",
  verification: "VERIFIED",
  materials: ["COPPER_CATHODE_GRADE_A"],
  grades: ["A"],
  capacityKg: 50000,
};

const goodOffer: SellOffer = {
  id: "o1",
  supplierId: "s1",
  material: "COPPER_CATHODE_GRADE_A",
  grade: "A",
  provenance: "DIRECT_PRODUCER",
  quantityKg: 20000,
  pricePerTonneCents: eur(8500),
  location: "Marseille",
  country: "France",
  documents: ["COA", "ORIGIN", "INVOICE"],
  createdAt: new Date().toISOString(),
};

describe("deriveRiskFlags", () => {
  it("returns no flags for a clean verified domestic offer", () => {
    const r = deriveRiskFlags({ company: supplier, offer: goodOffer });
    expect(r.flags).toHaveLength(0);
    expect(r.humanReviewRequired).toBe(false);
  });

  it("flags an unverified company", () => {
    const r = deriveRiskFlags({ company: { ...supplier, verification: "PENDING" }, offer: goodOffer });
    expect(r.flags).toContain("UNVERIFIED_COMPANY");
  });

  it("flags a suspiciously cheap price (prix trop beau)", () => {
    const ref = referencePrice("COPPER_CATHODE_GRADE_A")!;
    const cheap: SellOffer = { ...goodOffer, pricePerTonneCents: Math.round(ref * 0.5) };
    const r = deriveRiskFlags({ company: supplier, offer: cheap });
    expect(r.flags).toContain("PRICE_TOO_GOOD");
  });

  it("flags missing COA on cathode and missing origin on cross-border", () => {
    const bare: SellOffer = {
      ...goodOffer,
      country: "RD Congo",
      documents: [],
    };
    const r = deriveRiskFlags({ company: { ...supplier, country: "RD Congo" }, offer: bare });
    expect(r.flags).toContain("MISSING_COA");
    expect(r.flags).toContain("MISSING_ORIGIN");
  });

  it("flags inconsistent quantity beyond supplier capacity", () => {
    const deal: Deal = {
      id: "d1",
      title: "d",
      buyerId: "b1",
      supplierId: "s1",
      material: "COPPER_CATHODE_GRADE_A",
      quantityKg: 999999,
      stage: "QUALIFIED",
      salePricePerTonneCents: eur(8800),
      purchasePricePerTonneCents: eur(8500),
      closeProbability: 0.5,
      ownerId: "ceo",
      createdAt: new Date().toISOString(),
      documents: ["COA"],
      riskFlags: [],
      businessLine: "TRADE",
    };
    const r = deriveRiskFlags({ company: supplier, deal });
    expect(r.flags).toContain("INCONSISTENT_QUANTITY");
  });

  it("routes unknown-country counterparties to MANUAL_REVIEW and forces human review", () => {
    const r = deriveRiskFlags({ company: { ...supplier, country: "Inconnu", verification: "UNVERIFIED" } });
    expect(r.flags).toContain("MANUAL_REVIEW");
    expect(r.humanReviewRequired).toBe(true);
  });

  it("forces human review for an unverified Congo-corridor counterparty", () => {
    const katanga: Company = {
      ...supplier,
      country: "RD Congo",
      businessLine: "CONGO",
      verification: "PENDING",
    };
    const r = deriveRiskFlags({ company: katanga, offer: { ...goodOffer, country: "RD Congo" } });
    expect(r.flags).toContain("MANUAL_REVIEW");
    expect(r.humanReviewRequired).toBe(true);
  });

  it("flags expired tracked documents", () => {
    const docs: TrackedDocument[] = [
      { id: "x", type: "COA", verificationStatus: "VERIFIED", expiryDate: new Date(Date.now() - 86400000).toISOString() },
    ];
    const r = deriveRiskFlags({ company: supplier, offer: goodOffer, trackedDocuments: docs });
    expect(r.flags).toContain("DOCUMENT_EXPIRED");
    expect(r.humanReviewRequired).toBe(true);
  });

  it("never fabricates a sanctions match but preserves one already recorded", () => {
    const deal: Deal = {
      id: "d2",
      title: "d",
      buyerId: "b1",
      material: "BRASS",
      quantityKg: 1000,
      stage: "LEAD",
      salePricePerTonneCents: eur(5600),
      purchasePricePerTonneCents: eur(5300),
      closeProbability: 0.4,
      ownerId: "ceo",
      createdAt: new Date().toISOString(),
      documents: ["COA", "ORIGIN"],
      riskFlags: ["SANCTIONS_REVIEW_REQUIRED"],
      businessLine: "TRADE",
    };
    const withSanction = deriveRiskFlags({ deal });
    expect(withSanction.flags).toContain("SANCTIONS_REVIEW_REQUIRED");

    const clean = deriveRiskFlags({ company: supplier, offer: goodOffer });
    expect(clean.flags).not.toContain("SANCTIONS_REVIEW_REQUIRED");
  });
});

describe("requiresHumanReview / documentExpiryAlerts", () => {
  it("requiresHumanReview true for blocking flags only", () => {
    expect(requiresHumanReview(["UNVERIFIED_COMPANY"])).toBe(false);
    expect(requiresHumanReview(["DOCUMENT_EXPIRED"])).toBe(true);
  });

  it("documentExpiryAlerts surfaces seeded expired/expiring documents", async () => {
    const alerts = await documentExpiryAlerts(new Date());
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.some((a) => a.status === "EXPIRED" || a.status === "EXPIRING_SOON")).toBe(true);
  });
});
