import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  MarketChangeFilter,
  MarketContractSub,
  MarketSegment,
  MarketTickerPatch,
  MarketTickerRow,
  MarketWatchlistSub,
} from '@/types/market'
import { fetchMarketTickers } from '@/api/market'

const WATCHLIST_LS_KEY = 'exchange_market_watchlist_v1'

function watchKey(r: MarketTickerRow): string {
  if (r.kind === 'DELIVERY') return `DELIVERY:${r.routeSymbol}`
  return `${r.kind}:${r.routeSymbol}`
}

function loadWatchlistFromStorage(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(WATCHLIST_LS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function persistWatchlist(keys: Set<string>) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(WATCHLIST_LS_KEY, JSON.stringify([...keys]))
  } catch {
    /* ignore quota */
  }
}

export const useMarketStore = defineStore('market', () => {
  const tickers = ref<MarketTickerRow[]>([])
  const loading = ref(false)
  /** REST 首屏或刷新失败 */
  const loadError = ref<string | null>(null)
  /** 顶部分类 Tab */
  const segment = ref<MarketSegment>('SPOT')
  /** 「合约」Tab：永续 / 交割 */
  const contractSub = ref<MarketContractSub>('PERPETUAL')
  /** 「自选」Tab：现货 / 永续 / 交割 */
  const watchlistSub = ref<MarketWatchlistSub>('SPOT')
  const searchQuery = ref('')
  /** 涨跌筛选 */
  const changeFilter = ref<MarketChangeFilter>('all')
  /** 自选：localStorage 持久化；登录后与云端合并接口预留 */
  const watchlistKeys = ref<Set<string>>(loadWatchlistFromStorage())
  const lastWsSeq = ref(0)

  function applySegment(list: MarketTickerRow[]): MarketTickerRow[] {
    switch (segment.value) {
      case 'WATCHLIST': {
        let wl = list.filter((r) => watchlistKeys.value.has(watchKey(r)))
        if (watchlistSub.value === 'SPOT') {
          wl = wl.filter((r) => r.kind === 'SPOT')
        } else if (watchlistSub.value === 'PERPETUAL') {
          wl = wl.filter((r) => r.kind === 'CONTRACT' && r.quoteAsset === 'USDT')
        } else if (watchlistSub.value === 'DELIVERY') {
          wl = wl.filter((r) => r.kind === 'DELIVERY')
        }
        return wl
      }
      case 'SPOT':
        return list.filter((r) => r.kind === 'SPOT')
      case 'CONTRACT':
        if (contractSub.value === 'DELIVERY') {
          return list.filter((r) => r.kind === 'DELIVERY')
        }
        return list.filter((r) => r.kind === 'CONTRACT' && r.quoteAsset === 'USDT')
      case 'HOT': {
        const hot = list.filter((r) => r.zone === 'HOT')
        return hot.length > 0 ? hot : list
      }
      case 'GAINERS':
        return list.filter((r) => r.changePct > 0)
      case 'LOSERS':
        return list.filter((r) => r.changePct < 0)
      case 'VOLUME_24H':
        return list
      default:
        return list
    }
  }

  function applySearch(list: MarketTickerRow[]): MarketTickerRow[] {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (r) =>
        r.baseAsset.toLowerCase().includes(q) ||
        r.displayPair.toLowerCase().includes(q) ||
        r.routeSymbol.toLowerCase().includes(q),
    )
  }

  function applyChangeFilter(list: MarketTickerRow[]): MarketTickerRow[] {
    switch (changeFilter.value) {
      case 'up':
        return list.filter((r) => r.changePct > 0)
      case 'down':
        return list.filter((r) => r.changePct < 0)
      default:
        return list
    }
  }

  /** 表格最终行：分类 + 搜索 + 涨跌筛选 */
  const displayRows = computed(() => {
    let out = tickers.value
    out = applySegment(out)
    out = applySearch(out)
    out = applyChangeFilter(out)
    return out
  })

  const marketSummary = computed(() => {
    const rows = tickers.value
    const n = rows.length
    const vol = rows.reduce((s, r) => s + r.quoteVolume, 0)
    return { pairCount: n, quoteVolume24h: vol }
  })

  const hotRows = computed(() =>
    [...tickers.value].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 10),
  )

  const gainersRows = computed(() =>
    [...tickers.value].sort((a, b) => b.changePct - a.changePct).slice(0, 10),
  )

  const losersRows = computed(() =>
    [...tickers.value].sort((a, b) => a.changePct - b.changePct).slice(0, 10),
  )

  const volumeRankRows = computed(() =>
    [...tickers.value].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 10),
  )

  async function loadTickers() {
    loading.value = true
    loadError.value = null
    try {
      tickers.value = await fetchMarketTickers()
    } catch {
      loadError.value = '行情加载失败，请检查网络后重试'
    } finally {
      loading.value = false
    }
  }

  function setSegment(s: MarketSegment) {
    segment.value = s
  }

  function setContractSub(s: MarketContractSub) {
    contractSub.value = s
  }

  function setWatchlistSub(s: MarketWatchlistSub) {
    watchlistSub.value = s
  }

  function setSearch(q: string) {
    searchQuery.value = q
  }

  function setChangeFilter(f: MarketChangeFilter) {
    changeFilter.value = f
  }

  /** WebSocket：合并单条或批量增量（见 websocket/marketTicker.ts） */
  function applyTickerPatches(patches: MarketTickerPatch[], seq?: number) {
    if (seq != null && seq <= lastWsSeq.value) return
    if (seq != null) lastWsSeq.value = seq

    const map = new Map(tickers.value.map((r) => [r.id, r]))
    for (const p of patches) {
      const cur = map.get(p.id)
      if (!cur) continue
      const next: MarketTickerRow = { ...cur }
      if (p.lastPrice != null) next.lastPrice = p.lastPrice
      if (p.changePct != null) next.changePct = p.changePct
      if (p.high24h != null) next.high24h = p.high24h
      if (p.low24h != null) next.low24h = p.low24h
      if (p.volumeBase != null) next.volumeBase = p.volumeBase
      if (p.quoteVolume != null) next.quoteVolume = p.quoteVolume
      if (p.marketCapUsdt != null) next.marketCapUsdt = p.marketCapUsdt
      map.set(p.id, next)
    }
    tickers.value = Array.from(map.values())
  }

  function toggleWatchlist(row: MarketTickerRow) {
    const k = watchKey(row)
    const next = new Set(watchlistKeys.value)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    watchlistKeys.value = next
    persistWatchlist(next)
  }

  function isInWatchlist(row: MarketTickerRow): boolean {
    return watchlistKeys.value.has(watchKey(row))
  }

  /** 现货页收藏：与行情自选同一套 key（SPOT:BTC_USDT） */
  function isSpotSymbolWatched(routeSymbol: string): boolean {
    return watchlistKeys.value.has(`SPOT:${routeSymbol}`)
  }

  function toggleSpotSymbolWatchlist(routeSymbol: string) {
    const k = `SPOT:${routeSymbol}`
    const next = new Set(watchlistKeys.value)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    watchlistKeys.value = next
    persistWatchlist(next)
  }

  /** 合约页收藏：与行情自选同一套 key（CONTRACT:BTCUSDT） */
  function isContractSymbolWatched(routeSymbol: string): boolean {
    return watchlistKeys.value.has(`CONTRACT:${routeSymbol}`)
  }

  function toggleContractSymbolWatchlist(routeSymbol: string) {
    const k = `CONTRACT:${routeSymbol}`
    const next = new Set(watchlistKeys.value)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    watchlistKeys.value = next
    persistWatchlist(next)
  }

  /** 交割合约页收藏：路由参数 symbol，如 BTCUSDT_240628 */
  function isDeliverySymbolWatched(routeSymbol: string): boolean {
    return watchlistKeys.value.has(`DELIVERY:${routeSymbol}`)
  }

  function toggleDeliverySymbolWatchlist(routeSymbol: string) {
    const k = `DELIVERY:${routeSymbol}`
    const next = new Set(watchlistKeys.value)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    watchlistKeys.value = next
    persistWatchlist(next)
  }

  return {
    tickers,
    loading,
    loadError,
    segment,
    contractSub,
    watchlistSub,
    searchQuery,
    changeFilter,
    watchlistKeys,
    lastWsSeq,
    displayRows,
    marketSummary,
    hotRows,
    gainersRows,
    losersRows,
    volumeRankRows,
    loadTickers,
    setSegment,
    setContractSub,
    setWatchlistSub,
    setSearch,
    setChangeFilter,
    applyTickerPatches,
    toggleWatchlist,
    isInWatchlist,
    isSpotSymbolWatched,
    toggleSpotSymbolWatchlist,
    isContractSymbolWatched,
    toggleContractSymbolWatchlist,
    isDeliverySymbolWatched,
    toggleDeliverySymbolWatchlist,
  }
})
