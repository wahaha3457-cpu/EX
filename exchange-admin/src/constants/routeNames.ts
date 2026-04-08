export const RouteNames = {
  Home: 'Home',
  Market: 'Market',
  SpotTrade: 'SpotTrade',
  ContractTrade: 'ContractTrade',
  Assets: 'Assets',
  /** 统一账户工作台（父级 meta，实际子路由承载页面） */
  AccountHub: 'AccountHub',
  /** 账户工作台 · 总览 */
  AccountOverview: 'AccountOverview',
  /** 账户工作台 · 用户资料 */
  AccountProfile: 'AccountProfile',
  /** 账户工作台 · 安全中心 */
  AccountSecurity: 'AccountSecurity',
  /** 账户工作台 · API */
  AccountApi: 'AccountApi',
  /** 账户工作台 · 登录设备与记录 */
  AccountSessions: 'AccountSessions',
  /** 订单中心（资金流水 / 现货 / 合约 / C2C / 闪兑 / 理财） */
  OrdersCenter: 'OrdersCenter',
  OrdersLedger: 'OrdersLedger',
  OrdersSpot: 'OrdersSpot',
  OrdersContract: 'OrdersContract',
  OrdersC2C: 'OrdersC2C',
  OrdersConvert: 'OrdersConvert',
  OrdersEarn: 'OrdersEarn',
  OrdersNft: 'OrdersNft',
  /** 旧「用户中心」路由名：重定向至账户工作台，保留以兼容外链 */
  UserCenter: 'UserCenter',
  /** 重定向至用户中心 · 身份认证 Tab（对标 /account/verification） */
  Verification: 'Verification',
  /** 重定向至用户中心 · 偏好设置 Tab */
  Preferences: 'Preferences',
  Login: 'Login',
  Register: 'Register',
  ForgotPassword: 'ForgotPassword',
  /** 独立运营后台登录页（仅 admin 子应用） */
  AdminPortalLogin: 'AdminPortalLogin',
  /** 运营后台 */
  AdminRoot: 'AdminRoot',
  AdminDashboard: 'AdminDashboard',
  /** 后台账号与安全（顶栏用户菜单，侧栏可不展示） */
  AdminAccount: 'AdminAccount',
  AdminAccountLoginPassword: 'AdminAccountLoginPassword',
  AdminAccountFundPassword: 'AdminAccountFundPassword',
  /** 常用功能列表 */
  AdminQuickAccess: 'AdminQuickAccess',
  AdminQuickGeneralQuery: 'AdminQuickGeneralQuery',
  /** 用户管理（父级，嵌套子路由） */
  AdminUsers: 'AdminUsers',
  AdminUserAgents: 'AdminUserAgents',
  AdminUserReferrals: 'AdminUserReferrals',
  AdminUserKycBasic: 'AdminUserKycBasic',
  AdminUserKycC2c: 'AdminUserKycC2c',
  AdminUserKycAdvanced: 'AdminUserKycAdvanced',
  AdminUserManualReset: 'AdminUserManualReset',
  AdminUserBasicProfiles: 'AdminUserBasicProfiles',
  AdminUserList: 'AdminUserList',
  AdminUserContacts: 'AdminUserContacts',
  AdminCurrencies: 'AdminCurrencies',
  AdminSymbols: 'AdminSymbols',
  /** 订单管理（父级嵌套） */
  AdminOrders: 'AdminOrders',
  AdminOrdersSpot: 'AdminOrdersSpot',
  /** 合约订单（二级分组） */
  AdminOrdersContract: 'AdminOrdersContract',
  AdminOrdersContractPerpOrders: 'AdminOrdersContractPerpOrders',
  AdminOrdersContractPerpEntrust: 'AdminOrdersContractPerpEntrust',
  AdminOrdersContractDelOrders: 'AdminOrdersContractDelOrders',
  AdminOrdersContractDelVenueSettings: 'AdminOrdersContractDelVenueSettings',
  AdminOrdersContractDelGlobalVenue: 'AdminOrdersContractDelGlobalVenue',
  AdminOrdersContractDelTeamVenue: 'AdminOrdersContractDelTeamVenue',
  AdminOrdersContractDelCopy: 'AdminOrdersContractDelCopy',
  /** 理财订单（二级分组） */
  AdminOrdersFinance: 'AdminOrdersFinance',
  AdminOrdersFinanceMiner: 'AdminOrdersFinanceMiner',
  AdminOrdersFinanceSmartMiner: 'AdminOrdersFinanceSmartMiner',
  AdminOrdersFinanceBots: 'AdminOrdersFinanceBots',
  AdminOrdersNft: 'AdminOrdersNft',
  AdminOrdersConvert: 'AdminOrdersConvert',
  AdminOrdersStaking: 'AdminOrdersStaking',
  AdminOrdersLending: 'AdminOrdersLending',
  /** 充提订单（二级分组） */
  AdminOrdersFunding: 'AdminOrdersFunding',
  AdminOrdersFundingDeposit: 'AdminOrdersFundingDeposit',
  AdminOrdersFundingWithdraw: 'AdminOrdersFundingWithdraw',
  /** 业务订单 · C2C */
  AdminOrdersC2c: 'AdminOrdersC2c',
  AdminOrdersC2cPayTemplates: 'AdminOrdersC2cPayTemplates',
  AdminOrdersC2cPayMethods: 'AdminOrdersC2cPayMethods',
  AdminOrdersC2cMerchants: 'AdminOrdersC2cMerchants',
  AdminOrdersC2cAds: 'AdminOrdersC2cAds',
  AdminOrdersC2cOrders: 'AdminOrdersC2cOrders',
  AdminOrdersC2cAppeals: 'AdminOrdersC2cAppeals',
  /** 业务订单 · ICO */
  AdminOrdersIco: 'AdminOrdersIco',
  AdminOrdersIcoProducts: 'AdminOrdersIcoProducts',
  AdminOrdersIcoUserOrders: 'AdminOrdersIcoUserOrders',
  /** 运营后台 · 一级模块（占位） */
  AdminActivities: 'AdminActivities',
  AdminFinanceMgmt: 'AdminFinanceMgmt',
  /** 财务管理（二级） */
  AdminFinanceDeposits: 'AdminFinanceDeposits',
  AdminFinanceWithdrawals: 'AdminFinanceWithdrawals',
  AdminFinanceChainWithdrawAddresses: 'AdminFinanceChainWithdrawAddresses',
  AdminFinanceChainPersonalDepositAddresses: 'AdminFinanceChainPersonalDepositAddresses',
  AdminFinanceChainPublicDepositAddresses: 'AdminFinanceChainPublicDepositAddresses',
  AdminFinanceWithdrawLimits: 'AdminFinanceWithdrawLimits',
  /** 报表管理（父级嵌套） */
  AdminReports: 'AdminReports',
  AdminReportsTotalDw: 'AdminReportsTotalDw',
  AdminReportsAgentDw: 'AdminReportsAgentDw',
  AdminReportsUserEarnings: 'AdminReportsUserEarnings',
  /** 配置管理（父级嵌套） */
  AdminConfigCenter: 'AdminConfigCenter',
  /** 行情 */
  AdminConfigMarket: 'AdminConfigMarket',
  AdminConfigMarketOverview: 'AdminConfigMarketOverview',
  AdminConfigMarketSymbols: 'AdminConfigMarketSymbols',
  /** 汇率 */
  AdminConfigExchangeRates: 'AdminConfigExchangeRates',
  AdminConfigExchangeRatesSettings: 'AdminConfigExchangeRatesSettings',
  /** 合约 */
  AdminConfigContract: 'AdminConfigContract',
  AdminConfigContractPerpetual: 'AdminConfigContractPerpetual',
  AdminConfigContractDelivery: 'AdminConfigContractDelivery',
  /** 财富 */
  AdminConfigWealth: 'AdminConfigWealth',
  AdminConfigWealthEarn: 'AdminConfigWealthEarn',
  AdminConfigWealthMiner: 'AdminConfigWealthMiner',
  AdminConfigWealthBots: 'AdminConfigWealthBots',
  AdminConfigWealthLending: 'AdminConfigWealthLending',
  AdminConfigWealthTeamWithdraw: 'AdminConfigWealthTeamWithdraw',
  /** 内容 */
  AdminConfigContent: 'AdminConfigContent',
  AdminConfigContentClient: 'AdminConfigContentClient',
  AdminConfigContentNews: 'AdminConfigContentNews',
  AdminConfigContentBanners: 'AdminConfigContentBanners',
  /** 系统管理（父级嵌套） */
  AdminSystemMgmt: 'AdminSystemMgmt',
  /** 二级：系统管理 */
  AdminSystemSys: 'AdminSystemSys',
  AdminSystemSysRootParams: 'AdminSystemSysRootParams',
  AdminSystemSysParams: 'AdminSystemSysParams',
  AdminSystemSysSupport: 'AdminSystemSysSupport',
  /** 二级：系统用户 */
  AdminSystemUsers: 'AdminSystemUsers',
  AdminSystemUsersRoles: 'AdminSystemUsersRoles',
  AdminSystemUsersList: 'AdminSystemUsersList',
  /** 二级：日志 */
  AdminSystemLogs: 'AdminSystemLogs',
  AdminSystemLogsLedger: 'AdminSystemLogsLedger',
  AdminSystemLogsOperations: 'AdminSystemLogsOperations',
  AdminSystemLogsFrontend: 'AdminSystemLogsFrontend',
  AdminSystemLogsVerifyCodes: 'AdminSystemLogsVerifyCodes',
  /** 二级：IP 管理 */
  AdminSystemIp: 'AdminSystemIp',
  AdminSystemIpList: 'AdminSystemIpList',
  AdminAssets: 'AdminAssets',
  AdminAnnouncements: 'AdminAnnouncements',
  AdminRbac: 'AdminRbac',
  AdminLogs: 'AdminLogs',
  /** 交易 / 合约 / 金融 / 支持 — 占位页（后续接业务） */
  CopyTrading: 'CopyTrading',
  DemoTrading: 'DemoTrading',
  /** 模拟现货终端（与实盘 UI 一致，虚拟资金） */
  DemoSpotTrade: 'DemoSpotTrade',
  Convert: 'Convert',
  C2C: 'C2C',
  /** 币安式 USDT 交割 / 季度合约交易台 */
  DeliveryContract: 'DeliveryContract',
  FinanceFund: 'FinanceFund',
  SmartMiner: 'SmartMiner',
  LendingAssist: 'LendingAssist',
  StakingBorrow: 'StakingBorrow',
  AnnounceCenter: 'AnnounceCenter',
  ActivityCenter: 'ActivityCenter',
  SupportCenter: 'SupportCenter',
  /** 主导航「更多」：全球资讯 / NFT / 慈善（占位页） */
  MoreGlobalNews: 'MoreGlobalNews',
  MoreNft: 'MoreNft',
  /** NFT Marketplace Lite：我的 NFT（最小闭环模块） */
  NftMy: 'NftMy',
  MoreCharity: 'MoreCharity',
  /** 邀请返佣（需登录） */
  ReferralInvite: 'ReferralInvite',
  AppDownload: 'AppDownload',
  /** Binance 公开行情 K 线演示（REST + WebSocket） */
  BinanceKlineDemo: 'BinanceKlineDemo',

  /** H5 移动端壳（USDT 实用交易 / 任务 / 托管）— 与运营后台共存，路径前缀 /m */
  MobileRoot: 'MobileRoot',
  MobileHome: 'MobileHome',
  MobileMarket: 'MobileMarket',
  MobilePublish: 'MobilePublish',
  MobileAssets: 'MobileAssets',
  MobileProfile: 'MobileProfile',
  MobileOtcMerchant: 'MobileOtcMerchant',
  MobileOtcOrder: 'MobileOtcOrder',
  MobileTaskDetail: 'MobileTaskDetail',
  MobilePublishTask: 'MobilePublishTask',
  MobilePublishEscrow: 'MobilePublishEscrow',
  MobileEscrowDetail: 'MobileEscrowDetail',
  MobileMeOrders: 'MobileMeOrders',
  MobileMeTasks: 'MobileMeTasks',
  MobileMeAccepts: 'MobileMeAccepts',
  MobileMeEscrows: 'MobileMeEscrows',
  MobileAssetsDeposit: 'MobileAssetsDeposit',
  MobileAssetsWithdraw: 'MobileAssetsWithdraw',
  MobileLedgerDetail: 'MobileLedgerDetail',
  MobileSettings: 'MobileSettings',
  MobileHelp: 'MobileHelp',
  MobileSecurity: 'MobileSecurity',
  /** 消息中心（演示） */
  MobileInbox: 'MobileInbox',
  MobileInboxDetail: 'MobileInboxDetail',
  MobilePublishService: 'MobilePublishService',
  MobileServiceDetail: 'MobileServiceDetail',
  MobileMeServices: 'MobileMeServices',
} as const
