/**
 * Buy-opportunity classifier — answers "que dois-je acheter ?" WITHOUT blindly
 * recommending stock. A BUY is only suggested when there is real pull:
 * a live buyer request, historical rotation, an attractive supplier price and
 * acceptable risk. Otherwise the verdict is WATCH or AVOID, always justified.
 *
 * This enforces the "buyer before inventory" policy (see CLAUDE.md).
 */

import { LOW_CAPITAL_PROVENANCES, gradeSatisfies } from "./enums";
import { marginPercent, priceForKg, type Cents } from "./money";
import type { BuyRequest, Company, SellOffer } from "./types";
import { scoreSupplierCompany } from "./supplier-score";

export interface BuyOpportunityInput {
  offer: SellOffer;
  /** Live buyer requests that this offer could serve. */
  requests: BuyRequest[];
  supplier: Company;
  /** Historical units sold of this material over the reference window (kg). */
  historicalRotationKg?: number;
}

export interface BuyOpportunityResult {
  offer: SellOffer;
  recommendation: "BUY" | "WATCH" | "AVOID";
  /** Best achievable margin % against matching live demand. */
  bestMarginPercent: number;
  /** Total live demand quantity (kg) this offer could serve. */
  matchingDemandKg: number;
  capitalRequiredCents: Cents;
  lowCapital: boolean;
  reasons: string[];
}

export interface BuyOpportunityThresholds {
  /** Margin % above which price is considered attractive. */
  attractiveMarginPercent: number;
  /** Historical rotation (kg) considered meaningful. */
  meaningfulRotationKg: number;
}

export const DEFAULT_BUY_THRESHOLDS: BuyOpportunityThresholds = {
  attractiveMarginPercent: 8,
  meaningfulRotationKg: 2000,
};

export function classifyBuyOpportunity(
  input: BuyOpportunityInput,
  thresholds: BuyOpportunityThresholds = DEFAULT_BUY_THRESHOLDS,
): BuyOpportunityResult {
  const { offer, supplier } = input;
  const reasons: string[] = [];

  const supplierScore = scoreSupplierCompany(supplier);
  const capitalRequiredCents = priceForKg(offer.pricePerTonneCents, offer.quantityKg);
  const lowCapital =
    LOW_CAPITAL_PROVENANCES.includes(offer.provenance) || offer.quantityKg <= 1000;

  // Live demand this offer could serve.
  const matchingRequests = input.requests.filter(
    (r) => r.material === offer.material && gradeSatisfies(offer.grade, r.minGrade),
  );
  const matchingDemandKg = matchingRequests.reduce((acc, r) => acc + r.quantityKg, 0);

  let bestMarginPercent = 0;
  for (const r of matchingRequests) {
    const cost = priceForKg(offer.pricePerTonneCents, 1000);
    const sale = priceForKg(r.targetPricePerTonneCents, 1000);
    bestMarginPercent = Math.max(bestMarginPercent, marginPercent(sale, cost));
  }

  // Hard AVOID conditions.
  if (supplierScore.blocked) {
    reasons.push("Fournisseur BLOQUÉ");
    return avoid(offer, bestMarginPercent, matchingDemandKg, capitalRequiredCents, lowCapital, reasons);
  }
  if (supplier.verification !== "VERIFIED") {
    reasons.push("Fournisseur non vérifié : achat spéculatif déconseillé");
  }

  const hasLiveDemand = matchingDemandKg > 0;
  const attractivePrice = bestMarginPercent >= thresholds.attractiveMarginPercent;
  const hasRotation = (input.historicalRotationKg ?? 0) >= thresholds.meaningfulRotationKg;
  const acceptableRisk = supplier.verification === "VERIFIED" && !supplierScore.blocked;

  if (hasLiveDemand) reasons.push(`Demande client réelle : ${matchingDemandKg} kg`);
  if (attractivePrice) reasons.push(`Prix fournisseur intéressant (marge ${bestMarginPercent}%)`);
  if (hasRotation) reasons.push("Rotation historique établie");
  if (lowCapital) reasons.push("Faible capital immobilisé");

  // Decision logic — "buyer before inventory".
  let recommendation: "BUY" | "WATCH" | "AVOID";
  if (hasLiveDemand && attractivePrice && acceptableRisk) {
    recommendation = "BUY";
    reasons.unshift("Acheteur identifié avant l'achat");
  } else if ((hasLiveDemand || (hasRotation && attractivePrice)) && acceptableRisk) {
    recommendation = "WATCH";
    reasons.unshift("Potentiel réel mais conditions incomplètes : surveiller");
  } else if (!acceptableRisk || (!hasLiveDemand && !hasRotation)) {
    recommendation = "AVOID";
    reasons.unshift(
      !hasLiveDemand && !hasRotation
        ? "Pas de demande ni de rotation : achat aveugle"
        : "Risque non maîtrisé",
    );
  } else {
    recommendation = "WATCH";
    reasons.unshift("Conditions partielles : surveiller");
  }

  return {
    offer,
    recommendation,
    bestMarginPercent,
    matchingDemandKg,
    capitalRequiredCents,
    lowCapital,
    reasons,
  };
}

function avoid(
  offer: SellOffer,
  bestMarginPercent: number,
  matchingDemandKg: number,
  capitalRequiredCents: Cents,
  lowCapital: boolean,
  reasons: string[],
): BuyOpportunityResult {
  return {
    offer,
    recommendation: "AVOID",
    bestMarginPercent,
    matchingDemandKg,
    capitalRequiredCents,
    lowCapital,
    reasons,
  };
}
