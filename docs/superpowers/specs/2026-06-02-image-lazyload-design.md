# 视频卡片图片懒加载 — 设计文档

- 日期：2026-06-02
- 状态：已批准，待实施
- 范围：Web 应用

## 背景与目标

`VideoCard` 组件渲染的封面图会在网格列表中产生大量首屏外的图片请求，浪费带宽并拖慢首屏渲染。本次任务为搜索结果页的视频卡片图片启用懒加载（用户已确认扩展至全部 VideoCard 复用点）。

## 设计

### 改动范围

只改一个文件：`apps/web/src/shared/components/VideoCard.tsx`，给 `<img>` 元素加两个原生属性：

- `loading="lazy"` — 浏览器内置的懒加载，图片进入视口前不发起请求
- `decoding="async"` — 异步解码图片，避免阻塞主线程

### 受影响位置（自动受益）

`VideoCard` 共有三处调用方，全部自动获得懒加载：

- `apps/web/src/features/video-search/components/SearchResults.tsx`
- `apps/web/src/features/favorites/components/FavoriteList.tsx`
- `apps/web/src/features/play-records/components/RecordList.tsx`

三处调用方代码均不需修改。

### 不需要改动的部分

- **占位背景**：`<img>` 外层 `<div>` 已是 `aspect-2/3 bg-gray-100 dark:bg-gray-800 overflow-hidden`，图片未加载时显示灰色块，视觉上不会出现跳动。
- **可访问性**：`alt={title}` 已存在，不受影响。
- **依赖**：浏览器原生支持（Chrome、Firefox、Edge、Safari 全部支持），不引入新依赖。不支持时浏览器自动回退为立即加载，不会报错。

## 范围外（明确不做）

- 不引入懒加载库（如 `react-lazyload`）
- 不给 `VideoCard` 加 `lazy` 之类的 prop（用户已确认全 VideoCard 统一启用）
- 不动 `VideoInfo.tsx` 中的详情页大图（不在本次任务范围）
- 不动视频播放器的相关逻辑
- 不加 skeleton/占位动画（保持改动最小）

## 验证方式

实施完成后人工验证：

1. **网络行为**：DevTools Network 面板打开搜索结果页（多结果的搜索），确认首屏外的图片请求不会立即发出，滚动到视口时才发起。
2. **正常浏览**：在搜索结果页正常滚动浏览，所有封面图正常显示。
3. **回归测试**：收藏列表、播放记录列表的图片加载不受影响。
4. **构建**：`pnpm --filter web typecheck` 通过。

## 风险评估

- **极低风险**：只新增两个 HTML 属性，不改任何逻辑、状态、依赖。
- **回退成本**：撤销本次改动只需要删除这两个属性，无副作用。
