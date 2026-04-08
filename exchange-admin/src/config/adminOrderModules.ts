/**
 * 业务/订单管理 — 各二、三级路由演示配置（对接 API 时替换 rows）
 */
import type { UserModuleColumn, UserModuleDef } from '@/config/adminUserModules'

export type OrderModuleColumn = UserModuleColumn

export interface OrderModuleDef extends UserModuleDef {
  /** 是否展示「审核」操作（如 C2C 申诉） */
  showReviewAction?: boolean
}

export type OrderModuleKey =
  | 'c2cPayTemplates'
  | 'c2cPayMethods'
  | 'c2cMerchants'
  | 'c2cAds'
  | 'c2cOrders'
  | 'c2cAppeals'
  | 'icoProducts'
  | 'icoUserOrders'
  | 'spot'
  | 'contractPerpOrders'
  | 'contractPerpEntrust'
  | 'contractDelOrders'
  | 'contractDelVenueSettings'
  | 'contractDelGlobalVenue'
  | 'contractDelTeamVenue'
  | 'contractDelCopy'
  | 'financeMiner'
  | 'financeSmartMiner'
  | 'financeBots'
  | 'nft'
  | 'convert'
  | 'staking'
  | 'lending'
  | 'fundingDeposit'
  | 'fundingWithdraw'

const df = (ts: number) => new Date(ts).toLocaleString('zh-CN')

const ONOFF = {
  ON: { type: 'success' as const, label: '启用' },
  OFF: { type: 'info' as const, label: '停用' },
}

const C2C_ORDER = {
  PENDING_PAY: { type: 'warning' as const, label: '待付款' },
  PROCESSING: { type: 'info' as const, label: '放币中' },
  DONE: { type: 'success' as const, label: '已完成' },
  DISPUTE: { type: 'danger' as const, label: '申诉中' },
  CANCEL: { type: 'info' as const, label: '已取消' },
}

const APPEAL = {
  OPEN: { type: 'danger' as const, label: '待裁' },
  REVIEW: { type: 'warning' as const, label: '复核中' },
  DONE: { type: 'success' as const, label: '已结案' },
}

const SPOT_ST = {
  OPEN: { type: 'warning' as const, label: '挂单中' },
  PARTIAL: { type: 'info' as const, label: '部分成交' },
  FILLED: { type: 'success' as const, label: '完全成交' },
  CANCEL: { type: 'info' as const, label: '已撤销' },
}

const PERP_ST = {
  OPEN: { type: 'warning' as const, label: '持仓中' },
  CLOSED: { type: 'success' as const, label: '已平仓' },
  LIQ: { type: 'danger' as const, label: '强平' },
}

export const ADMIN_ORDER_MODULE_REGISTRY: Record<OrderModuleKey, OrderModuleDef> = {
  c2cPayTemplates: {
    title: 'C2C支付方式模版',
    subtitle:
      '法币通道、限额阶梯与 KYC 要求模版；发布后供承兑商引用。对接示例：GET /v1/admin/orders/c2c/payment-templates。',
    hint: '配置 · 模版',
    keywordPlaceholder: '模版编码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: '支付方式模版',
    drawerNote: '可挂载适用国家白名单、费率模板版本与灰度发布记录。',
    stats: [
      { label: '启用模版', value: '18', tone: 'ok' },
      { label: '待发布', value: '2', tone: 'warn' },
      { label: '引用中商户', value: '640', tone: 'default' },
      { label: '近 7 日变更', value: '5', tone: 'muted' },
    ],
    columns: [
      { prop: 'code', label: '模版编码', width: 120 },
      { prop: 'name', label: '名称', minWidth: 140 },
      { prop: 'fiat', label: '法币', width: 72 },
      { prop: 'channels', label: '通道', minWidth: 120 },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { code: 'TPL-CNY-01', name: '人民币银行卡标准', fiat: 'CNY', channels: '银联/快捷', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { code: 'TPL-VND-02', name: '越南盾电子钱包', fiat: 'VND', channels: 'Momo/ZaloPay', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { code: 'TPL-USD-01', name: '美元电汇', fiat: 'USD', channels: 'SWIFT', status: 'OFF', updatedAt: df(Date.now() - 86400000 * 4) },
      { code: 'TPL-EUR-01', name: 'SEPA 模版', fiat: 'EUR', channels: 'SEPA', status: 'ON', updatedAt: df(Date.now() - 7200000) },
      { code: 'TPL-IDR-01', name: '印尼本地银行', fiat: 'IDR', channels: 'VA', status: 'ON', updatedAt: df(Date.now() - 600000) },
    ],
  },
  c2cPayMethods: {
    title: 'C2C支付方式管理',
    subtitle:
      '承兑商已绑定的具体收款账户与限额；支持冻结与复核。对接示例：GET /v1/admin/orders/c2c/payment-methods。',
    keywordPlaceholder: '商户 / 账户尾号 / 模版',
    filterKeywordLabel: '检索',
    listCaption: '支付方式实例',
    drawerNote: '详情含开户名哈希、历史拒付率与风控命中标签。',
    stats: [
      { label: '在线方式', value: '2,104', tone: 'ok' },
      { label: '冻结', value: '31', tone: 'warn' },
      { label: '待人工复核', value: '6', tone: 'default' },
      { label: '今日新增', value: '+42', tone: 'muted' },
    ],
    columns: [
      { prop: 'id', label: '实例 ID', width: 128 },
      { prop: 'merchant', label: '承兑商', minWidth: 120 },
      { prop: 'tplCode', label: '引用模版', width: 118 },
      { prop: 'maskAccount', label: '账户(脱敏)', minWidth: 140, mono: true },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: { OK: { type: 'success', label: '正常' }, FROZEN: { type: 'danger', label: '冻结' }, REVIEW: { type: 'warning', label: '复核' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { id: 'PM-88201', merchant: '极速换汇', tplCode: 'TPL-CNY-01', maskAccount: '6222 **** **** 1024', status: 'OK', updatedAt: df(Date.now() - 3600000) },
      { id: 'PM-88202', merchant: '安心 OTC', tplCode: 'TPL-CNY-01', maskAccount: '6217 **** **** 8891', status: 'OK', updatedAt: df(Date.now() - 7200000) },
      { id: 'PM-88210', merchant: '24H 承兑', tplCode: 'TPL-VND-02', maskAccount: 'Momo ***771', status: 'REVIEW', updatedAt: df(Date.now() - 1800000) },
      { id: 'PM-88188', merchant: '华南承兑', tplCode: 'TPL-CNY-01', maskAccount: '6225 **** **** 4400', status: 'FROZEN', updatedAt: df(Date.now() - 86400000) },
      { id: 'PM-88301', merchant: '机构场外', tplCode: 'TPL-USD-01', maskAccount: 'SWIFT ****9021', status: 'OK', updatedAt: df(Date.now() - 86400000 * 2) },
    ],
  },
  c2cMerchants: {
    title: 'C2C承兑商管理',
    subtitle:
      '保证金、成交权重、广告上限与合规状态；与商家 KYC 联动。对接示例：GET /v1/admin/orders/c2c/merchants。',
    hint: '运营 · 商户',
    keywordPlaceholder: '商户 ID / 店铺名',
    filterKeywordLabel: '检索',
    listCaption: '承兑商列表',
    drawerNote: '可下钻保证金流水、罚单、历史申诉率与 API 调用配额。',
    stats: [
      { label: '认证商家', value: '1,024', tone: 'ok' },
      { label: '观察名单', value: '14', tone: 'warn' },
      { label: '保证金池', value: '820 万 U', tone: 'default' },
      { label: '今日成交额', value: '4.2 亿 CNY', tone: 'muted' },
    ],
    columns: [
      { prop: 'mid', label: '商户 ID', width: 120 },
      { prop: 'shopName', label: '店铺', minWidth: 130 },
      { prop: 'margin', label: '保证金', width: 110 },
      { prop: 'adsCount', label: '在挂广告', width: 96 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { OK: { type: 'success', label: '正常' }, LIMIT: { type: 'warning', label: '限权' }, BAN: { type: 'danger', label: '封禁' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { mid: 'M-221008', shopName: '极速换汇', margin: '50,000 U', adsCount: '6', status: 'OK', updatedAt: df(Date.now() - 3600000) },
      { mid: 'M-221015', shopName: '安心 OTC', margin: '120,000 U', adsCount: '3', status: 'OK', updatedAt: df(Date.now() - 86400000) },
      { mid: 'M-221022', shopName: '24H 承兑', margin: '8,000 U', adsCount: '0', status: 'LIMIT', updatedAt: df(Date.now() - 7200000) },
      { mid: 'M-220901', shopName: '新店试运营', margin: '2,000 U', adsCount: '1', status: 'OK', updatedAt: df(Date.now() - 600000) },
      { mid: 'M-219877', shopName: '风险商户样例', margin: '0 U', adsCount: '0', status: 'BAN', updatedAt: df(Date.now() - 86400000 * 10) },
    ],
  },
  c2cAds: {
    title: 'C2C广告配置',
    subtitle:
      '买/卖盘价格、浮动策略、单笔限额与支付方式绑定；支持批量下架。对接示例：GET /v1/admin/orders/c2c/ads。',
    keywordPlaceholder: '广告 ID / 交易对 / 商户',
    filterKeywordLabel: '检索',
    listCaption: '广告列表',
    drawerNote: '详情含调价日志、成交量曲线与对手方黑名单命中。',
    stats: [
      { label: '在挂广告', value: '8,420', tone: 'default' },
      { label: '异常定价', value: '7', tone: 'warn' },
      { label: '今日下架', value: '128', tone: 'muted' },
      { label: '买/卖比', value: '1 : 1.12', tone: 'ok' },
    ],
    columns: [
      { prop: 'adId', label: '广告 ID', width: 128 },
      { prop: 'pair', label: '交易对', width: 100 },
      { prop: 'side', label: '方向', width: 72, display: 'tag', tagMap: { BUY: { type: 'success', label: '买' }, SELL: { type: 'danger', label: '卖' } } },
      { prop: 'price', label: '价格/溢价', minWidth: 110 },
      { prop: 'merchant', label: '商户', minWidth: 110 },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: { ON: { type: 'success', label: '上架' }, OFF: { type: 'info', label: '下架' }, LIMIT: { type: 'warning', label: '限流' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { adId: 'AD-900821', pair: 'USDT/CNY', side: 'SELL', price: '7.18 +0.1%', merchant: '极速换汇', status: 'ON', updatedAt: df(Date.now() - 600000) },
      { adId: 'AD-900822', pair: 'USDT/CNY', side: 'BUY', price: '7.16 -0.05%', merchant: '安心 OTC', status: 'ON', updatedAt: df(Date.now() - 1200000) },
      { adId: 'AD-900830', pair: 'USDT/VND', side: 'SELL', price: '25,420', merchant: '24H 承兑', status: 'LIMIT', updatedAt: df(Date.now() - 3600000) },
      { adId: 'AD-900801', pair: 'BTC/USDT', side: 'SELL', price: '市价 +0.8%', merchant: '机构场外', status: 'OFF', updatedAt: df(Date.now() - 86400000) },
      { adId: 'AD-900805', pair: 'USDT/CNY', side: 'BUY', price: '7.10（异常）', merchant: '观测样本', status: 'LIMIT', updatedAt: df(Date.now() - 1800000) },
    ],
  },
  c2cOrders: {
    title: 'C2C订单',
    subtitle:
      '撮合订单全生命周期：下单、付款、放币、申诉与仲裁结案。对接示例：GET /v1/admin/orders/c2c/orders。',
    keywordPlaceholder: '订单号 / 买家 / 卖家 UID',
    filterKeywordLabel: '检索',
    listCaption: 'C2C 订单',
    drawerNote: '聚合聊天摘要、付款凭证哈希、倒计时节点与客服介入记录。',
    stats: [
      { label: '进行中', value: '312', tone: 'warn' },
      { label: '今日成交', value: '4,102', tone: 'ok' },
      { label: '申诉中', value: '18', tone: 'default' },
      { label: '今日成交额', value: '2.1 亿 CNY', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 148 },
      { prop: 'pair', label: '交易对', width: 100 },
      { prop: 'buyer', label: '买家', width: 108 },
      { prop: 'seller', label: '卖家', width: 108 },
      { prop: 'fiatAmt', label: '法币金额', width: 110 },
      { prop: 'cryptoAmt', label: '数字币', width: 100 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: C2C_ORDER },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'C2C-20260402-001', pair: 'USDT/CNY', buyer: 'U440102', seller: 'M-221008', fiatAmt: '¥ 50,000', cryptoAmt: '6,963 USDT', status: 'PENDING_PAY', createdAt: df(Date.now() - 600000) },
      { orderId: 'C2C-20260402-002', pair: 'USDT/CNY', buyer: 'U551002', seller: 'M-221015', fiatAmt: '¥ 12,000', cryptoAmt: '1,671 USDT', status: 'PROCESSING', createdAt: df(Date.now() - 1800000) },
      { orderId: 'C2C-20260401-881', pair: 'USDT/CNY', buyer: 'U778899', seller: 'M-221008', fiatAmt: '¥ 8,800', cryptoAmt: '1,226 USDT', status: 'DISPUTE', createdAt: df(Date.now() - 86400000) },
      { orderId: 'C2C-20260401-880', pair: 'USDT/VND', buyer: 'U900001', seller: 'M-221022', fiatAmt: '₫ 100M', cryptoAmt: '3,900 USDT', status: 'DONE', createdAt: df(Date.now() - 86400000 * 2) },
      { orderId: 'C2C-20260331-770', pair: 'USDT/CNY', buyer: 'U204881', seller: 'M-220901', fiatAmt: '¥ 3,000', cryptoAmt: '418 USDT', status: 'CANCEL', createdAt: df(Date.now() - 86400000 * 3) },
    ],
  },
  c2cAppeals: {
    title: 'C2C申诉',
    subtitle:
      '争议工单、举证材料与仲裁结论；与客服工单号关联。对接示例：GET /v1/admin/orders/c2c/appeals。',
    hint: '风控 · 仲裁',
    keywordPlaceholder: '申诉单号 / 关联订单',
    filterKeywordLabel: '检索',
    listCaption: '申诉工单',
    drawerNote: '展示双方凭证时间线、自动风控评分建议与终局裁决码。',
    showReviewAction: true,
    stats: [
      { label: '待裁', value: '11', tone: 'warn' },
      { label: '复核中', value: '5', tone: 'default' },
      { label: '今日结案', value: '23', tone: 'ok' },
      { label: '平均处理时长', value: '6.2 h', tone: 'muted' },
    ],
    columns: [
      { prop: 'appealId', label: '申诉单号', width: 148 },
      { prop: 'orderId', label: '关联订单', width: 148 },
      { prop: 'initiator', label: '发起人', width: 108 },
      { prop: 'reason', label: '原因摘要', minWidth: 140 },
      { prop: 'appealStatus', label: '状态', width: 100, display: 'tag', tagMap: APPEAL },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { appealId: 'APL-20260401-01', orderId: 'C2C-20260401-881', initiator: 'U778899', reason: '已付款对方未放币', appealStatus: 'OPEN', createdAt: df(Date.now() - 7200000) },
      { appealId: 'APL-20260401-02', orderId: 'C2C-20260330-660', initiator: 'M-221015', reason: '买家恶意取消', appealStatus: 'REVIEW', createdAt: df(Date.now() - 86400000) },
      { appealId: 'APL-20260331-88', orderId: 'C2C-20260329-501', initiator: 'U440102', reason: '金额不一致', appealStatus: 'DONE', createdAt: df(Date.now() - 86400000 * 3) },
      { appealId: 'APL-20260330-12', orderId: 'C2C-20260328-330', initiator: 'U551002', reason: '付款超时争议', appealStatus: 'OPEN', createdAt: df(Date.now() - 432000000) },
      { appealId: 'APL-20260329-03', orderId: 'C2C-20260327-220', initiator: 'M-221008', reason: '凭证伪造嫌疑', appealStatus: 'REVIEW', createdAt: df(Date.now() - 518400000) },
    ],
  },
  icoProducts: {
    title: 'ICO产品配置',
    subtitle:
      '募集轮次、价格阶梯、白名单与链上合约地址；发布前合规检查。对接示例：GET /v1/admin/orders/ico/products。',
    keywordPlaceholder: '产品编码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: 'ICO 产品',
    drawerNote: '可挂载募集合约 ABI、KYC 等级门槛与地区黑名单。',
    stats: [
      { label: '进行中', value: '2', tone: 'ok' },
      { label: '待上线', value: '1', tone: 'warn' },
      { label: '历史项目', value: '14', tone: 'muted' },
      { label: '累计募集', value: '6,200 万 U', tone: 'default' },
    ],
    columns: [
      { prop: 'productId', label: '产品编码', width: 120 },
      { prop: 'name', label: '名称', minWidth: 140 },
      { prop: 'price', label: '单价', width: 100 },
      { prop: 'hardCap', label: '硬顶', width: 110 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { SALE: { type: 'success', label: '发售中' }, UPCOMING: { type: 'warning', label: '预热' }, END: { type: 'info', label: '已结束' } } },
      { prop: 'saleEnd', label: '结束时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { productId: 'ICO-NODE-03', name: '生态节点第三期', price: '0.12 USDT', hardCap: '500 万 U', status: 'SALE', saleEnd: df(Date.now() + 86400000 * 5) },
      { productId: 'ICO-AI-01', name: '算力积分首发', price: '0.05 USDT', hardCap: '200 万 U', status: 'UPCOMING', saleEnd: df(Date.now() + 86400000 * 20) },
      { productId: 'ICO-DEFI-02', name: '协议治理代币', price: '0.20 USDT', hardCap: '800 万 U', status: 'END', saleEnd: df(Date.now() - 86400000 * 30) },
      { productId: 'ICO-GAME-01', name: '链游道具通证', price: '0.02 USDT', hardCap: '120 万 U', status: 'END', saleEnd: df(Date.now() - 86400000 * 90) },
    ],
  },
  icoUserOrders: {
    title: 'ICO用户订单',
    subtitle:
      '用户认购明细、支付状态与分配代币到账；可对异常单人工调账。对接示例：GET /v1/admin/orders/ico/user-orders。',
    keywordPlaceholder: '订单号 / UID / 产品',
    filterKeywordLabel: '检索',
    listCaption: '认购订单',
    drawerNote: '链上打款 tx、分配系数与退款流水可在此聚合。',
    stats: [
      { label: '待支付', value: '42', tone: 'warn' },
      { label: '已分配', value: '1,204', tone: 'ok' },
      { label: '失败/退款', value: '18', tone: 'muted' },
      { label: '今日销售额', value: '82 万 U', tone: 'default' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'product', label: '产品', minWidth: 120 },
      { prop: 'amount', label: '认购额', width: 110 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: { PENDING_PAY: { type: 'warning', label: '待支付' }, PAID: { type: 'info', label: '已付款' }, ALLOCATED: { type: 'success', label: '已分配' }, REFUND: { type: 'danger', label: '已退款' } } },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'ICO-U-99201', uid: 'U440102', product: 'ICO-NODE-03', amount: '5,000 USDT', status: 'ALLOCATED', createdAt: df(Date.now() - 86400000) },
      { orderId: 'ICO-U-99202', uid: 'U551002', product: 'ICO-NODE-03', amount: '1,200 USDT', status: 'PAID', createdAt: df(Date.now() - 3600000) },
      { orderId: 'ICO-U-99203', uid: 'U778899', product: 'ICO-AI-01', amount: '500 USDT', status: 'PENDING_PAY', createdAt: df(Date.now() - 600000) },
      { orderId: 'ICO-U-99188', uid: 'U204881', product: 'ICO-DEFI-02', amount: '10,000 USDT', status: 'REFUND', createdAt: df(Date.now() - 86400000 * 40) },
      { orderId: 'ICO-U-99190', uid: 'U900001', product: 'ICO-GAME-01', amount: '2,000 USDT', status: 'ALLOCATED', createdAt: df(Date.now() - 86400000 * 100) },
    ],
  },
  spot: {
    title: '现货订单',
    subtitle:
      '限价/市价委托与成交回报；支持按交易对、UID、时间检索与导出。对接示例：GET /v1/admin/orders/spot。',
    keywordPlaceholder: '订单号 / UID / 交易对',
    filterKeywordLabel: '检索',
    listCaption: '现货委托',
    drawerNote: '可下钻撮合明细、手续费分层与自成交标记。',
    stats: [
      { label: '今日委托', value: '182,400', tone: 'default' },
      { label: '成交率', value: '71.2%', tone: 'ok' },
      { label: '异常撤单', value: '56', tone: 'warn' },
      { label: '做市账号', value: '24', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'symbol', label: '交易对', width: 110 },
      { prop: 'side', label: '方向', width: 72, display: 'tag', tagMap: { BUY: { type: 'success', label: '买入' }, SELL: { type: 'danger', label: '卖出' } } },
      { prop: 'price', label: '价格', width: 100 },
      { prop: 'qty', label: '数量', width: 100 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: SPOT_ST },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'SP-9281102', uid: 'U204881', symbol: 'BTC/USDT', side: 'BUY', price: '98,500.12', qty: '0.015', status: 'PARTIAL', createdAt: df(Date.now() - 120000) },
      { orderId: 'SP-9281103', uid: 'U440102', symbol: 'ETH/USDT', side: 'SELL', price: '3,420.00', qty: '2.5', status: 'OPEN', createdAt: df(Date.now() - 300000) },
      { orderId: 'SP-9281098', uid: 'U551002', symbol: 'SOL/USDT', side: 'BUY', price: '市价', qty: '40', status: 'FILLED', createdAt: df(Date.now() - 600000) },
      { orderId: 'SP-9281090', uid: 'U778899', symbol: 'BTC/USDT', side: 'SELL', price: '99,000', qty: '0.08', status: 'CANCEL', createdAt: df(Date.now() - 3600000) },
      { orderId: 'SP-9281085', uid: 'U900001', symbol: 'USDT/CNY', side: 'BUY', price: '7.18', qty: '10,000', status: 'FILLED', createdAt: df(Date.now() - 86400000) },
    ],
  },
  contractPerpOrders: {
    title: '永续合约单',
    subtitle:
      '持仓、开仓均价、保证金与强平价格；支持分仓/合仓视图切换。对接示例：GET /v1/admin/orders/contract/perpetual/positions。',
    keywordPlaceholder: '持仓 ID / UID / 合约',
    filterKeywordLabel: '检索',
    listCaption: '永续持仓',
    drawerNote: '资金费率累积、ADL 队列序号与保险基金分摊记录。',
    stats: [
      { label: '开放持仓', value: '42,102', tone: 'default' },
      { label: '多头名义', value: '12.4 亿 U', tone: 'ok' },
      { label: '空头名义', value: '11.9 亿 U', tone: 'ok' },
      { label: '临近强平', value: '88', tone: 'warn' },
    ],
    columns: [
      { prop: 'posId', label: '持仓 ID', width: 132 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'symbol', label: '合约', width: 120 },
      { prop: 'side', label: '方向', width: 72, display: 'tag', tagMap: { LONG: { type: 'success', label: '多' }, SHORT: { type: 'danger', label: '空' } } },
      { prop: 'size', label: '张数/数量', width: 110 },
      { prop: 'entry', label: '开仓均价', width: 110 },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: PERP_ST },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { posId: 'PP-882910', uid: 'U204881', symbol: 'BTC-USDT-SWAP', side: 'LONG', size: '12 张', entry: '98,200', status: 'OPEN', updatedAt: df(Date.now() - 60000) },
      { posId: 'PP-882911', uid: 'U440102', symbol: 'ETH-USDT-SWAP', side: 'SHORT', size: '50 张', entry: '3,450', status: 'OPEN', updatedAt: df(Date.now() - 120000) },
      { posId: 'PP-882905', uid: 'U551002', symbol: 'BTC-USDT-SWAP', side: 'LONG', size: '2 张', entry: '101,000', status: 'CLOSED', updatedAt: df(Date.now() - 3600000) },
      { posId: 'PP-882900', uid: 'U778899', symbol: 'SOL-USDT-SWAP', side: 'SHORT', size: '200 张', entry: '142.5', status: 'LIQ', updatedAt: df(Date.now() - 86400000) },
      { posId: 'PP-882898', uid: 'U900001', symbol: 'BTC-USDT-SWAP', side: 'LONG', size: '100 张', entry: '95,800', status: 'CLOSED', updatedAt: df(Date.now() - 86400000 * 2) },
    ],
  },
  contractPerpEntrust: {
    title: '永续委托单',
    subtitle:
      '计划委托、止盈止损与条件单；与撮合引擎状态同步。对接示例：GET /v1/admin/orders/contract/perpetual/entrusts。',
    keywordPlaceholder: '委托号 / UID',
    filterKeywordLabel: '检索',
    listCaption: '永续委托',
    drawerNote: '触发价、生效时间、关联持仓 ID 与撤单原因码。',
    stats: [
      { label: '待触发', value: '12,400', tone: 'warn' },
      { label: '今日成交', value: '88,200', tone: 'ok' },
      { label: '失败', value: '102', tone: 'muted' },
      { label: 'API 占比', value: '62%', tone: 'default' },
    ],
    columns: [
      { prop: 'entrustId', label: '委托号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'symbol', label: '合约', width: 120 },
      { prop: 'type', label: '类型', minWidth: 100 },
      { prop: 'trigger', label: '触发价', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { WAIT: { type: 'warning', label: '待触发' }, TRIG: { type: 'info', label: '已触发' }, DONE: { type: 'success', label: '完成' }, CANCEL: { type: 'info', label: '已撤' } } },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { entrustId: 'PE-77201', uid: 'U204881', symbol: 'BTC-USDT-SWAP', type: '止损市价', trigger: '96,500', status: 'WAIT', createdAt: df(Date.now() - 3600000) },
      { entrustId: 'PE-77202', uid: 'U440102', symbol: 'ETH-USDT-SWAP', type: '止盈限价', trigger: '3,600', status: 'TRIG', createdAt: df(Date.now() - 1800000) },
      { entrustId: 'PE-77198', uid: 'U551002', symbol: 'BTC-USDT-SWAP', type: '计划委托', trigger: '100,000', status: 'DONE', createdAt: df(Date.now() - 86400000) },
      { entrustId: 'PE-77190', uid: 'U778899', symbol: 'SOL-USDT-SWAP', type: '追踪止损', trigger: '—', status: 'CANCEL', createdAt: df(Date.now() - 86400000 * 2) },
      { entrustId: 'PE-77185', uid: 'U900001', symbol: 'BTC-USDT-SWAP', type: '止损市价', trigger: '94,000', status: 'WAIT', createdAt: df(Date.now() - 7200000) },
    ],
  },
  contractDelOrders: {
    title: '交割合约单',
    subtitle:
      '季度/次周等交割合约持仓与交割结算单；含交割价与盈亏。对接示例：GET /v1/admin/orders/contract/delivery/orders。',
    keywordPlaceholder: '订单号 / UID / 合约',
    filterKeywordLabel: '检索',
    listCaption: '交割订单',
    drawerNote: '交割结算明细、基差补偿与仓位合并记录。',
    stats: [
      { label: '未交割仓位', value: '8,102', tone: 'default' },
      { label: '本周交割额', value: '3.4 亿 U', tone: 'ok' },
      { label: '穿仓垫付', value: '2', tone: 'warn' },
      { label: '历史合约数', value: '36', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'symbol', label: '合约', width: 140 },
      { prop: 'qty', label: '持仓', width: 88 },
      { prop: 'settlePx', label: '交割价', width: 100 },
      { prop: 'pnl', label: '预估盈亏', width: 110 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { HOLD: { type: 'warning', label: '持仓' }, SETTLED: { type: 'success', label: '已交割' }, ROLL: { type: 'info', label: '已展期' } } },
      { prop: 'deliveryAt', label: '交割日', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'DL-33021', uid: 'U204881', symbol: 'BTC-USDT-260628', qty: '5 张', settlePx: '—', pnl: '+1,240 U', status: 'HOLD', deliveryAt: df(Date.now() + 86400000 * 45) },
      { orderId: 'DL-33010', uid: 'U440102', symbol: 'ETH-USDT-260328', qty: '20 张', settlePx: '3,388', pnl: '-420 U', status: 'SETTLED', deliveryAt: df(Date.now() - 86400000 * 2) },
      { orderId: 'DL-33005', uid: 'U551002', symbol: 'BTC-USDT-260328', qty: '1 张', settlePx: '97,900', pnl: '+88 U', status: 'SETTLED', deliveryAt: df(Date.now() - 86400000 * 5) },
      { orderId: 'DL-32998', uid: 'U778899', symbol: 'BTC-USDT-260628', qty: '50 张', settlePx: '—', pnl: '+12,000 U', status: 'ROLL', deliveryAt: df(Date.now() + 86400000 * 60) },
      { orderId: 'DL-32990', uid: 'U900001', symbol: 'ETH-USDT-260628', qty: '100 张', settlePx: '—', pnl: '-2,100 U', status: 'HOLD', deliveryAt: df(Date.now() + 86400000 * 40) },
    ],
  },
  contractDelVenueSettings: {
    title: '交割场控设置',
    subtitle:
      '单合约维度的开仓开关、杠杆上限与费率临时调整；影响所有用户。对接示例：GET /v1/admin/orders/contract/delivery/venue。',
    hint: '场控 · 合约',
    keywordPlaceholder: '合约代码',
    filterKeywordLabel: '检索',
    listCaption: '合约场控',
    drawerNote: '变更审批单号、生效窗口与回滚快照 ID。',
    stats: [
      { label: '受限合约', value: '3', tone: 'warn' },
      { label: '全量开放', value: '33', tone: 'ok' },
      { label: '今日调整', value: '2', tone: 'default' },
      { label: '维护窗口', value: '1', tone: 'muted' },
    ],
    columns: [
      { prop: 'symbol', label: '合约', width: 140 },
      { prop: 'openAllowed', label: '开仓', width: 88, display: 'tag', tagMap: { Y: { type: 'success', label: '允许' }, N: { type: 'danger', label: '禁止' } } },
      { prop: 'maxLev', label: '杠杆上限', width: 96 },
      { prop: 'feeAdj', label: '费率调整', width: 100 },
      { prop: 'venueStatus', label: '状态', width: 96, display: 'tag', tagMap: { NORMAL: { type: 'success', label: '正常' }, LIMIT: { type: 'warning', label: '限制' }, HALT: { type: 'danger', label: '熔断' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { symbol: 'BTC-USDT-260628', openAllowed: 'Y', maxLev: '50x', feeAdj: '0', venueStatus: 'NORMAL', updatedAt: df(Date.now() - 3600000) },
      { symbol: 'ETH-USDT-260628', openAllowed: 'Y', maxLev: '40x', feeAdj: '+0.005%', venueStatus: 'NORMAL', updatedAt: df(Date.now() - 7200000) },
      { symbol: 'ALT-USDT-260628', openAllowed: 'N', maxLev: '20x', feeAdj: '0', venueStatus: 'HALT', updatedAt: df(Date.now() - 600000) },
      { symbol: 'BTC-USDT-260328', openAllowed: 'Y', maxLev: '30x', feeAdj: '0', venueStatus: 'LIMIT', updatedAt: df(Date.now() - 86400000) },
      { symbol: 'MEME-USDT-260628', openAllowed: 'Y', maxLev: '10x', feeAdj: '+0.02%', venueStatus: 'LIMIT', updatedAt: df(Date.now() - 1800000) },
    ],
  },
  contractDelGlobalVenue: {
    title: '交割合约全局场控',
    subtitle:
      '全市场级熔断、只减仓模式与 API 下单开关；慎用并强制双人复核。对接示例：GET /v1/admin/orders/contract/delivery/global。',
    hint: '全局 · 熔断',
    keywordPlaceholder: '策略名 / 操作人',
    filterKeywordLabel: '检索',
    listCaption: '全局策略',
    drawerNote: '审计日志、生效范围（全站/仅交割）与自动解除条件。',
    stats: [
      { label: '全局只减仓', value: '关', tone: 'ok' },
      { label: '熔断级别', value: 'L0', tone: 'default' },
      { label: '生效策略', value: '4', tone: 'muted' },
      { label: '最近变更', value: '2h 前', tone: 'warn' },
    ],
    columns: [
      { prop: 'policyId', label: '策略 ID', width: 120 },
      { prop: 'name', label: '名称', minWidth: 140 },
      { prop: 'scope', label: '范围', width: 100 },
      { prop: 'value', label: '当前值', minWidth: 120 },
      { prop: 'venueStatus', label: '状态', width: 88, display: 'tag', tagMap: { ON: { type: 'success', label: '生效' }, OFF: { type: 'info', label: '关闭' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { policyId: 'GV-01', name: '全市场只减仓', scope: '交割线', value: '关闭', venueStatus: 'OFF', updatedAt: df(Date.now() - 86400000) },
      { policyId: 'GV-02', name: '指数异常熔断', scope: '交割线', value: '阈值 8%', venueStatus: 'ON', updatedAt: df(Date.now() - 7200000) },
      { policyId: 'GV-03', name: '新用户开仓冷却', scope: '交割线', value: '24h', venueStatus: 'OFF', updatedAt: df(Date.now() - 86400000 * 3) },
      { policyId: 'GV-04', name: 'API 下单总开关', scope: '全站', value: '开', venueStatus: 'ON', updatedAt: df(Date.now() - 3600000) },
    ],
  },
  contractDelTeamVenue: {
    title: '团队交割场控',
    subtitle:
      '团队/机构白名单下的杠杆、持仓上限与手续费折扣。对接示例：GET /v1/admin/orders/contract/delivery/team-venue。',
    keywordPlaceholder: '团队 ID / 名称',
    filterKeywordLabel: '检索',
    listCaption: '团队场控',
    drawerNote: '团队合约、子账户继承规则与临时解禁工单。',
    stats: [
      { label: '配置团队', value: '128', tone: 'default' },
      { label: '超限预警', value: '4', tone: 'warn' },
      { label: '今日调整', value: '3', tone: 'ok' },
      { label: '默认模板', value: '6', tone: 'muted' },
    ],
    columns: [
      { prop: 'teamId', label: '团队 ID', width: 120 },
      { prop: 'teamName', label: '名称', minWidth: 120 },
      { prop: 'maxNotional', label: '名义上限', width: 120 },
      { prop: 'maxLev', label: '杠杆上限', width: 96 },
      { prop: 'feeTier', label: '费率档', width: 88 },
      { prop: 'venueStatus', label: '状态', width: 88, display: 'tag', tagMap: { OK: { type: 'success', label: '正常' }, WARN: { type: 'warning', label: '预警' }, LOCK: { type: 'danger', label: '锁定' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { teamId: 'T-10001', teamName: '量化团队 A', maxNotional: '500 万 U', maxLev: '50x', feeTier: 'VIP3', venueStatus: 'OK', updatedAt: df(Date.now() - 3600000) },
      { teamId: 'T-10002', teamName: '资管 B', maxNotional: '2000 万 U', maxLev: '30x', feeTier: 'VIP5', venueStatus: 'OK', updatedAt: df(Date.now() - 86400000) },
      { teamId: 'T-10008', teamName: '社区带单', maxNotional: '50 万 U', maxLev: '20x', feeTier: '普通', venueStatus: 'WARN', updatedAt: df(Date.now() - 7200000) },
      { teamId: 'T-10012', teamName: '高风险样本', maxNotional: '10 万 U', maxLev: '5x', feeTier: '惩罚', venueStatus: 'LOCK', updatedAt: df(Date.now() - 86400000 * 2) },
      { teamId: 'T-10015', teamName: '企业对冲', maxNotional: '1 亿 U', maxLev: '25x', feeTier: '议付', venueStatus: 'OK', updatedAt: df(Date.now() - 600000) },
    ],
  },
  contractDelCopy: {
    title: '交割跟单管理',
    subtitle:
      '带单员、跟随者与分润比例；交割线跟单与永续隔离。对接示例：GET /v1/admin/orders/contract/delivery/copy。',
    keywordPlaceholder: '带单员 / 跟随 UID',
    filterKeywordLabel: '检索',
    listCaption: '跟单关系',
    drawerNote: '历史收益率、最大回撤、订阅人数与风控熔断记录。',
    stats: [
      { label: '活跃带单', value: '86', tone: 'ok' },
      { label: '跟随账户', value: '12,400', tone: 'default' },
      { label: '今日分润', value: '82,000 U', tone: 'muted' },
      { label: '异常暂停', value: '3', tone: 'warn' },
    ],
    columns: [
      { prop: 'copyId', label: '关系 ID', width: 120 },
      { prop: 'leader', label: '带单员', width: 108 },
      { prop: 'follower', label: '跟随者', width: 108 },
      { prop: 'symbol', label: '合约', width: 120 },
      { prop: 'ratio', label: '分润比', width: 88 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { ACTIVE: { type: 'success', label: '跟随中' }, PAUSE: { type: 'warning', label: '暂停' }, END: { type: 'info', label: '结束' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { copyId: 'CP-5501', leader: 'U204881', follower: 'U440102', symbol: 'BTC-USDT-260628', ratio: '12%', status: 'ACTIVE', updatedAt: df(Date.now() - 3600000) },
      { copyId: 'CP-5502', leader: 'U900001', follower: 'U551002', symbol: 'ETH-USDT-260628', ratio: '15%', status: 'ACTIVE', updatedAt: df(Date.now() - 7200000) },
      { copyId: 'CP-5498', leader: 'U778899', follower: 'U332211', symbol: 'BTC-USDT-260628', ratio: '10%', status: 'PAUSE', updatedAt: df(Date.now() - 86400000) },
      { copyId: 'CP-5490', leader: 'U204883', follower: 'U100008', symbol: 'ALT-USDT-260628', ratio: '20%', status: 'END', updatedAt: df(Date.now() - 86400000 * 5) },
      { copyId: 'CP-5485', leader: 'U204881', follower: 'U778900', symbol: 'BTC-USDT-260328', ratio: '12%', status: 'ACTIVE', updatedAt: df(Date.now() - 600000) },
    ],
  },
  financeMiner: {
    title: '矿机理财订单',
    subtitle:
      '算力套餐认购、起息日与到期结算；支持提前赎回罚息规则展示。对接示例：GET /v1/admin/orders/finance/miner。',
    keywordPlaceholder: '订单号 / UID',
    filterKeywordLabel: '检索',
    listCaption: '矿机订单',
    drawerNote: '链上算力证明、收益派发流水与税务代扣标记。',
    stats: [
      { label: '计息中', value: '8,102', tone: 'ok' },
      { label: '今日起息', value: '+240', tone: 'default' },
      { label: '待赎回', value: '56', tone: 'warn' },
      { label: '存量 AUM', value: '1.02 亿 U', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'product', label: '套餐', minWidth: 120 },
      { prop: 'amount', label: '金额', width: 110 },
      { prop: 'apr', label: '参考 APR', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { ACTIVE: { type: 'success', label: '计息中' }, PENDING: { type: 'warning', label: '待起息' }, END: { type: 'info', label: '已结束' } } },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'FM-88201', uid: 'U440102', product: 'BTC 算力 90D', amount: '10,000 USDT', apr: '18%', status: 'ACTIVE', createdAt: df(Date.now() - 86400000 * 10) },
      { orderId: 'FM-88202', uid: 'U551002', product: 'ETH 算力 30D', amount: '5,000 USDT', apr: '12%', status: 'PENDING', createdAt: df(Date.now() - 3600000) },
      { orderId: 'FM-88198', uid: 'U204881', product: '混合算力 180D', amount: '50,000 USDT', apr: '22%', status: 'ACTIVE', createdAt: df(Date.now() - 86400000 * 60) },
      { orderId: 'FM-88190', uid: 'U778899', product: 'BTC 算力 90D', amount: '2,000 USDT', apr: '18%', status: 'END', createdAt: df(Date.now() - 86400000 * 100) },
      { orderId: 'FM-88185', uid: 'U900001', product: '机构专享 365D', amount: '200,000 USDT', apr: '15%', status: 'ACTIVE', createdAt: df(Date.now() - 86400000 * 200) },
    ],
  },
  financeSmartMiner: {
    title: '智能矿机订单',
    subtitle:
      '策略型算力产品，收益与策略池表现挂钩；需披露净值曲线来源。对接示例：GET /v1/admin/orders/finance/smart-miner。',
    keywordPlaceholder: '订单号 / 策略池',
    filterKeywordLabel: '检索',
    listCaption: '智能矿机',
    drawerNote: '策略版本、再平衡记录与最大回撤阈值。',
    stats: [
      { label: '运行中', value: '3,402', tone: 'ok' },
      { label: '策略池', value: '8', tone: 'default' },
      { label: '今日申购', value: '¥ 420 万', tone: 'muted' },
      { label: '预警池', value: '1', tone: 'warn' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'pool', label: '策略池', minWidth: 120 },
      { prop: 'amount', label: '金额', width: 110 },
      { prop: 'nav', label: '当前净值', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { RUN: { type: 'success', label: '运行' }, SUB: { type: 'warning', label: '申购确认' }, RED: { type: 'info', label: '赎回中' } } },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'SM-22001', uid: 'U440102', pool: '稳健 Alpha', amount: '8,000 USDT', nav: '1.042', status: 'RUN', createdAt: df(Date.now() - 86400000 * 20) },
      { orderId: 'SM-22002', uid: 'U551002', pool: '波动增强', amount: '3,000 USDT', nav: '0.988', status: 'RUN', createdAt: df(Date.now() - 86400000 * 5) },
      { orderId: 'SM-21998', uid: 'U204881', pool: '稳健 Alpha', amount: '100,000 USDT', nav: '1.042', status: 'SUB', createdAt: df(Date.now() - 3600000) },
      { orderId: 'SM-21990', uid: 'U778899', pool: '观测池 X', amount: '500 USDT', nav: '0.910', status: 'RED', createdAt: df(Date.now() - 86400000 * 40) },
      { orderId: 'SM-21985', uid: 'U900001', pool: '机构定制', amount: '1,000,000 USDT', nav: '1.010', status: 'RUN', createdAt: df(Date.now() - 86400000 * 100) },
    ],
  },
  financeBots: {
    title: '交易机器人订单',
    subtitle:
      '网格、定投、套利等机器人实例与运行状态；可紧急停机。对接示例：GET /v1/admin/orders/finance/bots。',
    keywordPlaceholder: '实例 ID / UID / 交易对',
    filterKeywordLabel: '检索',
    listCaption: '机器人实例',
    drawerNote: '参数快照、成交笔数、滑点统计与异常日志 ID。',
    stats: [
      { label: '运行中', value: '6,800', tone: 'ok' },
      { label: '今日新建', value: '+312', tone: 'default' },
      { label: '异常停止', value: '14', tone: 'warn' },
      { label: '策略模板', value: '12', tone: 'muted' },
    ],
    columns: [
      { prop: 'botId', label: '实例 ID', width: 128 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'strategy', label: '策略', minWidth: 100 },
      { prop: 'symbol', label: '交易对', width: 110 },
      { prop: 'invest', label: '投入资金', width: 110 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { RUN: { type: 'success', label: '运行' }, STOP: { type: 'info', label: '停止' }, ERR: { type: 'danger', label: '故障' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { botId: 'BOT-77101', uid: 'U440102', strategy: '现货网格', symbol: 'BTC/USDT', invest: '5,000 U', status: 'RUN', updatedAt: df(Date.now() - 600000) },
      { botId: 'BOT-77102', uid: 'U551002', strategy: '合约网格', symbol: 'ETH-USDT-SWAP', invest: '2,000 U', status: 'RUN', updatedAt: df(Date.now() - 1200000) },
      { botId: 'BOT-77098', uid: 'U204881', strategy: '定投', symbol: 'BTC/USDT', invest: '10,000 U', status: 'STOP', updatedAt: df(Date.now() - 86400000) },
      { botId: 'BOT-77090', uid: 'U778899', strategy: '套利', symbol: 'SOL/USDT', invest: '800 U', status: 'ERR', updatedAt: df(Date.now() - 7200000) },
      { botId: 'BOT-77085', uid: 'U900001', strategy: '现货网格', symbol: 'BTC/USDT', invest: '80,000 U', status: 'RUN', updatedAt: df(Date.now() - 180000) },
    ],
  },
  nft: {
    title: 'NFT订单',
    subtitle:
      '首发、二级市场成交与版税分成；可链上哈希对账。对接示例：GET /v1/admin/orders/nft。',
    keywordPlaceholder: '订单号 / 合约 / TokenId',
    filterKeywordLabel: '检索',
    listCaption: 'NFT 订单',
    drawerNote: '元数据 URI、版税接收地址与冻结状态。',
    stats: [
      { label: '今日成交', value: '1,024', tone: 'ok' },
      { label: '待结算', value: '18', tone: 'warn' },
      { label: '版税池', value: '12,400 U', tone: 'muted' },
      { label: '合集数', value: '86', tone: 'default' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'buyer', label: '买家', width: 108 },
      { prop: 'seller', label: '卖家', width: 108 },
      { prop: 'collection', label: '合集', minWidth: 120 },
      { prop: 'tokenId', label: 'TokenId', width: 88 },
      { prop: 'price', label: '成交价', width: 100 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { DONE: { type: 'success', label: '成交' }, PENDING: { type: 'warning', label: '支付中' }, CANCEL: { type: 'info', label: '取消' } } },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'NFT-44001', buyer: 'U440102', seller: 'U551002', collection: 'City Pass', tokenId: '#1024', price: '0.85 ETH', status: 'DONE', createdAt: df(Date.now() - 3600000) },
      { orderId: 'NFT-44002', buyer: 'U778899', seller: 'U204881', collection: 'Meme Gen', tokenId: '#8891', price: '120 USDT', status: 'PENDING', createdAt: df(Date.now() - 600000) },
      { orderId: 'NFT-43998', buyer: 'U900001', seller: 'M-221008', collection: '机构徽章', tokenId: '#01', price: '10,000 USDT', status: 'DONE', createdAt: df(Date.now() - 86400000) },
      { orderId: 'NFT-43990', buyer: 'U332211', seller: 'U440105', collection: 'City Pass', tokenId: '#2201', price: '0.90 ETH', status: 'CANCEL', createdAt: df(Date.now() - 86400000 * 2) },
      { orderId: 'NFT-43985', buyer: 'U204883', seller: 'U100001', collection: 'Game Item', tokenId: '#501', price: '55 USDT', status: 'DONE', createdAt: df(Date.now() - 86400000 * 5) },
    ],
  },
  convert: {
    title: '闪兑订单',
    subtitle:
      '小额一键兑换路径、滑点与实际成交价；用于客诉与对账。对接示例：GET /v1/admin/orders/convert。',
    keywordPlaceholder: '订单号 / UID',
    filterKeywordLabel: '检索',
    listCaption: '闪兑记录',
    drawerNote: '路由拆分、流动性源占比与失败回滚状态。',
    stats: [
      { label: '今日笔数', value: '42,800', tone: 'default' },
      { label: '成功率', value: '99.2%', tone: 'ok' },
      { label: '待退款', value: '6', tone: 'warn' },
      { label: '成交额', value: '820 万 U', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'from', label: '卖出', width: 100 },
      { prop: 'to', label: '买入', width: 100 },
      { prop: 'qtyIn', label: '数量', width: 100 },
      { prop: 'qtyOut', label: '获得', width: 100 },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: { DONE: { type: 'success', label: '成功' }, PENDING: { type: 'warning', label: '处理中' }, FAIL: { type: 'danger', label: '失败' } } },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'CV-99201', uid: 'U440102', from: 'USDT', to: 'BTC', qtyIn: '1,000', qtyOut: '0.01015', status: 'DONE', createdAt: df(Date.now() - 300000) },
      { orderId: 'CV-99202', uid: 'U551002', from: 'ETH', to: 'USDT', qtyIn: '1.2', qtyOut: '4,080', status: 'DONE', createdAt: df(Date.now() - 600000) },
      { orderId: 'CV-99198', uid: 'U204881', from: 'SOL', to: 'USDT', qtyIn: '50', qtyOut: '7,050', status: 'PENDING', createdAt: df(Date.now() - 120000) },
      { orderId: 'CV-99190', uid: 'U778899', from: 'USDT', to: 'MEME', qtyIn: '500', qtyOut: '—', status: 'FAIL', createdAt: df(Date.now() - 3600000) },
      { orderId: 'CV-99185', uid: 'U900001', from: 'BTC', to: 'USDT', qtyIn: '2.0', qtyOut: '196,400', status: 'DONE', createdAt: df(Date.now() - 86400000) },
    ],
  },
  staking: {
    title: '质押订单',
    subtitle:
      '链上质押、活期/定期产品与解质押排队；含奖励累积。对接示例：GET /v1/admin/orders/staking。',
    keywordPlaceholder: '订单号 / UID / 资产',
    filterKeywordLabel: '检索',
    listCaption: '质押订单',
    drawerNote: '验证人地址、解绑期区块高度与罚没记录。',
    stats: [
      { label: '质押总量', value: '420 万 ETH', tone: 'default' },
      { label: '活期 AUM', value: '88 万 U', tone: 'ok' },
      { label: '解押排队', value: '120', tone: 'warn' },
      { label: '今日奖励', value: '12,400 U', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'asset', label: '资产', width: 88 },
      { prop: 'amount', label: '质押量', width: 110 },
      { prop: 'term', label: '期限', width: 88 },
      { prop: 'apr', label: 'APR', width: 72 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { STAKING: { type: 'success', label: '质押中' }, UNSTAKING: { type: 'warning', label: '解押中' }, END: { type: 'info', label: '已结束' } } },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'SK-33001', uid: 'U440102', asset: 'ETH', amount: '32', term: '活期', apr: '4.2%', status: 'STAKING', createdAt: df(Date.now() - 86400000 * 30) },
      { orderId: 'SK-33002', uid: 'U551002', asset: 'ATOM', amount: '1,200', term: '21 天', apr: '12%', status: 'UNSTAKING', createdAt: df(Date.now() - 86400000 * 60) },
      { orderId: 'SK-32998', uid: 'U204881', asset: 'SOL', amount: '500', term: '活期', apr: '6%', status: 'STAKING', createdAt: df(Date.now() - 86400000 * 10) },
      { orderId: 'SK-32990', uid: 'U778899', asset: 'ETH', amount: '5', term: '90 天', apr: '5%', status: 'END', createdAt: df(Date.now() - 86400000 * 200) },
      { orderId: 'SK-32985', uid: 'U900001', asset: 'ETH', amount: '500', term: '活期', apr: '4.0%', status: 'STAKING', createdAt: df(Date.now() - 86400000 * 400) },
    ],
  },
  lending: {
    title: '借贷订单',
    subtitle:
      '抵押借贷、强平线与还款计划；与风控爆仓流水联动。对接示例：GET /v1/admin/orders/lending。',
    keywordPlaceholder: '借据号 / UID',
    filterKeywordLabel: '检索',
    listCaption: '借贷借据',
    drawerNote: '抵押率、清算历史、利息资本化与展期记录。',
    stats: [
      { label: '在贷余额', value: '2.8 亿 U', tone: 'default' },
      { label: '今日放款', value: '420 万 U', tone: 'ok' },
      { label: '预警仓位', value: '36', tone: 'warn' },
      { label: '已清算', value: '4', tone: 'muted' },
    ],
    columns: [
      { prop: 'loanId', label: '借据号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'borrow', label: '借入', width: 100 },
      { prop: 'collateral', label: '抵押', minWidth: 120 },
      { prop: 'ltv', label: 'LTV', width: 72 },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { ACTIVE: { type: 'success', label: '还款中' }, MARGIN: { type: 'warning', label: '补仓' }, LIQ: { type: 'danger', label: '已清算' }, CLOSED: { type: 'info', label: '已结清' } } },
      { prop: 'createdAt', label: '创建', minWidth: 160, display: 'date' },
    ],
    rows: [
      { loanId: 'LN-88001', uid: 'U440102', borrow: '10,000 USDT', collateral: '0.5 BTC', ltv: '58%', status: 'ACTIVE', createdAt: df(Date.now() - 86400000 * 5) },
      { loanId: 'LN-88002', uid: 'U551002', borrow: '50,000 USDT', collateral: '18 ETH', ltv: '72%', status: 'MARGIN', createdAt: df(Date.now() - 86400000 * 2) },
      { loanId: 'LN-87998', uid: 'U204881', borrow: '200,000 USDT', collateral: '100 ETH', ltv: '45%', status: 'ACTIVE', createdAt: df(Date.now() - 86400000 * 30) },
      { loanId: 'LN-87990', uid: 'U778899', borrow: '5,000 USDT', collateral: '2 BNB', ltv: '81%', status: 'LIQ', createdAt: df(Date.now() - 86400000 * 10) },
      { loanId: 'LN-87985', uid: 'U900001', borrow: '1,000,000 USDT', collateral: '40 BTC', ltv: '42%', status: 'CLOSED', createdAt: df(Date.now() - 86400000 * 90) },
    ],
  },
  fundingDeposit: {
    title: '充值订单（业务线）',
    subtitle:
      '用户端充值入账与确认数；与财务「区块链充值」可对账。对接示例：GET /v1/admin/orders/funding/deposit。',
    keywordPlaceholder: '订单号 / UID / TxID',
    filterKeywordLabel: '检索',
    listCaption: '充值记录',
    drawerNote: '链上确认进度、风控暂缓标签与人工上分凭证。',
    stats: [
      { label: '待确认', value: '56', tone: 'warn' },
      { label: '今日到账', value: '12,400 笔', tone: 'ok' },
      { label: '异常挂起', value: '3', tone: 'warn' },
      { label: '今日金额', value: '8,200 万 U', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'asset', label: '资产', width: 80 },
      { prop: 'chain', label: '链', width: 88 },
      { prop: 'amount', label: '金额', width: 110 },
      { prop: 'txid', label: 'TxID(缩略)', minWidth: 140, mono: true },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { PENDING: { type: 'warning', label: '确认中' }, DONE: { type: 'success', label: '到账' }, FAIL: { type: 'danger', label: '失败' } } },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'FD-20260402-01', uid: 'U440102', asset: 'USDT', chain: 'TRC20', amount: '2,000', txid: 'a1b2…9f0c', status: 'PENDING', createdAt: df(Date.now() - 600000) },
      { orderId: 'FD-20260402-02', uid: 'U551002', asset: 'BTC', chain: 'BTC', amount: '0.05', txid: '9c11…2d90', status: 'DONE', createdAt: df(Date.now() - 3600000) },
      { orderId: 'FD-20260401-88', uid: 'U204881', asset: 'ETH', chain: 'ERC20', amount: '3.2', txid: '0x71…4c8e', status: 'DONE', createdAt: df(Date.now() - 86400000) },
      { orderId: 'FD-20260401-77', uid: 'U778899', asset: 'USDT', chain: 'ERC20', amount: '500', txid: '0xee…dead', status: 'FAIL', createdAt: df(Date.now() - 86400000 * 2) },
      { orderId: 'FD-20260331-50', uid: 'U900001', asset: 'USDC', chain: 'Arbitrum', amount: '100,000', txid: '0x55…01fa', status: 'DONE', createdAt: df(Date.now() - 86400000 * 5) },
    ],
  },
  fundingWithdraw: {
    title: '提现订单（业务线）',
    subtitle:
      '出金审核、链上广播与回调；与财务提现复核流程衔接。对接示例：GET /v1/admin/orders/funding/withdraw。',
    keywordPlaceholder: '订单号 / UID / 地址',
    filterKeywordLabel: '检索',
    listCaption: '提现记录',
    drawerNote: '热钱包批次、手续费实付、风控规则命中与解冻工单。',
    stats: [
      { label: '待审核', value: '24', tone: 'warn' },
      { label: '广播中', value: '8', tone: 'default' },
      { label: '今日成功', value: '3,102', tone: 'ok' },
      { label: '今日金额', value: '5,600 万 U', tone: 'muted' },
    ],
    columns: [
      { prop: 'orderId', label: '订单号', width: 140 },
      { prop: 'uid', label: '用户', width: 108 },
      { prop: 'asset', label: '资产', width: 80 },
      { prop: 'chain', label: '链', width: 88 },
      { prop: 'amount', label: '金额', width: 110 },
      { prop: 'toAddr', label: '目标地址', minWidth: 160, mono: true },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: { REVIEW: { type: 'warning', label: '审核中' }, SENT: { type: 'info', label: '已广播' }, DONE: { type: 'success', label: '完成' }, REJECT: { type: 'danger', label: '拒绝' } } },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { orderId: 'FW-20260402-01', uid: 'U440102', asset: 'USDT', chain: 'TRC20', amount: '8,000', toAddr: 'TXYZ…9a2f', status: 'REVIEW', createdAt: df(Date.now() - 1800000) },
      { orderId: 'FW-20260402-02', uid: 'U551002', asset: 'BTC', chain: 'BTC', amount: '0.12', toAddr: 'bc1q…kp5s', status: 'SENT', createdAt: df(Date.now() - 3600000) },
      { orderId: 'FW-20260401-90', uid: 'U204881', asset: 'ETH', chain: 'ERC20', amount: '5', toAddr: '0x71…4c8e', status: 'DONE', createdAt: df(Date.now() - 86400000) },
      { orderId: 'FW-20260401-85', uid: 'U778899', asset: 'USDT', chain: 'TRC20', amount: '50,000', toAddr: 'TBad…0001', status: 'REJECT', createdAt: df(Date.now() - 86400000 * 2) },
      { orderId: 'FW-20260331-70', uid: 'U900001', asset: 'USDC', chain: 'Polygon', amount: '200,000', toAddr: '0x55…01fa', status: 'DONE', createdAt: df(Date.now() - 86400000 * 4) },
    ],
  },
}
