import { RouteNames } from '@/constants/routeNames'

/** 二级菜单图标 key，与 NavMenuIcon 映射一致 */
export type NavIconKey =
  | 'spot'
  | 'copy'
  | 'demo'
  | 'convert'
  | 'c2c'
  | 'perpetual'
  | 'options'
  | 'fund'
  | 'miner'
  | 'lending'
  | 'staking'
  | 'announce'
  | 'activity'
  | 'support'
  | 'news'
  | 'nft'
  | 'charity'
  | 'locale'
  | 'chat'
  | 'app'

export type NavMenuLeaf = {
  key: string
  /** vue-i18n key，文案在 locales/messages/*.json */
  labelKey: string
  routeName: string
  to: string | Record<string, unknown>
  icon: NavIconKey
}

export type NavMenuDropdown = {
  kind: 'dropdown'
  key: string
  labelKey: string
  children: NavMenuLeaf[]
}

export type NavMenuFlatRoute = {
  kind: 'route'
  key: string
  labelKey: string
  routeName: string
  to: string | Record<string, unknown>
}

export type NavMenuFlatHash = {
  kind: 'hash'
  key: string
  labelKey: string
  routeName: string
  hash: string
  path: string
}

export type NavMenuEntry = NavMenuFlatRoute | NavMenuFlatHash | NavMenuDropdown

export function isNavDropdown(e: NavMenuEntry): e is NavMenuDropdown {
  return e.kind === 'dropdown'
}

/** 顶栏 + 抽屉共用主导航 */
export const MAIN_NAV_ENTRIES: NavMenuEntry[] = [
  { kind: 'route', key: 'home', labelKey: 'nav.home', routeName: RouteNames.Home, to: '/' },
  { kind: 'route', key: 'market', labelKey: 'nav.market', routeName: RouteNames.Market, to: '/market' },
  {
    kind: 'dropdown',
    key: 'trade',
    labelKey: 'nav.trade',
    children: [
      {
        key: 'spot',
        labelKey: 'nav.tradeSpot',
        routeName: RouteNames.SpotTrade,
        to: '/trade/spot/BTC_USDT',
        icon: 'spot',
      },
      {
        key: 'copy',
        labelKey: 'nav.tradeCopy',
        routeName: RouteNames.CopyTrading,
        to: '/trade/copy',
        icon: 'copy',
      },
      {
        key: 'demo',
        labelKey: 'nav.tradeDemo',
        routeName: RouteNames.DemoTrading,
        to: '/trade/demo',
        icon: 'demo',
      },
      {
        key: 'convert',
        labelKey: 'nav.tradeConvert',
        routeName: RouteNames.Convert,
        to: '/convert',
        icon: 'convert',
      },
      {
        key: 'c2c',
        labelKey: 'nav.tradeC2c',
        routeName: RouteNames.C2C,
        to: '/c2c/market',
        icon: 'c2c',
      },
    ],
  },
  {
    kind: 'dropdown',
    key: 'contract',
    labelKey: 'nav.contract',
    children: [
      {
        key: 'perpetual',
        labelKey: 'nav.contractPerpetual',
        routeName: RouteNames.ContractTrade,
        to: '/trade/contract/BTCUSDT',
        icon: 'perpetual',
      },
      {
        key: 'delivery',
        labelKey: 'nav.contractOptions',
        routeName: RouteNames.DeliveryContract,
        to: '/trade/delivery/BTCUSDT_250627',
        icon: 'options',
      },
    ],
  },
  {
    kind: 'dropdown',
    key: 'finance',
    labelKey: 'nav.finance',
    children: [
      {
        key: 'fund',
        labelKey: 'nav.financeFund',
        routeName: RouteNames.FinanceFund,
        to: '/finance/fund',
        icon: 'fund',
      },
      {
        key: 'miner',
        labelKey: 'nav.financeMiner',
        routeName: RouteNames.SmartMiner,
        to: '/finance/miner',
        icon: 'miner',
      },
      {
        key: 'lending',
        labelKey: 'nav.financeLending',
        routeName: RouteNames.LendingAssist,
        to: '/finance/lending',
        icon: 'lending',
      },
      {
        key: 'staking',
        labelKey: 'nav.financeStaking',
        routeName: RouteNames.StakingBorrow,
        to: '/finance/staking',
        icon: 'staking',
      },
    ],
  },
  {
    kind: 'dropdown',
    key: 'moreExplore',
    labelKey: 'nav.more',
    children: [
      {
        key: 'global-news',
        labelKey: 'nav.moreGlobalNews',
        routeName: RouteNames.MoreGlobalNews,
        to: '/more/global-news',
        icon: 'news',
      },
      {
        key: 'nft',
        labelKey: 'nav.moreNft',
        routeName: RouteNames.MoreNft,
        to: '/more/nft',
        icon: 'nft',
      },
      {
        key: 'charity',
        labelKey: 'nav.moreCharity',
        routeName: RouteNames.MoreCharity,
        to: '/more/charity',
        icon: 'charity',
      },
    ],
  },
]

/** 右侧「更多」下拉：公告 / 活动 / 客服 */
export const HEADER_MORE_MENU: NavMenuLeaf[] = [
  {
    key: 'announce-center',
    labelKey: 'navMore.announceCenter',
    routeName: RouteNames.AnnounceCenter,
    to: '/support/announce',
    icon: 'announce',
  },
  {
    key: 'activity-center',
    labelKey: 'navMore.activityCenter',
    routeName: RouteNames.ActivityCenter,
    to: '/support/activity',
    icon: 'activity',
  },
  {
    key: 'support-center',
    labelKey: 'navMore.supportCenter',
    routeName: RouteNames.SupportCenter,
    to: '/support/service',
    icon: 'support',
  },
]

export type MobileDockItem = {
  key: string
  labelKey: string
  to: string | Record<string, unknown>
  routeNames: string[]
}

export const MOBILE_DOCK_ITEMS: MobileDockItem[] = [
  { key: 'home', labelKey: 'dock.home', to: '/', routeNames: [RouteNames.Home] },
  { key: 'market', labelKey: 'dock.market', to: '/market', routeNames: [RouteNames.Market] },
  {
    key: 'trade',
    labelKey: 'dock.trade',
    to: '/trade/spot/BTC_USDT',
    routeNames: [
      RouteNames.SpotTrade,
      RouteNames.DemoSpotTrade,
      RouteNames.ContractTrade,
      RouteNames.CopyTrading,
      RouteNames.DemoTrading,
      RouteNames.Convert,
      RouteNames.C2C,
      RouteNames.C2COrdersRunning,
      RouteNames.C2COrdersEnded,
      RouteNames.DeliveryContract,
    ],
  },
  { key: 'assets', labelKey: 'dock.assets', to: '/assets', routeNames: [RouteNames.Assets] },
  {
    key: 'user',
    labelKey: 'dock.user',
    to: '/account/overview',
    routeNames: [RouteNames.AccountOverview, RouteNames.AccountHub],
  },
]
