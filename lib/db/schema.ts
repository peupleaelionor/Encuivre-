/**
 * Drizzle schema — EN CUIVRE OS platform (PostgreSQL).
 *
 * Conventions:
 *  - ids: app-generated text (domain uses readable ids like "sup-metalsud";
 *    platform rows use uuids). See lib/db/ids.ts.
 *  - money: bigint cents (mode number) — never floats (see lib/money.ts).
 *  - dates: ISO-8601 text, matching the domain string contract (Deal.createdAt:
 *    string, etc.). ISO strings sort correctly and keep mapping identity-simple.
 *  - controlled vocabularies (materials, grades, roles, stages, statuses) are
 *    stored as text validated by lib/enums — not pg enums, to keep migrations
 *    flexible.
 *  - value objects / short arrays (metrics, memory, incoterms, materials[],
 *    grades[], documents[], riskFlags[]) are jsonb.
 */

import { bigint, doublePrecision, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type {
  BuyerMetrics,
  ContactMemory,
  Incoterms,
  SupplierMetrics,
} from "../types";
import type {
  BusinessLine,
  CompanyRole,
  DealStage,
  DocumentType,
  Grade,
  Material,
  Provenance,
  RiskFlag,
  VerificationStatus,
} from "../enums";

// ---------------- Platform / auth ----------------

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  legalName: text("legal_name").notNull(),
  displayName: text("display_name").notNull(),
  slug: text("slug").notNull().unique(),
  /** INTERNAL | SUPPLIER | BUYER | BOTH | PARTNER */
  type: text("type").notNull(),
  country: text("country").notNull(),
  /** ACTIVE | SUSPENDED */
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  /** CEO | ADMIN | SALES | OPERATIONS | COMPLIANCE | FINANCE | SUPPLIER | BUYER | PARTNER | VIEWER */
  role: text("role").notNull(),
  /** ACTIVE | INVITED | SUSPENDED */
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------- Reference data ----------------

export const materials = pgTable("materials", {
  code: text("code").primaryKey(), // Material enum value
  label: text("label").notNull(),
  isMvp: integer("is_mvp").notNull().default(0),
});

// ---------------- Business / CRM ----------------

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  /** Tenant that owns this CRM record (usually EN CUIVRE INTERNAL). */
  ownerOrganizationId: text("owner_organization_id").references(() => organizations.id),
  /** If this counterparty has its own login account (portal), its org. Nullable. */
  accountOrganizationId: text("account_organization_id").references(() => organizations.id),
  legalName: text("legal_name").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").$type<CompanyRole>().notNull(),
  country: text("country").notNull(),
  businessLine: text("business_line").$type<BusinessLine>().notNull(),
  verification: text("verification").$type<VerificationStatus>().notNull(),
  materials: jsonb("materials").$type<Material[]>().notNull(),
  grades: jsonb("grades").$type<Grade[]>().notNull(),
  provenance: text("provenance").$type<Provenance>(),
  moqKg: integer("moq_kg"),
  capacityKg: integer("capacity_kg"),
  incoterms: jsonb("incoterms").$type<Incoterms>(),
  paymentTerms: text("payment_terms"),
  leadTimeDays: integer("lead_time_days"),
  supplierMetrics: jsonb("supplier_metrics").$type<SupplierMetrics>(),
  buyerMetrics: jsonb("buyer_metrics").$type<BuyerMetrics>(),
  qualityIncidents: integer("quality_incidents"),
  lastContactAt: text("last_contact_at"),
  notes: text("notes"),
});

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
  memory: jsonb("memory").$type<ContactMemory>().notNull(),
});

export const sellOffers = pgTable("sell_offers", {
  id: text("id").primaryKey(),
  ownerOrganizationId: text("owner_organization_id").references(() => organizations.id),
  supplierId: text("supplier_id").notNull().references(() => companies.id),
  material: text("material").$type<Material>().notNull(),
  grade: text("grade").$type<Grade>().notNull(),
  provenance: text("provenance").$type<Provenance>().notNull(),
  quantityKg: integer("quantity_kg").notNull(),
  pricePerTonneCents: bigint("price_per_tonne_cents", { mode: "number" }).notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  availableUntil: text("available_until"),
  incoterms: jsonb("incoterms").$type<Incoterms>(),
  documents: jsonb("documents").$type<DocumentType[]>().notNull(),
  createdAt: text("created_at").notNull(),
});

export const buyRequests = pgTable("buy_requests", {
  id: text("id").primaryKey(),
  ownerOrganizationId: text("owner_organization_id").references(() => organizations.id),
  buyerId: text("buyer_id").notNull().references(() => companies.id),
  material: text("material").$type<Material>().notNull(),
  minGrade: text("min_grade").$type<Grade>().notNull(),
  quantityKg: integer("quantity_kg").notNull(),
  targetPricePerTonneCents: bigint("target_price_per_tonne_cents", { mode: "number" }).notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  neededBy: text("needed_by"),
  createdAt: text("created_at").notNull(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  ownerOrganizationId: text("owner_organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  buyerId: text("buyer_id").notNull().references(() => companies.id),
  supplierId: text("supplier_id").references(() => companies.id),
  material: text("material").$type<Material>().notNull(),
  quantityKg: integer("quantity_kg").notNull(),
  stage: text("stage").$type<DealStage>().notNull(),
  salePricePerTonneCents: bigint("sale_price_per_tonne_cents", { mode: "number" }).notNull(),
  purchasePricePerTonneCents: bigint("purchase_price_per_tonne_cents", { mode: "number" }).notNull(),
  closeProbability: doublePrecision("close_probability").notNull(),
  ownerId: text("owner_id").notNull(),
  createdAt: text("created_at").notNull(),
  lastContactAt: text("last_contact_at"),
  nextAction: text("next_action"),
  nextActionAt: text("next_action_at"),
  documents: jsonb("documents").$type<DocumentType[]>().notNull(),
  riskFlags: jsonb("risk_flags").$type<RiskFlag[]>().notNull(),
  businessLine: text("business_line").$type<BusinessLine>().notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  type: text("type").$type<DocumentType>().notNull(),
  companyId: text("company_id").references(() => companies.id),
  dealId: text("deal_id").references(() => deals.id),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  verificationStatus: text("verification_status").$type<VerificationStatus>().notNull(),
  verifiedAt: text("verified_at"),
  verifiedBy: text("verified_by"),
  /** Private storage key (S3/Supabase). Never a public URL. Nullable in V1. */
  storageKey: text("storage_key"),
  notes: text("notes"),
});

export const followUps = pgTable("follow_ups", {
  id: text("id").primaryKey(),
  dealId: text("deal_id").references(() => deals.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  action: text("action").notNull(),
  ownerId: text("owner_id").notNull(),
  priority: text("priority").notNull(),
  dueAt: text("due_at").notNull(),
  lastContactAt: text("last_contact_at"),
  done: integer("done").notNull().default(0),
});

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  supplierId: text("supplier_id").references(() => companies.id),
  buyerId: text("buyer_id").notNull().references(() => companies.id),
  material: text("material").$type<Material>().notNull(),
  grade: text("grade").$type<Grade>().notNull(),
  quantityKg: integer("quantity_kg").notNull(),
  purchasePricePerTonneCents: bigint("purchase_price_per_tonne_cents", { mode: "number" }).notNull(),
  transportCents: bigint("transport_cents", { mode: "number" }).notNull(),
  insuranceCents: bigint("insurance_cents", { mode: "number" }).notNull(),
  customsFeesCents: bigint("customs_fees_cents", { mode: "number" }).notNull(),
  financingCents: bigint("financing_cents", { mode: "number" }).notNull(),
  otherCostsCents: bigint("other_costs_cents", { mode: "number" }).notNull(),
  desiredMarginPercent: doublePrecision("desired_margin_percent").notNull(),
  createdAt: text("created_at").notNull(),
});

export const decisions = pgTable("decisions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  context: text("context").notNull(),
  decision: text("decision").notNull(),
  rationale: text("rationale").notNull(),
  expectedOutcome: text("expected_outcome").notNull(),
  actualOutcome: text("actual_outcome"),
  reviewAt: text("review_at"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

// ---------------- Governance ----------------

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  actorUserId: text("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  type: text("type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actorUserId: text("actor_user_id").references(() => users.id),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schema = {
  users,
  organizations,
  memberships,
  materials,
  companies,
  contacts,
  sellOffers,
  buyRequests,
  deals,
  documents,
  followUps,
  quotes,
  decisions,
  auditEvents,
  activities,
};
