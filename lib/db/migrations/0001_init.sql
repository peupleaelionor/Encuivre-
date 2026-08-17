-- Migration 0001_init — readable mirror of lib/db/migrations.ts.
-- The canonical migration applied at runtime is the TS constant (embedded so it
-- works in the Next server bundle); this .sql file is kept for review/reference.

CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  legalName TEXT NOT NULL,
  displayName TEXT NOT NULL,
  role TEXT NOT NULL,
  country TEXT NOT NULL,
  businessLine TEXT NOT NULL,
  verification TEXT NOT NULL,
  materials TEXT NOT NULL,        -- JSON string[]
  grades TEXT NOT NULL,           -- JSON string[]
  provenance TEXT,
  moqKg INTEGER,
  capacityKg INTEGER,
  incoterms TEXT,                 -- JSON object
  paymentTerms TEXT,
  leadTimeDays INTEGER,
  supplierMetrics TEXT,           -- JSON object
  buyerMetrics TEXT,              -- JSON object
  qualityIncidents INTEGER,
  lastContactAt TEXT,
  notes TEXT
);

CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  memory TEXT NOT NULL            -- JSON object
);

CREATE TABLE sell_offers (
  id TEXT PRIMARY KEY,
  supplierId TEXT NOT NULL REFERENCES companies(id),
  material TEXT NOT NULL,
  grade TEXT NOT NULL,
  provenance TEXT NOT NULL,
  quantityKg INTEGER NOT NULL,
  pricePerTonneCents INTEGER NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  availableUntil TEXT,
  incoterms TEXT,                 -- JSON object
  documents TEXT NOT NULL,        -- JSON string[]
  createdAt TEXT NOT NULL
);

CREATE TABLE buy_requests (
  id TEXT PRIMARY KEY,
  buyerId TEXT NOT NULL REFERENCES companies(id),
  material TEXT NOT NULL,
  minGrade TEXT NOT NULL,
  quantityKg INTEGER NOT NULL,
  targetPricePerTonneCents INTEGER NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  neededBy TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  buyerId TEXT NOT NULL REFERENCES companies(id),
  supplierId TEXT REFERENCES companies(id),
  material TEXT NOT NULL,
  quantityKg INTEGER NOT NULL,
  stage TEXT NOT NULL,
  salePricePerTonneCents INTEGER NOT NULL,
  purchasePricePerTonneCents INTEGER NOT NULL,
  closeProbability REAL NOT NULL,
  ownerId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  lastContactAt TEXT,
  nextAction TEXT,
  nextActionAt TEXT,
  documents TEXT NOT NULL,        -- JSON string[]
  riskFlags TEXT NOT NULL,        -- JSON string[]
  businessLine TEXT NOT NULL
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  companyId TEXT REFERENCES companies(id),
  dealId TEXT REFERENCES deals(id),
  issueDate TEXT,
  expiryDate TEXT,
  verificationStatus TEXT NOT NULL,
  verifiedAt TEXT,
  verifiedBy TEXT,
  notes TEXT
);

CREATE TABLE follow_ups (
  id TEXT PRIMARY KEY,
  dealId TEXT REFERENCES deals(id),
  companyId TEXT NOT NULL REFERENCES companies(id),
  action TEXT NOT NULL,
  ownerId TEXT NOT NULL,
  priority TEXT NOT NULL,
  dueAt TEXT NOT NULL,
  lastContactAt TEXT,
  done INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  supplierId TEXT REFERENCES companies(id),
  buyerId TEXT NOT NULL REFERENCES companies(id),
  material TEXT NOT NULL,
  grade TEXT NOT NULL,
  quantityKg INTEGER NOT NULL,
  purchasePricePerTonneCents INTEGER NOT NULL,
  transportCents INTEGER NOT NULL,
  insuranceCents INTEGER NOT NULL,
  customsFeesCents INTEGER NOT NULL,
  financingCents INTEGER NOT NULL,
  otherCostsCents INTEGER NOT NULL,
  desiredMarginPercent REAL NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  context TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  expectedOutcome TEXT NOT NULL,
  actualOutcome TEXT,
  reviewAt TEXT,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX idx_offers_material ON sell_offers(material);
CREATE INDEX idx_requests_material ON buy_requests(material);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_documents_deal ON documents(dealId);
