# server

在线视频后端 API — Hono + Bun + Drizzle ORM + SQLite。

## 技术栈

- **运行时**: [Bun](https://bun.com) 1.1.27+
- **HTTP 框架**: [Hono](https://hono.dev) 4.x（用 `Bun.serve` 承载）
- **校验**: [zod](https://zod.dev) 4.x + [`@hono/zod-validator`](https://github.com/honojs/middleware/tree/main/packages/zod-validator)
- **ORM**: [drizzle-orm](https://orm.drizzle.team) + `drizzle-orm/bun-sqlite` 驱动
- **数据库迁移**: `drizzle-kit`
- **CORS**: `hono/cors`

## 命令

```bash
bun install                  # 在 monorepo 根目录执行，安装 workspace 依赖
bun run dev                  # 开发（热重载，从 apps/server 启动）
bun run start                # 生产
bun run typecheck            # TypeScript 类型检查
bun run drizzle:generate     # 根据 schema 生成新的 migration
bun run drizzle:push         # 把 schema 直接推到数据库（开发用）
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
└── src/
    ├── index.ts             # 入口：Bun.serve + 副作用导入（config + db + cron）
    ├── app.ts               # createApp() Hono 工厂：注册路由、中间件、错误处理
    ├── middleware/
    │   └── access-log.ts    # 访问日志
    ├── shared/              # 跨 feature 复用的基础设施
    │   ├── config/          # config.yml 加载 (Bun.YAML.parse)
    │   │   ├── schema.ts    # Source / AppConfig 的 zod schema
    │   │   ├── config.ts    # 启动时同步加载 + 缓存
    │   │   └── index.ts
    │   └── database/        # drizzle 连接 + schema
    │       ├── schema.ts    # videos / favorites / play_records 三张表
    │       ├── database.ts  # new Bun.SQLite + WAL/foreign_keys + auto-migrate
    │       └── index.ts
    └── features/            # 每个 feature 自包含
        ├── videos/          # 跨源搜索 + 详情 + 批量更新 + cron 入口
        │   ├── routes.ts
        │   ├── types.ts
        │   ├── parsers/     # 上游 vod_play_url 解析
        │   └── services/    # search / detail / batchUpdate / refresh (Bun.cron)
        ├── favorites/       # 收藏 CRUD
        ├── play-records/    # 播放进度 CRUD
        └── image-proxy/     # 第三方封面图代理 + 磁盘缓存 + LRU 淘汰
            ├── routes.ts
            ├── service.ts   # 编排层（含 inflight 去重）
            ├── fetcher.ts   # 上游 fetch + 大小/类型校验
            ├── cache.ts     # Bun.file / Bun.write / Bun.Glob
            ├── errors.ts
            └── dto.ts
```

## API 列表

| 方法   | 路径                                     | 说明                                        |
| ------ | ---------------------------------------- | ------------------------------------------- |
| GET    | `/videos?q=...`                          | 跨源聚合搜索                                |
| GET    | `/videos/:sourceId/:sourceVideoId`       | 视频详情（含剧集列表）                      |
| POST   | `/videos/batch-update`                   | 批量更新收藏视频的集数                      |
| GET    | `/favorites`                             | 收藏列表（按更新时间倒序）                  |
| POST   | `/favorites`                             | 添加收藏（201）                             |
| DELETE | `/favorites`                             | 清空收藏                                    |
| DELETE | `/favorites/:id`                         | 删除单条收藏                                |
| PATCH  | `/favorites/:id`                         | 触摸（更新 `updatedAt` 让其浮到顶部）       |
| GET    | `/play-records`                          | 播放记录列表                                |
| GET    | `/play-records/:sourceId/:sourceVideoId` | 单条记录（不存在 → 404）                    |
| PUT    | `/play-records`                          | 新增/更新播放记录（upsert）                 |
| DELETE | `/play-records`                          | 清空播放记录（204）                         |
| DELETE | `/play-records/:sourceId/:sourceVideoId` | 删除单条（204）                             |
| GET    | `/image-proxy?url=...`                   | 第三方封面图代理（带 ETag / Cache-Control） |

## 数据持久化

- **SQLite 文件**: `<cwd>/.data/data.db`（启动时自动建表、自动跑 migration）
- **图片缓存**: `<cwd>/.cache/images/`，500 MiB 上限 + LRU 淘汰
- 两者都已在 `.gitignore` 里。

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
