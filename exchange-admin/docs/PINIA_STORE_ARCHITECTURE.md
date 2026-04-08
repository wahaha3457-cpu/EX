# Pinia 状态管理方案（按业务领域）

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **按领域拆 Store** | 每个 Store 对应一条业务线（行情、交易、资产等），不按页面文件名拆分。 |
| **单例数据源** | 同一类全局数据只在一个 Store 维护，页面通过组合 Store 消费。 |
| **Setup Store + TS** | 使用 `defineStore(id, () => { ... })`，`ref`/`computed` 明确类型。 |
| **异步与 WS** | REST 加载用 `actions`；WebSocket 推送通过 `actions` 或专用 runtime 写入同一 Store，避免两套行情源。 |

### 1.1 建议的 Store 与文件映射（当前仓库）

| 领域 | Store ID | 实现文件 | 说明 |
|------|----------|----------|------|
| 应用壳 | `app` | `stores/app.ts` | 主题、语言、全局 Toast |
| 认证 | `auth` | `stores/auth.ts` | 登录态、用户摘要 |
| 行情 | `market` | `stores/market.ts` | 全市场 Ticker、筛选、自选 |
| 现货交易 | `spotTrade` | `stores/spotTrade.ts` | 别名入口：`stores/trade.ts` → 同实例 |
| 合约交易 | `futuresTrade` | `stores/futuresTrade.ts` | 别名入口：`stores/contract.ts` → 同实例 |
| 资产 | `assetsCenter` | `stores/assetsCenter.ts` | 资产总览与记录 Tab |
| 用户中心 | `userCenter` | `stores/userCenter.ts` | 安全、登录记录等非交易资料 |

可选横向模块（按需保留独立文件）：

| 领域 | 说明 |
|------|------|
| `home` | 首页运营数据聚合；若仅引用 `market` + 静态配置，可逐步变薄或合并到 `app`。 |
| `adminLayout` | 管理端布局状态，与 C 端隔离，勿与 `app` 混用。 |

---

## 2. 什么该进 Store，什么不该进

### 2.1 应该放在 Store

- **跨路由/多组件共享**的：登录用户、全市场行情列表、当前交易对上下文、资产总览。
- **需要与 URL / 路由同步**的：当前 `symbol`、交易区类型（现货/合约）（也可部分放路由 query，Store 作单一写入源）。
- **需要持久化或恢复**的：主题、自选列表 key、与业务相关的 UI 偏好（可配合 `localStorage`）。
- **来自 REST + WebSocket 合并**的：Ticker、深度、成交；Store 作为合并后的唯一读源。

### 2.2 不建议放在 Store

| 类别 | 处理方式 |
|------|----------|
| **纯展示用临时状态** | 组件 `ref`：弹窗开关、hover 行、展开折叠。 |
| **单次请求缓存** | Composable + `ref`，或 TanStack Query 类方案；不必为每个 GET 建 Store。 |
| **表单草稿**（未提交） | 优先组件内状态；若需切换 Tab 不丢，再提升到 Store 或 `sessionStorage`。 |
| **大列表虚拟滚动索引** | 留在列表组件或 useVirtualList 内。 |
| **图表实例（TradingView / LW）** | 组件生命周期内持有，不把 chart 对象放进 Pinia。 |
| **原始 WS 二进制 / 高频中间态** | 可先经 Worker/ring buffer 处理，再节流写入 Store。 |

---

## 3. 各 Store 契约（State / Getters / Actions / 类型）

以下为与现有实现对齐的**推荐契约**；`getters` 在 Setup Store 中一律用 `computed` 表达。

### 3.1 `useAppStore` — 应用壳

**职责**：全局 UI 壳、与业务无关的横切能力。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `theme` | `'dark' \| 'light'` |
| | `locale` | `string`（如 `zh-CN`） |
| | `toasts` | `ToastItem[]` |
| **Getters** | （可选）`isDark` | `computed(() => theme === 'dark')` |
| **Actions** | `setTheme` | 同步 `document.documentElement` |
| | `pushToast` / `dismissToast` | 全局消息 |

**推荐类型**（已存在于 `stores/app.ts`）：

```ts
export type ToastType = 'info' | 'success' | 'warning' | 'error'
export interface ToastItem { id: number; type: ToastType; message: string }
```

---

### 3.2 `useAuthStore` — 认证

**职责**：凭证与登录用户摘要；**不**承载资产余额（归 `asset`）。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `user` | `UserProfile \| null`（`@/types/user`） |
| | `loading` | `boolean` |
| **Getters** | `isAuthenticated` | `computed`，以 token 存在为准 |
| **Actions** | `login` / `logout` / `loadProfile` | 调 API + `tokenStorage` |
| | `setSession` / `clearSession` | 供 OAuth / 刷新链路复用 |

---

### 3.3 `useMarketStore` — 行情

**职责**：行情列表、分类筛选、自选；**不**持有「当前交易页」的深度/委托（归 `trade`/`contract`）。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `tickers` | `MarketTickerRow[]` |
| | `loading` | `boolean` |
| | `segment` | `MarketSegment` |
| | `searchQuery` | `string` |
| | `changeFilter` | `MarketChangeFilter` |
| | `watchlistKeys` | `Set<string>` |
| | `lastWsSeq` | `number`（增量合并用） |
| **Getters** | `displayRows` | 筛选后的表格行 |
| | `marketSummary` | 顶部统计（若实现） |
| **Actions** | `loadTickers` | REST |
| | `applyTickerPatch` | WS 增量 |
| | `toggleWatchlist` / 持久化 | 自选 |

---

### 3.4 `useSpotTradeStore`（领域名：**trade / 现货**）

**职责**：当前现货交易对、盘口、成交、订单、下单表单状态、图表周期。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `symbol` | `string`（如 `BTC_USDT`） |
| | `loading` | `boolean` |
| | `ticker` / `depth` / `trades` | `SpotTickerSnapshot` 等 |
| | `openOrders` / `historyOrders` / `fills` | 列表行类型 |
| | `baseAvailable` / `quoteAvailable` | `number`（展示用；精算用 `decimal` + 后端为准） |
| | `formSide` / `formType` / `priceInput` / `qtyInput` … | 下单表单 |
| | `chartInterval` | K 线周期 |
| **Getters** | `baseAsset` / `quoteAsset` | 从 `symbol` 解析 |
| **Actions** | `setSymbol` / `bootstrap` | 切换交易对并拉数据 |
| | `applyTicker` / `applyDepth` / `pushTrade` | WS |
| | `placeOrder` / `cancelOrder` | 业务 |

**推荐类型**：`@/types/spotTrade`、`@/types/spotOrderForm`；聚合类型见 `@/api/trade/trade.types` 的 `SpotTradeBootstrap`。

**命名别名**：`import { useSpotTradeStore } from '@/stores/trade'` 与 `spotTrade` 为同一 Store。

---

### 3.5 `useFuturesTradeStore`（领域名：**contract / 合约**）

**职责**：合约元数据、标记价、持仓、订单、保证金表单、资金费率相关展示。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `symbol` | 合约代码（如 `BTCUSDT`） |
| | `instrument` / `ticker` / `depth` / `trades` | `Futures*` 类型 |
| | `positions` / `openOrders` / … | 列表 |
| | `formIntent` / `leverage` / `marginMode` / 表单 inputs | 交易侧 UI |
| **Getters** | `markPrice` / `baseAsset` / `quoteAsset` | 自 `instrument`/`ticker` 推导 |
| **Actions** | `setSymbol` / `bootstrap` | 拉聚合 bootstrap |
| | `placeOrder` / `closePosition` | 业务 |

**推荐类型**：`@/types/futuresTrade`、`@/types/futuresOrderForm`。

**命名别名**：`import { useFuturesTradeStore } from '@/stores/contract'`。

---

### 3.6 `useAssetsCenterStore` — 资产

**职责**：资产总览、分账户余额、记录 Tab；**不**重复存 `auth.user`。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `payload` | `AssetsCenterPayload \| null` |
| | `activeAccountTab` / `activeRecordTab` | Tab 枚举 |
| | `hideSmallAssets` 等 | UI 偏好 |
| **Getters** | `overview` / `balanceRows` / `records` | 自 `payload` 派生 |
| **Actions** | `bootstrap` / `refresh` | 调 `fetchAssetsCenter` |

**推荐类型**：`@/types/assetsCenter`。

---

### 3.7 `useUserCenterStore` — 用户（账户扩展）

**职责**：安全项、登录记录、KYC 展示等；与 `auth` 分工：`auth` 管「是谁」，本 Store 管「账户详情与安全视图」。

| 类别 | 成员 | 类型要点 |
|------|------|----------|
| **State** | `payload` | `UserCenterPayload \| null` |
| | `activeTab` | `UserCenterNavTab` |
| **Getters** | `displayUid` | 可与 `auth.user` 合并展示 |
| **Actions** | `bootstrap` | 拉聚合数据并与 `auth` 对齐 |

**推荐类型**：`@/types/userCenter`。

---

## 4. Store 之间依赖关系（建议）

```
auth ←—— userCenter（展示 UID / 邮箱时合并）
auth ←—— asset（若后续按用户拉资产，在 action 内读 auth）
market （独立）
spotTrade / futuresTrade （独立；可读取 app.pushToast）
```

避免：`market` 依赖 `spotTrade`（行情列表不应依赖当前交易页）。

---

## 5. 与页面组件联动示例

### 5.1 在交易页组合多个 Store

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const spot = useSpotTradeStore()
const app = useAppStore()
const auth = useAuthStore()

const { symbol, ticker, loading, depth } = storeToRefs(spot)

function onSubmitOrder() {
  spot.placeOrder()
}

function onUnauthorized() {
  app.pushToast('warning', '请先登录')
}
</script>

<template>
  <div v-loading="loading">
    <header>{{ symbol }} · {{ ticker?.lastPrice }}</header>
    <!-- 子组件可继续 inject 或直接 useSpotTradeStore() -->
  </div>
</template>
```

### 5.2 只读派生：行情列表 + 跳转交易

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMarketStore } from '@/stores/market'
import { useRouter } from 'vue-router'

const market = useMarketStore()
const { displayRows, loading } = storeToRefs(market)
const router = useRouter()

function goSpot(row: { routeSymbol: string }) {
  router.push({ name: 'SpotTrade', params: { symbol: row.routeSymbol } })
}
</script>
```

### 5.3 在子组件中复用同一 Store（不 prop  drilling）

子组件直接 `useSpotTradeStore()` 即可与父页面共享同一 `symbol` / 深度数据；**无需**把深度整树通过 props 传递。

---

## 6. 落地检查清单

- [ ] 新增页面先判断数据是否已有领域 Store；没有则先扩展现有 Store，而非新建「某页 Store」。
- [ ] 异步入口统一为 `actions`，组件内避免散落 `fetch` 后多处 `ref` 赋值。
- [ ] 类型从 `@/types/*` 与 API 适配层 Domain 类型导入，Store 内避免 `any`。
- [ ] WebSocket 订阅/退订放在 layout 或 `onMounted`，与 Store 的 `apply*` actions 配合。

---

## 7. 与 `stores/index.ts` 导出

建议在入口统一导出领域名，便于检索：

```ts
export { useAppStore } from './app'
export { useAuthStore } from './auth'
export { useMarketStore } from './market'
export { useSpotTradeStore } from './spotTrade'
export { useFuturesTradeStore } from './futuresTrade'
export { useSpotTradeStore as useTradeStore } from './trade' // 可选别名文件
export { useFuturesTradeStore as useContractStore } from './contract'
export { useAssetsCenterStore } from './assetsCenter'
export { useUserCenterStore } from './userCenter'
```

（按项目实际 `index.ts` 增量添加即可。）
