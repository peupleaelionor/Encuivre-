/**
 * Application services — the authorization boundary between the UI and the
 * repository. Every sensitive read/write goes through here with an explicit
 * AuthContext; permissions are checked server-side via lib/auth/rbac. A hidden
 * button is never a security control (Sprint §10).
 */

import { repo } from "../store";
import { assertCan, can, isInternalUser, scopedOrganizationIds, type AuthContext } from "../auth/rbac";
import type { BuyRequest, Company, Deal, Quote, SellOffer } from "../types";

function companyScope(c: Company) {
  return { ownerOrganizationId: c.ownerOrganizationId, accountOrganizationId: c.accountOrganizationId };
}

/** Whether the user may see internal margin/cost figures. */
export function canViewInternalMargin(ctx: AuthContext): boolean {
  return can(ctx, "VIEW_INTERNAL_MARGIN");
}

/** Companies visible to the user (internal → all; portal → own account only). */
export async function getVisibleCompanies(ctx: AuthContext): Promise<Company[]> {
  const all = await repo.companies();
  if (isInternalUser(ctx)) return all;
  const orgs = new Set(scopedOrganizationIds(ctx));
  return all.filter((c) => c.accountOrganizationId && orgs.has(c.accountOrganizationId));
}

/** A single company, enforcing VIEW_COMPANY + scope. Returns undefined if hidden. */
export async function getCompanyFor(ctx: AuthContext, id: string): Promise<Company | undefined> {
  const c = await repo.company(id);
  if (!c) return undefined;
  return can(ctx, "VIEW_COMPANY", companyScope(c)) ? c : undefined;
}

/** Deals visible to the user (internal → all; portal → deals with their company). */
export async function getVisibleDeals(ctx: AuthContext): Promise<Deal[]> {
  const all = await repo.deals();
  if (isInternalUser(ctx)) return all;
  const companies = await repo.companies();
  const orgs = new Set(scopedOrganizationIds(ctx));
  const myCompanyIds = new Set(
    companies.filter((c) => c.accountOrganizationId && orgs.has(c.accountOrganizationId)).map((c) => c.id),
  );
  return all.filter((d) => myCompanyIds.has(d.buyerId) || (d.supplierId ? myCompanyIds.has(d.supplierId) : false));
}

// ---------- writes (permission-checked) ----------

export async function createSellOfferFor(
  ctx: AuthContext,
  input: Omit<SellOffer, "id" | "createdAt">,
): Promise<SellOffer> {
  assertCan(ctx, "CREATE_OFFER");
  return repo.createSellOffer(input);
}

export async function createBuyRequestFor(
  ctx: AuthContext,
  input: Omit<BuyRequest, "id" | "createdAt">,
): Promise<BuyRequest> {
  assertCan(ctx, "CREATE_REQUEST");
  return repo.createBuyRequest(input);
}

export async function createDealFor(ctx: AuthContext, input: Omit<Deal, "id" | "createdAt">): Promise<Deal> {
  assertCan(ctx, "CREATE_DEAL");
  return repo.createDeal(input);
}

export async function createQuoteFor(ctx: AuthContext, input: Omit<Quote, "id" | "createdAt">): Promise<Quote> {
  assertCan(ctx, "CREATE_QUOTE");
  return repo.createQuote(input);
}
