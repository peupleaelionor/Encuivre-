/**
 * Mapping between Drizzle rows and domain objects. Drizzle already returns jsonb
 * columns typed, so mapping is mostly: null → undefined, and done int → boolean.
 */

import type {
  BuyRequest,
  Company,
  Contact,
  Deal,
  Decision,
  FollowUp,
  Quote,
  SellOffer,
  TrackedDocument,
} from "../types";
import type {
  buyRequests,
  companies,
  contacts,
  deals,
  decisions,
  documents,
  followUps,
  quotes,
  sellOffers,
} from "./schema";

type CompanyRow = typeof companies.$inferSelect;
type ContactRow = typeof contacts.$inferSelect;
type SellOfferRow = typeof sellOffers.$inferSelect;
type BuyRequestRow = typeof buyRequests.$inferSelect;
type DealRow = typeof deals.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;
type FollowUpRow = typeof followUps.$inferSelect;
type QuoteRow = typeof quotes.$inferSelect;
type DecisionRow = typeof decisions.$inferSelect;

const u = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

export function rowToCompany(r: CompanyRow): Company {
  return {
    id: r.id,
    ownerOrganizationId: u(r.ownerOrganizationId),
    accountOrganizationId: u(r.accountOrganizationId),
    legalName: r.legalName,
    displayName: r.displayName,
    role: r.role,
    country: r.country,
    businessLine: r.businessLine,
    verification: r.verification,
    materials: r.materials,
    grades: r.grades,
    provenance: u(r.provenance),
    moqKg: u(r.moqKg),
    capacityKg: u(r.capacityKg),
    incoterms: u(r.incoterms),
    paymentTerms: u(r.paymentTerms),
    leadTimeDays: u(r.leadTimeDays),
    supplierMetrics: u(r.supplierMetrics),
    buyerMetrics: u(r.buyerMetrics),
    qualityIncidents: u(r.qualityIncidents),
    lastContactAt: u(r.lastContactAt),
    notes: u(r.notes),
  };
}

export function rowToContact(r: ContactRow): Contact {
  return {
    id: r.id,
    companyId: r.companyId,
    name: r.name,
    role: u(r.role),
    phone: u(r.phone),
    email: u(r.email),
    memory: r.memory,
  };
}

export function rowToSellOffer(r: SellOfferRow): SellOffer {
  return {
    id: r.id,
    supplierId: r.supplierId,
    material: r.material,
    grade: r.grade,
    provenance: r.provenance,
    quantityKg: r.quantityKg,
    pricePerTonneCents: r.pricePerTonneCents,
    location: r.location,
    country: r.country,
    availableUntil: u(r.availableUntil),
    incoterms: u(r.incoterms),
    documents: r.documents,
    createdAt: r.createdAt,
  };
}

export function rowToBuyRequest(r: BuyRequestRow): BuyRequest {
  return {
    id: r.id,
    buyerId: r.buyerId,
    material: r.material,
    minGrade: r.minGrade,
    quantityKg: r.quantityKg,
    targetPricePerTonneCents: r.targetPricePerTonneCents,
    location: r.location,
    country: r.country,
    neededBy: u(r.neededBy),
    createdAt: r.createdAt,
  };
}

export function rowToDeal(r: DealRow): Deal {
  return {
    id: r.id,
    title: r.title,
    buyerId: r.buyerId,
    supplierId: u(r.supplierId),
    material: r.material,
    quantityKg: r.quantityKg,
    stage: r.stage,
    salePricePerTonneCents: r.salePricePerTonneCents,
    purchasePricePerTonneCents: r.purchasePricePerTonneCents,
    closeProbability: r.closeProbability,
    ownerId: r.ownerId,
    createdAt: r.createdAt,
    lastContactAt: u(r.lastContactAt),
    nextAction: u(r.nextAction),
    nextActionAt: u(r.nextActionAt),
    documents: r.documents,
    riskFlags: r.riskFlags,
    businessLine: r.businessLine,
  };
}

export function rowToDocument(r: DocumentRow): TrackedDocument {
  return {
    id: r.id,
    type: r.type,
    companyId: u(r.companyId),
    dealId: u(r.dealId),
    issueDate: u(r.issueDate),
    expiryDate: u(r.expiryDate),
    verificationStatus: r.verificationStatus,
    verifiedAt: u(r.verifiedAt),
    verifiedBy: u(r.verifiedBy),
    notes: u(r.notes),
  };
}

export function rowToFollowUp(r: FollowUpRow): FollowUp {
  return {
    id: r.id,
    dealId: u(r.dealId),
    companyId: r.companyId,
    action: r.action,
    ownerId: r.ownerId,
    priority: r.priority as FollowUp["priority"],
    dueAt: r.dueAt,
    lastContactAt: u(r.lastContactAt),
    done: r.done === 1,
  };
}

export function rowToQuote(r: QuoteRow): Quote {
  return {
    id: r.id,
    supplierId: u(r.supplierId),
    buyerId: r.buyerId,
    material: r.material,
    grade: r.grade,
    quantityKg: r.quantityKg,
    purchasePricePerTonneCents: r.purchasePricePerTonneCents,
    transportCents: r.transportCents,
    insuranceCents: r.insuranceCents,
    customsFeesCents: r.customsFeesCents,
    financingCents: r.financingCents,
    otherCostsCents: r.otherCostsCents,
    desiredMarginPercent: r.desiredMarginPercent,
    createdAt: r.createdAt,
  };
}

export function rowToDecision(r: DecisionRow): Decision {
  return {
    id: r.id,
    title: r.title,
    context: r.context,
    decision: r.decision,
    rationale: r.rationale,
    expectedOutcome: r.expectedOutcome,
    actualOutcome: u(r.actualOutcome),
    reviewAt: u(r.reviewAt),
    status: r.status as Decision["status"],
    createdAt: r.createdAt,
  };
}
