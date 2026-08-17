import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { calculateBuyerScore, badgeForBuyer, scoreBuyerCompany } from "@/lib/buyer-score";
import type { BuyerMetrics } from "@/lib/types";
import { companies } from "@/lib/seed";

const vip: BuyerMetrics = {
  buyingVolumeKg: 60000,
  frequency: 14,
  paymentReliability: 92,
  closingSpeed: 85,
  grossMarginGeneratedCents: eur(72000),
  relationship: 88,
  repeatPurchases: 18,
};

describe("calculateBuyerScore", () => {
  it("scores a strong verified buyer as VIP", () => {
    const r = calculateBuyerScore({ metrics: vip, verification: "VERIFIED" });
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.badge).toBe("VIP");
  });

  it("flags a buyer with poor payment reliability as RISK", () => {
    const r = calculateBuyerScore({
      metrics: { ...vip, paymentReliability: 25 },
      verification: "UNVERIFIED",
    });
    expect(r.badge).toBe("RISK");
    expect(r.reasons.some((x) => x.toLowerCase().includes("paiement"))).toBe(true);
  });

  it("marks a long-inactive buyer as DORMANT", () => {
    const r = calculateBuyerScore({ metrics: vip, verification: "VERIFIED", inactivityDays: 120 });
    expect(r.badge).toBe("DORMANT");
  });

  it("badgeForBuyer thresholds", () => {
    expect(badgeForBuyer(85)).toBe("VIP");
    expect(badgeForBuyer(60)).toBe("ACTIVE");
    expect(badgeForBuyer(30)).toBe("OCCASIONAL");
  });

  it("scores the seeded risky buyer as RISK", () => {
    const risky = companies.find((c) => c.id === "buy-quickcash")!;
    const r = scoreBuyerCompany(risky);
    expect(r.badge).toBe("RISK");
  });
});
