import { defineStore } from 'pinia'
import { computed, h, ref } from 'vue'
import { fetchFuturesTradeBootstrap, type FuturesTradeBootstrap } from '@/api/futuresTrade'
import type {
  FuturesDepthSnapshot,
  FuturesFillRow,
  FuturesFundingLedgerRow,
  FuturesHistoryOrderRow,
  FuturesInstrumentMeta,
  FuturesMarginMode,
  FuturesOpenOrderRow,
  FuturesOrderSide,
  FuturesOrderType,
  FuturesPlaceOrderRequest,
  FuturesPositionRow,
  FuturesPositionSide,
  FuturesRecentTrade,
  FuturesTickerSnapshot,
} from '@/types/futuresTrade'
import { useAppStore } from '@/stores/app'
import { usePreferencesStore } from '@/stores/preferences'
import { ElMessageBox } from 'element-plus'
import { buildFuturesOrderConfirmSummary } from '@/composables/futures/futuresOrderConfirmSummary'
import { formatPrice } from '@/utils/format/number'
import {
  parseFuturesOrderNum,
  tryBuildFuturesPlaceOrderPayload,
} from '@/composables/futures/validateFuturesOrderForm'
import { cancelFuturesOrder, placeFuturesOrder } from '@/api/futuresTradeOrders'
import SpotOrderConfirmBody from '@/components/business/spot/SpotOrderConfirmBody.vue'
import type { FuturesOrderFormFields } from '@/types/futuresOrderForm'
import { StorageKeys } from '@/constants/storageKeys'
import { getAccessToken } from '@/utils/tokenStorage'
import { futuresDemoStorageKey } from '@/utils/tradeDemoLocalPersist'

/** 永续：接口未回写持仓/委托时，本会话演示合并到底部表（与 server bootstrap 空数组对齐） */
const FUT_DEMO_ORD = 'fut-demo-ord-'
const FUT_DEMO_POS = 'fut-demo-pos-'
const FUT_DEMO_FILL = 'fut-demo-fill-'
const FUT_DEMO_LEDGER = 'fut-demo-ledger-'

interface FuturesDemoPersistPayload {
  v: 1
  localDemoOpenOrders: FuturesOpenOrderRow[]
  localDemoPositions: FuturesPositionRow[]
  localDemoHistoryOrders: FuturesHistoryOrderRow[]
  localDemoFills: FuturesFillRow[]
  localDemoFundingLedger: FuturesFundingLedgerRow[]
}

export const useFuturesTradeStore = defineStore('futuresTrade', () => {
  const symbol = ref('BTCUSDT')
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const instrument = ref<FuturesInstrumentMeta | null>(null)
  const ticker = ref<FuturesTickerSnapshot | null>(null)
  const depth = ref<FuturesDepthSnapshot | null>(null)
  const trades = ref<FuturesRecentTrade[]>([])
  const positions = ref<FuturesPositionRow[]>([])
  const openOrders = ref<FuturesOpenOrderRow[]>([])
  const historyOrders = ref<FuturesHistoryOrderRow[]>([])
  const fills = ref<FuturesFillRow[]>([])
  const fundingLedger = ref<FuturesFundingLedgerRow[]>([])

  const localDemoOpenOrders = ref<FuturesOpenOrderRow[]>([])
  const localDemoPositions = ref<FuturesPositionRow[]>([])
  const localDemoHistoryOrders = ref<FuturesHistoryOrderRow[]>([])
  const localDemoFills = ref<FuturesFillRow[]>([])
  const localDemoFundingLedger = ref<FuturesFundingLedgerRow[]>([])

  function persistLocalDemoToStorage() {
    if (typeof localStorage === 'undefined') return
    try {
      const payload: FuturesDemoPersistPayload = {
        v: 1,
        localDemoOpenOrders: localDemoOpenOrders.value,
        localDemoPositions: localDemoPositions.value,
        localDemoHistoryOrders: localDemoHistoryOrders.value,
        localDemoFills: localDemoFills.value,
        localDemoFundingLedger: localDemoFundingLedger.value,
      }
      localStorage.setItem(futuresDemoStorageKey(), JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  }

  function hydrateLocalDemoFromStorage() {
    if (typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(futuresDemoStorageKey())
      if (!raw) return
      const p = JSON.parse(raw) as Partial<FuturesDemoPersistPayload>
      if (p.v !== 1) return
      if (Array.isArray(p.localDemoOpenOrders)) localDemoOpenOrders.value = p.localDemoOpenOrders
      if (Array.isArray(p.localDemoPositions)) localDemoPositions.value = p.localDemoPositions
      if (Array.isArray(p.localDemoHistoryOrders)) localDemoHistoryOrders.value = p.localDemoHistoryOrders
      if (Array.isArray(p.localDemoFills)) localDemoFills.value = p.localDemoFills
      if (Array.isArray(p.localDemoFundingLedger)) localDemoFundingLedger.value = p.localDemoFundingLedger
    } catch {
      /* ignore */
    }
  }

  function stripLocalDemoFromUiState() {
    localDemoOpenOrders.value = []
    localDemoPositions.value = []
    localDemoHistoryOrders.value = []
    localDemoFills.value = []
    localDemoFundingLedger.value = []
    openOrders.value = openOrders.value.filter((o) => !o.orderNo.startsWith(FUT_DEMO_ORD))
    positions.value = positions.value.filter((p) => !p.positionId.startsWith(FUT_DEMO_POS))
    historyOrders.value = historyOrders.value.filter((h) => !h.orderNo.startsWith(FUT_DEMO_ORD))
    fills.value = fills.value.filter((f) => !f.tradeId.startsWith(FUT_DEMO_FILL))
    fundingLedger.value = fundingLedger.value.filter((r) => !r.id.startsWith(FUT_DEMO_LEDGER))
  }

  const availableQuote = ref(0)
  /** 合约保证金余额（计价）；接口未拆分时与可用余额同源 */
  const marginBalance = ref(0)
  const walletAsset = ref('USDT')

  /** 下单区仅开仓：开多 / 开空 */
  const positionSide = ref<FuturesPositionSide>('LONG')
  const formType = ref<FuturesOrderType>('LIMIT')
  const leverage = ref(20)
  const marginMode = ref<FuturesMarginMode>('CROSS')

  const priceInput = ref('')
  const qtyInput = ref('')
  const quoteQtyInput = ref('')

  const tpSlEnabled = ref(false)
  const tpPriceInput = ref('')
  const slPriceInput = ref('')

  const chartInterval = ref<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('15m')
  const chartMainTab = ref<'KLINE' | 'DEPTH'>('KLINE')

  const baseAsset = computed(() => instrument.value?.baseAsset ?? 'BTC')
  const quoteAsset = computed(() => instrument.value?.quoteAsset ?? 'USDT')

  const markPrice = computed(() => ticker.value?.markPrice ?? 0)

  /** 最大可开名义（计价）≈ 可用保证金 × 杠杆；与「张数 × 面值 × 标记价」口径一致 */
  const maxOpenNotionalUsdt = computed(() => {
    if (leverage.value <= 0) return 0
    return availableQuote.value * leverage.value
  })

  function setSymbol(s: string) {
    const next = s && s.length > 0 ? s : 'BTCUSDT'
    symbol.value = next
    void bootstrap()
  }

  function mergeLocalDemoRows(sym: string, data: FuturesTradeBootstrap) {
    positions.value = [...data.positions, ...localDemoPositions.value.filter((p) => p.symbol === sym)]
    openOrders.value = [...data.openOrders, ...localDemoOpenOrders.value.filter((o) => o.symbol === sym)]
    historyOrders.value = [
      ...data.historyOrders,
      ...localDemoHistoryOrders.value.filter((h) => h.symbol === sym),
    ]
    fills.value = [...data.fills, ...localDemoFills.value]
    fundingLedger.value = [...localDemoFundingLedger.value, ...data.fundingLedger]
  }

  /** 演示撤单：写入历史委托，否则「历史委托」列表看不到已撤销 */
  function pushLocalDemoOrderToHistoryAsCancelled(o: FuturesOpenOrderRow) {
    const now = new Date().toISOString()
    const row: FuturesHistoryOrderRow = {
      ...o,
      status: 'CANCELED',
      updatedAt: now,
      avgFillPrice: null,
    }
    localDemoHistoryOrders.value.unshift(row)
  }

  /** 合并 server 历史与本地演示历史（不依赖 depth，撤单后可直接刷新列表） */
  function refreshHistoryOrdersMerged() {
    const sym = symbol.value
    const fromServer = historyOrders.value.filter((h) => !h.orderNo.startsWith(FUT_DEMO_ORD))
    historyOrders.value = [
      ...fromServer,
      ...localDemoHistoryOrders.value.filter((h) => h.symbol === sym),
    ]
  }

  function remergeFromStrippedServerPlusLocal() {
    const sym = symbol.value
    const inst = instrument.value
    const tick = ticker.value
    const dep = depth.value
    if (!inst || !tick || !dep) return

    const stripped: FuturesTradeBootstrap = {
      instrument: inst,
      ticker: tick,
      depth: dep,
      trades: trades.value,
      positions: positions.value.filter((p) => !p.positionId.startsWith(FUT_DEMO_POS)),
      openOrders: openOrders.value.filter((o) => !o.orderNo.startsWith(FUT_DEMO_ORD)),
      historyOrders: historyOrders.value.filter((h) => !h.orderNo.startsWith(FUT_DEMO_ORD)),
      fills: fills.value.filter((f) => !f.tradeId.startsWith(FUT_DEMO_FILL)),
      fundingLedger: fundingLedger.value.filter((r) => !r.id.startsWith(FUT_DEMO_LEDGER)),
      wallet: {
        availableQuote: availableQuote.value,
        asset: walletAsset.value,
        marginBalance: marginBalance.value,
      },
    }
    mergeLocalDemoRows(sym, stripped)
  }

  function appendLocalDemoFromPlaceOrder(payload: FuturesPlaceOrderRequest) {
    const inst = instrument.value
    const mPx = ticker.value?.markPrice ?? 0
    const cs = inst?.contractSizeBase ?? 0
    const sym = payload.symbol
    const now = new Date().toISOString()
    const ts = Date.now()

    if (payload.type === 'LIMIT' && payload.price != null) {
      localDemoOpenOrders.value.push({
        orderNo: `${FUT_DEMO_ORD}${ts}`,
        symbol: sym,
        side: payload.side,
        positionSide: payload.positionSide,
        type: 'LIMIT',
        price: payload.price,
        quantity: payload.quantity,
        filledQty: 0,
        reduceOnly: false,
        status: 'NEW',
        createdAt: now,
      })
      persistLocalDemoToStorage()
      return
    }

    const fillPrice = mPx > 0 ? mPx : (payload.price ?? 0)
    const orderNo = `${FUT_DEMO_ORD}${ts}`
    const lev = payload.leverage
    const notional = cs > 0 && fillPrice > 0 ? fillPrice * payload.quantity * cs : 0
    const isoMargin = lev > 0 ? notional / lev : notional

    localDemoPositions.value.push({
      positionId: `${FUT_DEMO_POS}${ts}`,
      symbol: sym,
      side: payload.positionSide,
      contracts: payload.quantity,
      entryPrice: fillPrice,
      markPrice: mPx || fillPrice,
      leverage: lev,
      marginMode: payload.marginMode,
      isolatedMargin: isoMargin,
      unrealizedPnl: 0,
      liquidationPrice:
        lev > 0 && fillPrice > 0
          ? payload.positionSide === 'LONG'
            ? fillPrice * (1 - 0.85 / lev)
            : fillPrice * (1 + 0.85 / lev)
          : null,
      marginRatio: 0.1,
      entryOrderType: 'MARKET',
    })
    localDemoHistoryOrders.value.push({
      orderNo,
      symbol: sym,
      side: payload.side,
      positionSide: payload.positionSide,
      type: 'MARKET',
      price: fillPrice,
      quantity: payload.quantity,
      filledQty: payload.quantity,
      avgFillPrice: fillPrice,
      reduceOnly: false,
      status: 'FILLED',
      createdAt: now,
      updatedAt: now,
    })
    const liqPx =
      lev > 0 && fillPrice > 0
        ? payload.positionSide === 'LONG'
          ? fillPrice * (1 - 0.85 / lev)
          : fillPrice * (1 + 0.85 / lev)
        : null
    localDemoFills.value.push({
      tradeId: `${FUT_DEMO_FILL}${ts}`,
      orderNo,
      price: fillPrice,
      quantity: payload.quantity,
      fee: cs > 0 ? fillPrice * payload.quantity * cs * 0.0004 : 0,
      feeAsset: 'USDT',
      realizedPnl: 0,
      time: now,
      isMaker: false,
      fillKind: 'OPEN',
      symbol: sym,
      orderSide: payload.side,
      positionSide: payload.positionSide,
      leverage: lev,
      orderType: 'MARKET',
      entryPrice: fillPrice,
      marginMode: payload.marginMode,
      liquidationPrice: liqPx,
      roiPct: 0,
    })

    const feeAmt = cs > 0 ? fillPrice * payload.quantity * cs * 0.0004 : 0
    if (feeAmt > 0) {
      localDemoFundingLedger.value.push({
        id: `${FUT_DEMO_LEDGER}${ts}`,
        time: now,
        type: 'FEE',
        amount: -feeAmt,
        asset: 'USDT',
        remark: `开仓成交手续费 · ${sym}`,
      })
    }
    persistLocalDemoToStorage()
  }

  async function bootstrap() {
    if (getAccessToken() && typeof localStorage !== 'undefined') {
      try {
        if (!localStorage.getItem(StorageKeys.DEMO_SCOPE_USER_CODE)) {
          const { useAuthStore } = await import('@/stores/auth')
          await useAuthStore().loadProfile()
        }
      } catch {
        /* ignore */
      }
    }
    loading.value = true
    loadError.value = null
    let mergedOk = false
    try {
      const data = await fetchFuturesTradeBootstrap(symbol.value)
      const sym = symbol.value
      hydrateLocalDemoFromStorage()
      instrument.value = data.instrument
      ticker.value = data.ticker
      depth.value = data.depth
      trades.value = data.trades
      mergeLocalDemoRows(sym, data)
      mergedOk = true
      availableQuote.value = data.wallet.availableQuote
      marginBalance.value = data.wallet.marginBalance
      walletAsset.value = data.wallet.asset

      const levCap = data.instrument.maxLeverage
      if (leverage.value > levCap) leverage.value = levCap

      priceInput.value = data.ticker.markPrice.toFixed(
        data.ticker.markPrice >= 1000 ? 2 : data.ticker.markPrice >= 1 ? 4 : 6,
      )
      qtyInput.value = ''
      quoteQtyInput.value = ''
      tpPriceInput.value = ''
      slPriceInput.value = ''
    } catch {
      loadError.value = '合约数据加载失败，请检查网络后重试'
    } finally {
      loading.value = false
      if (!mergedOk) {
        const serverFunding = fundingLedger.value.filter((r) => !r.id.startsWith(FUT_DEMO_LEDGER))
        fundingLedger.value = [...localDemoFundingLedger.value, ...serverFunding]
      }
    }
  }

  function applyTicker(t: FuturesTickerSnapshot) {
    ticker.value = t
    const m = t.markPrice
    const cs = instrument.value?.contractSizeBase ?? 0
    const sym = symbol.value
    if (!cs || !Number.isFinite(m) || positions.value.length === 0) return
    positions.value = positions.value.map((p) => {
      if (p.symbol !== sym) return p
      const dir = p.side === 'LONG' ? 1 : -1
      const pnl = (m - p.entryPrice) * p.contracts * cs * dir
      return { ...p, markPrice: m, unrealizedPnl: pnl }
    })
  }

  function applyDepth(d: FuturesDepthSnapshot) {
    depth.value = d
  }

  function pushTrade(t: FuturesRecentTrade) {
    trades.value = [t, ...trades.value].slice(0, 48)
  }

  function setPositionSide(ps: FuturesPositionSide) {
    positionSide.value = ps
  }

  function setFormType(t: FuturesOrderType) {
    if (t === 'CONDITIONAL') return
    formType.value = t
  }

  function setLeverage(lev: number) {
    const max = instrument.value?.maxLeverage ?? 125
    leverage.value = Math.min(max, Math.max(1, Math.round(lev)))
  }

  function setMarginMode(m: FuturesMarginMode) {
    marginMode.value = m
  }

  function setChartInterval(iv: typeof chartInterval.value) {
    chartInterval.value = iv
  }

  function setChartMainTab(tab: typeof chartMainTab.value) {
    chartMainTab.value = tab
  }

  function applyQtyPercent(pct: number) {
    const p = Math.min(100, Math.max(0, pct)) / 100
    const max = maxOpenNotionalUsdt.value
    if (Number.isFinite(max) && max > 0) {
      qtyInput.value = (max * p).toFixed(2)
    }
  }

  /** 从表单推导下单方向（仅开仓） */
  function deriveOrderSide(): FuturesOrderSide {
    return positionSide.value === 'LONG' ? 'BUY' : 'SELL'
  }

  async function placeOrder() {
    const app = useAppStore()
    const inst0 = instrument.value
    const maxLev = inst0?.maxLeverage ?? 125
    const mPx = ticker.value?.markPrice ?? 0
    const fields: FuturesOrderFormFields = {
      formIntent: 'OPEN',
      positionSide: positionSide.value,
      formType: formType.value,
      price: priceInput.value,
      quantity: qtyInput.value,
      leverage: leverage.value,
    }
    const ctx = {
      maxLeverage: maxLev,
      contractSizeBase: inst0?.contractSizeBase ?? 0,
      markPrice: mPx,
    }
    const built = tryBuildFuturesPlaceOrderPayload(fields, symbol.value, marginMode.value, ctx)
    if (!built.ok) {
      app.pushToast('error', built.error)
      return
    }
    const payload = built.payload
    const pref = usePreferencesStore()
    if (pref.prefs.confirmFuturesOrder) {
      const inst = instrument.value
      if (!inst) {
        app.pushToast('error', '合约信息未就绪')
        return
      }
      const summary = buildFuturesOrderConfirmSummary(payload, {
        variant: 'perpetual',
        baseAsset: inst.baseAsset,
        quoteAsset: inst.quoteAsset,
        markPrice: ticker.value?.markPrice ?? null,
        contractSizeBase: inst.contractSizeBase,
        orderNotionalUsdt: parseFuturesOrderNum(qtyInput.value) ?? 0,
        tpSlEnabled: tpSlEnabled.value,
        takeProfitPrice: tpPriceInput.value,
        stopLossPrice: slPriceInput.value,
      })
      try {
        await ElMessageBox({
          title: '永续合约下单确认',
          message: h(SpotOrderConfirmBody, { summary, confirmCountdownSec: 0 }),
          showCancelButton: true,
          confirmButtonText: '确认下单',
          cancelButtonText: '取消',
          type: 'warning',
          closeOnClickModal: false,
          distinguishCancelAndClose: true,
          customClass: 'ex-trade-order-confirm-msgbox',
        })
      } catch {
        return
      }
    }
    void (async () => {
      try {
        await placeFuturesOrder(payload)
        appendLocalDemoFromPlaceOrder(payload)
        remergeFromStrippedServerPlusLocal()
        const n = parseFuturesOrderNum(qtyInput.value)
        app.pushOrderSuccessToast(
          `下单成功 · ${payload.side} ${payload.type} ${symbol.value} · ${n != null ? formatPrice(n) : ''} USDT · 永续`,
        )
        await bootstrap()
      } catch {
        app.pushToast('error', '下单失败')
      }
    })()
  }

  async function cancelOrder(orderNo: string) {
    const app = useAppStore()
    if (orderNo.startsWith(FUT_DEMO_ORD)) {
      const o = localDemoOpenOrders.value.find((x) => x.orderNo === orderNo)
      localDemoOpenOrders.value = localDemoOpenOrders.value.filter((x) => x.orderNo !== orderNo)
      if (o) pushLocalDemoOrderToHistoryAsCancelled(o)
      persistLocalDemoToStorage()
      openOrders.value = openOrders.value.filter((x) => x.orderNo !== orderNo)
      refreshHistoryOrdersMerged()
      app.pushToast('success', `已撤单 ${orderNo}`)
      return
    }
    loading.value = true
    try {
      await cancelFuturesOrder(orderNo)
      openOrders.value = openOrders.value.filter((o) => o.orderNo !== orderNo)
      app.pushToast('success', `已撤单 ${orderNo}`)
      void bootstrap()
    } catch {
      app.pushToast('error', '撤单失败')
    } finally {
      loading.value = false
    }
  }

  function cancelAllOrders() {
    const app = useAppStore()
    const sym = symbol.value
    const clearedCount = openOrders.value.length
    const demoForSym = localDemoOpenOrders.value.filter((o) => o.symbol === sym)
    for (const o of demoForSym) {
      pushLocalDemoOrderToHistoryAsCancelled(o)
    }
    localDemoOpenOrders.value = localDemoOpenOrders.value.filter((o) => o.symbol !== sym)
    openOrders.value = []
    persistLocalDemoToStorage()
    refreshHistoryOrdersMerged()
    app.pushToast(
      'info',
      demoForSym.length > 0
        ? `全部撤单 · 已将 ${demoForSym.length} 条演示委托记入历史（已撤销）`
        : `全部撤单占位 · 已清除 ${clearedCount} 条委托`,
    )
  }

  function closePosition(positionId: string) {
    const app = useAppStore()
    if (positionId.startsWith(FUT_DEMO_POS)) {
      localDemoPositions.value = localDemoPositions.value.filter((p) => p.positionId !== positionId)
      persistLocalDemoToStorage()
    }
    positions.value = positions.value.filter((p) => p.positionId !== positionId)
    app.pushToast('info', `市价平仓占位 · DELETE /v1/futures/positions/${positionId}`)
  }

  function reversePosition(positionId: string) {
    const app = useAppStore()
    app.pushToast('warning', `反手占位 · ${positionId}（需原子拆单+对冲）`)
  }

  return {
    symbol,
    loading,
    loadError,
    instrument,
    ticker,
    depth,
    trades,
    positions,
    openOrders,
    historyOrders,
    fills,
    fundingLedger,
    availableQuote,
    marginBalance,
    walletAsset,
    positionSide,
    formType,
    leverage,
    marginMode,
    priceInput,
    qtyInput,
    quoteQtyInput,
    tpSlEnabled,
    tpPriceInput,
    slPriceInput,
    chartInterval,
    chartMainTab,
    baseAsset,
    quoteAsset,
    markPrice,
    maxOpenNotionalUsdt,
    setSymbol,
    bootstrap,
    applyTicker,
    applyDepth,
    pushTrade,
    setPositionSide,
    setFormType,
    setLeverage,
    setMarginMode,
    setChartInterval,
    setChartMainTab,
    applyQtyPercent,
    deriveOrderSide,
    placeOrder,
    cancelOrder,
    cancelAllOrders,
    closePosition,
    reversePosition,
    stripLocalDemoFromUiState,
  }
})
