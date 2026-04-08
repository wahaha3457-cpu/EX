# 新 PC 交易所前端 ↔ 旧站真实接口 — 全站映射表、风险清单与接入顺序

> **文档来源**：旧站 Knife4j 页 [doc.html](https://bian50test.qdjkdo.com/api/doc.html#/home) 底层 OpenAPI 2.0：`GET https://bian50test.qdjkdo.com/api/v2/api-docs?group=外汇管理平台`（约 **187** 个 tag、大量 `/api/...` 路径）。  
> **前端项目**：`exchange-web`（Vue 3 + Vite + Pinia + Axios）。  
> **联调代理**：开发环境通过 `vite.config.ts` 将 `/legacy-api` 代理到 `https://bian50test.qdjkdo.com/api`，`legacyHttp` 中路径 `!` 需编码为 `%21`。

---

## 一、旧接口文档结构摘要（按路径前缀聚类）

以下为 Swagger 中 `/api/*` 出现频次较高的**业务前缀**（便于与前端模块对齐；`admin` 为后台管理，PC 前台一般不用）：

| 前缀/域 | 约数量 | 与 PC 前台相关性 |
|--------|--------|------------------|
| `admin` | 多 | 低（运营后台） |
| `user` | 多 | **高**：登录、资料、安全、KYC 等 |
| `hobi` | 多 | **高**：行情、K 线、深度、成交等（命名含 `!`） |
| `wallet` | 多 | **高**：资产、充提、划转 |
| `exchangeapplyorder` / `exchange` | 多 | **高**：现货委托、成交 |
| `item` | 多 | **高**：交易对、市场列表等 |
| `c2cOrder` / `c2cAdvert` / `c2cPaymentMethod` | 中 | **中**：C2C 广告/订单/支付方式 |
| `contractApplyOrder` / `contractOrder` / `futuresOrder` | 中 | **高**：合约下单、持仓、委托 |
| `cryptos` / `depth` / K 线相关 tag | 中 | **高**：行情、深度、K 线 |
| `notice` / `news` / `cms` | 少～中 | **中**：公告、资讯、CMS |
| `itemUserOptional` | 少 | **中**：自选（H5 命名，PC 可复用） |
| `webAuthn` / OAuth 相关 | 少 | **中**：扩展登录方式 |

**说明**：同一分组内混合 **前台 API** 与 **Admin API**；接入时需在代码层按路径与 tag 过滤，避免误调后台接口。

---

## 二、新前端页面与模块清单（路由级）

| 路由/页面 | 核心数据依赖 | 当前数据来源概况 |
|-----------|--------------|------------------|
| 首页 `HomePage` | Banner、公告、热门行情、概览 | Legacy：`fetchMarketTickers` 聚合 + 可选 `/notice/list`；`MOCK=true` 时 `homeOverviewMock` |
| 行情 `MarketPage` | 全市场列表、排序、搜索、自选 | Legacy：`publicRealtimeTop` 等 + adapter；Mock 分支 `marketTickersMock` |
| 现货 `SpotTradePage` | Ticker、K 线、深度、成交、下单、委托、资产 | Legacy：`legacySpotBootstrap`（hobi + 下单 + 资产）；深度可 Binance 兜底；非 legacy 仍大量 mock |
| 合约 `ContractTradePage` | 标记价、深度、成交、持仓、委托、下单 | **主要为 mock**（`contract.api.ts` + `futuresTradeMock`）；`contract/orders.ts` 真实接口仍注释 |
| 交割/永续占位 `DeliveryTradePage` | 与合约类似 | 多为占位/演示 |
| 资产 `AssetsPage` | 多账户余额、隐藏小额、流水 | `asset.api.ts` 仍以 domainMock / 注释 API 为主 |
| 订单中心各 Tab | 现货/合约/划转/C2C/理财/NFT 等 | 现货委托部分可走 legacy；合约/NFT/C2C 等多为 mock 或独立 lite API |
| 用户中心各页 | 资料、安全、验证、API Key、会话 | `user.api.ts` 等多为注释 + mock |
| 登录/注册 | Token、用户信息 | Legacy：`/login`、`/register`（Query）+ `Token` 头；Mock 分支 |
| C2C、理财、质押、借贷、慈善、资讯、活动、邀请等 | 各业务接口 | 多数为 `*Mock.ts` 或静态目录 |
| NFT 市场 | 列表、订单、我的 NFT | **前端 mock + IndexedDB**（非旧站合约业务） |
| Demo `BinanceKlinePage` | 公共行情 | Binance 公共 API |

---

## 三、全站功能 → 旧接口映射表（执行依据）

表头对应你的要求；**「旧接口路径」**为 Swagger/已用代码中的代表路径，具体以文档为准（含 `!` 的需 `%21`）。

| 页面 | 模块 | 功能点 | 假数据/未接 | 旧接口（示例） | 方法 | 鉴权 | 分页/筛选 | 字段/结构注意 | 风险 | 处理建议 |
|------|------|--------|-------------|----------------|------|------|-----------|---------------|------|----------|
| 全局 | HTTP | BaseURL、代理、错误码 | 已部分工程化 | `/legacy-api/*` → 上游 `/api/*` | * | - | - | `code`/`msg`/`data` 与 axios 封装对齐 | 多环境 URL | 保持 `env.ts` + `http.ts` / `legacyHttp` 双轨至全站统一 |
| 全局 | 鉴权 | 登录 | Mock 可关 | `/api/login` | POST(Query) | 否 | - | 返回 `token` → 存 `Token` 头 | 与 Bearer 混用 | 已：`VITE_AUTH_PROVIDER=legacy` 走 legacy |
| 全局 | 鉴权 | 注册 | 同左 | `/api/register` 等 | POST | 否 | - | 与 UI 字段映射 | 验证码/区号 | adapter 统一 |
| 首页 | 概览 | 热门币种/涨跌幅 | MOCK 时假数据 | `hobi!publicRealtimeTop`、多 ticker 聚合 | GET | 否 | - | 字段 → `MarketRow` | 接口限流 | 缓存 + 轮询间隔 |
| 首页 | 公告 | 公告列表 | 可选未开 | `/api/notice/list` | GET | 视接口 | 有则分页 | → `Announcement` | 无数据 | 空态 + 降级隐藏 |
| 行情 | 列表 | 全市场 | 同首页源 | 同上 + `item` 类接口补全交易对 | GET | 否 | 前端排序/搜索 | 交易对命名 `BTC/USDT` vs `BTCUSDT` | 命名不一致 | **已有** `mapLegacyMarket` 扩展 |
| 行情 | 自选 | 增删查 | **多未接** | `itemUserOptional` 相关 | * | **是** | - | 与本地 localStorage 双写可选 | 仅 H5 文档 | 优先本地自选；有余力对接云端 |
| 现货交易 | 头部 | 最新价/24h | Legacy 已接 | `hobi!getKline` / ticker 类 | GET | 否 | - | 精度、时区 | K 线空 | **已有** Binance K 线兜底 |
| 现货交易 | 图表 | K 线 | 已接 | `hobi!getKline` | GET | 否 | interval/limit | OHLCV 映射 | 限流 | 防抖 + 缓存 key |
| 现货交易 | 盘口 | 深度 | 部分接 | `hobi!depth`；兜底 Binance depth | GET | 否 | - | bids/asks 格式 | 交易对映射失败 | **已有** `binanceDepth` |
| 现货交易 | 成交 | 最新成交 | Legacy | hobi 成交接口 | GET | 否 | limit | 价格/数量 string | - | 轮询 |
| 现货交易 | 下单 | 限价/市价 | Legacy | `exchangeapplyorder!open` / `openview` | POST | **是** | - | side/type/price/qty | 参数名差异 | **已有** `legacySpotOrders` 映射 |
| 现货交易 | 撤单 | 当前委托 | Legacy | `exchangeapplyorder!cancel` | POST | **是** | - | order id | - | 下单后刷新列表 |
| 现货交易 | 订单 | 当前/历史 | Legacy | `exchangeapplyorder!*` 系列 | * | **是** | 分页字段不统一 | → UI Order 模型 | 分页结构 | **adapter 统一分页** |
| 现货交易 | 资产 | 可用余额 | Legacy | 资产接口（bootstrap 内） | * | **是** | - | 与交易对 base/quote 对齐 | 多钱包类型 | bootstrap 聚合 |
| 合约交易 | 全模块 | Ticker/深度/委托/下单 | **基本 mock** | `contractApplyOrder` / `contractOrder` / `futuresOrder` / `cryptos` | * | **是** | 多种 | 与新 UI `Futures*` 类型差异大 | **高** | **下一优先级**：扫 Swagger 定 1:1 路径 + `contract.adapter` |
| 资产中心 | 总览 | 各账户余额 | **mock 为主** | `wallet` / `assets` 相关 | * | **是** | - | 多账户合并展示 | **高** | 按旧站「账户类型」建聚合 adapter |
| 资产中心 | 充提 | 地址、链、记录 | **未接** | `rechargeBlockchain` / `withdraw` / `channelBlockchain` | * | **是** | 分页 | 链与币种枚举 | 风控/KYC 前置 | 接列表 + 表单提交 + 状态轮询 |
| 资产中心 | 划转 | 现货↔合约 | **未接** | `wallet` 内划转类（文档检索） | * | **是** | - | - | 接口名不一 | 文档关键字 `transfer`/`wallet` |
| 订单中心 | 现货 Tab | 委托/成交 | 部分 | 同现货 exchangeapplyorder | * | **是** | 分页 | - | 与交易页重复调用 | 抽 `api/modules/order.ts` 复用 |
| 订单中心 | 合约 Tab | 委托/持仓 | mock | 同合约模块 | * | **是** | - | - | **高** | 合约接入后复用 |
| C2C | 广告/订单 | 列表与下单 | mock | `c2cAdvert` / `c2cOrder` | * | **是** | 分页 | - | 中 | 按业务二期 |
| 用户中心 | 资料/安全 | 个人信息、改密 | mock | `user` 下各接口 | * | **是** | - | - | 中 | 对齐 `user.api.ts` 注释路径 |
| 资讯/活动 | 列表 | 新闻/活动 | mock | `news` / `cms` / 活动接口 | * | 视接口 | 分页 | - | 低 | 只读展示优先 |

---

## 四、接入风险清单（汇总）

1. **合约**：新前端类型与旧站 `contract*` / `futures*` 字段差异大，且当前几乎全 mock → **最高优先级业务风险**。  
2. **资产/钱包**：多接口、多账户，需统一 `asset.adapter` 与金额精度，避免页面各算各的。  
3. **分页**：旧接口 `page`/`size`/`total`/`rows` 形态不统一 → 必须统一 `normalizePage()`。  
4. **鉴权**：`Token` 头 vs `Authorization: Bearer`；登出/过期跳转需全站一致。  
5. **路径 `!`**：遗漏编码导致网关 404 → 已在 `legacyHttp` 处理，**新接模块须复用**。  
6. **限流与轮询**：行情/委托列表高频请求 → 需节流、合并请求、退避。  
7. **WebSocket**：若旧站有 wss，需单独列路径与订阅格式；若无则轮询方案可先行，抽象 `marketTransport` 便于替换。  
8. **Admin 接口误用**：Swagger 同组含 admin → 代码 review 禁止前台 bundle 调用。  
9. **NFT/部分创新业务**：当前为前端 mock，与旧站「合约 NFT」未必一致 → 映射表中单独标记「非旧站核心」。

---

## 五、最稳接入顺序（建议）

1. **基础闭环**：环境变量、`legacyHttp`、`http.ts` Token 策略、登录/登出、路由守卫（已有则回归测试）。  
2. **行情 + 首页 + 行情列表**：保证全站「能看见真数据」（已有基础则补公告、自选云端可选）。  
3. **现货交易全链路**：K 线/深度/成交/下单/撤单/委托列表/余额刷新（查漏补缺订单中心现货 Tab）。  
4. **资产 + 充提划转**：钱包 API → `AssetsPage` 真实出数 → 再接记录与状态。  
5. **合约交易**：从 Swagger 拉齐下单、持仓、委托、资金 → 替换 `contract.api.ts` mock 分支。  
6. **用户中心 + 安全 + KYC**：`user` + `highLevelAuth` 等。  
7. **C2C、理财、借贷、活动**：按产品优先级并行，统一走 `api/modules/*`。  
8. **实时通道**：最后统一把轮询换 WebSocket（若后端提供）。

---

## 六、建议的工程化目录（与你要求对齐，可渐进迁移）

当前仓库已有 `src/api/trade/legacy/`、`market/legacy/` 等，**不必一次性大搬家**；新模块优先：

- `src/api/modules/market.ts`（从 `market.api.ts` / `legacyMarketApi.ts` 再导出）  
- `src/api/modules/trade.ts`、`order.ts`、`contract.ts`、`assets.ts`、`wallet.ts`、`user.ts`、`common.ts`  

Adapter 已有 `*.adapter.ts`，继续按域扩展即可。

---

## 七、当前阶段结论（供你确认后开改）

- **已完成（联调向）**：Legacy 登录、现货侧 bootstrap/下单撤单/行情与 K 线（含兜底）、首页聚合、部分深度兜底。  
- **待主攻**：**合约全站**、**资产/钱包/充提**、**订单中心非现货**、**用户中心真实接口**、**C2C/理财等 mock 模块**。  
- **下一步**：你确认本映射表无误后，按 **第五节顺序** 从 **合约 Swagger 路径清单 → `contract` adapter + `contract.api.ts` 切 legacy** 或从 **资产 `wallet` 接口清单** 开始第一批 PR 式小步提交。

---

*文档版本：与仓库 `exchange-web` 当前结构同步；接口以线上 Swagger 为准，路径或参数变更时请重新拉取 `v2/api-docs`  diff。*
