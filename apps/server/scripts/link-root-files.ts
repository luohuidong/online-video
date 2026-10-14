/**
 * 把仓库根目录的 `.env` / `config.yml` 软链到 `apps/server/` 下，供本地开发的
 * `dev` 脚本在 Node 启动前调用（`start` 只在 Docker 里跑，`.env` / `config.yml`
 * 由 compose bind mount 到 `/app`，不走软链）。
 *
 * 仅支持 POSIX：Windows 上创建软链还需要额外的类型参数与权限，这里不处理。
 */

import fs from 'node:fs';
import path from 'node:path';

const FILES = ['.env', 'config.yml'] as const;
const APP_DIR = path.resolve(import.meta.dirname, '..');
const REPO_ROOT = path.resolve(APP_DIR, '../..');
const LOG_PREFIX = '[link-root-files]';

/** 建软链，存相对路径，整个仓库换位置后依然有效 */
function createLink(source: string, linkPath: string) {
  fs.symlinkSync(path.relative(path.dirname(linkPath), source), linkPath);
}

function ensureLink(source: string, linkPath: string) {
  const name = path.basename(linkPath);

  if (!fs.existsSync(source)) {
    throw new Error(
      `源文件 ${source} 不存在，请先在仓库根目录创建它（.env 可以从 .env.example 复制）`,
    );
  }

  // lstat 只看软链自身、不跟随；文件不存在时返回 undefined 而不是抛 ENOENT
  const linkStat = fs.lstatSync(linkPath, { throwIfNoEntry: false });

  if (linkStat === undefined) {
    createLink(source, linkPath);
    console.log(`${LOG_PREFIX} ${name} 已创建`);
    return;
  }

  if (linkStat.isDirectory()) {
    throw new Error(`${linkPath} 是目录而不是软链，请手动确认后删除它`);
  }

  if (!linkStat.isSymbolicLink()) {
    fs.rmSync(linkPath);
    createLink(source, linkPath);
    console.log(`${LOG_PREFIX} ${name} 已替换（原本是真实文件）`);
    return;
  }

  // 软链当前指向的绝对路径（例：raw = "../../.env"）
  const raw = fs.readlinkSync(linkPath);
  const actual = path.resolve(path.dirname(linkPath), raw);
  // 判断是否为死链：跟随软链 stat，目标不存在时返回 undefined 而不是抛 ENOENT
  const isAlive =
    fs.statSync(linkPath, { throwIfNoEntry: false }) !== undefined;

  if (!isAlive || actual !== source) {
    fs.rmSync(linkPath);
    createLink(source, linkPath);
    console.log(`${LOG_PREFIX} ${name} 已重建（原本是死链或指向别处）`);
    return;
  }

  console.log(`${LOG_PREFIX} ${name} 已就绪`);
}

// 逐个处理，坏掉一个不影响另一个；有任何失败就以非零码退出（`dev` 会因此中止）
const failures: string[] = [];

for (const file of FILES) {
  try {
    ensureLink(path.resolve(REPO_ROOT, file), path.resolve(APP_DIR, file));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`  - ${file}: ${message}`);
  }
}

if (failures.length > 0) {
  console.error(`${LOG_PREFIX} 处理失败：\n${failures.join('\n')}`);
  process.exitCode = 1;
}
