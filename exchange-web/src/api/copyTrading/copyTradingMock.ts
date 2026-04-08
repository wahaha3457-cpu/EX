import type {
  CopyClosedRound,
  CopyFollowSettings,
  CopyOpenPosition,
  CopySubscription,
  LeadTrader,
} from '@/types/copyTrading'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function subsKey(userCode: string) {
  return `ex.copy.subs.${userCode}`
}

function positionsKey(userCode: string) {
  return `ex.copy.positions.${userCode}`
}

function historyKey(userCode: string) {
  return `ex.copy.history.${userCode}`
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, v: unknown) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(v))
}

const LEAD_TRADERS: LeadTrader[] = [
  {
    id: 'lt-aurora',
    displayName: 'AuroraQuant',
    avatarHue: 210,
    roi30dPct: 38.2,
    roi90dPct: 112.5,
    winRatePct: 62,
    maxDrawdownPct: 12.4,
    followers: 128_400,
    aumUsdt: 48_200_000,
    tags: ['稳健型', '合约为主'],
    markets: ['FUTURES', 'SPOT'],
    riskLevel: 3,
    trades30d: 186,
    bio: '多周期趋势 + 仓位分层，严控回撤；适合中长期跟单（演示）。',
  },
  {
    id: 'lt-zen',
    displayName: 'ZenFlow',
    avatarHue: 160,
    roi30dPct: 12.6,
    roi90dPct: 41.3,
    winRatePct: 71,
    maxDrawdownPct: 5.1,
    followers: 56_200,
    aumUsdt: 12_800_000,
    tags: ['低回撤', '现货波段'],
    markets: ['SPOT'],
    riskLevel: 2,
    trades30d: 64,
    bio: '现货波段为主，低杠杆；适合保守型跟随者。',
  },
  {
    id: 'lt-neo',
    displayName: 'NeoScalp',
    avatarHue: 28,
    roi30dPct: 55.8,
    roi90dPct: 210.2,
    winRatePct: 54,
    maxDrawdownPct: 28.6,
    followers: 89_000,
    aumUsdt: 22_100_000,
    tags: ['高频', '高波动'],
    markets: ['FUTURES'],
    riskLevel: 5,
    trades30d: 920,
    bio: '短线高频，波动大；请降低跟单倍数并设置单日止损。',
  },
  {
    id: 'lt-pulse',
    displayName: 'PulseBTC',
    avatarHue: 330,
    roi30dPct: 22.1,
    roi90dPct: 68.9,
    winRatePct: 58,
    maxDrawdownPct: 15.2,
    followers: 201_000,
    aumUsdt: 95_000_000,
    tags: ['BTC 生态', '大额带单'],
    markets: ['FUTURES', 'SPOT'],
    riskLevel: 4,
    trades30d: 142,
    bio: '聚焦 BTC 相关标的与主流合约，仓位透明（演示）。',
  },
  {
    id: 'lt-lattice',
    displayName: 'LatticeArb',
    avatarHue: 275,
    roi30dPct: 8.4,
    roi90dPct: 26.7,
    winRatePct: 78,
    maxDrawdownPct: 3.8,
    followers: 34_500,
    aumUsdt: 6_200_000,
    tags: ['套利', '低风险'],
    markets: ['SPOT', 'FUTURES'],
    riskLevel: 1,
    trades30d: 410,
    bio: '期现与跨所价差套利思路展示，收益偏低但更平滑。',
  },
  {
    id: 'lt-mesa',
    displayName: 'MesaGrid',
    avatarHue: 48,
    roi30dPct: 18.9,
    roi90dPct: 52.1,
    winRatePct: 66,
    maxDrawdownPct: 9.3,
    followers: 72_300,
    aumUsdt: 18_400_000,
    tags: ['网格', '震荡市'],
    markets: ['SPOT'],
    riskLevel: 2,
    trades30d: 256,
    bio: '震荡区间网格策略示意，单边行情需注意风险。',
  },
]

export async function fetchLeadTraders(): Promise<LeadTrader[]> {
  await delay(110)
  return LEAD_TRADERS.map((t) => ({
    ...t,
    tags: [...t.tags],
    markets: [...t.markets],
  }))
}

function traderById(id: string): LeadTrader | undefined {
  return LEAD_TRADERS.find((t) => t.id === id)
}

function toSubscription(row: CopyFollowSettings): CopySubscription | null {
  const t = traderById(row.traderId)
  if (!t) return null
  return {
    ...row,
    trader: {
      id: t.id,
      displayName: t.displayName,
      avatarHue: t.avatarHue,
      roi30dPct: t.roi30dPct,
      followers: t.followers,
    },
  }
}

export async function fetchSubscriptions(userCode: string): Promise<CopySubscription[]> {
  await delay(80)
  const rows = readJson<CopyFollowSettings[]>(subsKey(userCode), [])
  return rows.map((r) => toSubscription(r)).filter((x): x is CopySubscription => x != null)
}

export async function saveSubscription(userCode: string, row: CopyFollowSettings): Promise<CopySubscription> {
  await delay(140)
  const list = readJson<CopyFollowSettings[]>(subsKey(userCode), [])
  const i = list.findIndex((x) => x.traderId === row.traderId)
  if (i >= 0) list[i] = row
  else list.push(row)
  writeJson(subsKey(userCode), list)
  const sub = toSubscription(row)
  if (!sub) throw new Error('invalid trader')
  return sub
}

export async function removeSubscription(userCode: string, traderId: string): Promise<void> {
  await delay(90)
  const list = readJson<CopyFollowSettings[]>(subsKey(userCode), []).filter((x) => x.traderId !== traderId)
  writeJson(subsKey(userCode), list)
  const pos = readJson<CopyOpenPosition[]>(positionsKey(userCode), []).filter((p) => p.traderId !== traderId)
  writeJson(positionsKey(userCode), pos)
}

/** 首次跟单时生成 0–2 条演示持仓 */
function seedPositionsIfEmpty(userCode: string, trader: LeadTrader) {
  const existing = readJson<CopyOpenPosition[]>(positionsKey(userCode), [])
  const has = existing.some((p) => p.traderId === trader.id)
  if (has) return
  const n = Math.floor(Math.random() * 3)
  const sym =
    trader.markets.includes('FUTURES') && Math.random() > 0.4
      ? 'BTCUSDT'
      : trader.markets.includes('SPOT')
        ? 'BTC_USDT'
        : 'ETHUSDT'
  const market = sym.includes('_') ? 'SPOT' : 'FUTURES'
  const next = [...existing]
  for (let k = 0; k < n; k++) {
    const isLong = Math.random() > 0.45
    const entry = market === 'SPOT' ? 98_200 + k * 120 : 98_150 + k * 80
    const mark = entry * (isLong ? 1.002 : 0.998)
    const qty = market === 'SPOT' ? 0.012 + k * 0.004 : 0.05 + k * 0.02
    const uPnl = (mark - entry) * qty * (isLong ? 1 : -1) * (market === 'FUTURES' ? 8 : 1)
    next.push({
      id: `cp-${userCode}-${trader.id}-${Date.now()}-${k}`,
      traderId: trader.id,
      traderName: trader.displayName,
      market,
      symbol: sym,
      side: market === 'SPOT' ? (isLong ? 'BUY' : 'SELL') : isLong ? 'LONG' : 'SHORT',
      entryPrice: entry,
      markPrice: mark,
      qty,
      leverage: market === 'FUTURES' ? 8 : undefined,
      uPnlUsdt: Math.round(uPnl * 100) / 100,
      openedAt: new Date(Date.now() - (k + 1) * 3_600_000).toISOString(),
    })
  }
  writeJson(positionsKey(userCode), next)
}

/** 首次跟单时追加少量演示平仓记录 */
function appendDemoHistory(userCode: string, trader: LeadTrader) {
  const existing = readJson<CopyClosedRound[]>(historyKey(userCode), [])
  const n = 2 + Math.floor(Math.random() * 2)
  const next = [...existing]
  for (let i = 0; i < n; i++) {
    const fut = trader.markets.includes('FUTURES') && (!trader.markets.includes('SPOT') || Math.random() > 0.4)
    next.unshift({
      id: `ch-${userCode}-${trader.id}-${Date.now()}-${i}`,
      traderId: trader.id,
      traderName: trader.displayName,
      symbol: fut ? (Math.random() > 0.5 ? 'BTCUSDT' : 'ETHUSDT') : Math.random() > 0.5 ? 'BTC_USDT' : 'ETH_USDT',
      market: fut ? 'FUTURES' : 'SPOT',
      pnlUsdt: Math.round((Math.random() - 0.38) * 280 * 100) / 100,
      closedAt: new Date(Date.now() - (i + 1) * 86_400_000 - Math.floor(Math.random() * 36_000_000)).toISOString(),
    })
  }
  writeJson(historyKey(userCode), next.slice(0, 40))
}

export async function fetchOpenPositions(userCode: string): Promise<CopyOpenPosition[]> {
  await delay(70)
  return readJson<CopyOpenPosition[]>(positionsKey(userCode), [])
}

export async function fetchHistory(userCode: string): Promise<CopyClosedRound[]> {
  await delay(60)
  return readJson<CopyClosedRound[]>(historyKey(userCode), [])
}

export async function followTrader(
  userCode: string,
  traderId: string,
  draft: Omit<CopyFollowSettings, 'traderId' | 'startedAt' | 'updatedAt' | 'status'>,
): Promise<CopySubscription> {
  const t = traderById(traderId)
  if (!t) throw new Error('trader not found')
  const now = new Date().toISOString()
  const row: CopyFollowSettings = {
    traderId,
    ...draft,
    status: 'active',
    startedAt: now,
    updatedAt: now,
  }
  seedPositionsIfEmpty(userCode, t)
  const sub = await saveSubscription(userCode, row)
  appendDemoHistory(userCode, t)
  return sub
}

export async function updateFollowSettings(
  userCode: string,
  traderId: string,
  patch: Partial<Omit<CopyFollowSettings, 'traderId' | 'startedAt'>>,
): Promise<CopySubscription | null> {
  const list = readJson<CopyFollowSettings[]>(subsKey(userCode), [])
  const i = list.findIndex((x) => x.traderId === traderId)
  if (i < 0) return null
  const prev = list[i]!
  const next: CopyFollowSettings = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  list[i] = next
  writeJson(subsKey(userCode), list)
  return toSubscription(next)
}

export async function togglePause(userCode: string, traderId: string, paused: boolean): Promise<CopySubscription | null> {
  return updateFollowSettings(userCode, traderId, { status: paused ? 'paused' : 'active' })
}

/** 刷新演示未实现盈亏（轻微随机波动） */
export async function jitterPositions(userCode: string): Promise<CopyOpenPosition[]> {
  const list = readJson<CopyOpenPosition[]>(positionsKey(userCode), [])
  const next = list.map((p) => {
    const wiggle = 1 + (Math.random() - 0.5) * 0.004
    const mark = Math.round(p.entryPrice * wiggle * 100) / 100
    const dir =
      p.side === 'LONG' || p.side === 'BUY' ? mark - p.entryPrice : p.entryPrice - mark
    const lev = p.leverage ?? 1
    const uPnl = Math.round(dir * p.qty * lev * 100) / 100
    return { ...p, markPrice: mark, uPnlUsdt: uPnl }
  })
  writeJson(positionsKey(userCode), next)
  await delay(40)
  return next
}
