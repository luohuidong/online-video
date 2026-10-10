import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { env } from '../env.ts';
import * as schema from './schema.ts';

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
