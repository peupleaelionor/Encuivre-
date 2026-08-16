/**
 * Risk & document-readiness helpers.
 *
 * IMPORTANT: this is NOT a sanctions-screening solution. SANCTIONS_REVIEW_REQUIRED
 * only routes a case to a human — no automated list matching is performed. See
 * docs/risk-controls.md.
 */

import type { RiskFlag } from "./enums";
import type { TrackedDocument } from "./types";
import { repo, type Repository } from "./store";

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
