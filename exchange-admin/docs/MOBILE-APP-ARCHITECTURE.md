# 移动端 H5 工程结构说明（Vue3 + 路由 + Pinia + API 预留）

本文档说明如何在当前仓库内与 **运营后台** 共存落地「USDT 实用交易 / 任务 / 托管」移动端壳工程，并与 `design-preview/*.html` 高保真稿对齐。

## 1. 访问入口

| 环境 | URL |
|------|-----|
| 开发 | `http://localhost:<port>/m/home`（Tab 切换子路径：`/m/market`、`/m/publish`、`/m/assets`、`/m/profile`） |
| 静态高保真 | `/design-preview/preview-app-home.html` 等 |

路由 **不挂** `requiresAuth` / `requiresAdmin`，与后台守卫无冲突；后续若 C 端需登录，在 `adminPortalGuard` 之上为 `meta.mobileRequiresAuth` 单独分支即可。

## 2. 目录与职责

```
src/
├── layouts/
│   └── MobileShellLayout.vue      # 移动端壳：主区 + 底栏
├── components/mobile/
│   └── MobileTabBar.vue           # 5 Tab，与静态稿交互一致
├── views/mobile/
│   ├── MobileHomePage.vue         # 首页（骨架）
│   ├── MobileMarketPage.vue       # 市场
│   ├── MobilePublishPage.vue      # 发布
│   ├── MobileAssetsPage.vue       # 资产
│   └── MobileProfilePage.vue      # 我的
├── router/
│   └── mobileRoutes.ts            # /m/* 子树，独立于 adminRoutes
├── stores/
│   ├── mobileWallet.ts            # 余额总览、后续可扩展流水
│   ├── mobileMarket.ts            # OTC 列表 + 任务 feed
│   ├── mobilePublish.ts           # 发布模式 + 表单草稿
│   └── mobileUser.ts              # 我的页身份/信用摘要
└── api/mobile/
    ├── types.ts                   # DTO 占位
    ├── wallet.ts
    ├── otc.ts
    ├── tasks.ts
    ├── escrow.ts
    └── user.ts
```

### 组件拆分原则（由高保真 → 工程化）

1. **壳层**：`MobileShellLayout` 只负责安全区、最大宽度、底栏占位；不放业务数据。
2. **导航**：`MobileTabBar` 纯展示 + `RouterLink`，选中态与 `route.name` 绑定。
3. **页面**：按 Tab 一页一文件；大页（市场、发布）后续可拆为：
   - `views/mobile/market/MobileMarketOtcPanel.vue`
   - `views/mobile/market/MobileMarketTaskPanel.vue`
   - `views/mobile/publish/PublishHubCards.vue`
   - `views/mobile/publish/PublishTaskForm.vue`
   - … 与 HTML 中区块一一对应，便于设计和前端并行。
4. **通用 UI**：从 `design-preview` 抽离为 `components/mobile/premium/`（如 `MpHeroWallet.vue`、`MpLedgerRow.vue`），样式用 SCSS 变量与设计 Token 对齐。

## 3. 路由组织

- **前缀**：`/m`，与后台 `/` 隔离，利于以后拆成子域 `m.example.com` 或独立 Vite 工程时 **整段复制** `views/mobile`、`router/mobileRoutes.ts`、`api/mobile`、`stores/mobile*`。
- **命名**：`RouteNames.MobileHome` … `MobileProfile`（见 `constants/routeNames.ts`）。
- **子路由**：全部为 `MobileShellLayout` 的 `children`，保证 Tab 切换不 remount 壳（仅 `RouterView` 内页面切换）。

## 4. Pinia 状态设计

| Store | 职责 | 持久化建议 |
|-------|------|------------|
| `mobileWallet` | `overview`、加载态；后续 `ledger`、`depositWithdraw` | 可选 `pinia-plugin-persistedstate` 仅草稿，余额必须实时拉取 |
| `mobileMarket` | OTC 列表、任务列表、筛选条件、分页游标 | 不持久化或仅缓存筛选 |
| `mobilePublish` | `hub \| task \| escrow \| service`、各表单 draft | localStorage 防抖草稿 |
| `mobileUser` | 昵称、UID、信用分、徽章列表 | 登录后内存 + 接口 |

跨页共享：**钱包余额** 由 `mobileWallet` 提供；首页与资产页可同 store，避免重复请求（后续可加 `loadedAt` 节流）。

## 5. API 对接预留

- **HTTP 客户端**：沿用 `@/api/common/http.ts`（Token、错误码、401 与后台一致）。
- **路径**：示例使用 `/app/wallet/overview`、`/app/otc/ads` 等 — **需与后端网关最终路径对齐**，集中改 `api/mobile/*.ts` 即可。
- **类型**：`api/mobile/types.ts` 与后端 DTO 同步；列表统一可考虑 `PageResult<T>`（已用于任务市场示例）。

对接步骤建议：

1. 后端确认前缀与字段 → 改 `types.ts` + 各 `fetch*`。
2. Store 的 `catch` 中暂可打日志；生产环境配合 Toast（可复用 `useAppStore().pushToast`）。
3. WebSocket（行情/订单）：新增 `src/websocket/mobileWs.ts` 与 store 订阅，**勿**与后台模块耦合。

## 6. 样式与移动端工程化

- **当前**：壳使用深色背景 + 与静态稿一致的 Tab 样式；页面内容为骨架，避免一次性引入 Element Plus 重组件。
- **推荐后续**：
  - `src/styles/mobile/_tokens.scss`：与 `design-preview` 变量对齐（`--usdt`、`--surface` 等）。
  - `postcss-px-to-viewport` 或 `clamp()` 做适配；安全区统一用 `env(safe-area-inset-*)`。
  - 真机调试：Vite `server.host: true`，同网段访问。

## 7. 与后台同仓的边界

- **不要**在移动端路由使用 `requiresAdmin`。
- **可**复用：`http`、`ApiResult`、鉴权存储（若 C 端与后台同一用户体系，可逐步把 `mobileUser` 与 `auth` store 打通）。
- **宜拆分**：上线压力大时，将 `mobileShellRoutes` + `views/mobile` + `api/mobile` 迁出为独立 package 或 monorepo app。

---

*文档版本随代码迭代更新；实现入口以 `src/router/mobileRoutes.ts` 为准。*
