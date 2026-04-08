/**
 * 合并 base + fragments，输出 zh-CN 与 en-US 完整包（键一致）。
 * 运行: node scripts/build-full-i18n-bundles.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function mergeTwo(a, b) {
  const out = { ...a }
  for (const key of Object.keys(b)) {
    const bv = b[key]
    const av = out[key]
    if (
      bv !== null &&
      typeof bv === 'object' &&
      !Array.isArray(bv) &&
      av !== null &&
      typeof av === 'object' &&
      !Array.isArray(av)
    ) {
      out[key] = mergeTwo(av, bv)
    } else {
      out[key] = bv
    }
  }
  return out
}

function mergeDeep(base, ...patches) {
  let o = { ...base }
  for (const p of patches) {
    o = mergeTwo(o, p)
  }
  return o
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
}

const baseZh = readJson('src/locales/messages/zh-CN.json')
const baseEn = readJson('src/locales/messages/en.json')
const zhCN = mergeDeep(
  baseZh,
  readJson('src/locales/messages/fragments/zh-CN/routes.json'),
  readJson('src/locales/messages/fragments/zh-CN/auth.json'),
  readJson('src/locales/messages/fragments/zh-CN/pages.json'),
  readJson('src/locales/messages/fragments/zh-CN/admin.json'),
)

let enUS = mergeDeep(
  baseEn,
  readJson('src/locales/messages/fragments/en/routes.json'),
  readJson('src/locales/messages/fragments/en/auth.json'),
  readJson('src/locales/messages/fragments/en/pages.json'),
  readJson('src/locales/messages/fragments/en/admin.json'),
)

/** 美式交易所语境精炼（与 zh-CN 语义对齐，非字面直译） */
const enUsPolish = {
  nav: {
    market: 'Markets',
    trade: 'Trade',
    tradeSpot: 'Spot',
    tradeCopy: 'Copy Trading',
    tradeDemo: 'Paper Trading',
    tradeConvert: 'Convert',
    contract: 'Derivatives',
    contractPerpetual: 'USDT-M Perpetual',
    contractOptions: 'Deliverable Futures',
    finance: 'Earn',
    financeFund: 'On-Chain Earn',
    financeMiner: 'Hashrate Products',
    financeLending: 'Flexible Loans',
    financeStaking: 'Crypto Loans',
  },
  navMore: {
    announceCenter: 'Announcements',
    activityCenter: 'Promotions',
    supportCenter: 'Help Center',
  },
  dock: {
    market: 'Markets',
    user: 'Profile',
  },
  layout: {
    searchPairsPlaceholder: 'BTC / ETH / Symbol',
    searchDialog: 'Search markets & earn products',
    hotTrades: 'Trending pairs',
    earnDetailSoon: 'Earn product details coming soon',
    walletHistory: 'Asset history',
    ordersCenterSub:
      'Unified access to funding, spot, derivatives, C2C, convert, and earn orders. Demo data mirrors the trading UI; production follows live APIs.',
    ordersCenterNavCaption: 'Order type',
    ordersLedger: 'Funding history',
    ordersC2c: 'C2C orders',
    userCenter: 'Profile',
    roleRegular: 'Standard user',
  },
  footer: {
    tagline: 'Institutional-grade crypto trading terminal',
    marketCenter: 'Markets',
    contract: 'Derivatives',
    fees: 'Fee schedule',
    apiDoc: 'API documentation',
  },
  routes: {
    meta: {
      market: 'Markets',
      spotTrade: 'Spot trading',
      contractTrade: 'Futures trading',
      ordersLedger: 'Funding history',
      deliveryContract: 'Deliverable futures',
      financeFund: 'Structured earn',
      smartMiner: 'Hashrate products',
      lendingAssist: 'Flexible loans',
      stakingBorrow: 'Collateralized borrowing',
      adminRoot: 'Operations console',
      adminDashboard: 'Overview',
      adminCurrencies: 'Asset catalog',
      adminSymbols: 'Instrument catalog',
      adminAssets: 'Withdrawal review',
      adminRbac: 'Access control',
      adminLogs: 'Audit logs',
    },
  },
  auth: {
    layout: {
      subtitle: 'Institutional-grade terminal · security and experience first',
    },
    login: {
      mockRegular: 'Demo (standard):',
      mockAdmin: 'Demo (admin, elevated limits):',
    },
    register: {
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
    },
    validation: {
      phoneInvalid: 'Enter a valid mainland China mobile number',
      accountInvalid: '4–20 characters; start with a letter; letters, digits, or underscore only',
    },
  },
  pages: {
    feature: {
      building: 'Under development',
      hint: 'We are building this page — check back soon.',
    },
  },
  admin: {
    placeholder: {
      desc: 'List views and approval workflows are not wired yet. Below demonstrates filters, toolbar, data grid, pagination, status chips, and drawer.',
      tableTitle: 'Dataset (sandbox)',
      exportCsv: 'Export CSV (coming soon)',
      review: 'Review (coming soon)',
      drawerBody:
        'Production shows read-only fields, trace IDs, risk labels, and nested approval comments.',
      confirm: 'Submit (coming soon)',
    },
  },
}

enUS = mergeDeep(enUS, enUsPolish)

const out = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

const outPath = path.join(root, 'src/locales/messages/exports/i18n-full-bundles.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
console.log('Wrote', outPath, '| zh-CN keys:', countLeaves(zhCN), '| en-US keys:', countLeaves(enUS))

function countLeaves(o) {
  let n = 0
  for (const k of Object.keys(o)) {
    if (o[k] !== null && typeof o[k] === 'object' && !Array.isArray(o[k])) n += countLeaves(o[k])
    else n += 1
  }
  return n
}
