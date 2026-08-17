/**
 * Follow-up engine — "aucun deal ne doit disparaître".
 *
 * Buckets follow-ups into Today / Overdue / Next 7 days / No activity, and
 * derives structured alerts (offer unanswered, contract unsigned, documents
 * missing, dormant client, supplier not chased). All time logic takes an
 * explicit `now` so it is deterministic and testable.
 */

import type { Deal, FollowUp } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface FollowUpBuckets {
  today: FollowUp[];
  overdue: FollowUp[];
  next7Days: FollowUp[];
  noActivity: FollowUp[];
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Bucket follow-ups relative to `now`. Only open (not done) items are bucketed. */
export function bucketFollowUps(
  followUps: FollowUp[],
  now: Date,
  noActivityDays = 21,
): FollowUpBuckets {
  const todayStart = startOfDay(now);
  const todayEnd = todayStart + DAY_MS;
  const in7Days = todayStart + 7 * DAY_MS;

  const buckets: FollowUpBuckets = { today: [], overdue: [], next7Days: [], noActivity: [] };

  for (const f of followUps) {
    if (f.done) continue;
    const due = new Date(f.dueAt).getTime();

    if (due < todayStart) {
      buckets.overdue.push(f);
    } else if (due >= todayStart && due < todayEnd) {
      buckets.today.push(f);
    } else if (due >= todayEnd && due <= in7Days) {
      buckets.next7Days.push(f);
    }

    // "No activity" is orthogonal: last contact older than the window.
    if (f.lastContactAt) {
      const last = new Date(f.lastContactAt).getTime();
      if (now.getTime() - last >= noActivityDays * DAY_MS) {
        buckets.noActivity.push(f);
      }
    } else {
      buckets.noActivity.push(f);
    }
  }

  const byDue = (a: FollowUp, b: FollowUp) =>
    new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  buckets.today.sort(byDue);
  buckets.overdue.sort(byDue);
  buckets.next7Days.sort(byDue);

  return buckets;
}

export interface DealAlert {
  dealId: string;
  kind:
    | "OFFER_UNANSWERED"
    | "CONTRACT_UNSIGNED"
    | "DOCUMENTS_MISSING"
    | "DORMANT_CLIENT"
    | "SUPPLIER_NOT_CHASED";
  message: string;
  ageDays: number;
}

export interface AlertThresholds {
  offerUnansweredDays: number;
  dormantClientDays: number;
  supplierNotChasedDays: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  offerUnansweredDays: 3,
  dormantClientDays: 45,
  supplierNotChasedDays: 7,
};

function ageInDays(iso: string | undefined, now: Date): number {
  if (!iso) return Infinity;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS);
}

/** Derive alerts from a deal's state relative to `now`. */
export function deriveDealAlerts(
  deal: Deal,
  now: Date,
  thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS,
): DealAlert[] {
  const alerts: DealAlert[] = [];
  const lastAge = ageInDays(deal.lastContactAt, now);

  if (deal.stage === "QUOTED" && lastAge >= thresholds.offerUnansweredDays) {
    alerts.push({
      dealId: deal.id,
      kind: "OFFER_UNANSWERED",
      message: `Offre sans réponse depuis ${lastAge} j`,
      ageDays: lastAge,
    });
  }

  if (deal.stage === "CONTRACT" && !deal.documents.includes("CONTRACT")) {
    alerts.push({
      dealId: deal.id,
      kind: "CONTRACT_UNSIGNED",
      message: "Contrat non signé",
      ageDays: lastAge === Infinity ? 0 : lastAge,
    });
  }

  const needsCoa = !deal.documents.includes("COA");
  const needsOrigin = !deal.documents.includes("ORIGIN");
  if ((deal.stage === "CONTRACT" || deal.stage === "NEGOTIATION") && (needsCoa || needsOrigin)) {
    const missing = [needsCoa ? "COA" : null, needsOrigin ? "Origine" : null]
      .filter(Boolean)
      .join(", ");
    alerts.push({
      dealId: deal.id,
      kind: "DOCUMENTS_MISSING",
      message: `Documents manquants : ${missing}`,
      ageDays: lastAge === Infinity ? 0 : lastAge,
    });
  }

  if (
    (deal.stage === "LEAD" || deal.stage === "QUALIFIED" || deal.stage === "NEGOTIATION") &&
    lastAge >= thresholds.dormantClientDays
  ) {
    alerts.push({
      dealId: deal.id,
      kind: "DORMANT_CLIENT",
      message: `Client dormant : ${lastAge} j sans contact`,
      ageDays: lastAge,
    });
  }

  if (
    deal.supplierId &&
    deal.stage === "NEGOTIATION" &&
    lastAge >= thresholds.supplierNotChasedDays
  ) {
    alerts.push({
      dealId: deal.id,
      kind: "SUPPLIER_NOT_CHASED",
      message: `Fournisseur non relancé depuis ${lastAge} j`,
      ageDays: lastAge,
    });
  }

  return alerts;
}
