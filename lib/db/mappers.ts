/**
 * Pure mapping between domain objects and SQLite rows. No DB import here, so it
 * is reusable by both the seeder and the repository without import cycles.
 *
 * Rules: complex fields (arrays, value objects) are JSON TEXT; absent optionals
 * become SQL NULL (better-sqlite3 rejects `undefined`).
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

type Row = Record<string, unknown>;

const j = (v: unknown): string => JSON.stringify(v ?? null);
const nn = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
function p<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  const parsed = JSON.parse(String(v));
  return (parsed ?? fallback) as T;
}
function pOpt<T>(v: unknown): T | undefined {
  if (v == null) return undefined;
  const parsed = JSON.parse(String(v));
  return parsed == null ? undefined : (parsed as T);
}
const bool = (v: unknown): boolean => v === 1 || v === true;
const optStr = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const optNum = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

// ---------- Company ----------
export function companyToRow(c: Company): Row {
  return {
    id: c.id,
    legalName: c.legalName,
    displayName: c.displayName,
    role: c.role,
    country: c.country,
    businessLine: c.businessLine,
    verification: c.verification,
    materials: j(c.materials),
    grades: j(c.grades),
    provenance: nn(c.provenance),
    moqKg: nn(c.moqKg),
    capacityKg: nn(c.capacityKg),
    incoterms: c.incoterms ? j(c.incoterms) : null,
    paymentTerms: nn(c.paymentTerms),
    leadTimeDays: nn(c.leadTimeDays),
    supplierMetrics: c.supplierMetrics ? j(c.supplierMetrics) : null,
    buyerMetrics: c.buyerMetrics ? j(c.buyerMetrics) : null,
    qualityIncidents: nn(c.qualityIncidents),
    lastContactAt: nn(c.lastContactAt),
    notes: nn(c.notes),
  };
}
export function rowToCompany(r: Row): Company {
  return {
    id: String(r.id),
    legalName: String(r.legalName),
    displayName: String(r.displayName),
    role: r.role as Company["role"],
    country: String(r.country),
    businessLine: r.businessLine as Company["businessLine"],
    verification: r.verification as Company["verification"],
    materials: p(r.materials, [] as Company["materials"]),
    grades: p(r.grades, [] as Company["grades"]),
    provenance: (optStr(r.provenance) as Company["provenance"]) ?? undefined,
    moqKg: optNum(r.moqKg),
    capacityKg: optNum(r.capacityKg),
    incoterms: pOpt<Company["incoterms"]>(r.incoterms),
    paymentTerms: optStr(r.paymentTerms),
    leadTimeDays: optNum(r.leadTimeDays),
    supplierMetrics: pOpt<Company["supplierMetrics"]>(r.supplierMetrics),
    buyerMetrics: pOpt<Company["buyerMetrics"]>(r.buyerMetrics),
    qualityIncidents: optNum(r.qualityIncidents),
    lastContactAt: optStr(r.lastContactAt),
    notes: optStr(r.notes),
  };
}

// ---------- Contact ----------
export function contactToRow(c: Contact): Row {
  return {
    id: c.id,
    companyId: c.companyId,
    name: c.name,
    role: nn(c.role),
    phone: nn(c.phone),
    email: nn(c.email),
    memory: j(c.memory),
  };
}
export function rowToContact(r: Row): Contact {
  return {
    id: String(r.id),
    companyId: String(r.companyId),
    name: String(r.name),
    role: optStr(r.role),
    phone: optStr(r.phone),
    email: optStr(r.email),
    memory: p(r.memory, {} as Contact["memory"]),
  };
}

// ---------- SellOffer ----------
export function sellOfferToRow(o: SellOffer): Row {
  return {
    id: o.id,
    supplierId: o.supplierId,
    material: o.material,
    grade: o.grade,
    provenance: o.provenance,
    quantityKg: o.quantityKg,
    pricePerTonneCents: o.pricePerTonneCents,
    location: o.location,
    country: o.country,
    availableUntil: nn(o.availableUntil),
    incoterms: o.incoterms ? j(o.incoterms) : null,
    documents: j(o.documents),
    createdAt: o.createdAt,
  };
}
export function rowToSellOffer(r: Row): SellOffer {
  return {
    id: String(r.id),
    supplierId: String(r.supplierId),
    material: r.material as SellOffer["material"],
    grade: r.grade as SellOffer["grade"],
    provenance: r.provenance as SellOffer["provenance"],
    quantityKg: Number(r.quantityKg),
    pricePerTonneCents: Number(r.pricePerTonneCents),
    location: String(r.location),
    country: String(r.country),
    availableUntil: optStr(r.availableUntil),
    incoterms: pOpt<SellOffer["incoterms"]>(r.incoterms),
    documents: p(r.documents, [] as SellOffer["documents"]),
    createdAt: String(r.createdAt),
  };
}

// ---------- BuyRequest ----------
export function buyRequestToRow(b: BuyRequest): Row {
  return {
    id: b.id,
    buyerId: b.buyerId,
    material: b.material,
    minGrade: b.minGrade,
    quantityKg: b.quantityKg,
    targetPricePerTonneCents: b.targetPricePerTonneCents,
    location: b.location,
    country: b.country,
    neededBy: nn(b.neededBy),
    createdAt: b.createdAt,
  };
}
export function rowToBuyRequest(r: Row): BuyRequest {
  return {
    id: String(r.id),
    buyerId: String(r.buyerId),
    material: r.material as BuyRequest["material"],
    minGrade: r.minGrade as BuyRequest["minGrade"],
    quantityKg: Number(r.quantityKg),
    targetPricePerTonneCents: Number(r.targetPricePerTonneCents),
    location: String(r.location),
    country: String(r.country),
    neededBy: optStr(r.neededBy),
    createdAt: String(r.createdAt),
  };
}

// ---------- Deal ----------
export function dealToRow(d: Deal): Row {
  return {
    id: d.id,
    title: d.title,
    buyerId: d.buyerId,
    supplierId: nn(d.supplierId),
    material: d.material,
    quantityKg: d.quantityKg,
    stage: d.stage,
    salePricePerTonneCents: d.salePricePerTonneCents,
    purchasePricePerTonneCents: d.purchasePricePerTonneCents,
    closeProbability: d.closeProbability,
    ownerId: d.ownerId,
    createdAt: d.createdAt,
    lastContactAt: nn(d.lastContactAt),
    nextAction: nn(d.nextAction),
    nextActionAt: nn(d.nextActionAt),
    documents: j(d.documents),
    riskFlags: j(d.riskFlags),
    businessLine: d.businessLine,
  };
}
export function rowToDeal(r: Row): Deal {
  return {
    id: String(r.id),
    title: String(r.title),
    buyerId: String(r.buyerId),
    supplierId: optStr(r.supplierId),
    material: r.material as Deal["material"],
    quantityKg: Number(r.quantityKg),
    stage: r.stage as Deal["stage"],
    salePricePerTonneCents: Number(r.salePricePerTonneCents),
    purchasePricePerTonneCents: Number(r.purchasePricePerTonneCents),
    closeProbability: Number(r.closeProbability),
    ownerId: String(r.ownerId),
    createdAt: String(r.createdAt),
    lastContactAt: optStr(r.lastContactAt),
    nextAction: optStr(r.nextAction),
    nextActionAt: optStr(r.nextActionAt),
    documents: p(r.documents, [] as Deal["documents"]),
    riskFlags: p(r.riskFlags, [] as Deal["riskFlags"]),
    businessLine: r.businessLine as Deal["businessLine"],
  };
}

// ---------- TrackedDocument ----------
export function documentToRow(d: TrackedDocument): Row {
  return {
    id: d.id,
    type: d.type,
    companyId: nn(d.companyId),
    dealId: nn(d.dealId),
    issueDate: nn(d.issueDate),
    expiryDate: nn(d.expiryDate),
    verificationStatus: d.verificationStatus,
    verifiedAt: nn(d.verifiedAt),
    verifiedBy: nn(d.verifiedBy),
    notes: nn(d.notes),
  };
}
export function rowToDocument(r: Row): TrackedDocument {
  return {
    id: String(r.id),
    type: r.type as TrackedDocument["type"],
    companyId: optStr(r.companyId),
    dealId: optStr(r.dealId),
    issueDate: optStr(r.issueDate),
    expiryDate: optStr(r.expiryDate),
    verificationStatus: r.verificationStatus as TrackedDocument["verificationStatus"],
    verifiedAt: optStr(r.verifiedAt),
    verifiedBy: optStr(r.verifiedBy),
    notes: optStr(r.notes),
  };
}

// ---------- FollowUp ----------
export function followUpToRow(f: FollowUp): Row {
  return {
    id: f.id,
    dealId: nn(f.dealId),
    companyId: f.companyId,
    action: f.action,
    ownerId: f.ownerId,
    priority: f.priority,
    dueAt: f.dueAt,
    lastContactAt: nn(f.lastContactAt),
    done: f.done ? 1 : 0,
  };
}
export function rowToFollowUp(r: Row): FollowUp {
  return {
    id: String(r.id),
    dealId: optStr(r.dealId),
    companyId: String(r.companyId),
    action: String(r.action),
    ownerId: String(r.ownerId),
    priority: r.priority as FollowUp["priority"],
    dueAt: String(r.dueAt),
    lastContactAt: optStr(r.lastContactAt),
    done: bool(r.done),
  };
}

// ---------- Quote ----------
export function quoteToRow(q: Quote): Row {
  return {
    id: q.id,
    supplierId: nn(q.supplierId),
    buyerId: q.buyerId,
    material: q.material,
    grade: q.grade,
    quantityKg: q.quantityKg,
    purchasePricePerTonneCents: q.purchasePricePerTonneCents,
    transportCents: q.transportCents,
    insuranceCents: q.insuranceCents,
    customsFeesCents: q.customsFeesCents,
    financingCents: q.financingCents,
    otherCostsCents: q.otherCostsCents,
    desiredMarginPercent: q.desiredMarginPercent,
    createdAt: q.createdAt,
  };
}
export function rowToQuote(r: Row): Quote {
  return {
    id: String(r.id),
    supplierId: optStr(r.supplierId),
    buyerId: String(r.buyerId),
    material: r.material as Quote["material"],
    grade: r.grade as Quote["grade"],
    quantityKg: Number(r.quantityKg),
    purchasePricePerTonneCents: Number(r.purchasePricePerTonneCents),
    transportCents: Number(r.transportCents),
    insuranceCents: Number(r.insuranceCents),
    customsFeesCents: Number(r.customsFeesCents),
    financingCents: Number(r.financingCents),
    otherCostsCents: Number(r.otherCostsCents),
    desiredMarginPercent: Number(r.desiredMarginPercent),
    createdAt: String(r.createdAt),
  };
}

// ---------- Decision ----------
export function decisionToRow(d: Decision): Row {
  return {
    id: d.id,
    title: d.title,
    context: d.context,
    decision: d.decision,
    rationale: d.rationale,
    expectedOutcome: d.expectedOutcome,
    actualOutcome: nn(d.actualOutcome),
    reviewAt: nn(d.reviewAt),
    status: d.status,
    createdAt: d.createdAt,
  };
}
export function rowToDecision(r: Row): Decision {
  return {
    id: String(r.id),
    title: String(r.title),
    context: String(r.context),
    decision: String(r.decision),
    rationale: String(r.rationale),
    expectedOutcome: String(r.expectedOutcome),
    actualOutcome: optStr(r.actualOutcome),
    reviewAt: optStr(r.reviewAt),
    status: r.status as Decision["status"],
    createdAt: String(r.createdAt),
  };
}
