/**
 * Domain models for EN CUIVRE OS.
 *
 * All monetary values are integer euro cents (see lib/money.ts). All prices are
 * cents PER TONNE; all quantities are in kilograms.
 */

import type {
  BuyerBadge,
  BusinessLine,
  CompanyRole,
  DealLevel,
  DealStage,
  DocumentType,
  Grade,
  Material,
  Provenance,
  RiskFlag,
  SupplierBadge,
  VerificationStatus,
} from "./enums";

export interface Incoterms {
  /** e.g. "EXW", "FCA", "FOB", "CIF", "DDP". */
  code: string;
  /** Named place, e.g. "Lyon", "Anvers". */
  place?: string;
}

/** Structured contact memory — replaces a giant free-text note field. */
export interface ContactMemory {
  /** What they buy/sell in one line. */
  dealsIn: string;
  /** Usual volume, human-readable, e.g. "5–10 t / mois". */
  usualVolume: string;
  /** Last discussion summary (one line). */
  lastDiscussion: string;
  /** Last objection raised. */
  lastObjection?: string;
  /** Commitment taken by us or by them. */
  commitment?: string;
  /** The single next action. */
  nextAction?: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  memory: ContactMemory;
}

/** Sub-scores feeding a supplier score (each 0–100). */
export interface SupplierMetrics {
  pricing: number;
  quality: number;
  reliability: number;
  availability: number;
  compliance: number;
  speed: number;
  communication: number;
  terms: number;
}

/** Sub-scores / raw inputs feeding a buyer score. */
export interface BuyerMetrics {
  /** Typical purchase volume in kg. */
  buyingVolumeKg: number;
  /** Purchases per quarter. */
  frequency: number;
  /** 0–100 how reliably they pay. */
  paymentReliability: number;
  /** 0–100 how fast they close. */
  closingSpeed: number;
  /** Gross margin they have generated historically, in cents. */
  grossMarginGeneratedCents: number;
  /** 0–100 relationship strength. */
  relationship: number;
  /** Number of repeat purchases. */
  repeatPurchases: number;
}

export interface Company {
  id: string;
  /** Tenant that owns this CRM record (usually EN CUIVRE INTERNAL). */
  ownerOrganizationId?: string;
  /** If this counterparty has its own login account/portal, its organization id. */
  accountOrganizationId?: string;
  legalName: string;
  displayName: string;
  role: CompanyRole;
  country: string;
  businessLine: BusinessLine;
  verification: VerificationStatus;
  /** Materials they supply or buy. */
  materials: Material[];
  grades: Grade[];
  provenance?: Provenance;
  /** Minimum order quantity in kg (suppliers). */
  moqKg?: number;
  /** Monthly capacity in kg (suppliers). */
  capacityKg?: number;
  incoterms?: Incoterms;
  paymentTerms?: string;
  /** Lead time in days. */
  leadTimeDays?: number;
  /** Supplier intelligence sub-scores (present when role includes supplier). */
  supplierMetrics?: SupplierMetrics;
  /** Buyer intelligence raw metrics (present when role includes buyer). */
  buyerMetrics?: BuyerMetrics;
  /** Count of recorded quality incidents. */
  qualityIncidents?: number;
  /** ISO date of last contact. */
  lastContactAt?: string;
  notes?: string;
}

/** A supply available to sell (from a supplier or our own inventory). */
export interface SellOffer {
  id: string;
  /** Tenant that owns this record (INTERNAL, or a supplier portal tenant). */
  ownerOrganizationId?: string;
  supplierId: string;
  material: Material;
  grade: Grade;
  provenance: Provenance;
  quantityKg: number;
  /** Purchase / cost price in cents per tonne. */
  pricePerTonneCents: number;
  /** Location for geography matching. */
  location: string;
  country: string;
  /** ISO date until which the offer is available. */
  availableUntil?: string;
  incoterms?: Incoterms;
  /** Document types already attached. */
  documents: DocumentType[];
  createdAt: string;
}

/** A buyer's request to purchase. */
export interface BuyRequest {
  id: string;
  /** Tenant that owns this record (INTERNAL, or a buyer portal tenant). */
  ownerOrganizationId?: string;
  buyerId: string;
  material: Material;
  /** Minimum acceptable grade. */
  minGrade: Grade;
  quantityKg: number;
  /** Target / max buy price in cents per tonne. */
  targetPricePerTonneCents: number;
  location: string;
  country: string;
  /** ISO date the buyer needs delivery by. */
  neededBy?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  buyerId: string;
  supplierId?: string;
  material: Material;
  quantityKg: number;
  stage: DealStage;
  /** Expected sale price in cents per tonne. */
  salePricePerTonneCents: number;
  /** Expected/agreed purchase price in cents per tonne. */
  purchasePricePerTonneCents: number;
  /** 0–1 probability of closing. */
  closeProbability: number;
  ownerId: string;
  createdAt: string;
  lastContactAt?: string;
  nextAction?: string;
  nextActionAt?: string;
  documents: DocumentType[];
  riskFlags: RiskFlag[];
  /** Business line the deal belongs to. */
  businessLine: BusinessLine;
}

export interface TrackedDocument {
  id: string;
  type: DocumentType;
  companyId?: string;
  dealId?: string;
  issueDate?: string;
  expiryDate?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface FollowUp {
  id: string;
  dealId?: string;
  companyId: string;
  action: string;
  ownerId: string;
  priority: DealLevel;
  dueAt: string;
  lastContactAt?: string;
  done: boolean;
}

export interface Quote {
  id: string;
  supplierId?: string;
  buyerId: string;
  material: Material;
  grade: Grade;
  quantityKg: number;
  purchasePricePerTonneCents: number;
  transportCents: number;
  insuranceCents: number;
  customsFeesCents: number;
  financingCents: number;
  otherCostsCents: number;
  desiredMarginPercent: number;
  createdAt: string;
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  expectedOutcome: string;
  actualOutcome?: string;
  reviewAt?: string;
  status: "OPEN" | "REVIEWING" | "CLOSED";
  createdAt: string;
}

/** Convenience: a Deal enriched with computed fields for the UI. */
export interface ScoredDeal extends Deal {
  priorityScore: number;
  priorityLevel: DealLevel;
  reasons: string[];
}

export type { SupplierBadge, BuyerBadge };
