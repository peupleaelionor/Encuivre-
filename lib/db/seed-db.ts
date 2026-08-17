/**
 * First-run seeding into Postgres/PGlite.
 *
 * Creates the platform tenants and users, then loads the typed fictional dataset
 * (lib/seed) scoped to the EN CUIVRE INTERNAL organization. Two external tenants
 * (a supplier and a buyer) get their own login accounts so multi-tenant RBAC can
 * be exercised end-to-end.
 */

import type { AppDb } from "./client";
import * as seed from "../seed";
import { MATERIALS, MATERIAL_LABELS, MVP_MATERIALS } from "../enums";
import { hashPassword } from "../auth/password";
import {
  buyRequests,
  companies,
  contacts,
  deals,
  decisions,
  documents,
  followUps,
  materials,
  memberships,
  organizations,
  quotes,
  sellOffers,
  users,
} from "./schema";

/** Stable ids used across seed, dev login and tests. */
export const INTERNAL_ORG_ID = "org-encuivre";
export const SUPPLIER_ORG_ID = "org-metalsud";
export const BUYER_ORG_ID = "org-cableplus";
export const CEO_USER_ID = "user-ceo";

/** Dev-only default password for seeded accounts. Never used in production. */
export const DEV_PASSWORD = "encuivre";

const now = () => new Date();

export async function seedDatabase(db: AppDb): Promise<void> {
  const pw = hashPassword(DEV_PASSWORD);

  await db.transaction(async (tx) => {
    // --- Organizations ---
    await tx.insert(organizations).values([
      {
        id: INTERNAL_ORG_ID,
        legalName: "EN CUIVRE GROUP",
        displayName: "EN CUIVRE",
        slug: "en-cuivre",
        type: "INTERNAL",
        country: "France",
        status: "ACTIVE",
      },
      {
        id: SUPPLIER_ORG_ID,
        legalName: "MétalSud Distribution SAS",
        displayName: "MétalSud",
        slug: "metalsud",
        type: "SUPPLIER",
        country: "France",
        status: "ACTIVE",
      },
      {
        id: BUYER_ORG_ID,
        legalName: "CâblePlus Industries SA",
        displayName: "CâblePlus",
        slug: "cableplus",
        type: "BUYER",
        country: "France",
        status: "ACTIVE",
      },
    ]);

    // --- Users (all share the dev password) ---
    const mkUser = (id: string, email: string, name: string) => ({
      id,
      email,
      name,
      passwordHash: pw.hash,
      passwordSalt: pw.salt,
      createdAt: now(),
      updatedAt: now(),
    });
    await tx.insert(users).values([
      mkUser(CEO_USER_ID, "ceo@encuivre.example", "PDG EN CUIVRE"),
      mkUser("user-sales", "sales@encuivre.example", "Commercial EN CUIVRE"),
      mkUser("user-compliance", "compliance@encuivre.example", "Compliance EN CUIVRE"),
      mkUser("user-finance", "finance@encuivre.example", "Finance EN CUIVRE"),
      mkUser("user-metalsud", "contact@metalsud.example", "MétalSud Portal"),
      mkUser("user-cableplus", "achat@cableplus.example", "CâblePlus Portal"),
    ]);

    // --- Memberships ---
    const mkMember = (id: string, userId: string, organizationId: string, role: string) => ({
      id,
      userId,
      organizationId,
      role,
      status: "ACTIVE",
    });
    await tx.insert(memberships).values([
      mkMember("m-ceo", CEO_USER_ID, INTERNAL_ORG_ID, "CEO"),
      mkMember("m-sales", "user-sales", INTERNAL_ORG_ID, "SALES"),
      mkMember("m-compliance", "user-compliance", INTERNAL_ORG_ID, "COMPLIANCE"),
      mkMember("m-finance", "user-finance", INTERNAL_ORG_ID, "FINANCE"),
      mkMember("m-metalsud", "user-metalsud", SUPPLIER_ORG_ID, "SUPPLIER"),
      mkMember("m-cableplus", "user-cableplus", BUYER_ORG_ID, "BUYER"),
    ]);

    // --- Reference: materials ---
    await tx.insert(materials).values(
      MATERIALS.map((code) => ({
        code,
        label: MATERIAL_LABELS[code],
        isMvp: MVP_MATERIALS.includes(code) ? 1 : 0,
      })),
    );

    // --- Business data (scoped to INTERNAL, with two counterparties linked to their org) ---
    await tx.insert(companies).values(
      seed.companies.map((c) => ({
        ...c,
        ownerOrganizationId: INTERNAL_ORG_ID,
        accountOrganizationId:
          c.id === "sup-metalsud" ? SUPPLIER_ORG_ID : c.id === "buy-cableplus" ? BUYER_ORG_ID : null,
      })),
    );

    await tx.insert(contacts).values(seed.contacts.map((c) => ({ ...c })));

    await tx.insert(sellOffers).values(
      seed.sellOffers.map((o) => ({ ...o, ownerOrganizationId: INTERNAL_ORG_ID })),
    );

    await tx.insert(buyRequests).values(
      seed.buyRequests.map((r) => ({ ...r, ownerOrganizationId: INTERNAL_ORG_ID })),
    );

    await tx.insert(deals).values(
      seed.deals.map((d) => ({ ...d, ownerOrganizationId: INTERNAL_ORG_ID })),
    );

    await tx.insert(documents).values(
      seed.documents.map((d) => ({ ...d, organizationId: INTERNAL_ORG_ID })),
    );

    await tx.insert(followUps).values(
      seed.followUps.map((f) => ({ ...f, done: f.done ? 1 : 0 })),
    );

    await tx.insert(quotes).values(
      seed.quotes.map((q) => ({ ...q, organizationId: INTERNAL_ORG_ID })),
    );

    await tx.insert(decisions).values(
      seed.decisions.map((d) => ({ ...d, organizationId: INTERNAL_ORG_ID })),
    );
  });
}
