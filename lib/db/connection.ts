/**
 * SQLite connection + migration runner + first-run seeding.
 *
 * The DB path comes from `ENCUIVRE_DB_PATH` (use ":memory:" in tests), else
 * `<cwd>/data/encuivre.db`. The connection is a lazily-created singleton: on
 * first access it applies pending migrations and, if the DB is empty, loads the
 * typed seed dataset (lib/seed) so the demo dashboard is immediately parlant.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { migrations } from "./migrations";
import { seedDatabase } from "./seed-db";

let instance: Database.Database | null = null;

function resolveDbPath(): string {
  const fromEnv = process.env.ENCUIVRE_DB_PATH;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "encuivre.db");
}

function runMigrations(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`);
  const applied = new Set(
    db.prepare(`SELECT id FROM _migrations`).all().map((r) => (r as { id: string }).id),
  );
  const record = db.prepare(`INSERT INTO _migrations (id, applied_at) VALUES (?, ?)`);
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    const apply = db.transaction(() => {
      db.exec(migration.sql);
      record.run(migration.id, new Date().toISOString());
    });
    apply();
  }
}

export function getDb(): Database.Database {
  if (instance) return instance;
  const db = new Database(resolveDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  const count = db.prepare(`SELECT COUNT(*) AS n FROM companies`).get() as { n: number };
  if (count.n === 0) seedDatabase(db);
  instance = db;
  return db;
}

/** Test helper: reset the singleton (e.g. between suites). */
export function __resetDbForTests(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
