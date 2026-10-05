import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';

const dbPath = `${process.cwd()}/.data/data.db`;

// Ensure the parent directory exists before opening the SQLite file. Bun.write
// with createPath creates the full directory chain if it doesn't exist.
await Bun.write(dbPath, '', { createPath: true });

const sqlite = new Database(dbPath, { create: true });
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

// Apply pending SQL migrations on boot. drizzle's migrator is idempotent —
// it tracks which files in ./drizzle have already run in the _journal table.
migrate(db, { migrationsFolder: './drizzle' });

export { schema };
