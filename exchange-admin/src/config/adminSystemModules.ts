/**
 * 系统管理 — 各二、三级路由演示配置（对接 API 时替换 rows）
 */
import type { UserModuleColumn, UserModuleDef } from '@/config/adminUserModules'

export type SystemModuleColumn = UserModuleColumn

export type SystemModuleKey =
  | 'systemRootParams'
  | 'systemParams'
  | 'systemRoles'
  | 'systemUserList'
  | 'logsAccountLedger'
  | 'logsOperations'
  | 'logsFrontend'
  | 'logsVerifyCodes'
  | 'ipList'

const df = (ts: number) => new Date(ts).toLocaleString('zh-CN')

const ONOFF = {
  ON: { type: 'success' as const, label: '启用' },
  OFF: { type: 'info' as const, label: '停用' },
}

const OP_RESULT = {
  SUCCESS: { type: 'success' as const, label: '成功' },
  FAIL: { type: 'danger' as const, label: '失败' },
  PARTIAL: { type: 'warning' as const, label: '部分' },
}

const LOG_LEVEL = {
  ERROR: { type: 'danger' as const, label: 'ERROR' },
  WARN: { type: 'warning' as const, label: 'WARN' },
  INFO: { type: 'info' as const, label: 'INFO' },
}

const IP_KIND = {
  ALLOW: { type: 'success' as const, label: '白名单' },
  BLOCK: { type: 'danger' as const, label: '黑名单' },
  MONITOR: { type: 'warning' as const, label: '观察' },
}

export const ADMIN_SYSTEM_MODULE_REGISTRY: Record<SystemModuleKey, UserModuleDef> = {
  systemRootParams: {
    title: '系统参数(ROOT)',
    subtitle:
      '仅超级管理员可改的全局开关与密钥占位；变更需双人复核与审计。对接示例：GET /v1/admin/system/root-params。',
    hint: 'ROOT',
    keywordPlaceholder: '参数键 / 说明',
    filterKeywordLabel: '检索',
    listCaption: 'ROOT 级参数',
    drawerNote: '生产环境应隐藏敏感值、展示指纹与上次变更人；支持回滚与变更单号关联。',
    stats: [
      { label: '敏感项', value: '12', tone: 'warn' },
      { label: '待复核', value: '1', tone: 'warn' },
      { label: '环境', value: 'prod', tone: 'ok' },
      { label: '今日变更', value: '2', tone: 'muted' },
    ],
    columns: [
      { prop: 'paramKey', label: '键', minWidth: 180, mono: true },
      { prop: 'scope', label: '范围', width: 88 },
      { prop: 'valueMasked', label: '值(脱敏)', minWidth: 140, mono: true },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { paramKey: 'root.maintenance_mode', scope: 'ROOT', valueMasked: '***false', status: 'OFF', updatedAt: df(Date.now() - 3600000) },
      { paramKey: 'root.signing.key_id', scope: 'ROOT', valueMasked: 'kid_***a8f', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { paramKey: 'root.feature.dark_launch', scope: 'ROOT', valueMasked: '***1', status: 'ON', updatedAt: df(Date.now() - 7200000) },
      { paramKey: 'root.backup.encryption', scope: 'ROOT', valueMasked: '***enabled', status: 'ON', updatedAt: df(Date.now() - 86400000 * 3) },
    ],
  },
  systemParams: {
    title: '系统参数',
    subtitle:
      '业务可调的运营参数（费率展示、活动开关、限流阈值等），按分组与灰度发布。对接示例：GET /v1/admin/system/params。',
    keywordPlaceholder: '参数键 / 分组',
    filterKeywordLabel: '检索',
    listCaption: '业务参数',
    drawerNote: '可挂载 JSON Schema 校验、历史版本对比与生效环境标签。',
    stats: [
      { label: '参数项', value: '486', tone: 'default' },
      { label: '分组', value: '32', tone: 'muted' },
      { label: '灰度中', value: '5', tone: 'warn' },
      { label: '今日发布', value: '4', tone: 'ok' },
    ],
    columns: [
      { prop: 'paramKey', label: '键', minWidth: 200, mono: true },
      { prop: 'group', label: '分组', width: 110 },
      { prop: 'valuePreview', label: '值预览', minWidth: 120, mono: true },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { paramKey: 'trade.spot.taker_fee_bps', group: '交易', valuePreview: '10', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { paramKey: 'c2c.order_timeout_min', group: 'C2C', valuePreview: '15', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { paramKey: 'risk.withdraw_daily_cap_usdt', group: '风控', valuePreview: '500000', status: 'ON', updatedAt: df(Date.now() - 7200000) },
      { paramKey: 'marketing.spring_banner', group: '运营', valuePreview: '{"on":true}', status: 'OFF', updatedAt: df(Date.now() - 86400000 * 2) },
    ],
  },
  systemRoles: {
    title: '角色管理',
    subtitle:
      '后台角色与权限集合；支持复制角色与权限 Diff。对接示例：GET /v1/admin/system/roles。',
    keywordPlaceholder: '角色编码 / 名称',
    filterKeywordLabel: '检索',
    listCaption: '角色列表',
    drawerNote: '详情展示权限树勾选快照、数据范围（全部/本部门/自定义）与互斥规则。',
    stats: [
      { label: '角色数', value: '28', tone: 'default' },
      { label: '系统内置', value: '6', tone: 'muted' },
      { label: '近 7 日编辑', value: '3', tone: 'warn' },
      { label: '绑定账号', value: '142', tone: 'ok' },
    ],
    columns: [
      { prop: 'roleCode', label: '编码', width: 120, mono: true },
      { prop: 'name', label: '名称', minWidth: 130 },
      { prop: 'permCount', label: '权限数', width: 88 },
      { prop: 'builtin', label: '内置', width: 88, display: 'tag', tagMap: { Y: { type: 'info', label: '是' }, N: { type: 'success', label: '否' } } },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { roleCode: 'SUPER', name: '超级管理员', permCount: 'ALL', builtin: 'Y', status: 'ON', updatedAt: df(Date.now() - 86400000 * 30) },
      { roleCode: 'OPS', name: '运营', permCount: '186', builtin: 'N', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { roleCode: 'FIN', name: '财务', permCount: '42', builtin: 'N', status: 'ON', updatedAt: df(Date.now() - 86400000) },
      { roleCode: 'CS_LEAD', name: '客服主管', permCount: '64', builtin: 'N', status: 'OFF', updatedAt: df(Date.now() - 86400000 * 5) },
    ],
  },
  systemUserList: {
    title: '系统用户管理',
    subtitle:
      '后台账号、角色绑定、MFA 与登录策略。对接示例：GET /v1/admin/system/users。',
    keywordPlaceholder: '登录名 / 姓名',
    filterKeywordLabel: '检索',
    listCaption: '系统用户',
    drawerNote: '可展示 MFA 状态、最近失败登录、IP 白名单与锁定原因。',
    stats: [
      { label: '启用', value: '138', tone: 'ok' },
      { label: '锁定', value: '2', tone: 'warn' },
      { label: '未绑 MFA', value: '9', tone: 'warn' },
      { label: '今日登录', value: '56', tone: 'muted' },
    ],
    columns: [
      { prop: 'username', label: '登录名', width: 120, mono: true },
      { prop: 'displayName', label: '姓名', width: 100 },
      { prop: 'roles', label: '角色', minWidth: 140 },
      { prop: 'lastLoginAt', label: '最近登录', minWidth: 160, display: 'date' },
      { prop: 'status', label: '状态', width: 96, display: 'tag', tagMap: { ACTIVE: { type: 'success', label: '正常' }, LOCKED: { type: 'danger', label: '锁定' }, DISABLED: { type: 'info', label: '停用' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { username: 'admin.root', displayName: '系统', roles: 'SUPER', lastLoginAt: df(Date.now() - 300000), status: 'ACTIVE', updatedAt: df(Date.now() - 86400000) },
      { username: 'ops.zhang', displayName: '张运营', roles: 'OPS', lastLoginAt: df(Date.now() - 3600000), status: 'ACTIVE', updatedAt: df(Date.now() - 7200000) },
      { username: 'fin.li', displayName: '李财务', roles: 'FIN', lastLoginAt: df(Date.now() - 86400000 * 2), status: 'ACTIVE', updatedAt: df(Date.now() - 86400000) },
      { username: 'cs.old', displayName: '王客服', roles: 'CS_LEAD', lastLoginAt: df(Date.now() - 86400000 * 10), status: 'LOCKED', updatedAt: df(Date.now() - 1800000) },
    ],
  },
  logsAccountLedger: {
    title: '账变记录',
    subtitle:
      '用户资产账户增减流水，用于对账与稽核。对接示例：GET /v1/admin/logs/account-ledger。',
    hint: '日志 · 账变',
    keywordPlaceholder: 'UID / 资产 / 业务单号',
    filterKeywordLabel: '检索',
    listCaption: '账变流水',
    drawerNote: '可下钻关联订单号、链上 Tx、操作员与幂等键。',
    stats: [
      { label: '今日笔数', value: '12,804', tone: 'default' },
      { label: '异常冲正', value: '0', tone: 'ok' },
      { label: '大额标记', value: '18', tone: 'warn' },
      { label: '延迟写入', value: '<200ms', tone: 'muted' },
    ],
    columns: [
      { prop: 'id', label: '流水号', width: 120, mono: true },
      { prop: 'uid', label: 'UID', width: 100, mono: true },
      { prop: 'asset', label: '资产', width: 80 },
      { prop: 'delta', label: '变动', width: 110 },
      { prop: 'bizType', label: '业务', width: 100 },
      { prop: 'refId', label: '关联单', minWidth: 120, mono: true },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { id: 'AL-900821', uid: 'U100882', asset: 'USDT', delta: '+120.00', bizType: '充值', refId: 'DEP-88201', createdAt: df(Date.now() - 60000) },
      { id: 'AL-900820', uid: 'U100882', asset: 'USDT', delta: '-50.00', bizType: '手续费', refId: 'ORD-44102', createdAt: df(Date.now() - 120000) },
      { id: 'AL-900819', uid: 'U200001', asset: 'BTC', delta: '+0.002', bizType: '返佣', refId: 'REB-991', createdAt: df(Date.now() - 300000) },
    ],
  },
  logsOperations: {
    title: '操作日志',
    subtitle:
      '管理后台敏感操作审计：谁在何时对何资源做了什么。对接示例：GET /v1/admin/logs/operations。',
    keywordPlaceholder: '操作人 / 资源 / IP',
    filterKeywordLabel: '检索',
    listCaption: '操作审计',
    drawerNote: '可展示请求 ID、变更前后 JSON Diff 与导出合规报表。',
    stats: [
      { label: '今日', value: '3,402', tone: 'default' },
      { label: '失败', value: '12', tone: 'warn' },
      { label: '涉权变更', value: '28', tone: 'muted' },
      { label: '保留天数', value: '180', tone: 'ok' },
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 100, mono: true },
      { prop: 'actor', label: '操作人', width: 110 },
      { prop: 'action', label: '动作', width: 120 },
      { prop: 'resource', label: '资源', minWidth: 160, mono: true },
      { prop: 'ip', label: 'IP', width: 120, mono: true },
      { prop: 'result', label: '结果', width: 88, display: 'tag', tagMap: OP_RESULT },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { id: 'OP-50122', actor: 'ops.zhang', action: 'UPDATE', resource: 'config/market/BTC-USDT', ip: '10.0.4.12', result: 'SUCCESS', createdAt: df(Date.now() - 120000) },
      { id: 'OP-50121', actor: 'fin.li', action: 'EXPORT', resource: 'report/dw/daily', ip: '10.0.8.3', result: 'SUCCESS', createdAt: df(Date.now() - 600000) },
      { id: 'OP-50120', actor: 'cs.old', action: 'DELETE', resource: 'user/U999/bank_card', ip: '192.168.1.9', result: 'FAIL', createdAt: df(Date.now() - 1800000) },
    ],
  },
  logsFrontend: {
    title: '前端日志',
    subtitle:
      'Web/App 端上报的错误与性能事件（采样）。对接示例：GET /v1/admin/logs/frontend。',
    keywordPlaceholder: '路径 / 错误码',
    filterKeywordLabel: '检索',
    listCaption: '前端事件',
    drawerNote: '可关联 SourceMap、设备指纹、会话回放 ID 与版本号。',
    stats: [
      { label: '今日事件', value: '28 万', tone: 'default' },
      { label: 'ERROR', value: '1,204', tone: 'warn' },
      { label: '采样率', value: '5%', tone: 'muted' },
      { label: 'P99 FCP', value: '1.8s', tone: 'ok' },
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 100, mono: true },
      { prop: 'path', label: '路径', minWidth: 160, mono: true },
      { prop: 'level', label: '级别', width: 88, display: 'tag', tagMap: LOG_LEVEL },
      { prop: 'code', label: '错误码', width: 100, mono: true },
      { prop: 'ua', label: 'UA 摘要', minWidth: 140 },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { id: 'FE-88201', path: '/trade/BTC-USDT', level: 'ERROR', code: 'CHUNK_LOAD', ua: 'Chrome 131 / macOS', createdAt: df(Date.now() - 60000) },
      { id: 'FE-88200', path: '/wallet/withdraw', level: 'WARN', code: 'SLOW_API', ua: 'App iOS 18', createdAt: df(Date.now() - 300000) },
      { id: 'FE-88199', path: '/', level: 'INFO', code: 'PERF_LCP', ua: 'Chrome 130 / Win', createdAt: df(Date.now() - 600000) },
    ],
  },
  logsVerifyCodes: {
    title: '验证码发送日志',
    subtitle:
      '短信/邮件验证码下发与校验结果，用于风控与投诉举证。对接示例：GET /v1/admin/logs/verify-codes。',
    keywordPlaceholder: '手机号 / 场景',
    filterKeywordLabel: '检索',
    listCaption: '验证码记录',
    drawerNote: '展示脱敏收件人、供应商回执、限流命中与重放检测结果。',
    stats: [
      { label: '今日发送', value: '42,100', tone: 'default' },
      { label: '失败率', value: '0.8%', tone: 'ok' },
      { label: '限流拦截', value: '312', tone: 'warn' },
      { label: '异常重放', value: '4', tone: 'warn' },
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 100, mono: true },
      { prop: 'targetMasked', label: '目标(脱敏)', width: 130, mono: true },
      { prop: 'channel', label: '通道', width: 88 },
      { prop: 'scene', label: '场景', width: 110 },
      { prop: 'result', label: '结果', width: 88, display: 'tag', tagMap: OP_RESULT },
      { prop: 'createdAt', label: '时间', minWidth: 160, display: 'date' },
    ],
    rows: [
      { id: 'VC-12001', targetMasked: '138****8000', channel: 'SMS', scene: '登录', result: 'SUCCESS', createdAt: df(Date.now() - 30000) },
      { id: 'VC-12000', targetMasked: 'u***@ex.com', channel: 'EMAIL', scene: '提现', result: 'SUCCESS', createdAt: df(Date.now() - 120000) },
      { id: 'VC-11999', targetMasked: '139****1111', channel: 'SMS', scene: '注册', result: 'FAIL', createdAt: df(Date.now() - 300000) },
    ],
  },
  ipList: {
    title: 'IP列表',
    subtitle:
      '后台/API 访问白名单、黑名单与观察名单；可与 WAF、风控策略联动。对接示例：GET /v1/admin/system/ip。',
    keywordPlaceholder: 'IP / 备注',
    filterKeywordLabel: '检索',
    listCaption: 'IP 规则',
    drawerNote: '支持 CIDR、过期时间、命中次数与自动解禁策略。',
    stats: [
      { label: '白名单', value: '24', tone: 'ok' },
      { label: '黑名单', value: '156', tone: 'warn' },
      { label: '观察', value: '8', tone: 'muted' },
      { label: '今日命中', value: '1,204', tone: 'default' },
    ],
    columns: [
      { prop: 'cidr', label: 'IP/CIDR', width: 140, mono: true },
      { prop: 'kind', label: '类型', width: 96, display: 'tag', tagMap: IP_KIND },
      { prop: 'region', label: '地区', width: 100 },
      { prop: 'note', label: '备注', minWidth: 140 },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: ONOFF },
      { prop: 'updatedAt', label: '更新', minWidth: 160, display: 'date' },
    ],
    rows: [
      { cidr: '10.0.0.0/8', kind: 'ALLOW', region: '内网', note: '办公出口', status: 'ON', updatedAt: df(Date.now() - 86400000 * 30) },
      { cidr: '203.0.113.44', kind: 'BLOCK', region: 'HK', note: '撞库', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { cidr: '198.51.100.0/24', kind: 'MONITOR', region: 'US', note: '可疑扫描', status: 'ON', updatedAt: df(Date.now() - 7200000) },
      { cidr: '192.0.2.10', kind: 'BLOCK', region: '—', note: '手动封禁', status: 'OFF', updatedAt: df(Date.now() - 86400000) },
    ],
  },
}
