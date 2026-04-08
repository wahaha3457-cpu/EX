/**
 * 一级路由：币种 / 交易对 / 资产审核 / 公告 / 权限 / 系统日志 / 活动 — 演示数据（对接 API 时替换 rows）
 */
import type { UserModuleColumn, UserModuleDef } from '@/config/adminUserModules'

export type TopLevelModuleColumn = UserModuleColumn

export type TopLevelModuleKey =
  | 'currencies'
  | 'symbols'
  | 'assets'
  | 'announcements'
  | 'rbac'
  | 'logs'
  | 'activities'

const df = (ts: number) => new Date(ts).toLocaleString('zh-CN')

const ONOFF = {
  ON: { type: 'success' as const, label: '启用' },
  OFF: { type: 'info' as const, label: '停用' },
}

const REVIEW = {
  PENDING: { type: 'warning' as const, label: '待审' },
  APPROVED: { type: 'success' as const, label: '通过' },
  REJECTED: { type: 'danger' as const, label: '驳回' },
}

const PUBLISH = {
  ONLINE: { type: 'success' as const, label: '已发布' },
  DRAFT: { type: 'info' as const, label: '草稿' },
  SCHEDULED: { type: 'warning' as const, label: '定时' },
}

const SEV = {
  CRITICAL: { type: 'danger' as const, label: '致命' },
  ERROR: { type: 'danger' as const, label: '错误' },
  WARN: { type: 'warning' as const, label: '警告' },
  INFO: { type: 'info' as const, label: '信息' },
}

const ACT = {
  LIVE: { type: 'success' as const, label: '进行中' },
  UPCOMING: { type: 'warning' as const, label: '未开始' },
  ENDED: { type: 'info' as const, label: '已结束' },
}

export const ADMIN_TOP_LEVEL_MODULE_REGISTRY: Record<TopLevelModuleKey, UserModuleDef> = {
  currencies: {
    title: '币种管理',
    subtitle:
      '上架币种、展示精度、主链与充提开关的统一入口；可下钻链配置与费率策略。对接示例：GET /v1/admin/currencies。',
    hint: '币种',
    keywordPlaceholder: '代码 / 全称',
    filterKeywordLabel: '检索',
    listCaption: '币种列表',
    drawerNote: '详情可编辑链上合约、确认数、图标与合规分区标签。',
    stats: [
      { label: '已上架', value: '312', tone: 'ok' },
      { label: '暂停充提', value: '3', tone: 'warn' },
      { label: '主链类型', value: '18', tone: 'default' },
      { label: '今日变更', value: '2', tone: 'muted' },
    ],
    columns: [
      { prop: 'code', label: '代码', width: 88, mono: true },
      { prop: 'name', label: '名称', minWidth: 120 },
      { prop: 'precision', label: '精度', width: 72 },
      { prop: 'chains', label: '主链数', width: 80 },
      { prop: 'deposit', label: '充值', width: 72, display: 'tag', tagMap: ONOFF },
      { prop: 'withdraw', label: '提现', width: 72, display: 'tag', tagMap: ONOFF },
      { prop: 'status', label: '展示', width: 80, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 152, display: 'date' },
    ],
    rows: [
      { code: 'BTC', name: 'Bitcoin', precision: '8', chains: '4', deposit: 'ON', withdraw: 'ON', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { code: 'ETH', name: 'Ethereum', precision: '8', chains: '3', deposit: 'ON', withdraw: 'ON', status: 'ON', updatedAt: df(Date.now() - 7200000) },
      { code: 'USDT', name: 'Tether USD', precision: '6', chains: '6', deposit: 'ON', withdraw: 'ON', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { code: 'SOL', name: 'Solana', precision: '8', chains: '2', deposit: 'ON', withdraw: 'OFF', status: 'ON', updatedAt: df(Date.now() - 1800000) },
      { code: 'MEME', name: 'Meme Coin', precision: '2', chains: '1', deposit: 'OFF', withdraw: 'OFF', status: 'OFF', updatedAt: df(Date.now() - 86400000 * 2) },
    ],
  },
  symbols: {
    title: '交易对管理',
    subtitle:
      '现货 / 合约标的 / 杠杆市场的核心参数：精度、分区、状态与最小名义。对接示例：GET /v1/admin/symbols。',
    hint: '交易对',
    keywordPlaceholder: '交易对 / 分区',
    filterKeywordLabel: '检索',
    listCaption: '交易市场',
    drawerNote: '可切换 Tab 拉取现货、永续、杠杆不同 API；此处合并演示。',
    stats: [
      { label: '现货交易中', value: '428', tone: 'ok' },
      { label: '永续挂牌', value: '86', tone: 'default' },
      { label: '停牌/维护', value: '5', tone: 'warn' },
      { label: '今日调参', value: '3', tone: 'muted' },
    ],
    columns: [
      { prop: 'symbol', label: '交易对/合约', minWidth: 140, mono: true },
      { prop: 'kind', label: '类型', width: 88 },
      { prop: 'zone', label: '分区', width: 88 },
      { prop: 'tick', label: '价精度', width: 88 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { TRADE: { type: 'success', label: '交易' }, PREP: { type: 'warning', label: '准备' }, HALT: { type: 'danger', label: '停牌' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 152, display: 'date' },
    ],
    rows: [
      { symbol: 'BTC/USDT', kind: '现货', zone: 'MAIN', tick: '0.1', status: 'TRADE', updatedAt: df(Date.now() - 3600000) },
      { symbol: 'ETH/USDT', kind: '现货', zone: 'MAIN', tick: '0.01', status: 'TRADE', updatedAt: df(Date.now() - 86400000) },
      { symbol: 'BTC-USDT-SWAP', kind: '永续', zone: '—', tick: '0.1', status: 'TRADE', updatedAt: df(Date.now() - 7200000) },
      { symbol: 'NEW/USDT', kind: '现货', zone: 'INNO', tick: '0.0001', status: 'PREP', updatedAt: df(Date.now() - 1800000) },
    ],
  },
  assets: {
    title: '资产审核',
    subtitle:
      '充值补单、提现风控二审、手工调账等待复核队列的统一视图。对接示例：GET /v1/admin/assets/reviews。',
    hint: '审核',
    keywordPlaceholder: '单号 / UID / TxID',
    filterKeywordLabel: '检索',
    listCaption: '待办与近期单',
    drawerNote: '生产环境可按类型分流路由；抽屉挂载链上凭证与审批链。',
    stats: [
      { label: '待审合计', value: '27', tone: 'warn' },
      { label: '今日通过', value: '412', tone: 'ok' },
      { label: '大额提现', value: '6', tone: 'warn' },
      { label: '平均耗时', value: '8m', tone: 'muted' },
    ],
    columns: [
      { prop: 'id', label: '单号', width: 120, mono: true },
      { prop: 'kind', label: '类型', width: 100 },
      { prop: 'uid', label: 'UID', width: 100, mono: true },
      { prop: 'asset', label: '资产', width: 72 },
      { prop: 'amount', label: '金额', width: 110 },
      { prop: 'ref', label: '关联', minWidth: 120, mono: true },
      { prop: 'status', label: '审核', width: 88, display: 'tag', tagMap: REVIEW },
      { prop: 'createdAt', label: '时间', minWidth: 152, display: 'date' },
    ],
    rows: [
      { id: 'DEP-R-9001', kind: '充值补单', uid: 'U88201', asset: 'USDT', amount: '10,000', ref: '0xab12...', status: 'PENDING', createdAt: df(Date.now() - 600000) },
      { id: 'WD-R-3301', kind: '提现二审', uid: 'U10001', asset: 'USDT', amount: '200,000', ref: '0x77aa...', status: 'PENDING', createdAt: df(Date.now() - 1800000) },
      { id: 'ADJ-2201', kind: '手工调账', uid: 'U555', asset: 'USDT', amount: '+50', ref: '工单 882', status: 'PENDING', createdAt: df(Date.now() - 900000) },
      { id: 'WD-R-3299', kind: '提现二审', uid: 'U20002', asset: 'ETH', amount: '120', ref: '0x99bb...', status: 'APPROVED', createdAt: df(Date.now() - 7200000) },
    ],
  },
  announcements: {
    title: '公告管理',
    subtitle:
      '对用户端展示的公告、维护通知与活动文案；支持多语言与定时发布。对接示例：GET /v1/admin/announcements。',
    hint: '公告',
    keywordPlaceholder: '标题 / ID',
    filterKeywordLabel: '检索',
    listCaption: '公告列表',
    drawerNote: '可挂载富文本 Diff、推送渠道联动与阅读统计导出。',
    stats: [
      { label: '在线', value: '42', tone: 'ok' },
      { label: '草稿', value: '6', tone: 'muted' },
      { label: '定时', value: '3', tone: 'warn' },
      { label: '今日 PV', value: '12 万', tone: 'default' },
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 100, mono: true },
      { prop: 'title', label: '标题', minWidth: 180 },
      { prop: 'channel', label: '频道', width: 100 },
      { prop: 'locale', label: '语言', width: 72 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: PUBLISH },
      { prop: 'updatedAt', label: '更新', minWidth: 152, display: 'date' },
    ],
    rows: [
      { id: 'ANN-801', title: '系统维护 02:00–04:00', channel: '维护', locale: 'zh-CN', status: 'ONLINE', updatedAt: df(Date.now() - 3600000) },
      { id: 'ANN-800', title: '新币上线公告', channel: '上新', locale: 'zh-CN', status: 'ONLINE', updatedAt: df(Date.now() - 86400000) },
      { id: 'ANN-D-12', title: '春节活动预告', channel: '活动', locale: 'zh-CN', status: 'SCHEDULED', updatedAt: df(Date.now() - 7200000) },
      { id: 'ANN-D-11', title: '费率调整（内审）', channel: '公告', locale: 'zh-CN', status: 'DRAFT', updatedAt: df(Date.now() - 3600000) },
    ],
  },
  rbac: {
    title: '权限管理',
    subtitle:
      '业务后台角色、权限包与数据范围；可与系统用户模块角色映射。对接示例：GET /v1/admin/rbac/roles。',
    hint: '权限',
    keywordPlaceholder: '角色编码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: '角色列表',
    drawerNote: '下钻权限树、API 资源绑定与只读审计角色模板。',
    stats: [
      { label: '角色数', value: '36', tone: 'default' },
      { label: '启用', value: '34', tone: 'ok' },
      { label: '内置', value: '8', tone: 'muted' },
      { label: '近 7 日编辑', value: '3', tone: 'warn' },
    ],
    columns: [
      { prop: 'code', label: '编码', width: 130, mono: true },
      { prop: 'name', label: '名称', minWidth: 130 },
      { prop: 'permCount', label: '权限数', width: 88 },
      { prop: 'builtin', label: '内置', width: 80, display: 'tag', tagMap: { Y: { type: 'info', label: '是' }, N: { type: 'success', label: '否' } } },
      { prop: 'status', label: '状态', width: 80, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 152, display: 'date' },
    ],
    rows: [
      { code: 'SUPER', name: '超级管理员', permCount: 'ALL', builtin: 'Y', status: 'ON', updatedAt: df(Date.now() - 86400000 * 30) },
      { code: 'RISK_ADMIN', name: '风控管理员', permCount: '96', builtin: 'N', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { code: 'LISTING_OPS', name: '上币运营', permCount: '42', builtin: 'N', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { code: 'READONLY_AUDIT', name: '只读审计', permCount: '18', builtin: 'N', status: 'ON', updatedAt: df(Date.now() - 86400000 * 5) },
    ],
  },
  logs: {
    title: '系统日志',
    subtitle:
      '应用服务结构化日志检索（与「系统管理」内账变/操作日志互补）。对接示例：GET /v1/admin/logs/query。',
    hint: '日志',
    keywordPlaceholder: '服务 / Trace / 关键字',
    filterKeywordLabel: '检索',
    listCaption: '日志条目',
    drawerNote: '生产可接 ELK/Loki；支持 traceId 跳转与原始 JSON。',
    stats: [
      { label: '今日条数', value: '2.1M', tone: 'default' },
      { label: 'ERROR', value: '412', tone: 'warn' },
      { label: '保留', value: '14 天', tone: 'muted' },
      { label: '集群', value: 'prod-3', tone: 'ok' },
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 100, mono: true },
      { prop: 'service', label: '服务', width: 120 },
      { prop: 'level', label: '级别', width: 88, display: 'tag', tagMap: SEV },
      { prop: 'message', label: '摘要', minWidth: 200 },
      { prop: 'traceId', label: 'Trace', width: 120, mono: true },
      { prop: 'createdAt', label: '时间', minWidth: 152, display: 'date' },
    ],
    rows: [
      { id: 'L-90001', service: 'wallet-deposit', level: 'ERROR', message: 'RPC timeout', traceId: 'tr_abc123', createdAt: df(Date.now() - 120000) },
      { id: 'L-90000', service: 'matching', level: 'WARN', message: 'order book skew', traceId: 'tr_def456', createdAt: df(Date.now() - 600000) },
      { id: 'L-89999', service: 'api-gateway', level: 'INFO', message: 'rate limit soft', traceId: 'tr_ghi789', createdAt: df(Date.now() - 900000) },
    ],
  },
  activities: {
    title: '活动管理',
    subtitle:
      '交易赛、任务、空投等活动配置与状态；参与数据可下钻至报表。对接示例：GET /v1/admin/activities。',
    hint: '活动',
    keywordPlaceholder: '活动码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: '活动',
    drawerNote: '可配置奖池、风控黑名单、参与条件与数据大盘嵌入。',
    stats: [
      { label: '进行中', value: '6', tone: 'ok' },
      { label: '未开始', value: '3', tone: 'warn' },
      { label: '已结束', value: '24', tone: 'muted' },
      { label: '今日 UV', value: '8.2 万', tone: 'default' },
    ],
    columns: [
      { prop: 'code', label: '活动码', width: 120, mono: true },
      { prop: 'name', label: '名称', minWidth: 160 },
      { prop: 'startAt', label: '开始', minWidth: 140, display: 'date' },
      { prop: 'endAt', label: '结束', minWidth: 140, display: 'date' },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: ACT },
      { prop: 'updatedAt', label: '更新', minWidth: 152, display: 'date' },
    ],
    rows: [
      { code: 'SPRING-2026', name: '春季交易赛', startAt: df(Date.now() - 86400000), endAt: df(Date.now() + 86400000 * 5), status: 'LIVE', updatedAt: df(Date.now() - 3600000) },
      { code: 'AIR-MAR', name: '三月空投', startAt: df(Date.now() + 86400000 * 2), endAt: df(Date.now() + 86400000 * 9), status: 'UPCOMING', updatedAt: df(Date.now() - 7200000) },
      { code: 'TASK-DAILY', name: '每日签到', startAt: df(Date.now() - 86400000 * 60), endAt: df(Date.now() + 86400000 * 300), status: 'LIVE', updatedAt: df(Date.now() - 86400000) },
    ],
  },
}
