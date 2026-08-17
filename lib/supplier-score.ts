/**
 * Supplier Intelligence — turns raw supplier metrics into a 0–100 score, a
 * badge, and reasons. A BLOCKED supplier is always surfaced as such and must be
 * excluded from normal deal use (enforced in matching.ts and margin flows).
 */

import type { Company, SupplierMetrics } from "./types";
import type { SupplierBadge, VerificationStatus } from "./enums";

export interface SupplierWeights {
  pricing: number;
  quality: number;
  reliability: number;
  availability: number;
  compliance: number;
  speed: number;
  communication: number;
  terms: number;
}

export const DEFAULT_SUPPLIER_WEIGHTS: SupplierWeights = {
  pricing: 0.16,
  quality: 0.2,
  reliability: 0.18,
  availability: 0.12,
  compliance: 0.14,
  speed: 0.08,
  communication: 0.06,
  terms: 0.06,
};

export interface SupplierScoreResult {
  score: number;
  badge: SupplierBadge;
  reasons: string[];
  /** True when the supplier must not be used in a normal deal. */
  blocked: boolean;
}

const clampMetric = (n: number) => Math.min(Math.max(n, 0), 100);

/**
 * Compute a weighted supplier score. `manualBadge` lets the CEO force a badge
 * (e.g. STRATEGIC or BLOCKED) regardless of the numeric score — a BLOCKED
 * override always wins.
 */
export function calculateSupplierScore(input: {
  metrics: SupplierMetrics;
  verification: VerificationStatus;
  qualityIncidents?: number;
  manualBadge?: SupplierBadge;
  weights?: SupplierWeights;
}): SupplierScoreResult {
  const weights = input.weights ?? DEFAULT_SUPPLIER_WEIGHTS;
  const m = input.metrics;

  let score =
    weights.pricing * clampMetric(m.pricing) +
    weights.quality * clampMetric(m.quality) +
    weights.reliability * clampMetric(m.reliability) +
    weights.availability * clampMetric(m.availability) +
    weights.compliance * clampMetric(m.compliance) +
    weights.speed * clampMetric(m.speed) +
    weights.communication * clampMetric(m.communication) +
    weights.terms * clampMetric(m.terms);

  const reasons: string[] = [];

  // Quality incidents reduce the score.
  const incidents = input.qualityIncidents ?? 0;
  if (incidents > 0) {
    score -= Math.min(incidents * 6, 30);
    reasons.push(`${incidents} incident(s) qualité enregistré(s)`);
  }

  // Unverified companies are penalized and can never exceed APPROVED.
  const unverified = input.verification !== "VERIFIED";
  if (unverified) {
    score -= 10;
    reasons.push("Société non vérifiée");
  }

  score = Math.round(Math.min(Math.max(score, 0), 100));

  // Badge from score, capped for unverified suppliers.
  let badge = badgeForScore(score);
  if (unverified && (badge === "STRATEGIC" || badge === "PREFERRED")) {
    badge = "APPROVED";
  }

  // Manual override.
  if (input.manualBadge) badge = input.manualBadge;

  const blocked = badge === "BLOCKED";
  if (blocked) reasons.unshift("Fournisseur BLOQUÉ : interdit dans les deals");

  if (m.pricing >= 80) reasons.push("Prix compétitifs");
  if (m.reliability >= 80) reasons.push("Très fiable sur les livraisons");
  if (m.compliance >= 80) reasons.push("Conformité documentaire solide");
  if (m.availability <= 40) reasons.push("Disponibilité limitée");

  if (reasons.length === 0) reasons.push("Profil standard");

  return { score, badge, reasons, blocked };
}

export function badgeForScore(score: number): SupplierBadge {
  if (score >= 85) return "STRATEGIC";
  if (score >= 70) return "PREFERRED";
  if (score >= 50) return "APPROVED";
  return "WATCH";
}

/** Resolve a supplier company's score using its stored metrics. */
export function scoreSupplierCompany(company: Company): SupplierScoreResult {
  if (!company.supplierMetrics) {
    return {
      score: 0,
      badge: "WATCH",
      reasons: ["Aucune métrique fournisseur"],
      blocked: false,
    };
  }
  const manualBadge = company.notes?.includes("[BLOCKED]") ? "BLOCKED" : undefined;
  return calculateSupplierScore({
    metrics: company.supplierMetrics,
    verification: company.verification,
    qualityIncidents: company.qualityIncidents,
    manualBadge,
  });
}
