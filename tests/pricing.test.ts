import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { calculateLandedCost, calculateQuote, grossMargin } from "@/lib/pricing";

describe("landed cost", () => {
  it("sums purchase cost and all logistics components", () => {
    const r = calculateLandedCost({
      purchasePricePerTonneCents: eur(9350),
      quantityKg: 10000,
      transportCents: eur(850),
      insuranceCents: eur(120),
      customsFeesCents: eur(0),
      financingCents: eur(300),
      otherCostsCents: eur(80),
    });
    expect(r.purchaseCostCents).toBe(eur(93500)); // 9350 * 10t
    expect(r.totalLandedCostCents).toBe(eur(93500 + 850 + 120 + 0 + 300 + 80));
  });

  it("treats missing components as zero", () => {
    const r = calculateLandedCost({ purchasePricePerTonneCents: eur(5000), quantityKg: 1000 });
    expect(r.totalLandedCostCents).toBe(eur(5000));
    expect(r.transportCents).toBe(0);
  });
});

describe("quote", () => {
  it("builds a quote price from landed cost and desired margin (mark-on)", () => {
    const q = calculateQuote({
      purchasePricePerTonneCents: eur(9350),
      quantityKg: 10000,
      transportCents: eur(850),
      insuranceCents: eur(120),
      financingCents: eur(300),
      otherCostsCents: eur(80),
      desiredMarginPercent: 9,
    });
    // landed = 94,850 ; quote = 94,850 / 0.91 = 104,230.77
    expect(q.totalLandedCostCents).toBe(eur(94850));
    expect(q.grossMarginPercent).toBeCloseTo(9, 1);
    expect(q.grossMarginCents).toBe(q.quotePriceCents - q.totalLandedCostCents);
    expect(q.quotePricePerTonneCents).toBeGreaterThan(eur(10000));
  });

  it("clamps absurd margins and never divides by zero", () => {
    const q = calculateQuote({
      purchasePricePerTonneCents: eur(1000),
      quantityKg: 1000,
      desiredMarginPercent: 200,
    });
    expect(Number.isFinite(q.quotePriceCents)).toBe(true);
    expect(q.grossMarginCents).toBeGreaterThan(0);
  });

  it("returns 0 per-tonne price when quantity is zero", () => {
    const q = calculateQuote({
      purchasePricePerTonneCents: eur(1000),
      quantityKg: 0,
      desiredMarginPercent: 10,
    });
    expect(q.quotePricePerTonneCents).toBe(0);
  });

  it("grossMargin helper subtracts landed cost from sale price", () => {
    expect(grossMargin(eur(110), eur(100))).toBe(eur(10));
  });
});
