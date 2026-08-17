/**
 * Buyer Intelligence — turns raw buyer metrics into a 0–100 score, a badge and
 * reasons. Mirrors supplier scoring but rewards volume, payment reliability,
 * closing speed, margin generated and loyalty.
 */

import type { Company, BuyerMetrics } from "./types";
import type { BuyerBadge, VerificationStatus } from "./enums";

export interface BuyerWeights {
  volume: number;
  frequency: number;
  paymentReliability: number;
  closingSpeed: number;
  marginGenerated: number;
  relationship: number;
  repeatPurchases: number;
}

export const DEFAULT_BUYER_WEIGHTS: BuyerWeights = {
  volume: 0.16,
  frequency: 0.12,
  paymentReliability: 0.22,
  closingSpeed: 0.14,
  marginGenerated: 0.16,
  relationship: 0.1,
  repeatPurchases: 0.1,
};

export interface BuyerReferences {
  /** Buying volume (kg) mapped to 1.0. */
  strongVolumeKg: number;
  /** Purchases per quarter mapped to 1.0. */
  strongFrequency: number;
  /** Gross margin generated (cents) mapped to 1.0. */
  strongMarginGeneratedCents: number;
  /** Repeat purchases mapped to 1.0. */
  strongRepeatPurchases: number;
}

export const DEFAULT_BUYER_REFERENCES: BuyerReferences = {
  strongVolumeKg: 50_000, // 50 t
  strongFrequency: 12,
  strongMarginGeneratedCents: 5_000_000, // €50,000
  strongRepeatPurchases: 10,
};

export interface BuyerScoreResult {
  score: number;
  badge: BuyerBadge;
  reasons: string[];
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const clamp100 = (n: number) => Math.min(Math.max(n, 0), 100);

export function calculateBuyerScore(input: {
  metrics: BuyerMetrics;
  verification: VerificationStatus;
  /** Days since last purchase — drives DORMANT detection. */
  inactivityDays?: number;
  manualBadge?: BuyerBadge;
  weights?: BuyerWeights;
  references?: BuyerReferences;
}): BuyerScoreResult {
  const weights = input.weights ?? DEFAULT_BUYER_WEIGHTS;
  const refs = input.references ?? DEFAULT_BUYER_REFERENCES;
  const m = input.metrics;

  const volumeN = clamp01(m.buyingVolumeKg / refs.strongVolumeKg);
  const frequencyN = clamp01(m.frequency / refs.strongFrequency);
  const paymentN = clamp01(m.paymentReliability / 100);
  const closingN = clamp01(m.closingSpeed / 100);
  const marginN = clamp01(m.grossMarginGeneratedCents / refs.strongMarginGeneratedCents);
  const relationshipN = clamp01(m.relationship / 100);
  const repeatN = clamp01(m.repeatPurchases / refs.strongRepeatPurchases);

  let score =
    100 *
    (weights.volume * volumeN +
      weights.frequency * frequencyN +
      weights.paymentReliability * paymentN +
      weights.closingSpeed * closingN +
      weights.marginGenerated * marginN +
      weights.relationship * relationshipN +
      weights.repeatPurchases * repeatN);

  const reasons: string[] = [];

  const inactivity = input.inactivityDays ?? 0;
  const dormant = inactivity >= 90;
  const risky = m.paymentReliability < 40;

  if (input.verification !== "VERIFIED") {
    score -= 8;
    reasons.push("Acheteur non vérifié");
  }
  if (risky) reasons.push("Fiabilité de paiement faible");
  if (dormant) reasons.push(`Aucun achat depuis ${inactivity} jours`);

  score = Math.round(clamp100(score));

  let badge = badgeForBuyer(score);
  if (risky) badge = "RISK";
  else if (dormant) badge = "DORMANT";
  if (input.manualBadge) badge = input.manualBadge;

  if (paymentN >= 0.85 && !risky) reasons.push("Paie de façon fiable");
  if (repeatN >= 0.6) reasons.push("Acheteur récurrent");
  if (marginN >= 0.6) reasons.push("Génère une bonne marge");

  if (reasons.length === 0) reasons.push("Profil standard");

  return { score, badge, reasons };
}

export function badgeForBuyer(score: number): BuyerBadge {
  if (score >= 80) return "VIP";
  if (score >= 55) return "ACTIVE";
  return "OCCASIONAL";
}

export function scoreBuyerCompany(company: Company, inactivityDays?: number): BuyerScoreResult {
  if (!company.buyerMetrics) {
    return { score: 0, badge: "OCCASIONAL", reasons: ["Aucune métrique acheteur"] };
  }
  const manualBadge = company.notes?.includes("[VIP]") ? "VIP" : undefined;
  return calculateBuyerScore({
    metrics: company.buyerMetrics,
    verification: company.verification,
    inactivityDays,
    manualBadge,
  });
}
