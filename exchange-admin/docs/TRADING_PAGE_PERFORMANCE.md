# 交易页前端性能优化方案（现货 / 合约）

本文面向 Vue 3 + TypeScript + Pinia 的交易所终端，与仓库内 `websocket/`、`composables/useWsSubscriptionScope.ts`、`RefCountedSubscriptionManager`、交易页 `SpotTradePage.vue` / `ContractTradePage.vue` 等实现对齐。

---

## 一、优化原则

| 原则 | 说明 |
|------|------|
| **少进响应式** | 高频原始流不要逐字段 `ref` 深层嵌套；大数组用 `shallowRef` 或合并后再一次性替换。 |
| **合并再提交** | WebSocket 同一帧内多条增量 → 合并为一次 Store 更新，减少渲染次数。 |
| **时间分片** | 盘口/成交/行情 tick 用 `requestAnimationFrame` 或节流（如 50–100ms）对齐屏幕刷新。 |
| **读多写少** | 展示层只读派生（`computed`），计算密集预处理放在 `composables` 纯函数，避免在模板里做重计算。 |
| **订阅与页面同生命周期** | 进入交易页 `start*`，离开 `stop*`；子组件用 `useWsSubscriptionScope` 注册 teardown，避免重复订阅与泄漏。 |
| **图表与 DOM 分离** | Lightweight Charts 实例不放进 Pinia；在 composable 内持有、在 `dispose` 里 `chart.remove()`。 |

---

## 二、组件级优化建议

### 1. 高频 WebSocket → Store

**问题**：每 tick 触发一次响应式更新 → 整页子树反复 patch。

**建议**：

- 在 **runtime 层**（如 `streams/*Realtime.ts`）将原始消息 **节流/合并** 后再调用 `store.applyDepth` / `applyTicker`。
- Store 内对「大列表」使用 `shallowRef` 存储快照，替换引用而非 `push` 触发深层追踪。

```ts
// 建议：深度快照用 shallowRef，整对象替换
import { shallowRef } from 'vue'
const depth = shallowRef<SpotDepthSnapshot | null>(null)

function applyDepth(next: SpotDepthSnapshot) {
  depth.value = next // 单次替换，避免深度 reactive
}
```

### 2. 盘口（Order Book）

**问题**：`buildAskViewRows` / `buildBidViewRows` 每帧全量重算 + 深度条 DOM 多。

**建议**：

- **固定展示档数**（如买卖各 15–20 档），与后端增量对齐。
- 计算结果用 **`computed`** 缓存，依赖仅为 `depth` 引用与 `maxLevels`；若 `depth` 更新极频，在 **computed 外层** 再加一层「与上一帧深度 seq 相同则短路」。
- 行组件使用 **`v-memo="[row.price, row.quantity, row.depthRatio]"`**（Vue 3）减少无关 diff。
- 列表容器使用 **`content-visibility: auto`**（可选）降低屏外绘制成本。

### 3. 最新成交（Recent Trades）

**问题**：列表无限增长、滚动区频繁更新。

**建议**：

- Store 侧 **环形缓冲**（如固定 40～50 条），新成交 `unshift` 后 `slice`，避免数组无限变长。
- 模板 **`v-memo`** 绑定 `trade.id` 或 `price+qty+time`。
- 避免在 `v-for` 里调用重格式化函数；可在写入 store 前预格式化展示字符串（权衡内存与 CPU）。

### 4. K 线（Lightweight Charts）

**问题**：`setData` 全量重绘、`update` 滥用、ResizeObserver 未清理。

**建议**：

- **历史首包**：`setData` 一次；**实时推送**：仅对 **最后一根** `candle.update` / `histogram.update`。
- 切周期 / 切交易对：先 `dispose()` 再重建，避免多实例（见 `useLightweightTradingChart` 已有 `dispose`）。
- `ResizeObserver` 与 `chart` 在 **同一 composable** 的 `onUnmounted` 中释放（当前实现已具备，保持调用）。

### 5. 当前委托 / 持仓表格

**问题**：REST + WS 双源导致重复刷新；大表全量渲染卡顿。

**建议**：

- **以服务端 orderId/positionId 为 key**，`v-for` 使用稳定 `:key`。
- 数据量大时上 **虚拟列表**（`@tanstack/vue-virtual` 或自研 `RecycleScroller`）。
- 批量更新：多条 WS 合并为一次 `ref` 替换，避免 `splice` 多次。

### 6. 页面切换与资源清理

**问题**：路由离开仍收消息、定时器未清、图表未销毁。

**建议**：

- 交易页 **`watch` + `onUnmounted`** 双保险：与当前 `SpotTradePage.vue` 一致，**切 symbol** 时 `stop` 再 `start`，**卸载** 时 `stop*`（见下「Vue3 策略」）。
- 所有 `setInterval` / `requestAnimationFrame` 必须在 teardown 中 `clear` / `cancel`。
- Private WS（订单/账户）与 Public WS 生命周期分离：用户登出时 `destroyPrivateRuntime`。

### 7. 防止重复订阅与内存泄漏

**问题**：同一频道多次 `subscribe`、热更新重复注册。

**建议**：

- 使用已有 **`RefCountedSubscriptionManager`**：`acquire(topicKey, sub, unsub)`，多组件共享同一 topic 只发一次 subscribe。
- 组件级使用 **`useWsSubscriptionScope`**，在 `onUnmounted` 统一执行 `cleanups`。
- **topicKey** 规范化：`${kind}:${symbol}:${channel}`，避免字符串拼出不一致导致重复订阅。

---

## 三、Vue 3 实现策略

| 策略 | 场景 |
|------|------|
| `shallowRef` / `shallowReactive` | 深度快照、订单列表、持仓列表 |
| `computed` + 纯函数 | 盘口视图行、筛选后的表格行 |
| `v-memo` | 盘口行、成交行、表格行 |
| `watch(..., { flush: 'post' })` | 依赖 DOM 尺寸后再调 `chart.resize` |
| `onScopeDispose`（若使用 effect scope） | 与路由守卫组合时统一释放 |
| `defineAsyncComponent` | 非首屏模块（深度图、高级订单）按需加载 |

---

## 四、推荐代码示例

### 4.1 将 WS 更新合并到下一帧（RAF）

```ts
let depthPending: SpotDepthSnapshot | null = null
let raf = 0

export function scheduleApplyDepth(store: ReturnType<typeof useSpotTradeStore>, next: SpotDepthSnapshot) {
  depthPending = next
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    if (depthPending) store.applyDepth(depthPending)
    depthPending = null
  })
}
```

页面卸载时：`cancelAnimationFrame(raf)`。

### 4.2 组件内注册可清理的订阅（与现有 composable 一致）

```ts
import { useWsSubscriptionScope } from '@/composables/useWsSubscriptionScope'
import { startSpotTradeRealtime } from '@/websocket/streams/spotTradeRealtime'

const { onScope } = useWsSubscriptionScope()

onScope(() => {
  const stop = startSpotTradeRealtime(symbol)
  return stop
})
```

### 4.3 交易页路由与 WebSocket 生命周期（与现实现一致，强化注释）

```ts
watch(
  () => route.params.symbol as string,
  (sym) => {
    store.setSymbol(sym)
    stopSpotTradeStreams()
    startSpotTradeStreams(sym)
  },
  { immediate: true },
)

onUnmounted(() => {
  stopSpotTradeStreams()
})
```

**要点**：切币先 `stop` 再 `start`，避免旧 symbol 频道残留。

### 4.4 盘口行 `v-memo`（示例）

```vue
<div
  v-for="row in askRows"
  :key="row.price"
  v-memo="[row.price, row.quantity, row.depthRatio]"
  class="ob-row"
>
  ...
</div>
```

### 4.5 K 线：仅更新最后一根（概念）

```ts
// 实时：update；换周期/全量：setData
const last = bars[bars.length - 1]
candleSeries.update(toCandle(last))
```

---

## 五、检查清单（上线前）

- [ ] 离开交易页后 Network / WS 面板中对应频道已 unsubscribe（或连接关闭）。
- [ ] 快速切换交易对 10 次，内存无明显阶梯上升（Chrome Performance / Memory）。
- [ ] 盘口、成交在 20Hz+ 推送时主线程长时间任务 < 50ms（Performance 火焰图）。
- [ ] 无 `setInterval` / `addEventListener` 未配对清除。
- [ ] Pinia 中无存储图表实例、WebSocket 实例。

---

## 六、与仓库模块的对应关系

| 模块 | 说明 |
|------|------|
| `websocket/subscription/RefCountedSubscriptionManager.ts` | 引用计数防重复订阅 |
| `composables/useWsSubscriptionScope.ts` | 组件卸载时统一 teardown |
| `websocket/runtime/publicMarketRuntime.ts` | 公共行情运行时单例，注意 `destroyPublicMarketRuntime` |
| `composables/orderBook/buildOrderBookView.ts` | 盘口纯函数，保持无副作用便于缓存 |
| `composables/chart/useLightweightTradingChart.ts` | 图表 dispose / ResizeObserver |

按上述原则迭代即可在 **不改动产品功能** 的前提下系统性提升交易页流畅度与稳定性。
