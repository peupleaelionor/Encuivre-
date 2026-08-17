"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createBuyRequestFor, createSellOfferFor, getPortalCompany } from "@/lib/services/data";
import { eur } from "@/lib/money";
import {
  GRADES,
  MVP_MATERIALS,
  PROVENANCES,
  type Grade,
  type Material,
  type Provenance,
} from "@/lib/enums";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function num(fd: FormData, k: string): number {
  const n = Number(fd.get(k));
  return Number.isFinite(n) ? n : 0;
}
const asMaterial = (v: string): Material =>
  (MVP_MATERIALS as readonly string[]).includes(v) ? (v as Material) : "COPPER_CATHODE_GRADE_A";
const asGrade = (v: string): Grade => ((GRADES as readonly string[]).includes(v) ? (v as Grade) : "A");
const asProvenance = (v: string): Provenance =>
  (PROVENANCES as readonly string[]).includes(v) ? (v as Provenance) : "DISTRIBUTOR";

export async function createPortalOfferAction(formData: FormData): Promise<void> {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");
  const company = await getPortalCompany(ctx);
  if (!company) redirect("/portal");

  await createSellOfferFor(ctx, {
    supplierId: company.id,
    material: asMaterial(str(formData, "material")),
    grade: asGrade(str(formData, "grade")),
    provenance: asProvenance(str(formData, "provenance")),
    quantityKg: Math.max(0, num(formData, "quantityKg")),
    pricePerTonneCents: eur(num(formData, "pricePerTonne")),
    location: str(formData, "location") || company.country,
    country: str(formData, "country") || company.country,
    documents: [],
  });
  revalidatePath("/portal");
  redirect("/portal");
}

export async function createPortalRequestAction(formData: FormData): Promise<void> {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");
  const company = await getPortalCompany(ctx);
  if (!company) redirect("/portal");

  await createBuyRequestFor(ctx, {
    buyerId: company.id,
    material: asMaterial(str(formData, "material")),
    minGrade: asGrade(str(formData, "minGrade")),
    quantityKg: Math.max(0, num(formData, "quantityKg")),
    targetPricePerTonneCents: eur(num(formData, "targetPricePerTonne")),
    location: str(formData, "location") || company.country,
    country: str(formData, "country") || company.country,
  });
  revalidatePath("/portal");
  redirect("/portal");
}
