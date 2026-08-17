/**
 * Margin Guard — protects the group from validating loss-making or thin deals.
 *
 * Before a deal moves to QUOTED / CONTRACT, we compute the full landed cost and
 * compare the resulting gross margin % against configurable thresholds:
 *   - margin < 0            -> RED, validation blocked.
 *   - margin < floorPercent -> RED, validation blocked (hard floor).
 *   - margin < targetPercent -> AMBER, explicit warning, validation allowed.
 *   - otherwise             -> GREEN.
 *
 * Thresholds are configurable (env / call site) — never hard-coded magic.
 */

import { marginPercent, priceForKg, type Cents } from "./money";
import { calculateLandedCost, type LandedCostInput } from "./pricing";
import type { MarginVerdict } from "./enums";

export interface MarginGuardThresholds {
  /** Below this margin %, verdict is AMBER (warning). */
  targetPercent: number;
  /** Below this margin %, verdict is RED and validation is blocked. */
  floorPercent: number;
}

export const DEFAULT_MARGIN_THRESHOLDS: MarginGuardThresholds = {
  targetPercent: 8,
  floorPercent: 3,
};

export interface MarginGuardInput extends LandedCostInput {
  /** Sale price in cents per tonne. */
  salePricePerTonneCents: Cents;
}

export interface MarginGuardResult {
  totalLandedCostCents: Cents;
  salePriceCents: Cents;
  grossMarginCents: Cents;
  grossMarginPercent: number;
  verdict: MarginVerdict;
  /** True when the deal may proceed to QUOTED/CONTRACT via the normal flow. */
  canValidate: boolean;
  warnings: string[];
}

/** Read thresholds from env, falling back to defaults. Safe on server + client. */
export function marginThresholdsFromEnv(): MarginGuardThresholds {
  const target = Number(process.env.NEXT_PUBLIC_MARGIN_TARGET_PERCENT);
  const floor = Number(process.env.NEXT_PUBLIC_MARGIN_FLOOR_PERCENT);
  return {
    targetPercent: Number.isFinite(target) ? target : DEFAULT_MARGIN_THRESHOLDS.targetPercent,
    floorPercent: Number.isFinite(floor) ? floor : DEFAULT_MARGIN_THRESHOLDS.floorPercent,
  };
}

export function evaluateMarginGuard(
  input: MarginGuardInput,
  thresholds: MarginGuardThresholds = DEFAULT_MARGIN_THRESHOLDS,
): MarginGuardResult {
  const landed = calculateLandedCost(input);
  const salePriceCents = priceForKg(input.salePricePerTonneCents, input.quantityKg);
  const grossMarginCents = salePriceCents - landed.totalLandedCostCents;
  const grossMarginPercent = marginPercent(salePriceCents, landed.totalLandedCostCents);

  const warnings: string[] = [];
  let verdict: MarginVerdict;
  let canValidate: boolean;

  if (grossMarginCents < 0) {
    verdict = "RED";
    canValidate = false;
    warnings.push("Marge négative : la vente est en dessous du coût de revient complet.");
  } else if (grossMarginPercent < thresholds.floorPercent) {
    verdict = "RED";
    canValidate = false;
    warnings.push(
      `Marge ${grossMarginPercent}% sous le plancher de ${thresholds.floorPercent}% : validation bloquée.`,
    );
  } else if (grossMarginPercent < thresholds.targetPercent) {
    verdict = "AMBER";
    canValidate = true;
    warnings.push(
      `Marge ${grossMarginPercent}% sous la cible de ${thresholds.targetPercent}% : à valider en connaissance de cause.`,
    );
  } else {
    verdict = "GREEN";
    canValidate = true;
  }

  return {
    totalLandedCostCents: landed.totalLandedCostCents,
    salePriceCents,
    grossMarginCents,
    grossMarginPercent,
    verdict,
    canValidate,
    warnings,
  };
}
