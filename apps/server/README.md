# server

在线视频后端 API — Hono + Node + Drizzle ORM + MySQL。

## 命令

```bash
pnpm install                  # 在 monorepo 根目录执行，安装 workspace 依赖
pnpm run dev                  # 开发（热重载，先建软链再启动）
pnpm run start                # 生产（只在 Docker 里跑，.env / config.yml 由 compose 挂载）
pnpm run typecheck            # TypeScript 类型检查
pnpm run drizzle:generate     # 根据 schema 生成新的 migration
pnpm run drizzle:push         # 把 schema 直接推到数据库（开发用）
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
  `.env`（`.env` 不入库）；Docker 部署把仓库根目录的 `.env` bind mount 到
  容器内的 `/app/.env`

## 配置文件

`config.yml` 在进程的工作目录下，定义视频源：

```yaml
sources:
  - sourceId: 'ruyi'
    sourceName: '如意资源'
    api: 'https://cj.rycjapi.com/api.php/provide/vod'
```

真实内容只在仓库根目录存一份 —— Docker 由 compose bind mount 进 `/app`，
本地开发则由 `scripts/link-root-files.ts`（`dev` 的第一步）
在本目录建软链，所以本目录里不要手写这两个文件。

数据库连接不走 `config.yml`，而是读环境变量：

| 变量                        | 必填 | 默认值 | 说明                                   |
| --------------------------- | ---- | ------ | -------------------------------------- |
| `DATABASE_URL`              | 是   | ——     | `mysql://用户名:密码@主机:端口/数据库` |
| `DATABASE_CONNECTION_LIMIT` | 否   | `10`   | 连接池大小                             |

`.env` 和 `config.yml` 一样：真实内容在仓库根目录（模板见根目录 `.env.example`），
本地开发靠软链落到 `apps/server/.env`；Docker 部署则由 compose bind mount 到
容器内的 `/app/.env`。两者主机名不同 —— 本地走 `127.0.0.1:3306`，容器内走
compose 网络里的服务名 `mysql:3306`。

`.env` 由 Node 26 原生加载（**无 `dotenv` 依赖**）：`pnpm run dev` / `pnpm run start`
都用 `--env-file=.env`，也就是缺 `.env` 就不启动 —— 这是刻意的。本地缺失时，`dev`
第一步的软链脚本会先给出「从 `.env.example` 复制一份」的提示并以非零码退出；
Docker 侧 `.env` 由 compose bind mount 进容器，Dockerfile 的 CMD 用
`--env-file-if-exists=.env`（不经 compose 手动 `docker run` 时先启动，再由
`shared/env.ts` 报错）。直接跑 `node src/index.ts` 不会加载 `.env`，请用 npm 脚本。
`.env` 已被 `.dockerignore` 排除，不会进镜像层。

`link-root-files.ts` 只在本地 `dev` 里跑（`start` 不需要软链：`.env`、`config.yml`
由 compose bind mount 到 `/app`）。它只维护 `apps/server/` 下的这两个软链：已就绪的
跳过，死链或指向别处的重建，同名**真实文件**直接删除重建（这个目录里只应该出现
软链），同名**目录**、以及仓库根目录缺文件则报错退出。软链本身也别提交：两个路径
都在 `.gitignore` / `.dockerignore` 里。

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
