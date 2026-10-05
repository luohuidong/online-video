import type { Config } from 'drizzle-kit';

const dbPath = `${process.cwd()}/.data/data.db`;

export default {
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
} satisfies Config;
