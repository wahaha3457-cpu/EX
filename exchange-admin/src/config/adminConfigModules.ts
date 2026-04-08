/**
 * 配置管理 — 各二、三级路由演示配置（对接 API 时替换 rows）
 */
import type { UserModuleColumn, UserModuleDef } from '@/config/adminUserModules'

export type ConfigModuleColumn = UserModuleColumn

export type ConfigModuleKey =
  | 'marketOverview'
  | 'marketSymbols'
  | 'fxSettings'
  | 'wealthEarn'
  | 'wealthMiner'
  | 'wealthBots'
  | 'wealthLending'
  | 'wealthTeamWithdraw'
  | 'contractPerpetual'
  | 'contractDelivery'
  | 'contentClient'
  | 'contentNews'
  | 'contentBanners'

const df = (ts: number) => new Date(ts).toLocaleString('zh-CN')

const ONOFF = {
  ON: { type: 'success' as const, label: '启用' },
  OFF: { type: 'info' as const, label: '停用' },
}

const CFG_OK = {
  ACTIVE: { type: 'success' as const, label: '生效' },
  DRAFT: { type: 'warning' as const, label: '草稿' },
  REVIEW: { type: 'info' as const, label: '审核中' },
}

const PUBLISH = {
  ONLINE: { type: 'success' as const, label: '已发布' },
  OFFLINE: { type: 'info' as const, label: '下线' },
  SCHEDULED: { type: 'warning' as const, label: '定时' },
}

export const ADMIN_CONFIG_MODULE_REGISTRY: Record<ConfigModuleKey, UserModuleDef> = {
  marketOverview: {
    title: '行情管理',
    subtitle:
      '行情源接入、延迟监控与全局开关；与交易对列表、风控熔断联动。对接示例：GET /v1/admin/config/market/overview。',
    hint: '行情 · 总览',
    keywordPlaceholder: '数据源 / 备注关键字',
    filterKeywordLabel: '检索',
    listCaption: '行情源与聚合任务',
    drawerNote: '可挂载 WS 连接数、丢包率、备用源切换记录与告警订阅。',
    stats: [
      { label: '主源在线', value: '3', tone: 'ok' },
      { label: '延迟告警', value: '0', tone: 'warn' },
      { label: '覆盖交易对', value: '428', tone: 'default' },
      { label: '今日切换', value: '1', tone: 'muted' },
    ],
    columns: [
      { prop: 'sourceId', label: '源 ID', width: 110 },
      { prop: 'name', label: '名称', minWidth: 130 },
      { prop: 'latencyMs', label: '延迟(ms)', width: 100 },
      { prop: 'pairs', label: '品种数', width: 88 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { sourceId: 'SRC-A', name: '聚合主源', latencyMs: '42', pairs: '428', status: 'ON', updatedAt: df(Date.now() - 60000) },
      { sourceId: 'SRC-B', name: '备用源 1', latencyMs: '120', pairs: '410', status: 'ON', updatedAt: df(Date.now() - 120000) },
      { sourceId: 'SRC-C', name: '指数参考', latencyMs: '—', pairs: '200', status: 'OFF', updatedAt: df(Date.now() - 86400000) },
      { sourceId: 'SRC-D', name: '延迟测试源', latencyMs: '890', pairs: '50', status: 'OFF', updatedAt: df(Date.now() - 3600000) },
    ],
  },
  marketSymbols: {
    title: '行情品种管理',
    subtitle:
      '交易对展示开关、精度、最小变动与指数成分；影响前端与撮合订阅。对接示例：GET /v1/admin/config/market/symbols。',
    keywordPlaceholder: '交易对 / 基础币',
    filterKeywordLabel: '检索',
    listCaption: '品种列表',
    drawerNote: '详情可编辑 tick/step、深度档位、标记价格来源与停牌原因码。',
    stats: [
      { label: '已上线', value: '386', tone: 'ok' },
      { label: '仅指数', value: '42', tone: 'default' },
      { label: '停牌', value: '3', tone: 'warn' },
      { label: '今日变更', value: '5', tone: 'muted' },
    ],
    columns: [
      { prop: 'symbol', label: '交易对', width: 120 },
      { prop: 'base', label: '基础', width: 80 },
      { prop: 'quote', label: '计价', width: 80 },
      { prop: 'tick', label: '最小价变', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { TRADE: { type: 'success', label: '交易' }, INDEX: { type: 'info', label: '指数' }, HALT: { type: 'danger', label: '停牌' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT', tick: '0.01', status: 'TRADE', updatedAt: df(Date.now() - 3600000) },
      { symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT', tick: '0.001', status: 'TRADE', updatedAt: df(Date.now() - 7200000) },
      { symbol: 'INDEX-BTC', base: 'BTC', quote: 'USDT', tick: '—', status: 'INDEX', updatedAt: df(Date.now() - 86400000) },
      { symbol: 'MEME/USDT', base: 'MEME', quote: 'USDT', tick: '0.00001', status: 'HALT', updatedAt: df(Date.now() - 1800000) },
      { symbol: 'SOL/USDT', base: 'SOL', quote: 'USDT', tick: '0.001', status: 'TRADE', updatedAt: df(Date.now() - 600000) },
    ],
  },
  fxSettings: {
    title: '汇率配置',
    subtitle:
      '法币与数字资产参考汇率、点差策略与刷新频率；影响 C2C 与展示价。对接示例：GET /v1/admin/config/fx/settings。',
    hint: '汇率',
    keywordPlaceholder: '货币对 / 源',
    filterKeywordLabel: '检索',
    listCaption: '汇率条目',
    drawerNote: '可配置多源加权、人工覆写窗口与审计流水。',
    stats: [
      { label: '货币对', value: '48', tone: 'default' },
      { label: '人工覆写', value: '2', tone: 'warn' },
      { label: '今日刷新', value: '12,400 次', tone: 'muted' },
      { label: '异常偏离', value: '0', tone: 'ok' },
    ],
    columns: [
      { prop: 'pair', label: '货币对', width: 110 },
      { prop: 'mid', label: '中间价', width: 110 },
      { prop: 'spreadBps', label: '点差(bps)', width: 100 },
      { prop: 'source', label: '数据源', minWidth: 120 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { pair: 'USD/CNY', mid: '7.18', spreadBps: '8', source: '多源加权', status: 'ON', updatedAt: df(Date.now() - 60000) },
      { pair: 'EUR/USD', mid: '1.084', spreadBps: '12', source: 'Reuters', status: 'ON', updatedAt: df(Date.now() - 120000) },
      { pair: 'VND/USD', mid: '25420', spreadBps: '20', source: '本地行', status: 'ON', updatedAt: df(Date.now() - 300000) },
      { pair: 'USD/JPY', mid: '149.2', spreadBps: '10', source: '手工覆写', status: 'ON', updatedAt: df(Date.now() - 86400000) },
    ],
  },
  wealthEarn: {
    title: '理财配置',
    subtitle:
      '活期/定期产品参数、利率档位与申购开关。对接示例：GET /v1/admin/config/wealth/earn。',
    keywordPlaceholder: '产品码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: '理财产品',
    drawerNote: '扩展：额度池、阶梯 APR、白名单与风控标签。',
    stats: [
      { label: '在售', value: '12', tone: 'ok' },
      { label: '草稿', value: '2', tone: 'warn' },
      { label: 'AUM 估', value: '2.4 亿 U', tone: 'default' },
      { label: '今日申购', value: '¥ 820 万', tone: 'muted' },
    ],
    columns: [
      { prop: 'code', label: '产品码', width: 110 },
      { prop: 'name', label: '名称', minWidth: 130 },
      { prop: 'apr', label: '参考 APR', width: 100 },
      { prop: 'term', label: '期限', width: 88 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: CFG_OK },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { code: 'EARN-FLEX', name: '活期宝', apr: '4.2%', term: '活期', status: 'ACTIVE', updatedAt: df(Date.now() - 3600000) },
      { code: 'EARN-90D', name: '稳健 90 天', apr: '6.8%', term: '90D', status: 'ACTIVE', updatedAt: df(Date.now() - 86400000) },
      { code: 'EARN-VIP', name: 'VIP 专享', apr: '8.0%', term: '30D', status: 'REVIEW', updatedAt: df(Date.now() - 7200000) },
      { code: 'EARN-NEW', name: '新品测算', apr: '—', term: '—', status: 'DRAFT', updatedAt: df(Date.now() - 600000) },
    ],
  },
  wealthMiner: {
    title: '矿机配置',
    subtitle:
      '算力套餐、起息规则与提前赎回罚息。对接示例：GET /v1/admin/config/wealth/miner。',
    keywordPlaceholder: '套餐码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: '矿机套餐',
    drawerNote: '可绑定链上算力证明模板与库存档位。',
    stats: [
      { label: '在售套餐', value: '8', tone: 'ok' },
      { label: '售罄', value: '2', tone: 'muted' },
      { label: '库存算力', value: '1.2 EH/s', tone: 'default' },
      { label: '维护中', value: '1', tone: 'warn' },
    ],
    columns: [
      { prop: 'code', label: '套餐码', width: 110 },
      { prop: 'name', label: '名称', minWidth: 120 },
      { prop: 'hash', label: '算力', width: 100 },
      { prop: 'apr', label: 'APR', width: 88 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: CFG_OK },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { code: 'MIN-90', name: '标准 90D', hash: '100 TH/s', apr: '18%', status: 'ACTIVE', updatedAt: df(Date.now() - 3600000) },
      { code: 'MIN-180', name: '加倍 180D', hash: '200 TH/s', apr: '22%', status: 'ACTIVE', updatedAt: df(Date.now() - 86400000) },
      { code: 'MIN-SOLD', name: '春节档(售罄)', hash: '—', apr: '20%', status: 'DRAFT', updatedAt: df(Date.now() - 86400000 * 10) },
    ],
  },
  wealthBots: {
    title: '交易机器人配置',
    subtitle:
      '策略模板、默认参数包与上架状态。对接示例：GET /v1/admin/config/wealth/bots。',
    keywordPlaceholder: '模板 ID / 名称',
    filterKeywordLabel: '检索',
    listCaption: '策略模板',
    drawerNote: '可限制适用交易对、最小本金与费率折扣。',
    stats: [
      { label: '上架模板', value: '12', tone: 'ok' },
      { label: '内测', value: '3', tone: 'warn' },
      { label: '运行实例', value: '6,800', tone: 'default' },
      { label: '今日新建', value: '+312', tone: 'muted' },
    ],
    columns: [
      { prop: 'tplId', label: '模板 ID', width: 120 },
      { prop: 'name', label: '名称', minWidth: 130 },
      { prop: 'kind', label: '类型', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: CFG_OK },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { tplId: 'BOT-GRID-01', name: '现货网格经典', kind: '网格', status: 'ACTIVE', updatedAt: df(Date.now() - 3600000) },
      { tplId: 'BOT-DCA-01', name: '定投 BTC', kind: '定投', status: 'ACTIVE', updatedAt: df(Date.now() - 86400000) },
      { tplId: 'BOT-ARB-XX', name: '套利实验', kind: '套利', status: 'DRAFT', updatedAt: df(Date.now() - 7200000) },
    ],
  },
  wealthLending: {
    title: '借贷配置',
    subtitle:
      '抵押市场、初始 LTV、强平线与利率曲线。对接示例：GET /v1/admin/config/wealth/lending。',
    keywordPlaceholder: '市场 / 资产',
    filterKeywordLabel: '检索',
    listCaption: '借贷市场',
    drawerNote: '下钻：利率阶梯、保险基金分摊与清算优先级。',
    stats: [
      { label: '开放市场', value: '14', tone: 'ok' },
      { label: '维护', value: '1', tone: 'warn' },
      { label: '在贷余额', value: '2.8 亿 U', tone: 'default' },
      { label: '今日清算', value: '4', tone: 'muted' },
    ],
    columns: [
      { prop: 'market', label: '市场', width: 120 },
      { prop: 'collateral', label: '抵押', width: 88 },
      { prop: 'borrow', label: '借入', width: 88 },
      { prop: 'maxLtv', label: '最大 LTV', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { market: 'BTC/USDT', collateral: 'BTC', borrow: 'USDT', maxLtv: '65%', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { market: 'ETH/USDT', collateral: 'ETH', borrow: 'USDT', maxLtv: '62%', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { market: 'ALT/USDT', collateral: 'ALT', borrow: 'USDT', maxLtv: '45%', status: 'OFF', updatedAt: df(Date.now() - 86400000 * 3) },
    ],
  },
  wealthTeamWithdraw: {
    title: '团队提现配置',
    subtitle:
      '团队分润提现门槛、冷却期与审核策略。对接示例：GET /v1/admin/config/wealth/team-withdraw。',
    keywordPlaceholder: '团队等级 / 编码',
    filterKeywordLabel: '检索',
    listCaption: '团队提现规则',
    drawerNote: '可关联代理商合同与税务代扣比例。',
    stats: [
      { label: '规则条', value: '6', tone: 'default' },
      { label: '启用', value: '5', tone: 'ok' },
      { label: '待审队列', value: '11', tone: 'warn' },
      { label: '今日放行', value: '¥ 420 万', tone: 'muted' },
    ],
    columns: [
      { prop: 'tierCode', label: '等级编码', width: 110 },
      { prop: 'tierName', label: '名称', minWidth: 120 },
      { prop: 'minAmount', label: '最小提现', width: 110 },
      { prop: 'cooldownH', label: '冷却(小时)', width: 110 },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { tierCode: 'T1', tierName: '普通团队', minAmount: '500 USDT', cooldownH: '24', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { tierCode: 'T2', tierName: '银牌', minAmount: '2,000 USDT', cooldownH: '12', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { tierCode: 'T3', tierName: '金牌', minAmount: '10,000 USDT', cooldownH: '6', status: 'ON', updatedAt: df(Date.now() - 7200000) },
      { tierCode: 'TX', tierName: '暂停档', minAmount: '—', cooldownH: '—', status: 'OFF', updatedAt: df(Date.now() - 86400000 * 2) },
    ],
  },
  contractPerpetual: {
    title: '永续合约管理',
    subtitle:
      '合约参数、杠杆档位、资金费率上下限与开仓开关。对接示例：GET /v1/admin/config/contract/perpetual。',
    keywordPlaceholder: '合约代码',
    filterKeywordLabel: '检索',
    listCaption: '永续合约',
    drawerNote: '详情：风险限额表、ADL 档位、标记价格成分。',
    stats: [
      { label: '已上线', value: '86', tone: 'ok' },
      { label: '仅模拟', value: '4', tone: 'muted' },
      { label: '维护', value: '2', tone: 'warn' },
      { label: '今日调参', value: '3', tone: 'default' },
    ],
    columns: [
      { prop: 'symbol', label: '合约', width: 130 },
      { prop: 'maxLev', label: '最大杠杆', width: 100 },
      { prop: 'mmr', label: '维持保证金率', minWidth: 120 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { OPEN: { type: 'success', label: '开放' }, MAINT: { type: 'warning', label: '维护' }, SIM: { type: 'info', label: '模拟' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { symbol: 'BTC-USDT-SWAP', maxLev: '125x', mmr: '0.4%', status: 'OPEN', updatedAt: df(Date.now() - 3600000) },
      { symbol: 'ETH-USDT-SWAP', maxLev: '100x', mmr: '0.5%', status: 'OPEN', updatedAt: df(Date.now() - 7200000) },
      { symbol: 'SOL-USDT-SWAP', maxLev: '50x', mmr: '1.0%', status: 'OPEN', updatedAt: df(Date.now() - 86400000) },
      { symbol: 'TEST-USDT-SWAP', maxLev: '20x', mmr: '2%', status: 'SIM', updatedAt: df(Date.now() - 86400000 * 5) },
    ],
  },
  contractDelivery: {
    title: '交割合约管理',
    subtitle:
      '交割日、最后交易时刻与展期规则。对接示例：GET /v1/admin/config/contract/delivery。',
    keywordPlaceholder: '合约代码',
    filterKeywordLabel: '检索',
    listCaption: '交割合约',
    drawerNote: '可配置交割价指数、行权价与结算币种。',
    stats: [
      { label: '挂牌', value: '36', tone: 'default' },
      { label: '临近交割', value: '4', tone: 'warn' },
      { label: '已交割(月)', value: '12', tone: 'muted' },
      { label: '全市场开放', value: '是', tone: 'ok' },
    ],
    columns: [
      { prop: 'symbol', label: '合约', width: 140 },
      { prop: 'deliveryAt', label: '交割日', width: 120, display: 'date' },
      { prop: 'lastTrade', label: '最后交易', minWidth: 160, display: 'date' },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { LISTED: { type: 'success', label: '挂牌' }, SETTLED: { type: 'info', label: '已交割' }, ROLL: { type: 'warning', label: '展期' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { symbol: 'BTC-USDT-260628', deliveryAt: df(Date.now() + 86400000 * 88), lastTrade: df(Date.now() + 86400000 * 87), status: 'LISTED', updatedAt: df(Date.now() - 3600000) },
      { symbol: 'ETH-USDT-260328', deliveryAt: df(Date.now() - 86400000 * 2), lastTrade: df(Date.now() - 86400000 * 3), status: 'SETTLED', updatedAt: df(Date.now() - 86400000) },
      { symbol: 'BTC-USDT-260328', deliveryAt: df(Date.now() - 86400000 * 5), lastTrade: df(Date.now() - 86400000 * 6), status: 'SETTLED', updatedAt: df(Date.now() - 86400000 * 4) },
    ],
  },
  contentClient: {
    title: '用户端内容管理',
    subtitle:
      '多语言文案、协议版本与灰度发布键。对接示例：GET /v1/admin/config/content/client。',
    hint: '内容 · 客户端',
    keywordPlaceholder: '配置键 / 语言',
    filterKeywordLabel: '检索',
    listCaption: '客户端配置项',
    drawerNote: '支持 JSON Diff、回滚版本与按 App 版本号定向。',
    stats: [
      { label: '配置键', value: '240', tone: 'default' },
      { label: '草稿', value: '6', tone: 'warn' },
      { label: '语言包', value: '8', tone: 'ok' },
      { label: '今日发布', value: '3', tone: 'muted' },
    ],
    columns: [
      { prop: 'cfgKey', label: '键', minWidth: 160, mono: true },
      { prop: 'locale', label: '语言', width: 80 },
      { prop: 'version', label: '版本', width: 88 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: CFG_OK },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { cfgKey: 'legal.user_agreement', locale: 'zh-CN', version: 'v12', status: 'ACTIVE', updatedAt: df(Date.now() - 86400000) },
      { cfgKey: 'home.banner_policy', locale: 'zh-CN', version: 'v3', status: 'REVIEW', updatedAt: df(Date.now() - 3600000) },
      { cfgKey: 'risk.popup_text', locale: 'en', version: 'v2', status: 'DRAFT', updatedAt: df(Date.now() - 7200000) },
    ],
  },
  contentNews: {
    title: '新闻管理',
    subtitle:
      '公告/资讯的发布、定时与渠道展示。对接示例：GET /v1/admin/config/content/news。',
    keywordPlaceholder: '标题 / ID',
    filterKeywordLabel: '检索',
    listCaption: '新闻列表',
    drawerNote: '可挂载富文本、附件、推送与阅读统计。',
    stats: [
      { label: '已发布', value: '128', tone: 'ok' },
      { label: '定时', value: '3', tone: 'warn' },
      { label: '草稿', value: '9', tone: 'muted' },
      { label: '今日 PV', value: '42 万', tone: 'default' },
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 100 },
      { prop: 'title', label: '标题', minWidth: 180 },
      { prop: 'channel', label: '频道', width: 100 },
      { prop: 'publishStatus', label: '状态', width: 100, display: 'tag', tagMap: PUBLISH },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { id: 'N-88201', title: '系统升级维护通知', channel: '公告', publishStatus: 'ONLINE', updatedAt: df(Date.now() - 3600000) },
      { id: 'N-88202', title: '新币上线：XXX', channel: '上新', publishStatus: 'SCHEDULED', updatedAt: df(Date.now() - 7200000) },
      { id: 'N-88198', title: '活动规则（内部审）', channel: '活动', publishStatus: 'OFFLINE', updatedAt: df(Date.now() - 86400000) },
    ],
  },
  contentBanners: {
    title: '横幅管理',
    subtitle:
      '广告位、素材、跳转链接与投放排期。对接示例：GET /v1/admin/config/content/banners。',
    keywordPlaceholder: '广告位 / 标题',
    filterKeywordLabel: '检索',
    listCaption: '横幅位',
    drawerNote: '支持 AB 测试桶、地域与登录态定向。',
    stats: [
      { label: '广告位', value: '14', tone: 'default' },
      { label: '投放中', value: '22', tone: 'ok' },
      { label: '待审素材', value: '4', tone: 'warn' },
      { label: 'CTR 估', value: '2.1%', tone: 'muted' },
    ],
    columns: [
      { prop: 'slotId', label: '广告位', width: 110 },
      { prop: 'title', label: '标题', minWidth: 140 },
      { prop: 'weight', label: '权重', width: 72 },
      { prop: 'schedule', label: '排期', minWidth: 120 },
      { prop: 'status', label: '投放状态', width: 100, display: 'tag', tagMap: PUBLISH },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { slotId: 'HOME-TOP', title: '春季活动主视觉', weight: '100', schedule: '4/1–4/30', status: 'ONLINE', updatedAt: df(Date.now() - 3600000) },
      { slotId: 'APP-POP', title: 'KYC 引导', weight: '80', schedule: '长期', status: 'ONLINE', updatedAt: df(Date.now() - 86400000) },
      { slotId: 'TRADE-SIDE', title: '合约费率优惠', weight: '60', schedule: '待定', status: 'SCHEDULED', updatedAt: df(Date.now() - 1800000) },
    ],
  },
}
