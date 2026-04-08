import { defineStore } from 'pinia'
import { computed, h, ref } from 'vue'
import { fetchDeliveryTradeBootstrap } from '@/api/delivery'
import {
  DELIVERY_DEFAULT_SYMBOL,
  compactUnderlying,
  normalizeDeliverySymbol,
} from '@/api/delivery/deliverySymbols'
import type {
  FuturesDepthSnapshot,
  FuturesFillRow,
  FuturesFundingLedgerRow,
  FuturesHistoryOrderRow,
  FuturesMarginMode,
  FuturesOpenOrderRow,
  FuturesOrderSide,
  FuturesOrderType,
  FuturesPlaceOrderRequest,
  FuturesPositionRow,
  FuturesPositionSide,
  FuturesRecentTrade,
} from '@/types/futuresTrade'
import type {
  DeliveryInstrumentMeta,
  DeliveryTickerSnapshot,
  DeliveryTradeBootstrap,
} from '@/types/deliveryTrade'
import { useAppStore } from '@/stores/app'
import { usePreferencesStore } from '@/stores/preferences'
import { ElMessageBox } from 'element-plus'
import { buildFuturesOrderConfirmSummary } from '@/composables/futures/futuresOrderConfirmSummary'
import { formatPrice } from '@/utils/format/number'
import {
  parseFuturesOrderNum,
  tryBuildFuturesPlaceOrderPayload,
} from '@/composables/futures/validateFuturesOrderForm'
import { placeFuturesOrder } from '@/api/futuresTradeOrders'
import SpotOrderConfirmBody from '@/components/business/spot/SpotOrderConfirmBody.vue'
import DeliveryRoundClosingDialogBody from '@/components/business/delivery/DeliveryRoundClosingDialogBody.vue'
import type { FuturesOrderFormFields } from '@/types/futuresOrderForm'
import {
  computeRollingDemoDeliveryAt,
  computeUpcomingDeliverySlots,
  DELIVERY_ORDER_BLOCK_LAST_SECONDS,
  orderableSlotDeliveryEndMs,
  secondsRemainingInCurrentOrderableRound,
} from '@/composables/delivery/deliveryCycleUtils'
import { StorageKeys } from '@/constants/storageKeys'
import { getAccessToken } from '@/utils/tokenStorage'
import {
  deliveryDemoStorageKey,
  migrateLegacyDeliveryDemoIfEmpty,
} from '@/utils/tradeDemoLocalPersist'

const EMPTY_FUTURES_DEPTH: FuturesDepthSnapshot = { seq: 0, bids: [], asks: [] }

const UPCOMING_DELIVERY_SLOT_COUNT = 10

/** 本会话内演示下单（API/mock 不落库时合并进底部表格） */
const DLV_DEMO_ORD = 'dlv-demo-ord-'
const DLV_DEMO_POS = 'dlv-demo-pos-'
const DLV_DEMO_FILL = 'dlv-demo-fill-'
const DLV_DEMO_LEDGER = 'dlv-demo-ledger-'

interface DeliveryDemoSessionPayload {
  v: 1
  localDemoOpenOrders: FuturesOpenOrderRow[]
  localDemoPositions: FuturesPositionRow[]
  localDemoHistoryOrders: FuturesHistoryOrderRow[]
  localDemoFills: FuturesFillRow[]
  localDemoFundingLedger: FuturesFundingLedgerRow[]
}

export const useDeliveryTradeStore = defineStore('deliveryTrade', () => {
  const symbol = ref(DELIVERY_DEFAULT_SYMBOL)
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const instrument = ref<DeliveryInstrumentMeta | null>(null)
  const ticker = ref<DeliveryTickerSnapshot | null>(null)
  const depth = ref<FuturesDepthSnapshot | null>(null)
  const trades = ref<FuturesRecentTrade[]>([])
  const positions = ref<FuturesPositionRow[]>([])
  const openOrders = ref<FuturesOpenOrderRow[]>([])
  const historyOrders = ref<FuturesHistoryOrderRow[]>([])
  const fills = ref<FuturesFillRow[]>([])
  const fundingLedger = ref<FuturesFundingLedgerRow[]>([])

  /** 本页下单成功后的本地演示行，bootstrap 时与接口数据合并 */
  const localDemoOpenOrders = ref<FuturesOpenOrderRow[]>([])
  const localDemoPositions = ref<FuturesPositionRow[]>([])
  const localDemoHistoryOrders = ref<FuturesHistoryOrderRow[]>([])
  const localDemoFills = ref<FuturesFillRow[]>([])
  const localDemoFundingLedger = ref<FuturesFundingLedgerRow[]>([])

  const availableQuote = ref(0)
  const marginBalance = ref(0)
  const walletAsset = ref('USDT')

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
  const chartMainTab = ref<'KLINE' | 'DEPTH' | 'DELIVERY_FUNDING'>('KLINE')

  /** 演示交割倒计时：半秒刷新，与 WS 推价解耦 */
  const deliveryClockMs = ref(Date.now())
  let deliveryClockTimer: ReturnType<typeof setInterval> | null = null

  /**
   * 「最近可下单 10 期」弹窗所选档：相对当前 UTC 演示分钟起点的偏移（0=与墙钟对齐的第 1 档）。
   * 仅影响下单区展示码与倒计时；路由 canonical symbol 不变。
   */
  const orderableSlotOffset = ref(0)

  function rebuildFundingLedgerMerged(serverRows: FuturesFundingLedgerRow[]) {
    fundingLedger.value = [...localDemoFundingLedger.value, ...serverRows]
  }

  function persistLocalDemoToStorage() {
    if (typeof localStorage === 'undefined') return
    try {
      const payload: DeliveryDemoSessionPayload = {
        v: 1,
        localDemoOpenOrders: localDemoOpenOrders.value,
        localDemoPositions: localDemoPositions.value,
        localDemoHistoryOrders: localDemoHistoryOrders.value,
        localDemoFills: localDemoFills.value,
        localDemoFundingLedger: localDemoFundingLedger.value,
      }
      localStorage.setItem(deliveryDemoStorageKey(), JSON.stringify(payload))
    } catch {
      /* 配额 / 隐私模式 */
    }
  }

  function hydrateLocalDemoFromStorage() {
    if (typeof localStorage === 'undefined') return
    const key = deliveryDemoStorageKey()
    migrateLegacyDeliveryDemoIfEmpty(key)
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const p = JSON.parse(raw) as Partial<DeliveryDemoSessionPayload>
      if (p.v !== 1) return
      if (Array.isArray(p.localDemoOpenOrders)) localDemoOpenOrders.value = p.localDemoOpenOrders
      if (Array.isArray(p.localDemoPositions)) localDemoPositions.value = p.localDemoPositions
      if (Array.isArray(p.localDemoHistoryOrders)) localDemoHistoryOrders.value = p.localDemoHistoryOrders
      if (Array.isArray(p.localDemoFills)) localDemoFills.value = p.localDemoFills
      if (Array.isArray(p.localDemoFundingLedger)) localDemoFundingLedger.value = p.localDemoFundingLedger
    } catch {
      /* 损坏则忽略 */
    }
  }

  /** 登出时清掉内存中的演示行，避免串到下一账号；持久化仍按用户 key 保留 */
  function stripLocalDemoFromUiState() {
    localDemoOpenOrders.value = []
    localDemoPositions.value = []
    localDemoHistoryOrders.value = []
    localDemoFills.value = []
    localDemoFundingLedger.value = []
    openOrders.value = openOrders.value.filter((o) => !o.orderNo.startsWith(DLV_DEMO_ORD))
    positions.value = positions.value.filter((p) => !p.positionId.startsWith(DLV_DEMO_POS))
    historyOrders.value = historyOrders.value.filter((h) => !h.orderNo.startsWith(DLV_DEMO_ORD))
    fills.value = fills.value.filter((f) => !f.tradeId.startsWith(DLV_DEMO_FILL))
    fundingLedger.value = fundingLedger.value.filter((r) => !r.id.startsWith(DLV_DEMO_LEDGER))
  }

  function pruneExpiredDeliveryPositions(nowMs: number) {
    const app = useAppStore()
    const isExpired = (p: FuturesPositionRow) =>
      p.deliverySettlesAtMs != null && p.deliverySettlesAtMs <= nowMs

    const expired = positions.value.filter(isExpired)
    for (const p of expired) {
      localDemoFundingLedger.value.push({
        id: `${DLV_DEMO_LEDGER}settle-${p.positionId}-${nowMs}`,
        time: new Date().toISOString(),
        type: 'REALIZED_PNL',
        amount: Number.isFinite(p.unrealizedPnl) ? p.unrealizedPnl : 0,
        asset: walletAsset.value,
        remark: `交割到期结算（演示）· ${p.symbol}`,
      })
    }

    localDemoPositions.value = localDemoPositions.value.filter((p) => !isExpired(p))

    const before = positions.value.length
    positions.value = positions.value.filter((p) => !isExpired(p))
    const removed = before - positions.value.length
    if (removed > 0) {
      app.pushToast('info', `演示：${removed} 个持仓已到期交割结算`)
      const serverFunding = fundingLedger.value.filter((r) => !r.id.startsWith(DLV_DEMO_LEDGER))
      rebuildFundingLedgerMerged(serverFunding)
    }
    if (expired.length > 0) {
      persistLocalDemoToStorage()
    }
  }

  function ensureDeliveryClock() {
    if (deliveryClockTimer != null || typeof window === 'undefined') return
    deliveryClockTimer = window.setInterval(() => {
      const now = Date.now()
      deliveryClockMs.value = now
      pruneExpiredDeliveryPositions(now)
    }, 500)
  }

  /** 最近可下单交割档（演示时间轴；下单区不再展示横向选择，交割时刻与路由 symbol 对齐） */
  const upcomingDeliverySlots = computed(() =>
    computeUpcomingDeliverySlots(
      compactUnderlying(symbol.value),
      deliveryClockMs.value,
      UPCOMING_DELIVERY_SLOT_COUNT,
    ),
  )

  /** 当前路由合约在「最近 N 档」时间轴中的位置，用于「最近第 k 档」文案 */
  const currentUpcomingDeliverySlot = computed(() => {
    const slots = upcomingDeliverySlots.value
    if (!slots.length) return null
    const idx = slots.findIndex((s) => s.symbol === symbol.value)
    if (idx < 0) return null
    return slots[idx]
  })

  const rollingDeliveryAtIso = computed(() => {
    const slots = upcomingDeliverySlots.value
    if (!slots.length) return computeRollingDemoDeliveryAt(symbol.value, deliveryClockMs.value)
    const hit = currentUpcomingDeliverySlot.value
    if (hit) return hit.deliveryAtIso
    return computeRollingDemoDeliveryAt(symbol.value, deliveryClockMs.value)
  })

  const baseAsset = computed(() => instrument.value?.baseAsset ?? 'BTC')
  const quoteAsset = computed(() => instrument.value?.quoteAsset ?? 'USDT')

  const markPrice = computed(() => ticker.value?.markPrice ?? 0)

  const maxOpenNotionalUsdt = computed(() => {
    if (leverage.value <= 0) return 0
    return availableQuote.value * leverage.value
  })

  function setSymbol(s: string) {
    symbol.value = normalizeDeliverySymbol(s)
    orderableSlotOffset.value = 0
    void bootstrap()
  }

  function setOrderableSlotOffset(i: number) {
    const n = Math.round(i)
    orderableSlotOffset.value = Math.min(9, Math.max(0, n))
  }

  function mergeLocalDemoRows(sym: string, data: DeliveryTradeBootstrap) {
    positions.value = [...data.positions, ...localDemoPositions.value.filter((p) => p.symbol === sym)]
    openOrders.value = [...data.openOrders, ...localDemoOpenOrders.value.filter((o) => o.symbol === sym)]
    historyOrders.value = [
      ...data.historyOrders,
      ...localDemoHistoryOrders.value.filter((h) => h.symbol === sym),
    ]
    fills.value = [...data.fills, ...localDemoFills.value]
    rebuildFundingLedgerMerged(data.fundingLedger)
  }

  /** 演示撤单：记入历史委托（已撤销） */
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

  function refreshHistoryOrdersMerged() {
    const sym = symbol.value
    const fromServer = historyOrders.value.filter((h) => !h.orderNo.startsWith(DLV_DEMO_ORD))
    historyOrders.value = [
      ...fromServer,
      ...localDemoHistoryOrders.value.filter((h) => h.symbol === sym),
    ]
  }

  /** 仅把本会话演示持仓按当前路由 symbol 铺回列表（不依赖 depth / bootstrap 是否成功） */
  function applyLocalDemoPositionsToView() {
    const sym = symbol.value
    const serverOnly = positions.value.filter((p) => !p.positionId.startsWith(DLV_DEMO_POS))
    const localForSym = localDemoPositions.value.filter((p) => p.symbol === sym)
    positions.value = [...serverOnly, ...localForSym]
  }

  /**
   * 不依赖 bootstrap 成功：从当前列表去掉本会话演示行，再与 localDemo* 合并。
   * 避免「下单成功但拉取失败 / 全页 loading 遮挡」时底部表一直为空。
   */
  function remergeFromStrippedServerPlusLocal() {
    const sym = symbol.value
    const inst = instrument.value
    const tick = ticker.value
    if (!inst || !tick) {
      applyLocalDemoPositionsToView()
      return
    }

    const dep = depth.value ?? EMPTY_FUTURES_DEPTH

    const stripped: DeliveryTradeBootstrap = {
      instrument: inst,
      ticker: tick,
      depth: dep,
      trades: trades.value,
      positions: positions.value.filter((p) => !p.positionId.startsWith(DLV_DEMO_POS)),
      openOrders: openOrders.value.filter((o) => !o.orderNo.startsWith(DLV_DEMO_ORD)),
      historyOrders: historyOrders.value.filter((h) => !h.orderNo.startsWith(DLV_DEMO_ORD)),
      fills: fills.value.filter((f) => !f.tradeId.startsWith(DLV_DEMO_FILL)),
      fundingLedger: fundingLedger.value.filter((r) => !r.id.startsWith(DLV_DEMO_LEDGER)),
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

    const fillPrice =
      payload.type === 'LIMIT' && payload.price != null
        ? payload.price
        : mPx > 0
          ? mPx
          : (payload.price ?? 0)
    const orderNo = `${DLV_DEMO_ORD}${ts}`
    const lev = payload.leverage
    const notional = cs > 0 && fillPrice > 0 ? fillPrice * payload.quantity * cs : 0
    const isoMargin = lev > 0 ? notional / lev : notional

    localDemoPositions.value.push({
      positionId: `${DLV_DEMO_POS}${ts}`,
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
      deliverySettlesAtMs: Math.max(
        orderableSlotDeliveryEndMs(ts, orderableSlotOffset.value),
        ts + 2_000,
      ),
    })
    applyLocalDemoPositionsToView()
    localDemoHistoryOrders.value.push({
      orderNo,
      symbol: sym,
      side: payload.side,
      positionSide: payload.positionSide,
      type: payload.type,
      price: fillPrice,
      quantity: payload.quantity,
      filledQty: payload.quantity,
      avgFillPrice: fillPrice,
      reduceOnly: false,
      status: 'FILLED',
      createdAt: now,
      updatedAt: now,
    })
    localDemoFills.value.push({
      tradeId: `${DLV_DEMO_FILL}${ts}`,
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
      orderType: payload.type,
    })

    const feeAmt = cs > 0 ? fillPrice * payload.quantity * cs * 0.0004 : 0
    if (feeAmt > 0) {
      localDemoFundingLedger.value.push({
        id: `${DLV_DEMO_LEDGER}${ts}`,
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
      const data = await fetchDeliveryTradeBootstrap(symbol.value)
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
      ensureDeliveryClock()
    } catch {
      loadError.value = '交割合约数据加载失败，请检查网络后重试'
    } finally {
      loading.value = false
      applyLocalDemoPositionsToView()
      if (!mergedOk) {
        const serverFunding = fundingLedger.value.filter((r) => !r.id.startsWith(DLV_DEMO_LEDGER))
        rebuildFundingLedgerMerged(serverFunding)
      }
    }
  }

  function applyTicker(t: DeliveryTickerSnapshot) {
    ensureDeliveryClock()
    ticker.value = {
      ...t,
      deliveryTime: rollingDeliveryAtIso.value,
    }
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
    const max = instrument.value?.maxLeverage ?? 75
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

  function deriveOrderSide(): FuturesOrderSide {
    return positionSide.value === 'LONG' ? 'BUY' : 'SELL'
  }

  /** 轮末截单前不可交易（与下单共用提示） */
  async function assertDeliveryTradingWindowOpen(): Promise<boolean> {
    const roundLeftSec = secondsRemainingInCurrentOrderableRound(Date.now(), orderableSlotOffset.value)
    if (roundLeftSec > DELIVERY_ORDER_BLOCK_LAST_SECONDS) return true
    try {
      await ElMessageBox({
        title: ' ',
        message: h(DeliveryRoundClosingDialogBody),
        confirmButtonText: '知道了',
        showCancelButton: false,
        showClose: true,
        closeOnClickModal: true,
        distinguishCancelAndClose: true,
        customClass: 'ex-delivery-round-closing-box',
      })
    } catch {
      /* 用户关闭 */
    }
    return false
  }

  /**
   * 演示反手：市价平掉当前仓（按标记价结算盈亏）+ 同业等量反向开仓；不写真实 API。
   */
  function appendLocalDemoReverse(prev: FuturesPositionRow, closedPositionId: string) {
    const inst = instrument.value
    const mPx = ticker.value?.markPrice ?? 0
    const cs = inst?.contractSizeBase ?? 0
    const sym = prev.symbol
    const ts = Date.now()
    const nowIso = new Date(ts).toISOString()
    const fillPrice = mPx > 0 ? mPx : prev.entryPrice
    const dirClose = prev.side === 'LONG' ? 1 : -1
    const realized = Number.isFinite(fillPrice) && cs > 0 ? (fillPrice - prev.entryPrice) * prev.contracts * cs * dirClose : 0
    const lev = prev.leverage
    const mm = prev.marginMode
    const newPs: FuturesPositionSide = prev.side === 'LONG' ? 'SHORT' : 'LONG'
    const closeOrderSide: FuturesOrderSide = prev.side === 'LONG' ? 'SELL' : 'BUY'
    const openOrderSide: FuturesOrderSide = prev.side === 'LONG' ? 'BUY' : 'SELL'

    const closeOrderNo = `${DLV_DEMO_ORD}rv-c-${ts}`
    const openOrderNo = `${DLV_DEMO_ORD}rv-o-${ts}`

    localDemoFundingLedger.value.push({
      id: `${DLV_DEMO_LEDGER}rv-pnl-${ts}`,
      time: nowIso,
      type: 'REALIZED_PNL',
      amount: realized,
      asset: walletAsset.value,
      remark: `反手·平${prev.side === 'LONG' ? '多' : '空'}盈亏（演示）· ${sym}`,
    })

    const feeClose = cs > 0 ? fillPrice * prev.contracts * cs * 0.0004 : 0
    const feeOpen = feeClose
    if (feeClose > 0) {
      localDemoFundingLedger.value.push({
        id: `${DLV_DEMO_LEDGER}rv-fee-c-${ts}`,
        time: nowIso,
        type: 'FEE',
        amount: -feeClose,
        asset: 'USDT',
        remark: `反手·平仓手续费（演示）`,
      })
    }
    if (feeOpen > 0) {
      localDemoFundingLedger.value.push({
        id: `${DLV_DEMO_LEDGER}rv-fee-o-${ts}`,
        time: nowIso,
        type: 'FEE',
        amount: -feeOpen,
        asset: 'USDT',
        remark: `反手·开仓手续费（演示）`,
      })
    }

    localDemoHistoryOrders.value.push(
      {
        orderNo: closeOrderNo,
        symbol: sym,
        side: closeOrderSide,
        positionSide: prev.side,
        type: 'MARKET',
        price: fillPrice,
        quantity: prev.contracts,
        filledQty: prev.contracts,
        avgFillPrice: fillPrice,
        reduceOnly: true,
        status: 'FILLED',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        orderNo: openOrderNo,
        symbol: sym,
        side: openOrderSide,
        positionSide: newPs,
        type: 'MARKET',
        price: fillPrice,
        quantity: prev.contracts,
        filledQty: prev.contracts,
        avgFillPrice: fillPrice,
        reduceOnly: false,
        status: 'FILLED',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    )

    localDemoFills.value.push(
      {
        tradeId: `${DLV_DEMO_FILL}rv-c-${ts}`,
        orderNo: closeOrderNo,
        price: fillPrice,
        quantity: prev.contracts,
        fee: feeClose,
        feeAsset: 'USDT',
        realizedPnl: realized,
        time: nowIso,
        isMaker: false,
        fillKind: 'CLOSE',
        symbol: sym,
        orderSide: closeOrderSide,
        positionSide: prev.side,
        leverage: lev,
        orderType: 'MARKET',
      },
      {
        tradeId: `${DLV_DEMO_FILL}rv-o-${ts}`,
        orderNo: openOrderNo,
        price: fillPrice,
        quantity: prev.contracts,
        fee: feeOpen,
        feeAsset: 'USDT',
        realizedPnl: 0,
        time: nowIso,
        isMaker: false,
        fillKind: 'OPEN',
        symbol: sym,
        orderSide: openOrderSide,
        positionSide: newPs,
        leverage: lev,
        orderType: 'MARKET',
      },
    )

    if (closedPositionId.startsWith(DLV_DEMO_POS)) {
      localDemoPositions.value = localDemoPositions.value.filter((p) => p.positionId !== closedPositionId)
    }

    const notional = cs > 0 && fillPrice > 0 ? fillPrice * prev.contracts * cs : 0
    const isoMargin = lev > 0 ? notional / lev : notional
    localDemoPositions.value.push({
      positionId: `${DLV_DEMO_POS}rv-${ts}`,
      symbol: sym,
      side: newPs,
      contracts: prev.contracts,
      entryPrice: fillPrice,
      markPrice: mPx || fillPrice,
      leverage: lev,
      marginMode: mm,
      isolatedMargin: isoMargin,
      unrealizedPnl: 0,
      liquidationPrice:
        lev > 0 && fillPrice > 0
          ? newPs === 'LONG'
            ? fillPrice * (1 - 0.85 / lev)
            : fillPrice * (1 + 0.85 / lev)
          : null,
      marginRatio: 0.1,
      deliverySettlesAtMs: Math.max(orderableSlotDeliveryEndMs(ts, orderableSlotOffset.value), ts + 2_000),
    })

    persistLocalDemoToStorage()
  }

  async function placeOrder() {
    const app = useAppStore()
    const inst0 = instrument.value
    const maxLev = inst0?.maxLeverage ?? 75
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
    if (!(await assertDeliveryTradingWindowOpen())) return
    const pref = usePreferencesStore()
    if (pref.prefs.confirmFuturesOrder) {
      const inst = instrument.value
      if (!inst) {
        app.pushToast('error', '合约信息未就绪')
        return
      }
      const summary = buildFuturesOrderConfirmSummary(payload, {
        variant: 'delivery',
        baseAsset: inst.baseAsset,
        quoteAsset: inst.quoteAsset,
        markPrice: ticker.value?.markPrice ?? null,
        contractSizeBase: inst.contractSizeBase,
        orderNotionalUsdt: parseFuturesOrderNum(qtyInput.value) ?? 0,
        tpSlEnabled: tpSlEnabled.value,
        takeProfitPrice: tpPriceInput.value,
        stopLossPrice: slPriceInput.value,
        deliveryConfirmLive: true,
      })
      try {
        await ElMessageBox({
          title: '交割合约下单确认',
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
          `下单成功 · ${payload.side} ${payload.type} ${symbol.value} · ${n != null ? formatPrice(n) : ''} USDT · 交割`,
        )
        qtyInput.value = ''
        quoteQtyInput.value = ''
        tpPriceInput.value = ''
        slPriceInput.value = ''
        const tick = ticker.value
        const inst0 = instrument.value
        if (tick && inst0) {
          priceInput.value = tick.markPrice.toFixed(
            tick.markPrice >= 1000 ? 2 : tick.markPrice >= 1 ? 4 : 6,
          )
        }
      } catch {
        app.pushToast('error', '下单失败')
      }
    })()
  }

  function cancelOrder(orderNo: string) {
    const app = useAppStore()
    if (orderNo.startsWith(DLV_DEMO_ORD)) {
      const o = localDemoOpenOrders.value.find((x) => x.orderNo === orderNo)
      localDemoOpenOrders.value = localDemoOpenOrders.value.filter((x) => x.orderNo !== orderNo)
      if (o) pushLocalDemoOrderToHistoryAsCancelled(o)
      persistLocalDemoToStorage()
      refreshHistoryOrdersMerged()
    }
    openOrders.value = openOrders.value.filter((o) => o.orderNo !== orderNo)
    app.pushToast('success', `撤单占位 · ${orderNo}`)
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
    if (positionId.startsWith(DLV_DEMO_POS)) {
      localDemoPositions.value = localDemoPositions.value.filter((p) => p.positionId !== positionId)
      persistLocalDemoToStorage()
    }
    positions.value = positions.value.filter((p) => p.positionId !== positionId)
    app.pushToast('info', `交割平仓占位 · ${positionId}`)
  }

  async function reversePosition(positionId: string) {
    const app = useAppStore()
    const prev = positions.value.find((p) => p.positionId === positionId)
    if (!prev) {
      app.pushToast('error', '未找到该持仓')
      return
    }
    if (prev.symbol !== symbol.value) {
      app.pushToast('warning', '请先切换到该持仓所在合约再反手')
      return
    }
    if (!(await assertDeliveryTradingWindowOpen())) return

    const newSideLabel = prev.side === 'LONG' ? '空' : '多'
    try {
      await ElMessageBox.confirm(
        `将以市价平掉当前${prev.side === 'LONG' ? '多' : '空'}仓，并立即开等量${newSideLabel}仓（演示：一次结算并挂单记账）。`,
        '交割 · 反手确认',
        {
          confirmButtonText: '确认反手',
          cancelButtonText: '取消',
          type: 'warning',
          closeOnClickModal: false,
          distinguishCancelAndClose: true,
          customClass: 'ex-delivery-reverse-confirm-msgbox',
        },
      )
    } catch {
      return
    }

    positions.value = positions.value.filter((p) => p.positionId !== positionId)
    appendLocalDemoReverse(prev, positionId)
    remergeFromStrippedServerPlusLocal()

    positionSide.value = prev.side === 'LONG' ? 'SHORT' : 'LONG'
    app.pushOrderSuccessToast(
      `反手成功（演示）· 已平${prev.side === 'LONG' ? '多' : '空'}并开${newSideLabel} · ${prev.symbol}`,
    )
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
    deliveryClockMs,
    orderableSlotOffset,
    upcomingDeliverySlots,
    currentUpcomingDeliverySlot,
    rollingDeliveryAtIso,
    baseAsset,
    quoteAsset,
    markPrice,
    maxOpenNotionalUsdt,
    setSymbol,
    setOrderableSlotOffset,
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
