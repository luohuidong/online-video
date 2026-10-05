import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';

// Dev runs (`bun run dev`) set NODE_ENV=development in the npm script and
// get an in-memory DB — no disk writes, no stale data across restarts.
// Production / `bun run start` stays on the on-disk file.
const isDev = Bun.env.NODE_ENV === 'development';

let sqlite: Database;
if (isDev) {
  // WAL is meaningless for `:memory:` — and SQLite < 3.45 errors when set.
  sqlite = new Database(':memory:');
} else {
  const dbPath = `${process.cwd()}/.data/data.db`;
  // Ensure the parent directory exists before opening the SQLite file.
  // Bun.write with createPath creates the full directory chain if missing.
  await Bun.write(dbPath, '', { createPath: true });
  sqlite = new Database(dbPath, { create: true });
  sqlite.run('PRAGMA journal_mode = WAL;');
}
sqlite.run('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

// Apply pending SQL migrations on boot. drizzle's migrator is idempotent —
// it tracks which files in ./drizzle have already run in the _journal table.
// For `:memory:` the journal is also in-memory, so every dev restart starts
// from a fresh schema with all migrations applied.
migrate(db, { migrationsFolder: './drizzle' });
