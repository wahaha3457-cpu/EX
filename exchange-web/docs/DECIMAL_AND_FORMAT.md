# 数字精度与格式化工具层

## 依赖

- [decimal.js](https://mikemcl.github.io/decimal.js/)：任意精度十进制，避免 JS `number` 累乘误差。

## 模块划分

| 文件 | 职责 |
|------|------|
| `src/utils/decimal.ts` | 解析、舍入、加减乘除、名义价值、涨跌幅；`SymbolPrecision` 与默认精度 |
| `src/utils/format.ts` | 展示用字符串：价格 / 数量 / 成交额 / 百分比 / 估值 / KMB 缩写；兼容旧 `formatPrice` 等 |
| `src/utils/format/number.ts` | 兼容路径，转发至 `format.ts` |

## 使用示例

### 1. 运算（必须走 Decimal）

```ts
import { toDecimal, mul, add, roundPrice, defaultSpotPrecision } from '@/utils/decimal'

const p = defaultSpotPrecision('USDT')
const price = toDecimal('68420.12')
const qty = toDecimal('0.015')
const notional = mul(price, qty) // 中间结果仍精确
const priceRounded = roundPrice(price, p)
```

### 2. 展示（按交易对精度）

```ts
import { displayPrice, displayQuantity, displayTurnover, displayCompact, displayPercent } from '@/utils/format'
import { defaultSpotPrecision, toDecimal } from '@/utils/decimal'

const prec = defaultSpotPrecision('USDT')

displayPrice(toDecimal('68420.123456'), { precision: prec })
displayQuantity(toDecimal('1.23456789'), { precision: prec })
displayTurnover(toDecimal('872000000.4'), { precision: prec })
displayCompact(toDecimal('872000000'))
displayPercent(toDecimal('0.0182')) // 1.82%
displayPercent(toDecimal('1.82'), { alreadyPercent: true })
```

### 3. 组合式中批量引入

```ts
import { useFormat } from '@/composables/useFormat'
// 等价于 import * from '@/utils/format'
```

## 页面接入建议

1. **Instrument / 币种配置**：从后端或静态表注入 `priceDecimals`、`quantityDecimals`、`quoteDecimals`，合并为 `SymbolPrecision`，放入 Pinia 或 `provide/inject`。
2. **REST / WS 原始值**：优先以 **字符串** 存 Store，运算前 `toDecimal(s)`；仅在绘图等必须 number 的 API 再 `toNumber()`。
3. **现货 / 合约**：无配置时用 `defaultSpotPrecision(quote)`、`defaultContractPrecision(quote)`，上线后改为接口覆盖。
4. **列表性能**：同一列共用同一套 `precision` 对象引用，避免在模板里重复创建大对象。
5. **与清算一致性**：前端展示与风控展示均为「最佳努力」；**最终金额以服务端为准**。

## 旧代码迁移

- 仍可使用 `formatPrice(n: number)`（内部已用 Decimal 解析），新代码优先 `displayPrice` + `SymbolPrecision`。
- `@/utils/format/tradingDisplay`、`@/utils/format/number` 路径保留，实现统一转发到 `@/utils/format`。
