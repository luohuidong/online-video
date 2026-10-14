# AGENTS.md

Server app —— 基于 Node 的 Hono HTTP API，配合 Drizzle ORM + MySQL。

## 命令

在本目录（`apps/server`）下执行：

```bash
pnpm run dev            # 先建软链，再 node --env-file=.env --watch src/index.ts（热重载）
pnpm run start          # node --env-file=.env src/index.ts（生产，只在 Docker 里跑，不建软链）
pnpm run typecheck      # tsc --noEmit
pnpm run drizzle:generate  # drizzle-kit generate
pnpm run drizzle:push      # drizzle-kit push
```

依赖在仓库根目录用 pnpm 安装（`pnpm install`）。服务端跑在 Node 26 上，通过原生类型擦除直接执行 TypeScript 源码 —— 没有构建步骤，因此：

- 相对导入必须带显式 `.ts`（目录 barrel 用 `/index.ts`）；`tsconfig.json` 用的是 `module`/`moduleResolution: nodenext`，漏掉会直接报 TS2835
- 只允许可擦除（erasable）的 TypeScript 语法 —— 不允许 enum、namespace、参数属性（`constructor(public x: T)`）、`import x = require()`

服务端从当前工作目录加载 `config.yml`。Docker 里是 `/app/config.yml`（从仓库根目录挂载进来）；本地开发则由 `scripts/link-root-files.ts`（`dev` 的第一步）在 `apps/server/config.yml` 建软链指向仓库根目录那份。`config.yml` 里**只有**视频源。

**`.env` 和 `config.yml` 的真实内容只在仓库根目录存一份。** 两者的加载点全在以 `apps/server/` 为基准的位置：`--env-file=.env` 相对 cwd、`shared/config/config.ts` 的 `${process.cwd()}/config.yml`、`drizzle.config.ts` 的 `new URL('./.env', import.meta.url)`。所以本地 `dev` 的第一步跑 `node scripts/link-root-files.ts`，把仓库根目录那两份软链进 app 目录 —— 用软链而不是拷贝，避免本地出现两份悄悄漂移的副本；`start` 只在 Docker 里跑，`.env` / `config.yml` 由 compose bind mount 到 `/app`，Dockerfile 的 CMD 直接读挂载进来的文件，没有软链这一环。脚本是幂等的：软链已指向正确目标时跳过；死链或指向别处时重建；同名**真实文件**会被删除重建（本地 `apps/server/` 里只应该有软链；Docker 里那个路径是只读挂载，也不会在容器内跑这个脚本）；同名**目录**、以及仓库根目录缺文件则报错退出。软链已 gitignore，也必须留在 `.dockerignore` 里 —— 否则 `COPY` 会把软链拷进镜像，而 compose 再往这个路径 bind mount 时 Docker 会顺着软链把文件挂到 `/config.yml`（文件系统根目录）而不是 `/app/config.yml`。

`.env` 由 **Node 原生能力加载，不引入 `dotenv` 依赖**：`dev` / `start` 脚本都用 `--env-file=.env` —— 这是刻意的硬要求，缺 `.env` 就不启动。本地缺 `.env` 时，`dev` 第一步的软链脚本会先给出「从 `.env.example` 复制一份」的提示并以非零码退出，用户不会只看到 Node 那句 `not found`。直接跑 `node src/index.ts` **不会**加载 `.env`，请用 npm 脚本。Docker 侧 `.env` 由 compose bind mount 到 `/app/.env`，所以 Dockerfile 的 CMD 用 `--env-file-if-exists=.env`：不经 compose 直接 `docker run` 时先让进程起来，再由 `shared/env.ts` 报出缺 `DATABASE_URL`。

`drizzle.config.ts` 用不了 CLI 的 flag（drizzle-kit 会自己 fork 一个 node 进程），所以它对同一个文件编程式调用 `process.loadEnvFile()`。路径是 `new URL('./.env', import.meta.url)` —— `drizzle.config.ts` 位于 `apps/server/`，而相对 URL 是相对文件自身所在目录解析的，写成 `'../.env'` 会指向 `apps/.env`。`generate` / `check` 只把 schema 和快照做 diff、根本不连库，所以 `drizzle.config.ts` 只对真正需要数据库的命令（`push`、`studio`）才因缺少 `DATABASE_URL` 而硬失败。drizzle 脚本自己不跑软链脚本，但软链建过一次就长期存在；真要在一台新机器上直接 `drizzle:push`，先跑一次 `pnpm run dev` 把软链建好。

## 本地开发

先把数据库拉起来（`docker compose up -d mysql`），并把 `DATABASE_URL` 写进**仓库根目录**的 `.env`（从 `.env.example` 复制）。要清空本地数据，删掉数据库（`docker compose down -v`），下次启动时 migration 会重建。

## 架构

架构遵循 feature-based architecture

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
