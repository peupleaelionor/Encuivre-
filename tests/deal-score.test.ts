import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import {
  calculateDealPriorityScore,
  levelForScore,
  type DealScoreFactors,
} from "@/lib/deal-score";

const strong: DealScoreFactors = {
  marginPotentialPercent: 16,
  dealValueCents: eur(80000),
  closeProbability: 0.9,
  buyerQuality: 90,
  supplierQuality: 88,
  documentCompleteness: 1,
  urgency: 0.8,
  capitalRequirementCents: eur(10000),
  risk: 0.05,
  inactivityDays: 1,
};

const weak: DealScoreFactors = {
  marginPotentialPercent: 2,
  dealValueCents: eur(3000),
  closeProbability: 0.15,
  buyerQuality: 30,
  supplierQuality: 40,
  documentCompleteness: 0.2,
  urgency: 0.1,
  capitalRequirementCents: eur(60000),
  risk: 0.8,
  inactivityDays: 30,
};

describe("calculateDealPriorityScore", () => {
  it("returns a 0–100 score, a level and reasons", () => {
    const r = calculateDealPriorityScore(strong);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(["HOT", "WARM", "COOL", "COLD"]).toContain(r.level);
  });

  it("ranks a strong deal HOT and a weak deal COLD", () => {
    const s = calculateDealPriorityScore(strong);
    const w = calculateDealPriorityScore(weak);
    expect(s.score).toBeGreaterThan(w.score);
    expect(s.level).toBe("HOT");
    expect(w.level).toBe("COLD");
  });

  it("explains the strong deal with positive reasons", () => {
    const r = calculateDealPriorityScore(strong);
    expect(r.reasons.some((x) => x.toLowerCase().includes("marge"))).toBe(true);
  });

  it("penalizes risk and inactivity", () => {
    const base = calculateDealPriorityScore({ ...strong, risk: 0, inactivityDays: 0 });
    const risky = calculateDealPriorityScore({ ...strong, risk: 0.9, inactivityDays: 30 });
    expect(risky.score).toBeLessThan(base.score);
  });

  it("levelForScore thresholds", () => {
    expect(levelForScore(80)).toBe("HOT");
    expect(levelForScore(60)).toBe("WARM");
    expect(levelForScore(40)).toBe("COOL");
    expect(levelForScore(10)).toBe("COLD");
  });
});
