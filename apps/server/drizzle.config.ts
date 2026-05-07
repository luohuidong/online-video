import type { Config } from 'drizzle-kit';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.resolve(process.cwd(), '.data', 'data.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
} satisfies Config;
