# 前端工程结构重构说明

## 目标

在**不改动页面 UI** 的前提下，将 API、Store、类型、工具与组合式按交易所域拆分，便于长期维护与联调。

## 目录约定（摘要）

| 路径 | 职责 |
|------|------|
| `src/api/auth/` | 登录、用户资料 |
| `src/api/market/` | 行情列表、K 线 |
| `src/api/trade/` | 现货 bootstrap、现货订单 |
| `src/api/contract/` | 合约 bootstrap、合约订单 |
| `src/api/asset/` | 资产中心 |
| `src/api/user/` | 用户中心 |
| `src/api/common/` | HTTP 客户端、首页、管理后台聚合等 |
| `src/api/*.ts`（根文件） | **兼容层**：`export * from './子路径'`，旧 import 不改仍可工作 |

## 迁移策略

1. **实现下沉**：新逻辑写在 `api/<域>/` 下模块；根级 `api/market.ts`、`api/home.ts` 等仅转发。
2. **Store**：`stores/spotTrade.ts`、`stores/futuresTrade.ts` 保持 ID 与行为不变；新增 `stores/trade.ts`、`stores/contract.ts` 作为**别名出口**（同一 `defineStore` 实例）。
3. **类型**：聚合入口 `types/trade/index.ts`、`types/contract/index.ts`；原 `types/spotTrade.ts` 等路径保留。
4. **工具**：`utils/format.ts`、`utils/time.ts`、`utils/decimal.ts`、`utils/validate.ts`、`utils/storage.ts` 为统一收口；子目录文件保留兼容。
5. **Composables**：新增 `useTicker`、`useDepth`、`useTrades`、`useFormat`、`usePagination`；页面可逐步替换直连 store 的写法。

## 新代码推荐 import

- 现货交易 store：`@/stores/trade` 或 `@/stores/spotTrade`
- 合约交易 store：`@/stores/contract` 或 `@/stores/futuresTrade`
- 类型：`@/types/trade`、`@/types/contract`
- 格式化：`@/utils/format` 或 `import { ... } from '@/composables/useFormat'`

## 验证

```bash
cd exchange-web && npm run typecheck && npm run build
```
