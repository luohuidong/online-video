# AGENTS.md

Server app —— 基于 Node 的 Hono HTTP API，配合 Drizzle ORM + MySQL。

## 命令

在本目录（`apps/server`）下执行：

```bash
pnpm run dev            # NODE_ENV=development node --watch src/index.ts（热重载）
pnpm run start          # node src/index.ts（生产）
pnpm run typecheck      # tsc --noEmit
pnpm run drizzle:generate  # drizzle-kit generate
pnpm run drizzle:push      # drizzle-kit push
```

依赖在仓库根目录用 pnpm 安装（`pnpm install`）。服务端跑在 Node 26 上，通过原生类型擦除直接执行 TypeScript 源码 —— 没有构建步骤，因此：

- 相对导入必须带显式 `.ts`（目录 barrel 用 `/index.ts`）；`tsconfig.json` 用的是 `module`/`moduleResolution: nodenext`，漏掉会直接报 TS2835
- 只允许可擦除（erasable）的 TypeScript 语法 —— 不允许 enum、namespace、参数属性（`constructor(public x: T)`）、`import x = require()`
- 顶层 `await` **是**允许的（属于标准 ES2022 JS，不是 TS 语法）—— `shared/database/database.ts` 依赖了它

服务端从当前工作目录加载 `config.yml`。Docker 里是 `/app/config.yml`（从仓库根目录挂载进来）；本地开发把 `config.yml` 放在 `apps/server/config.yml`。`config.yml` 里**只有**视频源。

数据库连接来自环境变量而非 `config.yml` —— 见 `.env.example`。`.env` 由 **Node 原生能力加载，不引入 `dotenv` 依赖**：`dev` / `start` 脚本和 Dockerfile 的 CMD 都带 `--env-file-if-exists=.env`。直接跑 `node src/index.ts` **不会**加载 `.env`，请用 npm 脚本。Docker 里由 compose 文件直接注入 `DATABASE_URL`（指向 `mysql` 服务），所以没有该文件也无妨。`.env` 已被 gitignore，入库的只有 `.env.example`。

`drizzle.config.ts` 用不了 CLI 的 flag（drizzle-kit 会自己 fork 一个 node 进程），所以它对同一个文件编程式调用 `process.loadEnvFile()`。路径是 `new URL('./.env', import.meta.url)` —— `drizzle.config.ts` 位于 `apps/server/`，而相对 URL 是相对文件自身所在目录解析的，写成 `'../.env'` 会指向 `apps/.env`。`generate` / `check` 只把 schema 和快照做 diff、根本不连库，所以 `drizzle.config.ts` 只对真正需要数据库的命令（`push`、`studio`）才因缺少 `DATABASE_URL` 而硬失败。

## 本地开发

已经没有内存库 / 一次性数据库了。`NODE_ENV=development` 不再有任何特殊行为：`pnpm run dev` 连的是和 production 同一个 MySQL，启动时建表，并且**数据在重启后依然保留**。先把数据库拉起来（`docker compose up -d mysql`），并把 `DATABASE_URL` 写进 `apps/server/.env`。要清空本地数据，删掉数据库（`docker compose down -v`），下次启动时 migration 会重建。

## MySQL 注意事项

- **所有查询都是异步的。** `better-sqlite3` 的 `.run()` / `.get()` / `.all()` 在 `mysql2` 驱动上不存在 —— 直接 `await` 查询构造器，取单行用 `const [row] = await db.select()...`。
- **upsert 用 `onDuplicateKeyUpdate({ set })`，**而不是 `onConflictDoUpdate({ target, set })`。MySQL 的 `ON DUPLICATE KEY UPDATE` 没有冲突目标（target），任意唯一索引都能触发它。哪个索引在扮演这个角色见下方「数据库 schema」。
- **从 upsert 里拿回 id。** MySQL 没有 `INSERT ... RETURNING`，drizzle 的 MySQL builder 也不支持 `.returning()`。service 层在 `onDuplicateKeyUpdate` 里加 `id: sql\`LAST_INSERT_ID(id)\``，再从结果头里读 `insertId`（`const [result] = await db.insert(...)`）—— 唯一键冲突时它是已有行的 id，否则是新分配的 id，于是不需要再补一次 `SELECT`。
- **`drizzle({ client, schema })` 必须配 `mode: 'default'`。** 不传会抛 `DrizzleError`。注意 `schema` 和 `mode` 必须一起传：drizzle 0.45.4 的 `isConfig()` 里 `mode` 分支写坏了（它的条件 `mode !== 'default' || mode !== 'planetscale' || mode !== undefined` 恒为真），所以**不带** `schema` 的 `drizzle({ client, mode })` 会被误判成 `(client, config)` 这套重载，之后每条查询都会以 `client.query is not a function` 收场。正因为 `schema` 分支先被检查，应用才是好的。
- **`migrate()` 需要单条连接，不能用连接池**，而且 `mysql.createConnection()` 返回的是 `Promise`，必须 await。
- **DML 的返回值带着 SQLite 当年内联返回的行信息。** `update` / `delete` 解析出来是 `[ResultSetHeader, fields]`，所以 `const [result] = await db.update(...)` 再判 `result.affectedRows === 0`，同一次往返就能回答「这行存在吗」。`affectedRows` 统计的是**实际变更**的行数，只有语句真的改动了什么，它才等于**命中**的行数。
- **瓶颈是网络往返，不是提交。** 每条语句都是一次网络跳转，所以相关写操作用 `db.transaction()` 包起来拿原子性，但别指望它减少往返次数。要减少往返请把 N 次写合成一条语句 —— 参考 `batchUpdate()`：它把同一个数据源的所有视频折叠成单条 `set total_episodes = case source_video_id when ... then ... end`。
- `updated_at` 用 `bigint({ mode: 'number' })`（epoch 毫秒），这样 JSON 契约保持 `number` —— 前端类型就是这么定义的。

## 架构

Hono app 在 `src/app.ts` 里由 `createApp()` 组装；每个 feature 是 `src/features/` 下一个自包含的目录：

- `shared/config/` - 对 `config.yml` 做 `yaml.parse` + zod schema（只含视频源）
- `shared/database/` - `mysql2` 连接池 + drizzle + 启动时自动 migration；从环境变量读 `DATABASE_URL` / `DATABASE_CONNECTION_LIMIT`
- `middleware/access-log.ts` - 请求访问日志
- `features/videos/` - 跨源搜索 + 详情 + 批量更新
- `features/favorites/` - 收藏 CRUD
- `features/play-records/` - 播放进度 CRUD
- `index.ts` - 进程入口：副作用导入 shared、创建 app、调用 `@hono/node-server` 的 `serve()`

## 约定

- **导出纪律** —— 只 `export` 有明确外部消费者的符号。只有当至少一个外部模块已经 import 了某符号时，才允许从 `index.ts` barrel 重新导出它。避免前瞻性 / 投机性导出；新消费者出现的那一刻 TS 就会提示你，届时再补 export 也只是几秒钟的事。不要为了 IDE 自动补全或「公开 API 门面」这类装饰性理由而 re-export。

数据库 schema（`shared/database/schema.ts`，`mysqlTable`）：

- `videos` - 视频元信息（sourceId、sourceVideoId、title、cover、year、totalEpisodes）。`(source_id, source_video_id)` 上的唯一索引 `videos_source_video_idx` 正是让 `onDuplicateKeyUpdate` 命中正确那一行的东西。
- `favorites` - 用户收藏（videoId、updatedAt）。唯一索引 `favorites_video_idx` 建在 `(video_id)` 上 —— 作用同上。
- `play_records` - 播放进度（videoId、episodeIndex、updatedAt）。唯一索引 `play_records_video_idx` 建在 `(video_id)` 上 —— 作用同上。

字符串列必须显式声明 `length`（MySQL 要求）。给值留得宽裕些：默认 `sql_mode` 含 `STRICT_TRANS_TABLES`，超长会直接报错，而不是被静默截断。

## API 设计（RESTful）

所有接口都必须实现成 RESTful API，没有例外。

- **资源**在 URI 里用复数名词（`/videos`、`/favorites`、`/play-records`）。路径里绝不出现动词 —— 动作用 HTTP method 表达。
- **HTTP method** 与 CRUD 一一对应：
  - `GET /resources` —— 列表，`GET /resources/:id` —— 单条详情
  - `POST /resources` —— 创建（返回 `201 Created`）
  - `PUT /resources/:id` —— 整体替换
  - `PATCH /resources/:id` —— 局部更新
  - `DELETE /resources/:id` —— 删除（返回 `204 No Content`）
- **嵌套**用来表达父子关系（如 `/videos/:id/episodes`）。URI 保持浅 —— 一层嵌套通常就够。
- **HTTP 状态码**遵循标准语义：
  - `200 OK` 用于成功的读取 / 更新
  - `201 Created` 用于资源被创建
  - `204 No Content` 用于成功的删除和「成功但无 body」
  - `400 Bad Request` 用于校验 / schema 失败
  - `404 Not Found` 用于资源不存在
  - `409 Conflict` 用于状态冲突（如重复键）
  - `5xx` 严格保留给服务端故障
- **无状态** —— 每个请求都自带服务端需要的一切；请求之间不保留会话状态。
- **幂等** —— `GET`、`PUT`、`DELETE` 必须可以安全重试。`POST` 是唯一非幂等的动词，专门留给创建。
- **查询字符串**只用于过滤、排序、分页和搜索（`?q=...`、`?page=...`），绝不用于标识资源。
- **错误响应**统一一种结构（`{ message, error? }`）—— 绝不用 HTML。
- **校验**用 zod schema 配合 `@hono/zod-validator` 中间件，作用于 `query` / `param` / `json`。TypeScript 类型从 schema 推导。

## 与旧 NestJS 实现的差异

| NestJS（已移除）                            | Hono + Node（当前）                                                   |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `NestFactory.create()` + Express            | `@hono/node-server` 的 `serve({ fetch: app.fetch })`                  |
| `js-yaml`                                   | `yaml.parse`                                                          |
| `fs.readFile / writeFile`                   | `node:fs/promises` 的 `readFile` / `mkdirSync`                        |
| `node:crypto.createHash('sha256')`          | `node:crypto` 的 `createHash`                                         |
| `mysql2` + `drizzle-orm/mysql2`             | `mysql2` + `drizzle-orm/mysql2`                                       |
| `@nestjs/schedule` 的 `@Cron('0 12 * * *')` | 已移除 —— 无定时任务，集数刷新由 `POST /videos/batch-update` 按需触发 |
| 缓存用 `fs.readdir`                         | `node:fs/promises` 的 `readdir` / `opendir`                           |
| `@nestjs/swagger` 注解                      | 不再引入 —— schema 写在 zod 里，见 `src/features/*/dto.ts`            |
| Nest DI（`@Injectable()` + `Module`）       | 普通 `import` / 模块级单例                                            |
| `NotFoundException` 等 + 全局 filter        | 自定义错误类 + `try/catch` + `app.onError`                            |
