/** 用户管理子模块：页面文案与演示数据（后续对接真实 API 时替换数据源即可） */
export type UserModuleKey =
  | 'agents'
  | 'referrals'
  | 'kycBasic'
  | 'kycC2c'
  | 'kycAdvanced'
  | 'manualReset'
  | 'basicProfiles'
  | 'list'
  | 'contacts'

export interface UserModuleStat {
  label: string
  value: string
  tone?: 'default' | 'warn' | 'ok' | 'muted'
}

export interface UserModuleColumn {
  prop: string
  label: string
  width?: number
  minWidth?: number
  /** 简单渲染：日期 / 标签 */
  display?: 'text' | 'date' | 'tag'
  tagMap?: Record<string, { type: 'success' | 'warning' | 'info' | 'danger'; label: string }>
}

export interface UserModuleDef {
  title: string
  subtitle: string
  hint?: string
  stats?: UserModuleStat[]
  columns: UserModuleColumn[]
  rows: Record<string, unknown>[]
}

const df = (ts: number) => new Date(ts).toLocaleString('zh-CN')

export const ADMIN_USER_MODULE_REGISTRY: Record<UserModuleKey, UserModuleDef> = {
  agents: {
    title: '代理商',
    subtitle: '代理商层级、分润比例与签约状态；对接 GET /v1/admin/users/agents',
    hint: '原型：机构 / 区域代理维护',
    stats: [
      { label: '一级代理', value: '12', tone: 'default' },
      { label: '待续约', value: '3', tone: 'warn' },
      { label: '本月新增', value: '2', tone: 'ok' },
    ],
    columns: [
      { prop: 'code', label: '代理编码', width: 120 },
      { prop: 'name', label: '名称', minWidth: 140 },
      { prop: 'tier', label: '等级', width: 88, display: 'tag', tagMap: { L1: { type: 'warning', label: '一级' }, L2: { type: 'info', label: '二级' } } },
      { prop: 'commission', label: '分润(%)', width: 96 },
      { prop: 'region', label: '区域', minWidth: 100 },
      { prop: 'updatedAt', label: '更新', width: 168, display: 'date' },
    ],
    rows: [
      { code: 'AG-1001', name: '华东运营中心', tier: 'L1', commission: '35', region: '华东', updatedAt: df(Date.now() - 86400000) },
      { code: 'AG-2044', name: '星辰渠道', tier: 'L2', commission: '22', region: '华南', updatedAt: df(Date.now() - 3600000) },
    ],
  },
  referrals: {
    title: '推荐关系',
    subtitle: '邀请人与被邀请人绑定关系、返佣生效状态；对接 GET /v1/admin/users/referrals',
    stats: [
      { label: '有效关系', value: '8,420', tone: 'ok' },
      { label: '待复核', value: '14', tone: 'warn' },
    ],
    columns: [
      { prop: 'inviter', label: '邀请人 UID', width: 120 },
      { prop: 'invitee', label: '被邀请人 UID', width: 120 },
      { prop: 'level', label: '层级', width: 72 },
      { prop: 'rebateStatus', label: '返佣状态', width: 110, display: 'tag', tagMap: { ACTIVE: { type: 'success', label: '生效' }, PENDING: { type: 'warning', label: '待生效' } } },
      { prop: 'bindAt', label: '绑定时间', minWidth: 168, display: 'date' },
    ],
    rows: [
      { inviter: 'U883021', invitee: 'U991204', level: '1', rebateStatus: 'ACTIVE', bindAt: df(Date.now() - 172800000) },
      { inviter: 'A100001', invitee: 'U440012', level: '1', rebateStatus: 'PENDING', bindAt: df(Date.now() - 7200000) },
    ],
  },
  kycBasic: {
    title: '用户基础认证',
    subtitle: '身份证件、人脸等基础 KYC 审核队列；对接 GET /v1/admin/users/kyc/basic',
    hint: '侧栏角标为待审核数量演示',
    stats: [
      { label: '待审核', value: '3', tone: 'warn' },
      { label: '今日通过', value: '56', tone: 'ok' },
      { label: '驳回', value: '4', tone: 'muted' },
    ],
    columns: [
      { prop: 'userCode', label: '用户', width: 112 },
      { prop: 'realName', label: '姓名', minWidth: 100 },
      { prop: 'idType', label: '证件类型', width: 100 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: { PENDING: { type: 'warning', label: '待审核' }, APPROVED: { type: 'success', label: '已通过' } } },
      { prop: 'submittedAt', label: '提交时间', minWidth: 168, display: 'date' },
    ],
    rows: [
      { userCode: 'U440102', realName: '张**', idType: '身份证', status: 'PENDING', submittedAt: df(Date.now() - 5400000) },
      { userCode: 'U440103', realName: '李**', idType: '身份证', status: 'PENDING', submittedAt: df(Date.now() - 1800000) },
      { userCode: 'U440105', realName: '王**', idType: '护照', status: 'PENDING', submittedAt: df(Date.now() - 600000) },
    ],
  },
  kycC2c: {
    title: '用户 C2C 认证',
    subtitle: 'C2C 商家/实人增补材料；对接 GET /v1/admin/users/kyc/c2c',
    columns: [
      { prop: 'userCode', label: '用户', width: 112 },
      { prop: 'shopName', label: '店铺/备注', minWidth: 140 },
      { prop: 'riskScore', label: '风险分', width: 88 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: { REVIEW: { type: 'warning', label: '审核中' }, OK: { type: 'success', label: '已认证' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 168, display: 'date' },
    ],
    rows: [
      { userCode: 'U221008', shopName: '极速换汇', riskScore: '12', status: 'REVIEW', updatedAt: df(Date.now() - 86400000) },
    ],
  },
  kycAdvanced: {
    title: '用户高级认证',
    subtitle: '大额 / 机构类高级认证；对接 GET /v1/admin/users/kyc/advanced',
    columns: [
      { prop: 'userCode', label: '用户', width: 112 },
      { prop: 'entity', label: '主体类型', width: 100 },
      { prop: 'limitReq', label: '申请额度', minWidth: 120 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: { PENDING: { type: 'warning', label: '待审' }, DONE: { type: 'success', label: '完成' } } },
      { prop: 'submittedAt', label: '提交', minWidth: 168, display: 'date' },
    ],
    rows: [
      { userCode: 'U900001', entity: '企业', limitReq: '500W USDT/日', status: 'PENDING', submittedAt: df(Date.now() - 259200000) },
    ],
  },
  manualReset: {
    title: '人工重置管理',
    subtitle: '登录保护、资金密码、2FA 等人工重置工单；对接 GET /v1/admin/users/resets',
    stats: [{ label: '开放工单', value: '5', tone: 'warn' }],
    columns: [
      { prop: 'ticketId', label: '工单号', width: 140 },
      { prop: 'userCode', label: '用户', width: 112 },
      { prop: 'type', label: '类型', minWidth: 120 },
      { prop: 'status', label: '状态', width: 100, display: 'tag', tagMap: { OPEN: { type: 'danger', label: '处理中' }, DONE: { type: 'success', label: '已关闭' } } },
      { prop: 'createdAt', label: '创建', minWidth: 168, display: 'date' },
    ],
    rows: [
      { ticketId: 'RST-20260401001', userCode: 'U332211', type: '资金密码重置', status: 'OPEN', createdAt: df(Date.now() - 14400000) },
      { ticketId: 'RST-20260330088', userCode: 'U778899', type: '手机换绑复核', status: 'DONE', createdAt: df(Date.now() - 432000000) },
    ],
  },
  basicProfiles: {
    title: '用户基础管理',
    subtitle: '资料字段、风险标签、账号状态的底层维护；对接 GET /v1/admin/users/profiles',
    columns: [
      { prop: 'userCode', label: 'UID', width: 120 },
      { prop: 'email', label: '邮箱(脱敏)', minWidth: 180 },
      { prop: 'riskTag', label: '标签', width: 100, display: 'tag', tagMap: { NORMAL: { type: 'info', label: '正常' }, WATCH: { type: 'warning', label: '观察' } } },
      { prop: 'status', label: '账号', width: 88, display: 'tag', tagMap: { ON: { type: 'success', label: '正常' }, LOCK: { type: 'danger', label: '冻结' } } },
      { prop: 'updatedAt', label: '更新', minWidth: 168, display: 'date' },
    ],
    rows: [
      { userCode: 'U100001', email: 'a***@example.com', riskTag: 'NORMAL', status: 'ON', updatedAt: df(Date.now() - 3600000) },
      { userCode: 'U100002', email: 'b***@qq.com', riskTag: 'WATCH', status: 'ON', updatedAt: df(Date.now() - 7200000) },
    ],
  },
  list: {
    title: '用户管理',
    subtitle: '全站用户检索、封禁、备注与分群导出；对接 GET /v1/admin/users',
    stats: [
      { label: '注册用户', value: '128,490', tone: 'default' },
      { label: '今日新增', value: '+312', tone: 'ok' },
      { label: '冻结', value: '48', tone: 'warn' },
    ],
    columns: [
      { prop: 'userCode', label: 'UID', width: 120 },
      { prop: 'nickname', label: '昵称', minWidth: 120 },
      { prop: 'kyc', label: 'KYC', width: 88, display: 'tag', tagMap: { '0': { type: 'info', label: '未认证' }, '1': { type: 'success', label: '基础' }, '2': { type: 'success', label: '高级' } } },
      { prop: 'lastLogin', label: '最近登录', minWidth: 168, display: 'date' },
      { prop: 'status', label: '状态', width: 88, display: 'tag', tagMap: { OK: { type: 'success', label: '正常' }, BAN: { type: 'danger', label: '封禁' } } },
    ],
    rows: [
      { userCode: 'U204881', nickname: 'North', kyc: '1', lastLogin: df(Date.now() - 120000), status: 'OK' },
      { userCode: 'U204882', nickname: 'River', kyc: '0', lastLogin: df(Date.now() - 86400000), status: 'OK' },
      { userCode: 'U204883', nickname: '—', kyc: '2', lastLogin: df(Date.now() - 10000), status: 'BAN' },
    ],
  },
  contacts: {
    title: '用户通讯录',
    subtitle: '链上地址簿、常用提现白名单等；对接 GET /v1/admin/users/contacts',
    columns: [
      { prop: 'userCode', label: '用户', width: 112 },
      { prop: 'label', label: '备注名', minWidth: 120 },
      { prop: 'network', label: '网络', width: 100 },
      { prop: 'address', label: '地址(缩略)', minWidth: 220 },
      { prop: 'verified', label: '校验', width: 88, display: 'tag', tagMap: { '1': { type: 'success', label: '已验' }, '0': { type: 'warning', label: '未验' } } },
    ],
    rows: [
      { userCode: 'U551002', label: '冷钱包 A', network: 'TRC20', address: 'TXYZ…9a2f', verified: '1' },
      { userCode: 'U551002', label: '运营热钱包', network: 'ERC20', address: '0x71…4c8e', verified: '0' },
    ],
  },
}
