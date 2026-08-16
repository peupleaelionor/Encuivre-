/**
 * Domain enumerations for EN CUIVRE OS.
 *
 * These are `as const` objects + union types rather than TS `enum` so they are
 * tree-shakeable, JSON-serializable, and cheap to seed. See CLAUDE.md.
 */

/** Materials. MVP-priority materials come first; tin/cobalt exist but are NOT promoted. */
export const MATERIALS = [
  "COPPER_CATHODE_GRADE_A",
  "COPPER_MILLBERRY",
  "COPPER_BARS_BUSBARS",
  "COPPER_TUBES",
  "COPPER_SHEETS_PLATES",
  "BRASS",
  "BRONZE",
  "ALUMINIUM",
  // Present in the model but NOT MVP-operational (see docs/business-model.md):
  "TIN",
  "COBALT",
] as const;
export type Material = (typeof MATERIALS)[number];

/** Materials actively promoted in the MVP UI / matching / buy-opportunities. */
export const MVP_MATERIALS: readonly Material[] = [
  "COPPER_CATHODE_GRADE_A",
  "COPPER_MILLBERRY",
  "COPPER_BARS_BUSBARS",
  "COPPER_TUBES",
  "COPPER_SHEETS_PLATES",
  "BRASS",
  "BRONZE",
  "ALUMINIUM",
];

export const MATERIAL_LABELS: Record<Material, string> = {
  COPPER_CATHODE_GRADE_A: "Cathode de cuivre Grade A",
  COPPER_MILLBERRY: "Cuivre Millberry (recyclé propre)",
  COPPER_BARS_BUSBARS: "Barres / busbars cuivre",
  COPPER_TUBES: "Tubes cuivre",
  COPPER_SHEETS_PLATES: "Plaques / feuilles cuivre",
  BRASS: "Laiton",
  BRONZE: "Bronze",
  ALUMINIUM: "Aluminium",
  TIN: "Étain",
  COBALT: "Cobalt",
};

/** Provenance of a supply — used to identify low-capital sourcing routes. */
export const PROVENANCES = [
  "LOCAL_SCRAP",
  "INDUSTRIAL_OFFCUT",
  "DISTRIBUTOR",
  "REFINERY",
  "TRADER",
  "DIRECT_PRODUCER",
] as const;
export type Provenance = (typeof PROVENANCES)[number];

export const PROVENANCE_LABELS: Record<Provenance, string> = {
  LOCAL_SCRAP: "Chutes locales",
  INDUSTRIAL_OFFCUT: "Chutes industrielles",
  DISTRIBUTOR: "Distributeur",
  REFINERY: "Raffinerie",
  TRADER: "Négociant",
  DIRECT_PRODUCER: "Producteur direct",
};

/** Low-capital provenances — strategic to start with less immobilized capital. */
export const LOW_CAPITAL_PROVENANCES: readonly Provenance[] = [
  "LOCAL_SCRAP",
  "INDUSTRIAL_OFFCUT",
];

/** Supplier trust/relationship badge. */
export const SUPPLIER_BADGES = [
  "STRATEGIC",
  "PREFERRED",
  "APPROVED",
  "WATCH",
  "BLOCKED",
] as const;
export type SupplierBadge = (typeof SUPPLIER_BADGES)[number];

/** Buyer relationship badge. */
export const BUYER_BADGES = ["VIP", "ACTIVE", "OCCASIONAL", "DORMANT", "RISK"] as const;
export type BuyerBadge = (typeof BUYER_BADGES)[number];

/** Company can be a supplier, a buyer, or both. */
export const COMPANY_ROLES = ["SUPPLIER", "BUYER", "BOTH"] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

/** Verification status shared by companies and documents. */
export const VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Grade quality tiers, ordered best -> lowest, used for grade compatibility. */
export const GRADES = ["A", "B", "C"] as const;
export type Grade = (typeof GRADES)[number];

/** Deal lifecycle stages. */
export const DEAL_STAGES = [
  "LEAD",
  "QUALIFIED",
  "QUOTED",
  "NEGOTIATION",
  "CONTRACT",
  "WON",
  "LOST",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

/** Deal priority levels derived from the priority score. */
export const DEAL_LEVELS = ["HOT", "WARM", "COOL", "COLD"] as const;
export type DealLevel = (typeof DEAL_LEVELS)[number];

/** Margin Guard verdicts. */
export const MARGIN_VERDICTS = ["GREEN", "AMBER", "RED"] as const;
export type MarginVerdict = (typeof MARGIN_VERDICTS)[number];

/** Buy-opportunity recommendation. */
export const BUY_RECOMMENDATIONS = ["BUY", "WATCH", "AVOID"] as const;
export type BuyRecommendation = (typeof BUY_RECOMMENDATIONS)[number];

/** Document types tracked for readiness / expiry. */
export const DOCUMENT_TYPES = [
  "COMPANY_REGISTRATION",
  "IDENTITY",
  "LICENSE",
  "COA",
  "ASSAY",
  "ORIGIN",
  "CONTRACT",
  "INVOICE",
  "PACKING_LIST",
  "LOGISTICS",
  "OTHER",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Structured risk flags. Sanctions screening is architecture-only — human review is forced. */
export const RISK_FLAGS = [
  "UNVERIFIED_COMPANY",
  "PRICE_TOO_GOOD",
  "BANK_ACCOUNT_CHANGED",
  "MISSING_ORIGIN",
  "MISSING_COA",
  "INCONSISTENT_QUANTITY",
  "PAYMENT_TOO_EARLY",
  "DOCUMENT_EXPIRED",
  "SANCTIONS_REVIEW_REQUIRED",
  "MANUAL_REVIEW",
] as const;
export type RiskFlag = (typeof RISK_FLAGS)[number];

export const RISK_FLAG_LABELS: Record<RiskFlag, string> = {
  UNVERIFIED_COMPANY: "Société non vérifiée",
  PRICE_TOO_GOOD: "Prix trop beau pour être vrai",
  BANK_ACCOUNT_CHANGED: "Coordonnées bancaires modifiées",
  MISSING_ORIGIN: "Certificat d'origine manquant",
  MISSING_COA: "COA manquant",
  INCONSISTENT_QUANTITY: "Quantité incohérente",
  PAYMENT_TOO_EARLY: "Paiement demandé trop tôt",
  DOCUMENT_EXPIRED: "Document expiré",
  SANCTIONS_REVIEW_REQUIRED: "Revue sanctions requise",
  MANUAL_REVIEW: "Revue manuelle requise",
};

/** Business lines of the group. */
export const BUSINESS_LINES = ["TRADE", "CIRCULAR", "ATELIER", "HOUSE", "CONGO"] as const;
export type BusinessLine = (typeof BUSINESS_LINES)[number];

/** Priority ordering for supplier badges (index 0 = best). */
export const SUPPLIER_BADGE_ORDER: Record<SupplierBadge, number> = {
  STRATEGIC: 0,
  PREFERRED: 1,
  APPROVED: 2,
  WATCH: 3,
  BLOCKED: 4,
};

/** Numeric compatibility: a supply of grade X can satisfy a request needing grade Y
 *  only if X is at least as good as Y. A (best) satisfies A/B/C; B satisfies B/C; C satisfies C. */
export function gradeSatisfies(supplyGrade: Grade, requiredGrade: Grade): boolean {
  const rank: Record<Grade, number> = { A: 3, B: 2, C: 1 };
  return rank[supplyGrade] >= rank[requiredGrade];
}
