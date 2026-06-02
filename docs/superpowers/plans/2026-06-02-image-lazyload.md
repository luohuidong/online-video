# 视频卡片图片懒加载 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 `VideoCard` 组件的 `<img>` 元素加上原生 `loading="lazy"` 和 `decoding="async"` 属性，使其封面图进入视口前不发起请求。

**Architecture:** 单一文件、纯声明式改动 — 只新增两个 HTML 属性，不改逻辑、不改状态、不改依赖。三处 VideoCard 调用方（搜索结果、收藏、播放记录）自动受益。

**Tech Stack:** React 19 + Vite + Tailwind CSS 4。无新依赖。

**Why no TDD tasks:** 改动是纯 HTML 属性，没有任何可单元测试的逻辑分支。`loading="lazy"` 是浏览器内置行为，无法用 jsdom 测出真实效果。`apps/web` 也没有现成测试框架（无 vitest/jest 配置、无 .test 文件）。验证通过 DevTools Network 面板人工确认（见 Task 1 Step 4）。

---

## File Structure

**Modify:**
- `apps/web/src/shared/components/VideoCard.tsx` — 第 26-30 行的 `<img>` 元素，新增两个属性

**No new files, no new dependencies, no call-site changes.**

---

### Task 1: 给 VideoCard 的 img 元素加懒加载属性

**Files:**
- Modify: `apps/web/src/shared/components/VideoCard.tsx:26-30`

- [ ] **Step 1: 修改 VideoCard.tsx 的 img 元素**

将第 26-30 行：

```tsx
        {poster ? (
          <img
            src={proxyImageUrl(poster)}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
```

改为：

```tsx
        {poster ? (
          <img
            src={proxyImageUrl(poster)}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
```

`loading="lazy"` 启用浏览器内置懒加载（图片进入视口前不发请求）。`decoding="async"` 让图片解码在后台进行、不阻塞主线程渲染。`alt={title}` 保持不变，无障碍不受影响。

- [ ] **Step 2: 跑 typecheck 验证没有类型错误**

Run: `pnpm --filter web typecheck`
Expected: 退出码 0，无错误输出。

- [ ] **Step 3: 启动 web dev server 准备手动验证**

Run: `pnpm --filter web dev`（或项目根目录的 `pnpm dev:web`）
Expected: Vite 启动，输出 `Local: http://localhost:5173/`（或类似端口）。

- [ ] **Step 4: 手动验证懒加载行为**

打开浏览器 DevTools，切换到 Network 面板，按 `Img` 类型筛选。

1. 访问搜索结果页（例如搜索有 ≥30 个结果的关键词）
2. 滚动到页面底部之前，观察 Network 面板：首屏外的图片请求**不会**出现在列表中
3. 缓慢向下滚动，每次有图片进入视口，对应的图片请求才出现
4. 验证图片正常显示、无白屏/闪烁（灰色背景是预期的，加载完成后被图片覆盖）

如果以上 4 点都符合，懒加载生效。

- [ ] **Step 5: 回归验证另两处 VideoCard 复用点**

访问收藏列表页和播放记录页（前提：对应功能有数据）：
- 图片正常加载显示
- 列表项较多时，滚动行为正常

- [ ] **Step 6: 提交**

```bash
git add apps/web/src/shared/components/VideoCard.tsx
git commit -m "feat(web): add loading=lazy and decoding=async to VideoCard images"
```

---

## Self-Review

- **Spec coverage**: 文档要求只改 `VideoCard.tsx` 的 `<img>` 加两个属性 — Task 1 完整覆盖。验证方式（DevTools Network 面板、滚动行为、typecheck）— Step 2/4/5 全部覆盖。
- **Placeholder scan**: 无 TBD / TODO / "implement later" / "add appropriate" 模糊语句。每个代码步骤都给出了完整代码。
- **Type consistency**: 没有跨任务的类型/函数名需要保持一致（单一文件、单一改动）。
- **Scope check**: 单一原子任务，单一文件，单一 commit。完全可执行。

无问题。
