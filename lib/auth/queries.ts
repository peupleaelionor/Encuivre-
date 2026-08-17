/**
 * DB-only auth queries (no next/headers), so they are unit-testable directly.
 */

import { eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { memberships, organizations, users } from "../db/schema";
import { verifyPassword } from "./password";
import type { AuthContext, Membership, Role } from "./rbac";

/** Organizations for a set of ids (for the header org switcher). */
export async function organizationsByIds(
  ids: string[],
): Promise<{ id: string; displayName: string }[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select({ id: organizations.id, displayName: organizations.displayName })
    .from(organizations)
    .where(inArray(organizations.id, ids));
  return rows;
}

/** Load a full auth context (user + memberships) from the DB by user id. */
export async function loadContext(userId: string): Promise<AuthContext | null> {
  const db = await getDb();
  const u = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!u) return null;
  const mems = await db.select().from(memberships).where(eq(memberships.userId, userId));
  return {
    user: { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl ?? undefined },
    memberships: mems.map(
      (m): Membership => ({ organizationId: m.organizationId, role: m.role as Role, status: m.status }),
    ),
  };
}

/** Verify credentials and return the auth context (does not set a cookie). */
export async function authenticate(email: string, password: string): Promise<AuthContext | null> {
  const db = await getDb();
  const u = (await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1))[0];
  if (!u) return null;
  if (!verifyPassword(password, u.passwordHash, u.passwordSalt)) return null;
  return loadContext(u.id);
}
