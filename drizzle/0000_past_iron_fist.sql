CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"actor_user_id" text,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before_json" jsonb,
	"after_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buy_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_organization_id" text,
	"buyer_id" text NOT NULL,
	"material" text NOT NULL,
	"min_grade" text NOT NULL,
	"quantity_kg" integer NOT NULL,
	"target_price_per_tonne_cents" bigint NOT NULL,
	"location" text NOT NULL,
	"country" text NOT NULL,
	"needed_by" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_organization_id" text,
	"account_organization_id" text,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"country" text NOT NULL,
	"business_line" text NOT NULL,
	"verification" text NOT NULL,
	"materials" jsonb NOT NULL,
	"grades" jsonb NOT NULL,
	"provenance" text,
	"moq_kg" integer,
	"capacity_kg" integer,
	"incoterms" jsonb,
	"payment_terms" text,
	"lead_time_days" integer,
	"supplier_metrics" jsonb,
	"buyer_metrics" jsonb,
	"quality_incidents" integer,
	"last_contact_at" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"phone" text,
	"email" text,
	"memory" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_organization_id" text,
	"title" text NOT NULL,
	"buyer_id" text NOT NULL,
	"supplier_id" text,
	"material" text NOT NULL,
	"quantity_kg" integer NOT NULL,
	"stage" text NOT NULL,
	"sale_price_per_tonne_cents" bigint NOT NULL,
	"purchase_price_per_tonne_cents" bigint NOT NULL,
	"close_probability" double precision NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" text NOT NULL,
	"last_contact_at" text,
	"next_action" text,
	"next_action_at" text,
	"documents" jsonb NOT NULL,
	"risk_flags" jsonb NOT NULL,
	"business_line" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"title" text NOT NULL,
	"context" text NOT NULL,
	"decision" text NOT NULL,
	"rationale" text NOT NULL,
	"expected_outcome" text NOT NULL,
	"actual_outcome" text,
	"review_at" text,
	"status" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"type" text NOT NULL,
	"company_id" text,
	"deal_id" text,
	"issue_date" text,
	"expiry_date" text,
	"verification_status" text NOT NULL,
	"verified_at" text,
	"verified_by" text,
	"storage_key" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" text PRIMARY KEY NOT NULL,
	"deal_id" text,
	"company_id" text NOT NULL,
	"action" text NOT NULL,
	"owner_id" text NOT NULL,
	"priority" text NOT NULL,
	"due_at" text NOT NULL,
	"last_contact_at" text,
	"done" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"code" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"is_mvp" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"country" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"supplier_id" text,
	"buyer_id" text NOT NULL,
	"material" text NOT NULL,
	"grade" text NOT NULL,
	"quantity_kg" integer NOT NULL,
	"purchase_price_per_tonne_cents" bigint NOT NULL,
	"transport_cents" bigint NOT NULL,
	"insurance_cents" bigint NOT NULL,
	"customs_fees_cents" bigint NOT NULL,
	"financing_cents" bigint NOT NULL,
	"other_costs_cents" bigint NOT NULL,
	"desired_margin_percent" double precision NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sell_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_organization_id" text,
	"supplier_id" text NOT NULL,
	"material" text NOT NULL,
	"grade" text NOT NULL,
	"provenance" text NOT NULL,
	"quantity_kg" integer NOT NULL,
	"price_per_tonne_cents" bigint NOT NULL,
	"location" text NOT NULL,
	"country" text NOT NULL,
	"available_until" text,
	"incoterms" jsonb,
	"documents" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buy_requests" ADD CONSTRAINT "buy_requests_owner_organization_id_organizations_id_fk" FOREIGN KEY ("owner_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buy_requests" ADD CONSTRAINT "buy_requests_buyer_id_companies_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_organization_id_organizations_id_fk" FOREIGN KEY ("owner_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_account_organization_id_organizations_id_fk" FOREIGN KEY ("account_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_organization_id_organizations_id_fk" FOREIGN KEY ("owner_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_buyer_id_companies_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_supplier_id_companies_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_companies_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_buyer_id_companies_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sell_offers" ADD CONSTRAINT "sell_offers_owner_organization_id_organizations_id_fk" FOREIGN KEY ("owner_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sell_offers" ADD CONSTRAINT "sell_offers_supplier_id_companies_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;