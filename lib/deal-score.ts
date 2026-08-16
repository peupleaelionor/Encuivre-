/**
 * Deal Priority Score — the single ranking that drives Focus Mode and the
 * "À faire aujourd'hui" list. Returns a 0–100 score, a level, and human-readable
 * reasons. The logic is intentionally NOT hidden: every factor and weight is
 * explicit and configurable.
 */

import type { Cents } from "./money";
import type { DealLevel } from "./enums";

export interface DealScoreFactors {
  /** Expected gross margin in %. */
  marginPotentialPercent: number;
  /** Total deal value in cents. */
  dealValueCents: Cents;
  /** Probability of closing, 0–1. */
  closeProbability: number;
  /** Buyer quality score, 0–100. */
  buyerQuality: number;
  /** Supplier quality score, 0–100. (Use 100 when selling from own stock.) */
  supplierQuality: number;
  /** Share of required documents already present, 0–1. */
  documentCompleteness: number;
  /** Urgency, 0–1 (deadline pressure — higher means act sooner). */
  urgency: number;
  /** Capital that must be immobilized, in cents (higher = penalized). */
  capitalRequirementCents: Cents;
  /** Overall risk, 0–1 (higher = penalized). */
  risk: number;
  /** Days since last activity (higher = penalized, deal going cold). */
  inactivityDays: number;
}

/** Weights for the positive contributors (should broadly sum to ~1 for readability). */
export interface DealScoreWeights {
  margin: number;
  value: number;
  closeProbability: number;
  buyerQuality: number;
  supplierQuality: number;
  documents: number;
  urgency: number;
}

export const DEFAULT_DEAL_WEIGHTS: DealScoreWeights = {
  margin: 0.24,
  value: 0.18,
  closeProbability: 0.18,
  buyerQuality: 0.12,
  supplierQuality: 0.08,
  documents: 0.1,
  urgency: 0.1,
};

/** Reference values used to normalize unbounded inputs. Configurable. */
export interface DealScoreReferences {
  /** Margin % that counts as "excellent" (maps to 1.0). */
  strongMarginPercent: number;
  /** Deal value (cents) that counts as "large" (maps to 1.0). */
  strongDealValueCents: Cents;
  /** Capital requirement (cents) that triggers the full capital penalty. */
  heavyCapitalCents: Cents;
  /** Inactivity (days) that triggers the full inactivity penalty. */
  staleInactivityDays: number;
}

export const DEFAULT_DEAL_REFERENCES: DealScoreReferences = {
  // Metals trading runs on thin margins: ~10% gross is already excellent.
  strongMarginPercent: 10,
  strongDealValueCents: 5_000_000, // €50,000
  heavyCapitalCents: 5_000_000, // €50,000 immobilized
  staleInactivityDays: 14,
};

/** Penalty weights (subtracted after the positive score). */
export interface DealScorePenalties {
  capital: number;
  risk: number;
  inactivity: number;
}

export const DEFAULT_DEAL_PENALTIES: DealScorePenalties = {
  capital: 0.08,
  risk: 0.2,
  inactivity: 0.12,
};

export interface DealScoreConfig {
  weights: DealScoreWeights;
  references: DealScoreReferences;
  penalties: DealScorePenalties;
}

export const DEFAULT_DEAL_SCORE_CONFIG: DealScoreConfig = {
  weights: DEFAULT_DEAL_WEIGHTS,
  references: DEFAULT_DEAL_REFERENCES,
  penalties: DEFAULT_DEAL_PENALTIES,
};

export interface DealScoreResult {
  score: number;
  level: DealLevel;
  reasons: string[];
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export function levelForScore(score: number): DealLevel {
  if (score >= 75) return "HOT";
  if (score >= 55) return "WARM";
  if (score >= 35) return "COOL";
  return "COLD";
}

/**
 * calculateDealPriorityScore — the heart of prioritization.
 */
export function calculateDealPriorityScore(
  factors: DealScoreFactors,
  config: DealScoreConfig = DEFAULT_DEAL_SCORE_CONFIG,
): DealScoreResult {
  const { weights, references, penalties } = config;

  const marginN = clamp01(factors.marginPotentialPercent / references.strongMarginPercent);
  const valueN = clamp01(factors.dealValueCents / references.strongDealValueCents);
  const closeN = clamp01(factors.closeProbability);
  const buyerN = clamp01(factors.buyerQuality / 100);
  const supplierN = clamp01(factors.supplierQuality / 100);
  const docsN = clamp01(factors.documentCompleteness);
  const urgencyN = clamp01(factors.urgency);

  const positive =
    weights.margin * marginN +
    weights.value * valueN +
    weights.closeProbability * closeN +
    weights.buyerQuality * buyerN +
    weights.supplierQuality * supplierN +
    weights.documents * docsN +
    weights.urgency * urgencyN;

  const capitalN = clamp01(factors.capitalRequirementCents / references.heavyCapitalCents);
  const riskN = clamp01(factors.risk);
  const inactivityN = clamp01(factors.inactivityDays / references.staleInactivityDays);

  const penalty =
    penalties.capital * capitalN + penalties.risk * riskN + penalties.inactivity * inactivityN;

  const raw = positive - penalty;
  const score = Math.round(clamp01(raw) * 100);
  const level = levelForScore(score);

  const reasons = buildReasons(factors, {
    marginN,
    valueN,
    closeN,
    buyerN,
    supplierN,
    docsN,
    urgencyN,
    capitalN,
    riskN,
    inactivityN,
  });

  return { score, level, reasons };
}

interface NormalizedFactors {
  marginN: number;
  valueN: number;
  closeN: number;
  buyerN: number;
  supplierN: number;
  docsN: number;
  urgencyN: number;
  capitalN: number;
  riskN: number;
  inactivityN: number;
}

function buildReasons(factors: DealScoreFactors, n: NormalizedFactors): string[] {
  const reasons: string[] = [];

  if (n.marginN >= 0.66) reasons.push(`Marge attendue élevée (${factors.marginPotentialPercent}%)`);
  else if (n.marginN <= 0.2) reasons.push(`Marge attendue faible (${factors.marginPotentialPercent}%)`);

  if (n.valueN >= 0.66) reasons.push("Deal de gros volume / forte valeur");
  if (n.closeN >= 0.7) reasons.push("Probabilité de closing élevée");
  else if (n.closeN <= 0.25) reasons.push("Closing incertain");

  if (n.buyerN >= 0.8) reasons.push("Acheteur de qualité (vérifié / fidèle)");
  if (n.supplierN >= 0.8) reasons.push("Fournisseur fiable");
  if (n.docsN >= 0.9) reasons.push("Documents complets");
  else if (n.docsN <= 0.5) reasons.push("Documents incomplets");

  if (n.urgencyN >= 0.7) reasons.push("Échéance proche : à traiter vite");
  if (n.riskN >= 0.5) reasons.push("Risque élevé : revue nécessaire");
  if (n.capitalN >= 0.7) reasons.push("Immobilise beaucoup de capital");
  if (n.inactivityN >= 0.7)
    reasons.push(`Sans activité depuis ${factors.inactivityDays} jours : deal qui refroidit`);

  if (reasons.length === 0) reasons.push("Deal standard, aucun signal fort");
  return reasons;
}
