/**
 * Risk & document-readiness helpers.
 *
 * IMPORTANT: this is NOT a sanctions-screening solution. SANCTIONS_REVIEW_REQUIRED
 * only routes a case to a human — no automated list matching is performed. See
 * docs/risk-controls.md.
 */

import { RISK_FLAG_LABELS, type RiskFlag } from "./enums";
import type { Company, Deal, SellOffer, TrackedDocument } from "./types";
import { repo, type Repository } from "./store";
import { referencePrice } from "./market";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DocumentExpiryAlert {
  documentId: string;
  type: string;
  companyId?: string;
  dealId?: string;
  status: "EXPIRED" | "EXPIRING_SOON";
  daysToExpiry: number;
}

/** Documents expired or expiring within `soonDays`. */
export function documentExpiryAlerts(
  now: Date = new Date(),
  soonDays = 30,
  r: Repository = repo,
): DocumentExpiryAlert[] {
  const alerts: DocumentExpiryAlert[] = [];
  for (const doc of r.documents()) {
    if (!doc.expiryDate) continue;
    const days = Math.floor((new Date(doc.expiryDate).getTime() - now.getTime()) / DAY_MS);
    if (days < 0) {
      alerts.push(toAlert(doc, "EXPIRED", days));
    } else if (days <= soonDays) {
      alerts.push(toAlert(doc, "EXPIRING_SOON", days));
    }
  }
  return alerts.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
}

function toAlert(
  doc: TrackedDocument,
  status: "EXPIRED" | "EXPIRING_SOON",
  daysToExpiry: number,
): DocumentExpiryAlert {
  return { documentId: doc.id, type: doc.type, companyId: doc.companyId, dealId: doc.dealId, status, daysToExpiry };
}

/** How far below the market reference a price becomes suspicious. */
export const PRICE_TOO_GOOD_RATIO = 0.7;

export interface RiskAssessmentInput {
  company?: Company;
  offer?: SellOffer;
  deal?: Deal;
  /** Tracked documents relevant to the offer/deal (for expiry detection). */
  trackedDocuments?: TrackedDocument[];
  now?: Date;
}

export interface RiskAssessment {
  flags: RiskFlag[];
  reasons: string[];
  /** True when at least one flag forces a human review. */
  humanReviewRequired: boolean;
}

/**
 * Derive structured risk flags from an offer / deal / company.
 *
 * This is deliberately conservative and explainable. It NEVER fabricates a
 * sanctions match — `SANCTIONS_REVIEW_REQUIRED` is only surfaced if it was
 * already set on the deal; unknown-country cases route to MANUAL_REVIEW so a
 * human decides (see docs/risk-controls.md).
 */
export function deriveRiskFlags(input: RiskAssessmentInput): RiskAssessment {
  const now = input.now ?? new Date();
  const flags = new Set<RiskFlag>();
  const { company, offer, deal } = input;

  // Carry over any flags already recorded on the deal (e.g. sanctions/bank change).
  for (const f of deal?.riskFlags ?? []) flags.add(f);

  if (company && company.verification !== "VERIFIED") {
    flags.add("UNVERIFIED_COMPANY");
  }

  // Suspiciously cheap offer vs the market reference.
  if (offer) {
    const ref = referencePrice(offer.material);
    if (ref && offer.pricePerTonneCents > 0 && offer.pricePerTonneCents < ref * PRICE_TOO_GOOD_RATIO) {
      flags.add("PRICE_TOO_GOOD");
    }
    if (offer.quantityKg <= 0) flags.add("INCONSISTENT_QUANTITY");
    if (!offer.documents.includes("ORIGIN") && isCrossBorder(offer.country)) {
      flags.add("MISSING_ORIGIN");
    }
    if (!offer.documents.includes("COA") && needsCoa(offer.material)) {
      flags.add("MISSING_COA");
    }
  }

  // Deal-level document gaps and quantity coherence.
  if (deal) {
    if (!deal.documents.includes("ORIGIN") && (deal.stage === "CONTRACT" || deal.businessLine === "CONGO")) {
      flags.add("MISSING_ORIGIN");
    }
    if (!deal.documents.includes("COA") && needsCoa(deal.material)) {
      flags.add("MISSING_COA");
    }
    if (company?.capacityKg && deal.quantityKg > company.capacityKg) {
      flags.add("INCONSISTENT_QUANTITY");
    }
  }

  // Expired documents force review.
  for (const doc of input.trackedDocuments ?? []) {
    if (doc.expiryDate && new Date(doc.expiryDate).getTime() < now.getTime()) {
      flags.add("DOCUMENT_EXPIRED");
    }
  }

  // Unknown-country counterparties route to a human, not a fake auto-screen.
  if (company && isUnknownCountry(company.country)) {
    flags.add("MANUAL_REVIEW");
  }

  // Congo corridor (V1) with an unverified counterparty: extra caution, a human
  // decides. This is a routing rule, not an automated compliance verdict.
  const congo = company?.businessLine === "CONGO" || deal?.businessLine === "CONGO";
  if (congo && company && company.verification !== "VERIFIED") {
    flags.add("MANUAL_REVIEW");
  }

  const list = [...flags];
  return {
    flags: list,
    reasons: list.map((f) => RISK_FLAG_LABELS[f]),
    humanReviewRequired: requiresHumanReview(list),
  };
}

function isCrossBorder(country: string): boolean {
  return country.trim().toLowerCase() !== "france";
}

function isUnknownCountry(country: string): boolean {
  const c = country.trim().toLowerCase();
  return c === "" || c === "inconnu" || c === "unknown";
}

function needsCoa(material: string): boolean {
  // Refined/high-purity materials trade on a Certificate of Analysis.
  return material === "COPPER_CATHODE_GRADE_A" || material === "COPPER_MILLBERRY";
}

/**
 * A flag requires forced human review before a deal can proceed. Sanctions and
 * bank-change flags always force review; unverified/price-too-good are advisory
 * but still surfaced.
 */
export function requiresHumanReview(flags: RiskFlag[]): boolean {
  const blocking: RiskFlag[] = [
    "SANCTIONS_REVIEW_REQUIRED",
    "BANK_ACCOUNT_CHANGED",
    "MANUAL_REVIEW",
    "DOCUMENT_EXPIRED",
  ];
  return flags.some((f) => blocking.includes(f));
}
