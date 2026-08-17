/**
 * Database client with driver abstraction.
 *
 *  - Production: `DATABASE_URL` present → postgres-js driver (Supabase or any Postgres).
 *  - Dev / test / CI: no `DATABASE_URL` → PGlite (embedded Postgres 16, no server).
 *    `ENCUIVRE_DB_PATH` chooses a persistent directory (dev) or in-memory (":memory:", tests).
 *
 * Migrations are applied from EMBEDDED SQL (lib/db/migrations-sql.ts) via a tiny
 * idempotent runner — not the file-reading migrator, which breaks inside the
 * Next server bundle. Seeding runs on an empty DB (auto for PGlite; for a real
 * Postgres only when ENCUIVRE_SEED="true", to avoid seeding production by accident).
 *
 * NOTE: server-only module. Never import (transitively) from a Client Component.
 */

import type { PgliteDatabase } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { embeddedMigrations } from "./migrations-sql";

export type AppDb = PgliteDatabase<typeof schema>;

let dbPromise: Promise<AppDb> | null = null;

async function initDb(): Promise<AppDb> {
  const url = process.env.DATABASE_URL;
  let db: AppDb;

  if (url && url.length > 0) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 5 });
    db = drizzle(client, { schema }) as unknown as AppDb;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const path = process.env.ENCUIVRE_DB_PATH;
    const client = path && path !== ":memory:" ? new PGlite(path) : new PGlite();
    db = drizzle(client, { schema });
  }

  await runMigrations(db);
  await maybeSeed(db, !url || url.length === 0);
  return db;
}

/** Normalize execute() results across drivers (PGlite: {rows}, postgres-js: array). */
function rowsOf(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const r = (res as { rows?: unknown[] }).rows;
  return (r ?? []) as Record<string, unknown>[];
}

/** Idempotent migration runner: applies embedded SQL, tracking applied ids. */
async function runMigrations(db: AppDb): Promise<void> {
  await db.execute(
    sql.raw(`CREATE TABLE IF NOT EXISTS _migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());`),
  );
  const applied = new Set(
    rowsOf(await db.execute(sql.raw(`SELECT id FROM _migrations`))).map((r) => String(r.id)),
  );
  for (const migration of embeddedMigrations) {
    if (applied.has(migration.id)) continue;
    for (const statement of migration.statements) {
      await db.execute(sql.raw(statement));
    }
    await db.execute(sql.raw(`INSERT INTO _migrations (id) VALUES ('${migration.id}')`));
  }
}

async function maybeSeed(db: AppDb, isEmbeddedDb: boolean): Promise<void> {
  const shouldSeed = isEmbeddedDb || process.env.ENCUIVRE_SEED === "true";
  if (!shouldSeed) return;
  const res = await db.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM organizations`));
  const n = Number((rowsOf(res)[0] as { n?: number } | undefined)?.n ?? 0);
  if (n === 0) {
    const { seedDatabase } = await import("./seed-db");
    await seedDatabase(db);
  }
}

/** Lazily-initialized singleton DB (migrated + seeded on first access). */
export function getDb(): Promise<AppDb> {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

/** Test helper: drop the singleton so the next getDb() re-initializes. */
export function __resetDb(): void {
  dbPromise = null;
}

export { schema };
