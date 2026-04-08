/**
 * 模拟现货：虚拟资金 + 本地委托/成交（localStorage），与真实账户隔离。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  SpotFillRow,
  SpotHistoryOrderRow,
  SpotOpenOrderRow,
  SpotOrderSide,
} from '@/types/spotTrade'
import type { SpotConditionalOrder } from '@/types/spotConditional'
import type { SpotOrderFormFields } from '@/types/spotOrderForm'
import {
  deriveConditionalIntent,
  intentTitleZh,
  shouldTriggerIntent,
} from '@/composables/spot/spotConditionalIntent'
import {
  buildSpotPlaceOrderPayload,
  parseSpotOrderNum,
  validateSpotOrderForm,
} from '@/composables/spot/validateSpotOrderForm'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useAppStore } from '@/stores/app'

const STORAGE_KEY = 'ex-demo-spot-v1'
const ORDER_PREFIX = 'DM-'
const TAKER_FEE = 0.001

export type DemoPersistShape = {
  v: 1
  assets: Record<string, number>
  openOrders: SpotOpenOrderRow[]
  historyOrders: SpotHistoryOrderRow[]
  fills: SpotFillRow[]
  /** 模拟条件限价单（限价止盈止损 Tab） */
  conditionalOrders?: SpotConditionalOrder[]
}

function defaultAssets(): Record<string, number> {
  return {
    USDT: 100_000,
    BTC: 2,
    ETH: 15,
    BNB: 8,
    SOL: 300,
    XRP: 8000,
  }
}

function parsePair(symbol: string): { base: string; quote: string } {
  const [b, q] = symbol.split('_')
  return { base: b || 'BTC', quote: q || 'USDT' }
}

function isoNow() {
  return new Date().toISOString()
}

function nextId(suf: string) {
  return `${ORDER_PREFIX}${Date.now()}-${suf}-${Math.random().toString(36).slice(2, 5)}`
}

export const useDemoTradeStore = defineStore('demoTrade', () => {
  const terminalActive = ref(false)
  const assets = ref<Record<string, number>>({})
  const orderLocks = ref<Record<string, { asset: string; amount: number }>>({})
  const conditionalOrders = ref<SpotConditionalOrder[]>([])

  function loadPersist(): DemoPersistShape {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const j = JSON.parse(raw) as Partial<DemoPersistShape>
        if (j && j.v === 1 && j.assets) {
          return {
            v: 1,
            assets: { ...defaultAssets(), ...j.assets },
            openOrders: Array.isArray(j.openOrders) ? j.openOrders : [],
            historyOrders: Array.isArray(j.historyOrders) ? j.historyOrders : [],
            fills: Array.isArray(j.fills) ? j.fills : [],
            conditionalOrders: Array.isArray(j.conditionalOrders) ? j.conditionalOrders : [],
          }
        }
      }
    } catch {
      /* ignore */
    }
    return {
      v: 1,
      assets: defaultAssets(),
      openOrders: [],
      historyOrders: [],
      fills: [],
      conditionalOrders: [],
    }
  }

  function savePersist(spot: ReturnType<typeof useSpotTradeStore>) {
    const p: DemoPersistShape = {
      v: 1,
      assets: { ...assets.value },
      openOrders: spot.openOrders.filter((o) => o.orderNo.startsWith(ORDER_PREFIX)),
      historyOrders: spot.historyOrders.filter((o) => o.orderNo.startsWith(ORDER_PREFIX)),
      fills: spot.fills.filter((f) => f.orderNo.startsWith(ORDER_PREFIX)),
      conditionalOrders: conditionalOrders.value.filter((c) => c.id.startsWith(ORDER_PREFIX)),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }

  function lockedAmount(asset: string): number {
    let s = 0
    for (const l of Object.values(orderLocks.value)) {
      if (l.asset === asset) s += l.amount
    }
    return s
  }

  function freeBalance(asset: string): number {
    const t = assets.value[asset] ?? 0
    return Math.max(0, t - lockedAmount(asset))
  }

  function syncSpotBalances(spot: ReturnType<typeof useSpotTradeStore>) {
    const { base, quote } = parsePair(spot.symbol)
    spot.baseAvailable = freeBalance(base)
    spot.quoteAvailable = freeBalance(quote)
  }

  function setTerminalActive(on: boolean) {
    terminalActive.value = on
    if (!on) {
      orderLocks.value = {}
    }
  }

  function addLock(orderNo: string, asset: string, amount: number) {
    orderLocks.value[orderNo] = { asset, amount }
  }

  function releaseLock(orderNo: string) {
    delete orderLocks.value[orderNo]
  }

  function pushHistory(spot: ReturnType<typeof useSpotTradeStore>, row: SpotHistoryOrderRow) {
    spot.historyOrders = [row, ...spot.historyOrders].slice(0, 200)
  }

  function pushFill(spot: ReturnType<typeof useSpotTradeStore>, row: SpotFillRow) {
    spot.fills = [row, ...spot.fills].slice(0, 200)
  }

  /** 限价成交结算（不论是否来自盘口） */
  function settleLimitFill(
    spot: ReturnType<typeof useSpotTradeStore>,
    side: SpotOrderSide,
    price: number,
    qty: number,
    orderNo: string,
  ) {
    const { base, quote } = parsePair(spot.symbol)
    const feeQuote = price * qty * TAKER_FEE
    const t = isoNow()

    if (side === 'BUY') {
      const cost = price * qty + feeQuote
      assets.value[quote] = (assets.value[quote] ?? 0) - cost
      assets.value[base] = (assets.value[base] ?? 0) + qty
    } else {
      assets.value[base] = (assets.value[base] ?? 0) - qty
      assets.value[quote] = (assets.value[quote] ?? 0) + (price * qty - feeQuote)
    }

    pushFill(spot, {
      tradeId: nextId('T'),
      orderNo,
      symbol: spot.symbol,
      side,
      orderType: 'LIMIT',
      price,
      quantity: qty,
      quoteAmount: price * qty,
      fee: feeQuote,
      feeCoin: quote,
      time: t,
      isMaker: false,
    })
    pushHistory(spot, {
      orderNo,
      symbol: spot.symbol,
      side,
      type: 'LIMIT',
      price,
      quantity: qty,
      filledQty: qty,
      status: 'FILLED',
      createdAt: t,
      updatedAt: t,
      avgFillPrice: price,
    })
    syncSpotBalances(spot)
    savePersist(spot)
  }

  /** 盘口上的限价单被行情触发 */
  function fillLimitOrder(
    spot: ReturnType<typeof useSpotTradeStore>,
    o: SpotOpenOrderRow,
    fillPrice: number,
  ) {
    const qty = o.quantity - o.filledQty
    if (qty <= 0) return
    const inBook = spot.openOrders.some((x) => x.orderNo === o.orderNo)
    if (inBook) {
      releaseLock(o.orderNo)
      spot.openOrders = spot.openOrders.filter((x) => x.orderNo !== o.orderNo)
    }
    settleLimitFill(spot, o.side, fillPrice, qty, o.orderNo)
    useAppStore().pushOrderSuccessToast(`模拟成交 · ${o.symbol} · ${o.side} · ${fillPrice}`)
  }

  function applyAfterSpotBootstrap() {
    if (!terminalActive.value) return
    const spot = useSpotTradeStore()
    const p = loadPersist()
    assets.value = p.assets
    conditionalOrders.value = p.conditionalOrders ?? []
    orderLocks.value = {}
    for (const o of p.openOrders) {
      if (!o.orderNo.startsWith(ORDER_PREFIX)) continue
      const { base, quote } = parsePair(o.symbol)
      if (o.side === 'BUY' && o.type === 'LIMIT') {
        orderLocks.value[o.orderNo] = { asset: quote, amount: o.price * o.quantity }
      } else if (o.side === 'SELL' && o.type === 'LIMIT') {
        orderLocks.value[o.orderNo] = { asset: base, amount: o.quantity }
      }
    }
    for (const co of conditionalOrders.value) {
      if (co.status !== 'PENDING' || !co.id.startsWith(ORDER_PREFIX)) continue
      const { base, quote } = parsePair(co.symbol)
      if (co.side === 'BUY') {
        orderLocks.value[co.id] = { asset: quote, amount: co.limitPrice * co.quantity }
      } else {
        orderLocks.value[co.id] = { asset: base, amount: co.quantity }
      }
    }
    spot.openOrders = p.openOrders.filter((o) => o.orderNo.startsWith(ORDER_PREFIX))
    spot.historyOrders = p.historyOrders.filter((o) => o.orderNo.startsWith(ORDER_PREFIX))
    spot.fills = p.fills.filter((f) => f.orderNo.startsWith(ORDER_PREFIX))
    syncSpotBalances(spot)
    savePersist(spot)
  }

  /** 落地页展示余额：未进入终端时仅从 localStorage 读取 */
  function peekPersistForHub() {
    assets.value = { ...loadPersist().assets }
  }

  function resetAll() {
    assets.value = defaultAssets()
    orderLocks.value = {}
    conditionalOrders.value = []
    if (terminalActive.value) {
      const spot = useSpotTradeStore()
      spot.openOrders = []
      spot.historyOrders = []
      spot.fills = []
      syncSpotBalances(spot)
      savePersist(spot)
    } else {
      const empty: DemoPersistShape = {
        v: 1,
        assets: { ...defaultAssets() },
        openOrders: [],
        historyOrders: [],
        fills: [],
        conditionalOrders: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty))
    }
    useAppStore().pushToast('success', '模拟资产与委托已重置为初始值')
  }

  /** WS / 轮询 ticker 更新时尝试撮合限价单 */
  function onTickerUpdated() {
    if (!terminalActive.value) return
    const spot = useSpotTradeStore()
    const last = spot.ticker?.lastPrice
    if (last == null || !Number.isFinite(last) || last <= 0) return

    const toFill: SpotOpenOrderRow[] = []
    for (const o of spot.openOrders) {
      if (!o.orderNo.startsWith(ORDER_PREFIX) || o.type !== 'LIMIT') continue
      if (o.symbol !== spot.symbol) continue
      if (o.side === 'BUY' && last <= o.price) toFill.push(o)
      if (o.side === 'SELL' && last >= o.price) toFill.push(o)
    }
    for (const o of toFill) {
      fillLimitOrder(spot, o, o.price)
    }

    const pending = conditionalOrders.value.filter(
      (c) => c.symbol === spot.symbol && c.status === 'PENDING',
    )
    for (const co of pending) {
      if (shouldTriggerIntent(co.intentKind, last, co.triggerPrice)) {
        triggerConditionalOrder(spot, co)
      }
    }
  }

  function triggerConditionalOrder(
    spot: ReturnType<typeof useSpotTradeStore>,
    co: SpotConditionalOrder,
  ) {
    if (co.status !== 'PENDING') return
    releaseLock(co.id)
    const orderNo = placeLimitAsOpen(spot, co.side, co.limitPrice, co.quantity, { silent: true })
    co.status = 'TRIGGERED'
    co.triggeredAt = isoNow()
    co.resultingOrderNo = orderNo
    savePersist(spot)
    useAppStore().pushOrderSuccessToast(`条件单已触发 · 限价委托 ${orderNo}`)
  }

  function manualTriggerConditional(id: string) {
    const spot = useSpotTradeStore()
    const co = conditionalOrders.value.find((c) => c.id === id)
    if (!co || co.status !== 'PENDING') return
    if (co.symbol !== spot.symbol) {
      useAppStore().pushToast('warning', '请切换到该条件单所在交易对后再操作')
      return
    }
    triggerConditionalOrder(spot, co)
  }

  function cancelConditionalOrder(id: string) {
    const spot = useSpotTradeStore()
    const co = conditionalOrders.value.find((c) => c.id === id)
    if (!co || co.status !== 'PENDING') return
    releaseLock(co.id)
    co.status = 'CANCELLED'
    savePersist(spot)
    syncSpotBalances(spot)
    useAppStore().pushToast('info', `已撤销条件单 · ${id}`)
  }

  function pendingConditionalsForSymbol(sym: string) {
    return conditionalOrders.value.filter((c) => c.symbol === sym && c.status === 'PENDING')
  }

  function cancelDemoOrder(orderNo: string) {
    const spot = useSpotTradeStore()
    const o = spot.openOrders.find((x) => x.orderNo === orderNo)
    if (!o || !orderNo.startsWith(ORDER_PREFIX)) return
    releaseLock(orderNo)
    spot.openOrders = spot.openOrders.filter((x) => x.orderNo !== orderNo)
    const t = isoNow()
    pushHistory(spot, {
      ...o,
      status: 'CANCELLED',
      updatedAt: t,
    })
    syncSpotBalances(spot)
    savePersist(spot)
    useAppStore().pushToast('info', `模拟撤单 · ${orderNo}`)
  }

  function cancelAllDemoOrders() {
    const spot = useSpotTradeStore()
    const ids = spot.openOrders.filter((o) => o.orderNo.startsWith(ORDER_PREFIX)).map((o) => o.orderNo)
    for (const id of ids) cancelDemoOrder(id)
  }

  function instantMarketFill(
    spot: ReturnType<typeof useSpotTradeStore>,
    side: SpotOrderSide,
    price: number,
    quoteSpend: number | null,
    qtyBase: number | null,
  ) {
    const { base, quote } = parsePair(spot.symbol)
    const orderNo = nextId('M')
    const t = isoNow()

    if (side === 'BUY' && quoteSpend != null) {
      const fee = quoteSpend * TAKER_FEE
      const net = quoteSpend - fee
      const qBase = net / price
      assets.value[quote] = (assets.value[quote] ?? 0) - quoteSpend
      assets.value[base] = (assets.value[base] ?? 0) + qBase
      pushFill(spot, {
        tradeId: nextId('T'),
        orderNo,
        symbol: spot.symbol,
        side: 'BUY',
        orderType: 'MARKET',
        price,
        quantity: qBase,
        quoteAmount: price * qBase,
        fee,
        feeCoin: quote,
        time: t,
        isMaker: false,
      })
      pushHistory(spot, {
        orderNo,
        symbol: spot.symbol,
        side: 'BUY',
        type: 'MARKET',
        price,
        quantity: qBase,
        filledQty: qBase,
        status: 'FILLED',
        createdAt: t,
        updatedAt: t,
        avgFillPrice: price,
      })
    } else if (side === 'SELL' && qtyBase != null) {
      const quoteGross = qtyBase * price
      const fee = quoteGross * TAKER_FEE
      const net = quoteGross - fee
      assets.value[base] = (assets.value[base] ?? 0) - qtyBase
      assets.value[quote] = (assets.value[quote] ?? 0) + net
      pushFill(spot, {
        tradeId: nextId('T'),
        orderNo,
        symbol: spot.symbol,
        side: 'SELL',
        orderType: 'MARKET',
        price,
        quantity: qtyBase,
        quoteAmount: price * qtyBase,
        fee,
        feeCoin: quote,
        time: t,
        isMaker: false,
      })
      pushHistory(spot, {
        orderNo,
        symbol: spot.symbol,
        side: 'SELL',
        type: 'MARKET',
        price,
        quantity: qtyBase,
        filledQty: qtyBase,
        status: 'FILLED',
        createdAt: t,
        updatedAt: t,
        avgFillPrice: price,
      })
    }
    syncSpotBalances(spot)
    savePersist(spot)
    useAppStore().pushOrderSuccessToast(`模拟市价成交 · ${spot.symbol} · ${side}`)
  }

  function placeLimitAsOpen(
    spot: ReturnType<typeof useSpotTradeStore>,
    side: SpotOrderSide,
    price: number,
    qty: number,
    opts?: { silent?: boolean },
  ): string {
    const { base, quote } = parsePair(spot.symbol)
    const orderNo = nextId('L')
    const t = isoNow()
    if (side === 'BUY') {
      addLock(orderNo, quote, price * qty)
    } else {
      addLock(orderNo, base, qty)
    }
    const row: SpotOpenOrderRow = {
      orderNo,
      symbol: spot.symbol,
      side,
      type: 'LIMIT',
      price,
      quantity: qty,
      filledQty: 0,
      status: 'NEW',
      createdAt: t,
    }
    spot.openOrders = [row, ...spot.openOrders]
    syncSpotBalances(spot)
    savePersist(spot)
    if (!opts?.silent) {
      useAppStore().pushOrderSuccessToast(`模拟限价委托已提交 · ${spot.symbol}`)
    }
    return orderNo
  }

  async function executeSpotPlaceOrderAfterConfirm(): Promise<void> {
    const spot = useSpotTradeStore()
    const app = useAppStore()
    const last = spot.ticker?.lastPrice ?? 0
    if (last <= 0) {
      app.pushToast('error', '暂无有效成交价，请稍候')
      return
    }

    if (spot.formType === 'STOP') {
      const fields: SpotOrderFormFields = {
        side: spot.formSide,
        orderType: 'STOP',
        price: spot.priceInput,
        quantity: spot.qtyInput,
        quoteQty: spot.quoteQtyInput,
        triggerPrice: spot.conditionalTriggerPriceInput,
      }
      const v = validateSpotOrderForm(fields, {
        symbol: spot.symbol,
        baseAvailable: spot.baseAvailable,
        quoteAvailable: spot.quoteAvailable,
        lastPrice: spot.ticker?.lastPrice ?? null,
      })
      if (!v.valid) {
        app.pushToast('error', v.errors[0] ?? '校验失败')
        return
      }
      const trigger = parseSpotOrderNum(fields.triggerPrice ?? '')
      const limit = parseSpotOrderNum(spot.priceInput)
      const qty = parseSpotOrderNum(spot.qtyInput)
      const lp = spot.ticker?.lastPrice ?? null
      const intent = deriveConditionalIntent(spot.formSide, trigger!, lp)
      if (intent == null || trigger == null || limit == null || qty == null) {
        app.pushToast('error', '无法提交条件单，请检查输入与行情')
        return
      }
      const { base, quote } = parsePair(spot.symbol)
      const id = nextId('C')
      const co: SpotConditionalOrder = {
        id,
        symbol: spot.symbol,
        side: spot.formSide,
        triggerPrice: trigger,
        limitPrice: limit,
        quantity: qty,
        intentKind: intent,
        referenceLastAtCreate: lp!,
        status: 'PENDING',
        createdAt: isoNow(),
      }
      conditionalOrders.value = [co, ...conditionalOrders.value].slice(0, 100)
      if (co.side === 'BUY') {
        addLock(co.id, quote, limit * qty)
      } else {
        addLock(co.id, base, qty)
      }
      syncSpotBalances(spot)
      savePersist(spot)
      app.pushOrderSuccessToast(`条件单待触发 · ${intentTitleZh(intent)} · ${spot.symbol}`)
      spot.qtyInput = ''
      return
    }

    const fields: SpotOrderFormFields = {
      side: spot.formSide,
      orderType: spot.formType,
      price: spot.priceInput,
      quantity: spot.qtyInput,
      quoteQty: spot.quoteQtyInput,
      tpSlAttachEnabled:
        spot.formType === 'LIMIT' || spot.formType === 'MARKET'
          ? spot.tpSlAttachEnabled
          : false,
      takeProfitPrice: spot.takeProfitPriceInput,
      stopLossPrice: spot.stopLossPriceInput,
    }
    const v = validateSpotOrderForm(fields, {
      symbol: spot.symbol,
      baseAvailable: spot.baseAvailable,
      quoteAvailable: spot.quoteAvailable,
      lastPrice: spot.ticker?.lastPrice ?? null,
    })
    if (!v.valid) {
      app.pushToast('error', v.errors[0] ?? '校验失败')
      return
    }

    const payload = buildSpotPlaceOrderPayload(
      fields,
      spot.symbol,
      spot.baseAvailable,
      spot.quoteAvailable,
      spot.ticker?.lastPrice ?? null,
    )
    if (!payload) {
      app.pushToast('error', '无法构造订单')
      return
    }

    if (payload.type === 'MARKET') {
      if (payload.side === 'BUY') {
        const spend = payload.quoteQty
        if (spend == null || spend <= 0) return
        instantMarketFill(spot, 'BUY', last, spend, null)
      } else {
        const qty = payload.quantity
        if (qty == null || qty <= 0) return
        instantMarketFill(spot, 'SELL', last, null, qty)
      }
      spot.qtyInput = ''
      spot.quoteQtyInput = ''
      return
    }

    const price = payload.price!
    const qty = payload.quantity!

    if (payload.side === 'BUY') {
      if (last <= price) {
        settleLimitFill(spot, 'BUY', price, qty, nextId('L'))
        useAppStore().pushOrderSuccessToast(`模拟限价即时成交 · ${spot.symbol}`)
      } else {
        placeLimitAsOpen(spot, 'BUY', price, qty)
      }
    } else if (last >= price) {
      settleLimitFill(spot, 'SELL', price, qty, nextId('L'))
      useAppStore().pushOrderSuccessToast(`模拟限价即时成交 · ${spot.symbol}`)
    } else {
      placeLimitAsOpen(spot, 'SELL', price, qty)
    }
    spot.qtyInput = ''
  }

  return {
    terminalActive,
    setTerminalActive,
    applyAfterSpotBootstrap,
    onTickerUpdated,
    resetAll,
    peekPersistForHub,
    executeSpotPlaceOrderAfterConfirm,
    cancelDemoOrder,
    cancelAllDemoOrders,
    assets,
    conditionalOrders,
    pendingConditionalsForSymbol,
    cancelConditionalOrder,
    manualTriggerConditional,
  }
})
