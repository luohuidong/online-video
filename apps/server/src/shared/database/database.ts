import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { z } from 'zod';
import * as schema from './schema.ts';

/**
 * 连接参数来自环境变量（见 .env.example），不走 config.yml——
 * 数据库凭据属于 secret，不应该和视频源配置放在同一个文件里。
 *
 * .env 由 Node 原生能力加载：`--env-file-if-exists=.env` 写在
 * package.json 的 dev/start 脚本和 Dockerfile 的 CMD 里。
 * 直接 `node src/index.ts` 不会自动加载，需要自带该 flag。
 */
const DatabaseEnvSchema = z.object({
  DATABASE_URL: z.url('DATABASE_URL must be a valid connection URL'),
  DATABASE_CONNECTION_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(10),
});

const env = (() => {
  const parsed = DatabaseEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid database environment:\n${z.prettifyError(parsed.error)}\n  Copy .env.example to .env and fill it in.`,
    );
  }
  return parsed.data;
})();

// 脱敏后打印连接目标，便于排查部署问题而不泄露凭据。
const { host, pathname } = new URL(env.DATABASE_URL);
console.log(`[database] connecting to mysql://***@${host}${pathname}`);

// 业务查询走连接池。
const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: env.DATABASE_CONNECTION_LIMIT,
});

// mysql2 驱动在传入 schema 时必须显式指定 mode。
export const db = drizzle({ client: pool, schema, mode: 'default' });

// DDL 迁移必须用单一连接而非连接池（drizzle 官方要求）。
// 注意 createConnection 返回 Promise<Connection>，漏掉 await 会让 drizzle
// 收到 Promise 对象，运行时报 "client.query is not a function"。
const migrationConnection = await mysql.createConnection({
  uri: env.DATABASE_URL,
});
// migrationsFolder 跟着源码位置解析，不依赖 cwd —— 否则换个目录启动就会静默找不到
// ./drizzle。
const migrationsFolder = fileURLToPath(
  new URL('../../../drizzle', import.meta.url),
);

try {
  const migrationDb = drizzle({ client: migrationConnection });
  await migrate(migrationDb, { migrationsFolder });
} finally {
  await migrationConnection.end();
}
