import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { evaluateMarginGuard, DEFAULT_MARGIN_THRESHOLDS } from "@/lib/margin-guard";

describe("margin guard", () => {
  it("returns GREEN and allows validation for a healthy margin", () => {
    const r = evaluateMarginGuard({
      purchasePricePerTonneCents: eur(8000),
      quantityKg: 10000,
      transportCents: eur(500),
      salePricePerTonneCents: eur(9200),
    });
    expect(r.verdict).toBe("GREEN");
    expect(r.canValidate).toBe(true);
    expect(r.grossMarginPercent).toBeGreaterThan(DEFAULT_MARGIN_THRESHOLDS.targetPercent);
  });

  it("returns AMBER with a warning for a thin margin", () => {
    // landed ~ 8000*10 = 80,000 ; sale 8450*10 = 84,500 -> margin ~5.3%
    const r = evaluateMarginGuard({
      purchasePricePerTonneCents: eur(8000),
      quantityKg: 10000,
      salePricePerTonneCents: eur(8450),
    });
    expect(r.verdict).toBe("AMBER");
    expect(r.canValidate).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("returns RED and BLOCKS validation on a negative margin", () => {
    const r = evaluateMarginGuard({
      purchasePricePerTonneCents: eur(9000),
      quantityKg: 10000,
      transportCents: eur(1000),
      salePricePerTonneCents: eur(8800),
    });
    expect(r.verdict).toBe("RED");
    expect(r.canValidate).toBe(false);
    expect(r.grossMarginCents).toBeLessThan(0);
  });

  it("returns RED below the configurable hard floor", () => {
    // margin ~2% with floor 3% -> RED
    const r = evaluateMarginGuard(
      {
        purchasePricePerTonneCents: eur(8000),
        quantityKg: 10000,
        salePricePerTonneCents: eur(8165),
      },
      { targetPercent: 8, floorPercent: 3 },
    );
    expect(r.verdict).toBe("RED");
    expect(r.canValidate).toBe(false);
  });

  it("respects custom thresholds", () => {
    const r = evaluateMarginGuard(
      {
        purchasePricePerTonneCents: eur(8000),
        quantityKg: 10000,
        salePricePerTonneCents: eur(8450),
      },
      { targetPercent: 4, floorPercent: 2 },
    );
    // ~5.3% now above a 4% target -> GREEN
    expect(r.verdict).toBe("GREEN");
  });
});
