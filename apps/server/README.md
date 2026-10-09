# server

在线视频后端 API — Hono + Node + Drizzle ORM + MySQL。

## 技术栈

- **运行时**: [Node.js](https://nodejs.org) 26+（原生 type stripping 直接跑 .ts，无需构建）
- **HTTP 框架**: [Hono](https://hono.dev) 4.x（用 `@hono/node-server` 承载）
- **校验**: [zod](https://zod.dev) 4.x + [`@hono/zod-validator`](https://github.com/honojs/middleware/tree/main/packages/zod-validator)
- **ORM**: [drizzle-orm](https://orm.drizzle.team) + `drizzle-orm/mysql2` 驱动
- **数据库**: [MySQL](https://www.mysql.com/) 8.4（`mysql2` 连接池）
- **数据库迁移**: `drizzle-kit`
- **CORS**: `hono/cors`

## 命令

```bash
pnpm install                  # 在 monorepo 根目录执行，安装 workspace 依赖
pnpm run dev                  # 开发（热重载，从 apps/server 启动）
pnpm run start                # 生产
pnpm run typecheck            # TypeScript 类型检查
pnpm run drizzle:generate     # 根据 schema 生成新的 migration
pnpm run drizzle:push         # 把 schema 直接推到数据库（开发用）
```

## 目录结构

```
.
├── biome.jsonc              # 继承根 biome 配置
├── tsconfig.json
├── package.json
├── drizzle.config.ts        # drizzle-kit 配置
├── drizzle/                 # SQL migration 文件
├── config.yml               # 视频源配置（gitignored）
├── .env.example             # 数据库连接的环境变量模板（.env 本身 gitignored）
└── src/
    ├── index.ts             # 入口：@hono/node-server serve + 副作用导入（config + db）
    ├── app.ts               # createApp() Hono 工厂：注册路由、中间件、错误处理
    ├── middleware/
    │   └── access-log.ts    # 访问日志
    ├── shared/              # 跨 feature 复用的基础设施
    │   ├── config/          # config.yml 加载 (yaml.parse)
    │   │   ├── schema.ts    # Source / AppConfig 的 zod schema
    │   │   ├── config.ts    # 启动时同步加载 + 缓存
    │   │   └── index.ts
    │   └── database/        # drizzle 连接 + schema
    │       ├── schema.ts    # videos / favorites / play_records 三张表
    │       ├── database.ts  # mysql2 连接池 + 单连接 auto-migrate
    │       └── index.ts
    └── features/            # 每个 feature 自包含
        ├── videos/          # 跨源搜索 + 详情 + 批量更新
        │   ├── routes.ts
        │   ├── types.ts
        │   ├── parsers/     # 上游 vod_play_url 解析
        │   └── services/    # search / detail / batchUpdate
        ├── favorites/       # 收藏 CRUD
        └── play-records/    # 播放进度 CRUD
```

## API 列表

| 方法   | 路径                                     | 说明                                  |
| ------ | ---------------------------------------- | ------------------------------------- |
| GET    | `/videos?q=...`                          | 跨源聚合搜索                          |
| GET    | `/videos/:sourceId/:sourceVideoId`       | 视频详情（含剧集列表）                |
| POST   | `/videos/batch-update`                   | 批量更新收藏视频的集数                |
| GET    | `/favorites`                             | 收藏列表（按更新时间倒序）            |
| POST   | `/favorites`                             | 添加收藏（201）                       |
| DELETE | `/favorites`                             | 清空收藏                              |
| DELETE | `/favorites/:id`                         | 删除单条收藏                          |
| PATCH  | `/favorites/:id`                         | 触摸（更新 `updatedAt` 让其浮到顶部） |
| GET    | `/play-records`                          | 播放记录列表                          |
| GET    | `/play-records/:sourceId/:sourceVideoId` | 单条记录（不存在 → 404）              |
| PUT    | `/play-records`                          | 新增/更新播放记录（upsert）           |
| DELETE | `/play-records`                          | 清空播放记录（204）                   |
| DELETE | `/play-records/:sourceId/:sourceVideoId` | 删除单条（204）                       |

## 数据持久化

- **MySQL**: 由 `docker-compose.yml` 的 `mysql` 服务提供，端口映射到宿主机的
  `3306`，数据存在 named volume `online-video-mysql` 里
- 启动时自动跑 `./drizzle/` 下的 migration，无需手动建表
- 连接串来自环境变量而非 `config.yml`：本地开发把 `.env.example` 复制成
  `.env`（`.env` 不入库）；Docker 由 compose 的 `environment` 直接注入

## 配置文件

`config.yml` 在进程的工作目录下，定义视频源：

```yaml
sources:
  - sourceId: 'ruyi'
    sourceName: '如意资源'
    api: 'https://cj.rycjapi.com/api.php/provide/vod'
```

本地开发时放在 `apps/server/config.yml`；Docker 中由 `docker-compose.yml`
挂载到容器内的 `/app/config.yml`。

数据库连接不走 `config.yml`，而是读环境变量：

| 变量                        | 必填 | 默认值 | 说明                                   |
| --------------------------- | ---- | ------ | -------------------------------------- |
| `DATABASE_URL`              | 是   | ——     | `mysql://用户名:密码@主机:端口/数据库` |
| `DATABASE_CONNECTION_LIMIT` | 否   | `10`   | 连接池大小                             |

本地开发把 `.env.example` 复制成 `.env` 并填写；Docker 环境由
`docker-compose.yml` 的 `environment` 注入，无需 `.env` 文件。

`.env` 由 Node 26 原生加载（**无 `dotenv` 依赖**）：`pnpm run dev` /
`pnpm run start` 和 Dockerfile 的 CMD 都带 `--env-file-if-exists=.env`。
直接跑 `node src/index.ts` 不会加载 `.env`，请用 npm 脚本。
`.env` 已被 `.dockerignore` 排除，不会进镜像层。

## 本地开发

dev 不再有「内存库 / 每次重启清空」这层特殊待遇：`NODE_ENV=development`
不再影响任何东西，`pnpm run dev` 直连与生产同一个 MySQL，启动时建表，
**数据在重启后依然保留**。

```bash
# 1. 先把数据库拉起来
docker compose up -d mysql

# 2. 再起服务
pnpm run dev
```

清空本地数据：

```bash
docker compose down -v # 删掉 volume，下次启动由 migration 重建
```
