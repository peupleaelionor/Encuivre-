/**
 * Quick Sales matching engine — answers "que puis-je vendre rapidement ?" by
 * matching SellOffers to BuyRequests.
 *
 * Hard filters (must all pass):
 *   - same material
 *   - grade compatibility (offer grade satisfies the request's min grade)
 *   - a BLOCKED supplier is never matched into a deal
 *
 * Soft factors feed a 0–100 compatibility score and a 0–100 risk score:
 *   - quantity fit, geography, price gap, document readiness, buyer/supplier scores.
 */

import { gradeSatisfies, type Material } from "./enums";
import { priceForKg, roundCents, marginPercent, type Cents } from "./money";
import type { BuyRequest, Company, SellOffer } from "./types";
import { scoreSupplierCompany } from "./supplier-score";
import { scoreBuyerCompany } from "./buyer-score";

export interface MatchResult {
  offer: SellOffer;
  request: BuyRequest;
  supplier: Company;
  buyer: Company;
  material: Material;
  /** Volume that can actually be moved (min of offer/request). */
  matchableQuantityKg: number;
  /** Indicative purchase cost for the matchable volume (cents). */
  indicativeCostCents: Cents;
  /** Indicative sale price for the matchable volume (cents). */
  indicativePriceCents: Cents;
  grossMarginCents: Cents;
  grossMarginPercent: number;
  /** 0–100 how well offer and request fit. */
  compatibilityScore: number;
  /** 0–100 risk of this match (higher = riskier). */
  riskScore: number;
  reasons: string[];
}

export interface MatchOptions {
  /** Only return matches with a positive gross margin. Default true. */
  requirePositiveMargin?: boolean;
  /** Minimum compatibility score to include. Default 0. */
  minCompatibility?: number;
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

function sameGeography(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Find all viable matches, best compatibility first.
 */
export function findMatches(
  offers: SellOffer[],
  requests: BuyRequest[],
  companies: Company[],
  options: MatchOptions = {},
): MatchResult[] {
  const { requirePositiveMargin = true, minCompatibility = 0 } = options;
  const byId = new Map(companies.map((c) => [c.id, c]));
  const results: MatchResult[] = [];

  for (const offer of offers) {
    const supplier = byId.get(offer.supplierId);
    if (!supplier) continue;

    // Hard rule: BLOCKED suppliers are excluded from matching entirely.
    const supplierScore = scoreSupplierCompany(supplier);
    if (supplierScore.blocked) continue;

    for (const request of requests) {
      if (offer.material !== request.material) continue;
      if (!gradeSatisfies(offer.grade, request.minGrade)) continue;

      const buyer = byId.get(request.buyerId);
      if (!buyer) continue;

      const match = buildMatch(offer, request, supplier, buyer, supplierScore.score);
      if (requirePositiveMargin && match.grossMarginCents <= 0) continue;
      if (match.compatibilityScore < minCompatibility) continue;
      results.push(match);
    }
  }

  return results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

function buildMatch(
  offer: SellOffer,
  request: BuyRequest,
  supplier: Company,
  buyer: Company,
  supplierScore: number,
): MatchResult {
  const matchableQuantityKg = Math.min(offer.quantityKg, request.quantityKg);
  const indicativeCostCents = priceForKg(offer.pricePerTonneCents, matchableQuantityKg);
  const indicativePriceCents = priceForKg(request.targetPricePerTonneCents, matchableQuantityKg);
  const grossMarginCents = indicativePriceCents - indicativeCostCents;
  const grossMarginPercent = marginPercent(indicativePriceCents, indicativeCostCents);

  const buyerScore = scoreBuyerCompany(buyer);

  // --- Compatibility factors (0..1) ---
  const reasons: string[] = [];

  // Quantity fit: how much of the request the offer covers.
  const quantityFit = clamp01(matchableQuantityKg / Math.max(request.quantityKg, 1));
  if (quantityFit >= 0.99) reasons.push("Volume entièrement couvert");
  else if (quantityFit < 0.5) reasons.push("Volume partiellement couvert");

  // Geography: same location is best, same country next.
  let geoFit = 0.4;
  if (sameGeography(offer.location, request.location)) {
    geoFit = 1;
    reasons.push("Même localisation");
  } else if (sameGeography(offer.country, request.country)) {
    geoFit = 0.75;
    reasons.push("Même pays");
  } else {
    reasons.push("Logistique internationale");
  }

  // Price fit: positive margin is good; the bigger the margin %, the better.
  const priceFit = clamp01(grossMarginPercent / 15);
  if (grossMarginPercent >= 10) reasons.push(`Marge attractive (${grossMarginPercent}%)`);
  else if (grossMarginPercent <= 0) reasons.push("Pas de marge à ce prix");

  // Documents readiness on the offer.
  const docFit = clamp01(offer.documents.length / 3);
  if (offer.documents.length >= 3) reasons.push("Documents prêts côté offre");

  const supplierN = clamp01(supplierScore / 100);
  const buyerN = clamp01(buyerScore.score / 100);

  const compatibilityScore = Math.round(
    100 *
      (0.28 * priceFit +
        0.22 * quantityFit +
        0.15 * geoFit +
        0.12 * docFit +
        0.12 * supplierN +
        0.11 * buyerN),
  );

  // --- Risk factors (0..1, higher = riskier) ---
  let risk = 0;
  if (supplier.verification !== "VERIFIED") {
    risk += 0.25;
    reasons.push("Fournisseur non vérifié");
  }
  if (buyer.verification !== "VERIFIED") risk += 0.15;
  if (offer.documents.length === 0) {
    risk += 0.2;
    reasons.push("Aucun document sur l'offre");
  }
  if (grossMarginPercent <= 0) risk += 0.2;
  if (buyerScore.badge === "RISK") {
    risk += 0.25;
    reasons.push("Acheteur à risque");
  }
  const riskScore = Math.round(clamp01(risk) * 100);

  return {
    offer,
    request,
    supplier,
    buyer,
    material: offer.material,
    matchableQuantityKg,
    indicativeCostCents,
    indicativePriceCents,
    grossMarginCents: roundCents(grossMarginCents),
    grossMarginPercent,
    compatibilityScore,
    riskScore,
    reasons,
  };
}
