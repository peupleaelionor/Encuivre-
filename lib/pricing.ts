/**
 * Pricing engine — landed cost, quote price and gross margin.
 *
 * All money is integer cents (lib/money.ts). Prices are cents PER TONNE,
 * quantities are kilograms. No naive floats. Rounding happens once per step.
 */

import { applyPercent, marginPercent, priceForKg, roundCents, sum, type Cents } from "./money";

export interface LandedCostInput {
  /** Purchase price in cents per tonne. */
  purchasePricePerTonneCents: Cents;
  quantityKg: number;
  transportCents?: Cents;
  insuranceCents?: Cents;
  /** Customs + handling fees. */
  customsFeesCents?: Cents;
  /** Cost of financing the position. */
  financingCents?: Cents;
  otherCostsCents?: Cents;
}

export interface LandedCostBreakdown {
  purchaseCostCents: Cents;
  transportCents: Cents;
  insuranceCents: Cents;
  customsFeesCents: Cents;
  financingCents: Cents;
  otherCostsCents: Cents;
  totalLandedCostCents: Cents;
}

/** Compute the total landed cost for a position. */
export function calculateLandedCost(input: LandedCostInput): LandedCostBreakdown {
  const purchaseCostCents = priceForKg(input.purchasePricePerTonneCents, input.quantityKg);
  const transportCents = input.transportCents ?? 0;
  const insuranceCents = input.insuranceCents ?? 0;
  const customsFeesCents = input.customsFeesCents ?? 0;
  const financingCents = input.financingCents ?? 0;
  const otherCostsCents = input.otherCostsCents ?? 0;

  return {
    purchaseCostCents,
    transportCents,
    insuranceCents,
    customsFeesCents,
    financingCents,
    otherCostsCents,
    totalLandedCostCents: sum(
      purchaseCostCents,
      transportCents,
      insuranceCents,
      customsFeesCents,
      financingCents,
      otherCostsCents,
    ),
  };
}

export interface QuoteInput extends LandedCostInput {
  /** Desired gross margin as a percentage of the sale price, e.g. 10 for 10%. */
  desiredMarginPercent: number;
}

export interface QuoteResult {
  landedCost: LandedCostBreakdown;
  totalLandedCostCents: Cents;
  /** Total sale price for the whole lot (cents). */
  quotePriceCents: Cents;
  /** Sale price expressed in cents per tonne. */
  quotePricePerTonneCents: Cents;
  grossMarginCents: Cents;
  grossMarginPercent: number;
}

/**
 * Build a quote from costs and a desired margin.
 *
 * We treat desiredMarginPercent as a margin ON the sale price (mark-on), which
 * is the honest way traders quote: quotePrice = landedCost / (1 - margin/100).
 * A 100% margin would be undefined, so we clamp the divisor.
 */
export function calculateQuote(input: QuoteInput): QuoteResult {
  const landedCost = calculateLandedCost(input);
  const totalLandedCostCents = landedCost.totalLandedCostCents;

  const marginFraction = Math.min(Math.max(input.desiredMarginPercent, 0), 95) / 100;
  const quotePriceCents = roundCents(totalLandedCostCents / (1 - marginFraction));
  const grossMarginCents = quotePriceCents - totalLandedCostCents;
  const grossMarginPercent = marginPercent(quotePriceCents, totalLandedCostCents);

  const quotePricePerTonneCents =
    input.quantityKg > 0 ? roundCents((quotePriceCents * 1000) / input.quantityKg) : 0;

  return {
    landedCost,
    totalLandedCostCents,
    quotePriceCents,
    quotePricePerTonneCents,
    grossMarginCents,
    grossMarginPercent,
  };
}

/** Gross margin (cents) for an explicit sale price and landed cost. */
export function grossMargin(salePriceCents: Cents, totalLandedCostCents: Cents): Cents {
  return salePriceCents - totalLandedCostCents;
}

/** Convenience: apply a percentage uplift to a landed cost (used in previews). */
export function withMarkup(landedCostCents: Cents, markupPercent: number): Cents {
  return landedCostCents + applyPercent(landedCostCents, markupPercent);
}
