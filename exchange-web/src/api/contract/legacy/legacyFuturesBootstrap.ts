import { legacyTryGet, legacyTryPostQuery } from '@/api/auth/legacy/legacyHttp'
import { fetchBinance24hTickerFields } from '@/api/binance/binance24hTicker'
import { fetchBinanceDepthRaw } from '@/api/binance/binanceDepth'
import { BINANCE_REST_BASE } from '@/api/binance/binancePublic'
import type { FuturesTradeBootstrapRaw } from '@/api/contract/contract.types'
import {
  LEGACY_FUTURES_PATHS,
  legacyFuturesToUiSymbol,
  normalizeFuturesRouteSymbol,
  toLegacyFuturesSymbol,
} from '@/api/contract/legacy/legacyFuturesPaths'
import {
  mapApplyListToOpenOrders,
  mapContractAssetsToWallet,
  mapDepthToFutures,
  mapFuturesOrderListToHistory,
  mapPcListToPositions,
  mapRealtimeToFuturesTickerBlock,
  mapTradesToFutures,
  pickInstrumentFromContractApply,
} from '@/api/contract/legacy/mapLegacyFutures'
import { LEGACY_SPOT_MARKET_TYPE } from '@/api/trade/legacy/legacySpotContract'

/**
 * 聚合旧站合约页所需数据：行情/深度/成交与现货同源 hobi；持仓/委托走 contract* / futuresOrder*。
 */
export async function fetchLegacyFuturesTradeBootstrapRaw(routeSymbol: string): Promise<FuturesTradeBootstrapRaw> {
  const sym = normalizeFuturesRouteSymbol(routeSymbol)
  const legacySym = toLegacyFuturesSymbol(sym)
  const uiCompact = legacyFuturesToUiSymbol(legacySym)

  const [rt, dep, trd, meta, assets, pcList, applyList, futHist] = await Promise.all([
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.realtime, { symbol: legacySym }),
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.depth, { symbol: legacySym }),
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.trades, { symbol: legacySym }),
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.contractApplyMeta, {}),
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.contractAssets, {}),
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.pcOrderList, {
      page_no: 1,
      page_size: 50,
      symbol: legacySym,
      symbolType: 'contract',
    }),
    legacyTryPostQuery<unknown>(LEGACY_FUTURES_PATHS.applyOrderList, {
      page_no: 1,
      symbol: legacySym,
      type: LEGACY_SPOT_MARKET_TYPE,
    }),
    legacyTryGet<unknown>(LEGACY_FUTURES_PATHS.futuresOrderList, {
      page_no: '1',
      symbol: legacySym,
      symbolType: 'contract',
    }),
  ])

  const instrument = pickInstrumentFromContractApply(meta, legacySym)
  instrument.symbol = uiCompact

  let ticker = mapRealtimeToFuturesTickerBlock(rt, legacySym)
  const lp = parseFloat(ticker.lp)
  if (!Number.isFinite(lp) || lp <= 0) {
    try {
      const b = await fetchBinance24hTickerFields(uiCompact)
      if (b && parseFloat(b.lastPrice) > 0) {
        ticker = {
          mp: b.lastPrice,
          ip: b.lastPrice,
          lp: b.lastPrice,
          pcp: b.priceChangePercent,
          hi: b.highPrice,
          lo: b.lowPrice,
          vb: b.volume,
          qv: b.quoteVolume,
          fr: ticker.fr,
          nft: ticker.nft,
        }
      }
    } catch {
      /* ignore */
    }
  }

  let depth = mapDepthToFutures(dep)
  if (!depth.b.length && !depth.a.length) {
    try {
      const d = await fetchBinanceDepthRaw(uiCompact, 20)
      depth = { s: d.s, b: d.b, a: d.a }
    } catch {
      /* ignore */
    }
  }

  let trades = mapTradesToFutures(trd)
  if (trades.length && trades.every((t) => parseFloat(t.p) <= 0)) {
    trades = []
  }
  if (trades.length === 0) {
    try {
      const sym = uiCompact.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BTCUSDT'
      const url = `${BINANCE_REST_BASE}/api/v3/trades?symbol=${encodeURIComponent(sym)}&limit=40`
      const res = await fetch(url)
      if (res.ok) {
        const arr = (await res.json()) as Array<{ price: string; qty: string; time: number; isBuyerMaker?: boolean }>
        trades = arr.map((x, i) => ({
          i: `bn-${x.time}-${i}`,
          p: String(x.price),
          q: String(x.qty),
          m: x.isBuyerMaker === true ? '2' : '1',
          t: String(x.time),
        }))
      }
    } catch {
      /* ignore */
    }
  }
  const positions = mapPcListToPositions(pcList, uiCompact)
  const open_orders = mapApplyListToOpenOrders(applyList, uiCompact)
  const history_orders = mapFuturesOrderListToHistory(futHist, uiCompact)
  const wallet = mapContractAssetsToWallet(assets)

  return {
    symbol: uiCompact,
    instrument,
    ticker,
    depth,
    trades,
    positions,
    open_orders,
    history_orders,
    fills: [],
    funding: [],
    wallet,
  }
}
