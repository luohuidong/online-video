import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.ts';

// Dev runs (`pnpm run dev`) set NODE_ENV=development in the npm script and
// get an in-memory DB — no disk writes, no stale data across restarts.
// Production / `pnpm run start` stays on the on-disk file.
const isDev = process.env.NODE_ENV === 'development';

let sqlite: Database.Database;
if (isDev) {
  sqlite = new Database(':memory:');
} else {
  const dbPath = `${process.cwd()}/.data/data.db`;
  // better-sqlite3 creates the file on open; the parent dir must exist first.
  mkdirSync(dirname(dbPath), { recursive: true });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
}
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Apply pending SQL migrations on boot. drizzle's migrator is idempotent —
// it tracks which files in ./drizzle have already run in the _journal table.
// For `:memory:` the journal is also in-memory, so every dev restart starts
// from a fresh schema with all migrations applied.
migrate(db, { migrationsFolder: './drizzle' });
