/**
 * Dashboard aggregation — turns the repository + engines into the CEO Command
 * Center KPIs, "À faire aujourd'hui", and Focus Mode.
 *
 * The repository is async (PostgreSQL). To avoid N+1 awaits, each exported
 * function loads the data it needs once, builds an in-memory company lookup, and
 * runs the (synchronous, pure) engines over it.
 */

import { marginPercent, priceForKg, type Cents } from "./money";
import { calculateDealPriorityScore } from "./deal-score";
import { scoreSupplierCompany } from "./supplier-score";
import { scoreBuyerCompany } from "./buyer-score";
import { bucketFollowUps, deriveDealAlerts, type DealAlert } from "./follow-ups";
import { deriveRiskFlags } from "./risk";
import { repo, type Repository } from "./store";
import type { Company, Deal, ScoredDeal } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const OPEN_STAGES = ["LEAD", "QUALIFIED", "QUOTED", "NEGOTIATION", "CONTRACT"] as const;

type CompanyLookup = Map<string, Company>;

export function isOpen(deal: Deal): boolean {
  return (OPEN_STAGES as readonly string[]).includes(deal.stage);
}

function lookupOf(companies: Company[]): CompanyLookup {
  return new Map(companies.map((c) => [c.id, c]));
}

function daysSince(iso: string | undefined, now: Date): number {
  if (!iso) return 999;
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

function urgencyFor(deal: Deal, now: Date): number {
  const target = deal.nextActionAt ?? deal.createdAt;
  const days = (new Date(target).getTime() - now.getTime()) / DAY_MS;
  if (days <= 0) return 1;
  if (days <= 2) return 0.8;
  if (days <= 7) return 0.5;
  return 0.2;
}

function riskFor(deal: Deal, supplierVerified: boolean): number {
  let risk = Math.min(deal.riskFlags.length * 0.2, 0.6);
  if (!supplierVerified) risk += 0.2;
  return Math.min(risk, 1);
}

/** The total sale value of a deal, in cents. */
export function dealValueCents(deal: Deal): Cents {
  return priceForKg(deal.salePricePerTonneCents, deal.quantityKg);
}

/** The purchase cost of a deal (capital immobilized), in cents. */
export function dealPurchaseCents(deal: Deal): Cents {
  return priceForKg(deal.purchasePricePerTonneCents, deal.quantityKg);
}

/** Expected gross margin of a deal, in cents. */
export function dealMarginCents(deal: Deal): Cents {
  return dealValueCents(deal) - dealPurchaseCents(deal);
}

/** Score a single deal (pure) using a preloaded company lookup. */
export function scoreDealWith(deal: Deal, companies: CompanyLookup, now: Date): ScoredDeal {
  const buyer = companies.get(deal.buyerId);
  const supplier = deal.supplierId ? companies.get(deal.supplierId) : undefined;

  const buyerQuality = buyer ? scoreBuyerCompany(buyer).score : 50;
  const supplierQuality = supplier ? scoreSupplierCompany(supplier).score : 100;
  const supplierVerified = supplier ? supplier.verification === "VERIFIED" : true;

  const saleCents = dealValueCents(deal);
  const costCents = dealPurchaseCents(deal);
  const margin = marginPercent(saleCents, costCents);

  const { score, level, reasons } = calculateDealPriorityScore({
    marginPotentialPercent: margin,
    dealValueCents: saleCents,
    closeProbability: deal.closeProbability,
    buyerQuality,
    supplierQuality,
    documentCompleteness: Math.min(1, deal.documents.length / 3),
    urgency: urgencyFor(deal, now),
    capitalRequirementCents: costCents,
    risk: riskFor(deal, supplierVerified),
    inactivityDays: daysSince(deal.lastContactAt, now),
  });

  return { ...deal, priorityScore: score, priorityLevel: level, reasons };
}

export async function scoredOpenDeals(now: Date = new Date(), r: Repository = repo): Promise<ScoredDeal[]> {
  const [deals, companies] = await Promise.all([r.deals(), r.companies()]);
  const lookup = lookupOf(companies);
  return deals
    .filter(isOpen)
    .map((d) => scoreDealWith(d, lookup, now))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export interface Kpi {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

/** The <= 8 headline KPIs for the CEO command center. */
export async function ceoKpis(now: Date = new Date(), r: Repository = repo): Promise<Kpi[]> {
  const [deals, companies, buyRequests, sellOffers] = await Promise.all([
    r.deals(),
    r.companies(),
    r.buyRequests(),
    r.sellOffers(),
  ]);
  const lookup = lookupOf(companies);
  const openDeals = deals.filter(isOpen);
  const pipeline = openDeals.reduce((acc, d) => acc + dealValueCents(d), 0);
  const potentialMargin = openDeals.reduce((acc, d) => acc + dealMarginCents(d), 0);
  const scored = openDeals.map((d) => scoreDealWith(d, lookup, now));
  const hot = scored.filter((d) => d.priorityLevel === "HOT").length;

  const toRelaunch = openDeals.filter(
    (d) => d.nextActionAt && new Date(d.nextActionAt).getTime() < now.getTime(),
  ).length;

  const activeBuyers = companies
    .filter((c) => c.role === "BUYER" || c.role === "BOTH")
    .filter((c) => {
      const s = scoreBuyerCompany(c, daysSince(c.lastContactAt, now));
      return s.badge === "VIP" || s.badge === "ACTIVE";
    }).length;

  const strategicSuppliers = companies
    .filter((c) => c.role === "SUPPLIER" || c.role === "BOTH")
    .filter((c) => {
      const s = scoreSupplierCompany(c);
      return s.badge === "STRATEGIC" || s.badge === "PREFERRED";
    }).length;

  const volumeDemanded = buyRequests.reduce((acc, br) => acc + br.quantityKg, 0);
  const volumeAvailable = sellOffers.reduce((acc, so) => acc + so.quantityKg, 0);

  return [
    { key: "pipeline", label: "Pipeline potentiel", value: formatEur(pipeline), hint: `${openDeals.length} deals ouverts` },
    { key: "margin", label: "Marge potentielle", value: formatEur(potentialMargin) },
    { key: "hot", label: "Deals HOT", value: String(hot) },
    { key: "relaunch", label: "Deals à relancer", value: String(toRelaunch) },
    { key: "buyers", label: "Acheteurs actifs", value: String(activeBuyers) },
    { key: "suppliers", label: "Fournisseurs stratégiques", value: String(strategicSuppliers) },
    { key: "demand", label: "Volume demandé", value: formatKg(volumeDemanded) },
    { key: "supply", label: "Volume disponible", value: formatKg(volumeAvailable) },
  ];
}

export interface TodayAction {
  title: string;
  company: string;
  potentialValue: string;
  reason: string;
  deadline: string;
  href: string;
}

/** Max 5 concrete actions for today, ranked by deal priority + overdue alerts. */
export async function todayActions(now: Date = new Date(), r: Repository = repo): Promise<TodayAction[]> {
  const scored = await scoredOpenDeals(now, r);
  const companies = lookupOf(await r.companies());
  const actions: TodayAction[] = [];

  for (const deal of scored) {
    if (!deal.nextAction) continue;
    const buyer = companies.get(deal.buyerId);
    const overdue = deal.nextActionAt ? new Date(deal.nextActionAt).getTime() < now.getTime() : false;
    actions.push({
      title: deal.nextAction,
      company: buyer?.displayName ?? deal.buyerId,
      potentialValue: formatEur(dealMarginCents(deal)),
      reason: overdue
        ? `${deal.priorityLevel} · échéance dépassée`
        : `${deal.priorityLevel} · ${deal.reasons[0] ?? "priorité élevée"}`,
      deadline: deal.nextActionAt ? formatDeadline(deal.nextActionAt, now) : "—",
      href: `/focus`,
    });
    if (actions.length >= 5) break;
  }

  return actions;
}

/** Focus Mode — the 3 priorities of the day. */
export async function focusPriorities(now: Date = new Date(), r: Repository = repo): Promise<ScoredDeal[]> {
  return (await scoredOpenDeals(now, r)).slice(0, 3);
}

/** All open-deal alerts (used on follow-ups & CEO pages). */
export async function allDealAlerts(now: Date = new Date(), r: Repository = repo): Promise<DealAlert[]> {
  const deals = await r.deals();
  return deals.filter(isOpen).flatMap((d) => deriveDealAlerts(d, now));
}

export async function followUpBuckets(now: Date = new Date(), r: Repository = repo) {
  return bucketFollowUps(await r.followUps(), now);
}

export interface DealReview {
  dealId: string;
  title: string;
  reasons: string[];
}

/** Open deals whose derived risk flags force a human review (Step 21). */
export async function dealsNeedingReview(now: Date = new Date(), r: Repository = repo): Promise<DealReview[]> {
  const [deals, companies, docs] = await Promise.all([r.deals(), r.companies(), r.documents()]);
  const lookup = lookupOf(companies);
  const reviews: DealReview[] = [];
  for (const deal of deals.filter(isOpen)) {
    const company = deal.supplierId ? lookup.get(deal.supplierId) : lookup.get(deal.buyerId);
    const dealDocs = docs.filter((d) => d.dealId === deal.id);
    const assessment = deriveRiskFlags({ company, deal, trackedDocuments: dealDocs, now });
    if (assessment.humanReviewRequired) {
      reviews.push({ dealId: deal.id, title: deal.title, reasons: assessment.reasons });
    }
  }
  return reviews;
}

// ---- local formatting ----

function formatEur(cents: Cents): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function formatKg(kg: number): string {
  if (kg >= 1000) return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(kg / 1000)} t`;
  return `${new Intl.NumberFormat("fr-FR").format(kg)} kg`;
}

function formatDeadline(iso: string, now: Date): string {
  const days = Math.round((new Date(iso).getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return `en retard de ${Math.abs(days)} j`;
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  return `dans ${days} j`;
}
