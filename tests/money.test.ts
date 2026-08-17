import { describe, it, expect } from "vitest";
import {
  eur,
  toEur,
  roundCents,
  sum,
  priceForKg,
  applyPercent,
  marginPercent,
  formatEur,
} from "@/lib/money";

describe("money", () => {
  it("converts EUR to integer cents without float drift", () => {
    expect(eur(8540.5)).toBe(854050);
    expect(eur(0.1)).toBe(10);
    expect(eur(0)).toBe(0);
  });

  it("round-trips cents to EUR", () => {
    expect(toEur(854050)).toBe(8540.5);
  });

  it("throws on non-finite input", () => {
    expect(() => eur(Infinity)).toThrow();
    expect(() => roundCents(NaN)).toThrow();
  });

  it("rounds fractional cents half away from zero", () => {
    expect(roundCents(10.5)).toBe(11);
    expect(roundCents(-10.5)).toBe(-11);
    expect(roundCents(10.4)).toBe(10);
  });

  it("sums cents exactly", () => {
    expect(sum(100, 200, 50)).toBe(350);
    expect(sum()).toBe(0);
  });

  it("prices a quantity in kg from a per-tonne price, rounding once", () => {
    // €8,500/t * 12,000 kg = €102,000 -> 10,200,000 cents
    expect(priceForKg(eur(8500), 12000)).toBe(10_200_000);
    // €7,650/t * 3,500 kg = €26,775
    expect(priceForKg(eur(7650), 3500)).toBe(eur(26775));
  });

  it("rejects negative quantities", () => {
    expect(() => priceForKg(eur(8500), -1)).toThrow();
  });

  it("applies a percentage to cents", () => {
    expect(applyPercent(eur(1000), 8)).toBe(eur(80));
  });

  it("computes margin percent from cents with 1 decimal", () => {
    expect(marginPercent(eur(110), eur(100))).toBeCloseTo(9.1, 1);
    expect(marginPercent(0, eur(100))).toBe(0);
    expect(marginPercent(eur(100), eur(120))).toBeLessThan(0);
  });

  it("formats EUR in fr-FR", () => {
    const s = formatEur(1234567);
    expect(s).toContain("€");
    expect(s).toMatch(/12\s?345,67/);
  });
});
