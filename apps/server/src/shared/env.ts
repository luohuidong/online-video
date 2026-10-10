import { z } from 'zod';

/**
 * 进程环境变量的加载 / 校验 / 读取入口。模块在 import 时就完成校验，
 * 缺变量或格式不对会立刻抛错 —— 失败发生在启动阶段，而不是等到第一次
 * 查库时才炸。
 *
 * 数据库凭据走环境变量而不进 `config.yml`：secret 不应该和视频源配置
 * 挤在同一个文件里（见 `.env.example`）。
 *
 * `.env` 由 Node 原生能力加载，不引入 `dotenv`：
 * `--env-file-if-exists=.env` 写在 package.json 的 dev/start 脚本和
 * Dockerfile 的 CMD 里。直接 `node src/index.ts` 不会自动加载，需要
 * 自带该 flag。
 */
const EnvSchema = z.object({
  DATABASE_URL: z.url('DATABASE_URL must be a valid connection URL'),
  DATABASE_CONNECTION_LIMIT: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(10),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment:\n${z.prettifyError(parsed.error)}\n  Copy .env.example to .env and fill it in.`,
  );
}

export const env = parsed.data;
