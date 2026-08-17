/**
 * Regenerates lib/db/migrations-sql.ts from the drizzle-kit output.
 * Run after `npm run db:generate`. Embeds each migration's statements so the
 * runtime runner needs no filesystem access (works inside the Next bundle).
 */
import fs from "node:fs";
import path from "node:path";

const dir = "drizzle";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const migrations = files.map((file) => {
  const id = file.replace(/\.sql$/, "");
  const sql = fs.readFileSync(path.join(dir, file), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  return { id, statements };
});

const body =
  `/**\n` +
  ` * Embedded migration statements (generated from drizzle/*.sql by scripts/embed-migrations.mjs).\n` +
  ` *\n` +
  ` * Runtime auto-migration executes these directly via db.execute(sql.raw(...)),\n` +
  ` * avoiding the file-reading migrator which breaks inside the Next server bundle.\n` +
  ` * Regenerate: \`npm run db:generate && npm run db:embed\`.\n` +
  ` */\n\n` +
  `export interface EmbeddedMigration {\n  id: string;\n  statements: string[];\n}\n\n` +
  `export const embeddedMigrations: EmbeddedMigration[] = ${JSON.stringify(migrations, null, 2)};\n`;

fs.writeFileSync("lib/db/migrations-sql.ts", body);
console.log(`Embedded ${migrations.length} migration(s) into lib/db/migrations-sql.ts`);
