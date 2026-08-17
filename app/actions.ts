"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { repo } from "@/lib/store";
import { eur } from "@/lib/money";
import { calculateQuote } from "@/lib/pricing";
import { evaluateMarginGuard, marginThresholdsFromEnv } from "@/lib/margin-guard";
import {
  GRADES,
  MVP_MATERIALS,
  PROVENANCES,
  type DealStage,
  type Grade,
  type Material,
  type Provenance,
} from "@/lib/enums";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string): number {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? n : 0;
}
function asMaterial(v: string): Material {
  return (MVP_MATERIALS as readonly string[]).includes(v) ? (v as Material) : "COPPER_CATHODE_GRADE_A";
}
function asGrade(v: string): Grade {
  return (GRADES as readonly string[]).includes(v) ? (v as Grade) : "A";
}
function asProvenance(v: string): Provenance {
  return (PROVENANCES as readonly string[]).includes(v) ? (v as Provenance) : "DISTRIBUTOR";
}

export async function createSellOfferAction(formData: FormData): Promise<void> {
  const supplierId = str(formData, "supplierId");
  if (!supplierId) throw new Error("Fournisseur requis");
  repo.createSellOffer({
    supplierId,
    material: asMaterial(str(formData, "material")),
    grade: asGrade(str(formData, "grade")),
    provenance: asProvenance(str(formData, "provenance")),
    quantityKg: Math.max(0, num(formData, "quantityKg")),
    pricePerTonneCents: eur(num(formData, "pricePerTonne")),
    location: str(formData, "location") || "—",
    country: str(formData, "country") || "France",
    documents: [],
  });
  revalidatePath("/quick-sales");
  revalidatePath("/buy-opportunities");
  redirect("/quick-sales");
}

export async function createBuyRequestAction(formData: FormData): Promise<void> {
  const buyerId = str(formData, "buyerId");
  if (!buyerId) throw new Error("Acheteur requis");
  repo.createBuyRequest({
    buyerId,
    material: asMaterial(str(formData, "material")),
    minGrade: asGrade(str(formData, "minGrade")),
    quantityKg: Math.max(0, num(formData, "quantityKg")),
    targetPricePerTonneCents: eur(num(formData, "targetPricePerTonne")),
    location: str(formData, "location") || "—",
    country: str(formData, "country") || "France",
  });
  revalidatePath("/quick-sales");
  redirect("/quick-sales");
}

export async function createDealFromMatchAction(formData: FormData): Promise<void> {
  const offerId = str(formData, "offerId");
  const requestId = str(formData, "requestId");
  const offer = repo.sellOffers().find((o) => o.id === offerId);
  const request = repo.buyRequests().find((r) => r.id === requestId);
  if (!offer || !request) throw new Error("Offre ou demande introuvable");

  const buyer = repo.company(request.buyerId);
  const supplier = repo.company(offer.supplierId);
  const quantityKg = Math.min(offer.quantityKg, request.quantityKg);

  const deal = repo.createDeal({
    title: `${buyer?.displayName ?? "Acheteur"} — ${offer.material}`,
    buyerId: request.buyerId,
    supplierId: offer.supplierId,
    material: offer.material,
    quantityKg,
    stage: "QUALIFIED",
    salePricePerTonneCents: request.targetPricePerTonneCents,
    purchasePricePerTonneCents: offer.pricePerTonneCents,
    closeProbability: 0.5,
    ownerId: "ceo",
    lastContactAt: new Date().toISOString(),
    nextAction: "Qualifier et chiffrer le deal",
    nextActionAt: new Date().toISOString(),
    documents: offer.documents,
    riskFlags: supplier?.verification !== "VERIFIED" ? ["UNVERIFIED_COMPANY"] : [],
    businessLine: supplier?.businessLine ?? "TRADE",
  });

  revalidatePath("/focus");
  revalidatePath("/ceo");
  redirect(`/focus`);
}

export async function saveQuoteAction(formData: FormData): Promise<void> {
  const buyerId = str(formData, "buyerId");
  if (!buyerId) throw new Error("Acheteur requis");
  const supplierId = str(formData, "supplierId") || undefined;
  const quantityKg = Math.max(0, num(formData, "quantityKg"));
  const material = asMaterial(str(formData, "material"));
  const grade = asGrade(str(formData, "grade"));
  const desiredMarginPercent = num(formData, "margin");

  const costs = {
    purchasePricePerTonneCents: eur(num(formData, "purchase")),
    transportCents: eur(num(formData, "transport")),
    insuranceCents: eur(num(formData, "insurance")),
    customsFeesCents: eur(num(formData, "customs")),
    financingCents: eur(num(formData, "financing")),
    otherCostsCents: eur(num(formData, "other")),
  };

  // Authoritative server-side recompute + margin guard.
  const quote = calculateQuote({ ...costs, quantityKg, desiredMarginPercent });
  const guard = evaluateMarginGuard(
    { ...costs, quantityKg, salePricePerTonneCents: quote.quotePricePerTonneCents },
    marginThresholdsFromEnv(),
  );
  if (!guard.canValidate) {
    throw new Error("Marge insuffisante : devis non enregistré (Margin Guard).");
  }

  repo.createQuote({ supplierId, buyerId, material, grade, quantityKg, desiredMarginPercent, ...costs });
  revalidatePath("/focus");
  redirect("/focus");
}

export async function promoteDealAction(dealId: string, stage: DealStage): Promise<void> {
  repo.updateDealStage(dealId, stage);
  revalidatePath("/focus");
  revalidatePath("/ceo");
}
