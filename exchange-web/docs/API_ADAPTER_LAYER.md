# 接口适配层（API Adapter Layer）

## 设计目标

- **不改**后端 URL 与 **原始 JSON 结构**（在 `*.api.ts` 中用类型 `*Raw` 固定契约）。
- **页面 / Store / 组件**只依赖 **Domain**（`@/types/*` 与模块内 `*Bootstrap` 等），禁止直接引用 `*Raw`。
- 数据流：`*.api.ts`（`fetch*Raw` / `apiGet<Raw>`）→ `*.adapter.ts`（`adapt*`）→ `index.ts` 对外导出 `fetch*`。

## 目录结构

```text
src/api/
├── common/
│   └── http.ts                 # axios + ApiResult 解包（仍为基础设施）
├── market/
│   ├── index.ts                # fetchMarketTickers / fetchChartKlines（仅返回 Domain）
│   ├── market.api.ts           # fetchMarketTickersRaw / fetchChartKlinesRaw
│   ├── market.adapter.ts       # adaptMarketTickers / adaptChartKlines
│   └── market.types.ts         # MarketTickerItemRaw、KlineTupleRaw 等
├── trade/
│   ├── index.ts
│   ├── trade.api.ts            # fetchSpotTradeBootstrapRaw
│   ├── trade.adapter.ts        # adaptSpotTradeBootstrap
│   ├── trade.types.ts          # SpotTradeBootstrapRaw、SpotTradeBootstrap
│   ├── spotBootstrap.ts        # 兼容旧路径 re-export
│   └── orders.ts               # 下单占位（可按同模式补 Raw + adapter）
├── contract/
│   ├── index.ts
│   ├── contract.api.ts
│   ├── contract.adapter.ts
│   ├── contract.types.ts
│   └── bootstrap.ts
├── asset/
│   ├── index.ts
│   ├── asset.api.ts            # fetchAssetsCenterRaw、assetsCenterDomainToRaw（本地模拟）
│   ├── asset.adapter.ts
│   ├── asset.types.ts
│   ├── asset.domainMock.ts     # 金标准 Domain（仅 mock 用，非 Raw）
│   └── center.ts               # 兼容 + 提现/充值 intent
├── user/
│   ├── index.ts
│   ├── user.api.ts
│   ├── user.adapter.ts
│   ├── user.types.ts
│   ├── user.domainMock.ts
│   └── center.ts
├── market.ts                   # 根 barrel：转发 market/index
├── chartKlines.ts              # 转发 market/index
├── spotTrade.ts                # 转发 trade/index
├── futuresTrade.ts             # 转发 contract/index
├── assetsCenter.ts
└── userCenter.ts
```

## 调用示例（页面侧）

```ts
// ✅ 只拿 Domain
import { fetchMarketTickers } from '@/api/market'
import type { MarketTickerRow } from '@/types/market'

// ❌ 不要在视图里 import { MarketTickerItemRaw } from '@/api/market/market.types'
```

## 联调时替换 mock

在对应 `*.api.ts` 中取消注释 `apiGet<...>(path)`，删除或绕过本地 `*Raw` mock，保持 `adapter` 单测覆盖字段映射即可。
