import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit 自己启动 node，package.json 脚本里的 --env-file 传不到这里，
// 所以用 Node 原生的 process.loadEnvFile() 编程式加载同一份 .env。
const envPath = new URL('./.env', import.meta.url);
if (existsSync(envPath)) process.loadEnvFile(envPath);

// `generate` 只比对 schema.ts 与快照、产出 SQL 文件，全程不连库，
// 所以缺 DATABASE_URL 时也放行；push / studio 才需要真实连接串。
const command = process.argv[2] ?? '';
const offlineCommands = new Set(['generate', 'check']);
const url =
  process.env.DATABASE_URL?.trim() ||
  (offlineCommands.has(command) ? 'mysql://user:password@localhost/db' : '');

if (!url) {
  throw new Error(
    `DATABASE_URL is not set — copy .env.example to .env and fill it in (drizzle-kit ${command})`,
  );
}

export default defineConfig({
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: { url },
});
