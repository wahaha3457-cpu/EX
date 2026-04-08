import { defineStore } from 'pinia'
import { computed, h, ref } from 'vue'
import { fetchSpotTradeBootstrap } from '@/api/spotTrade'
import { isExchangeSpotApiEnabled, isLegacyAuthMode } from '@/config/env'
import { normalizeSpotTicker } from '@/utils/spot/ticker'
import type {
  SpotDepthSnapshot,
  SpotFillRow,
  SpotHistoryOrderRow,
  SpotOpenOrderRow,
  SpotOrderSide,
  SpotOrderType,
  SpotRecentTrade,
  SpotTickerSnapshot,
} from '@/types/spotTrade'
import type { SpotOrderFormFields } from '@/types/spotOrderForm'
import {
  buildSpotConditionalConfirmSummary,
  buildSpotOrderConfirmSummaryFromPayload,
} from '@/composables/spot/spotOrderConfirmSummary'
import { deriveConditionalIntent } from '@/composables/spot/spotConditionalIntent'
import {
  buildSpotPlaceOrderPayload,
  parseSpotOrderNum,
  validateSpotOrderForm,
} from '@/composables/spot/validateSpotOrderForm'
import { resolveSpotBuyRefPrice } from '@/utils/spot/spotRefPrice'
import SpotOrderConfirmBody from '@/components/business/spot/SpotOrderConfirmBody.vue'
import { useAppStore } from '@/stores/app'
import { usePreferencesStore } from '@/stores/preferences'
import { ElMessageBox } from 'element-plus'

export const useSpotTradeStore = defineStore('spotTrade', () => {
  const symbol = ref('BTC_USDT')
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const ticker = ref<SpotTickerSnapshot | null>(null)
  const depth = ref<SpotDepthSnapshot | null>(null)
  const trades = ref<SpotRecentTrade[]>([])
  const openOrders = ref<SpotOpenOrderRow[]>([])
  const historyOrders = ref<SpotHistoryOrderRow[]>([])
  const fills = ref<SpotFillRow[]>([])

  const baseAsset = computed(() => symbol.value.split('_')[0] || 'BTC')
  const quoteAsset = computed(() => symbol.value.split('_')[1] || 'USDT')

  const baseAvailable = ref(0)
  const quoteAvailable = ref(0)

  const formSide = ref<SpotOrderSide>('BUY')
  const formType = ref<SpotOrderType>('LIMIT')
  const priceInput = ref('')
  const qtyInput = ref('')
  const quoteQtyInput = ref('')

  /**
   * 预留：现货止盈/止损触发价（计价币）。接入下单表单后绑定；
   * 确认弹窗仅在至少一项为有效正数时展示「止盈止损」行。
   */
  const takeProfitPriceInput = ref('')
  const stopLossPriceInput = ref('')
  /** 限价/市价：与合约一致的「止盈止损」勾选，展开止盈/止损价 */
  const tpSlAttachEnabled = ref(false)
  /** 限价止盈止损 Tab：触发价（计价币） */
  const conditionalTriggerPriceInput = ref('')

  const chartInterval = ref<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('15m')

  function setSymbol(s: string) {
    const next = s && s.length > 0 ? s : 'BTC_USDT'
    symbol.value = next
    void bootstrap()
  }

  async function bootstrap() {
    loading.value = true
    loadError.value = null
    try {
      const data = await fetchSpotTradeBootstrap(symbol.value)
      ticker.value = normalizeSpotTicker(data.ticker)
      depth.value = data.depth
      trades.value = data.trades
      openOrders.value = data.openOrders
      historyOrders.value = data.historyOrders
      fills.value = data.fills
      baseAvailable.value = data.balances.baseAvailable
      quoteAvailable.value = data.balances.quoteAvailable
      priceInput.value = data.ticker.lastPrice.toFixed(2)
      qtyInput.value = ''
      quoteQtyInput.value = ''
      const { useDemoTradeStore } = await import('@/stores/demoTrade')
      if (useDemoTradeStore().terminalActive) {
        useDemoTradeStore().applyAfterSpotBootstrap()
      }
    } catch {
      loadError.value = '交易数据加载失败，请检查网络后重试'
    } finally {
      loading.value = false
    }
  }

  function applyTicker(s: SpotTickerSnapshot) {
    ticker.value = normalizeSpotTicker(s)
    void import('@/stores/demoTrade').then(({ useDemoTradeStore }) => {
      useDemoTradeStore().onTickerUpdated()
    })
  }

  function applyDepth(d: SpotDepthSnapshot) {
    depth.value = d
  }

  function pushTrade(t: SpotRecentTrade) {
    trades.value = [t, ...trades.value].slice(0, 40)
  }

  function setFormSide(side: SpotOrderSide) {
    formSide.value = side
  }

  function setFormType(t: SpotOrderType) {
    formType.value = t
  }

  function setChartInterval(iv: typeof chartInterval.value) {
    chartInterval.value = iv
  }

  /** 快捷比例：买入按 USDT 余额；卖出按基础币余额 */
  function applyQtyPercent(pct: number) {
    const p = Math.min(100, Math.max(0, pct)) / 100
    if (formType.value === 'MARKET' && formSide.value === 'BUY') {
      const q = quoteAvailable.value * p
      quoteQtyInput.value = q.toFixed(2)
      const lp = ticker.value?.lastPrice
      if (lp != null && Number.isFinite(lp) && lp > 0) {
        qtyInput.value = (q / lp).toFixed(6)
      } else {
        qtyInput.value = ''
      }
      return
    }
    if (formType.value === 'MARKET' && formSide.value === 'SELL') {
      const qty = baseAvailable.value * p
      qtyInput.value = qty.toFixed(6)
      const lp = ticker.value?.lastPrice
      if (lp != null && Number.isFinite(lp) && lp > 0) {
        quoteQtyInput.value = (qty * lp).toFixed(2)
      } else {
        quoteQtyInput.value = ''
      }
      return
    }
    // 限价 / 条件限价：买入按与面板「可买」相同的参考价；卖出仅按基础币余额
    if (formSide.value === 'BUY') {
      const refPx = resolveSpotBuyRefPrice(
        formType.value === 'STOP' ? 'STOP' : 'LIMIT',
        priceInput.value,
        ticker.value?.lastPrice,
      )
      if (refPx == null || refPx <= 0) return
      const maxQty = quoteAvailable.value / refPx
      qtyInput.value = (maxQty * p).toFixed(6)
      return
    }
    qtyInput.value = (baseAvailable.value * p).toFixed(6)
  }

  async function refreshAssetsCenterAfterSpotTrade() {
    if (!isExchangeSpotApiEnabled()) return
    const { useAssetsCenterStore } = await import('@/stores/assetsCenter')
    await useAssetsCenterStore().bootstrap(true)
  }

  async function placeOrder() {
    const app = useAppStore()
    const fields: SpotOrderFormFields = {
      side: formSide.value,
      orderType: formType.value,
      price: priceInput.value,
      quantity: qtyInput.value,
      quoteQty: quoteQtyInput.value,
      triggerPrice: conditionalTriggerPriceInput.value,
      tpSlAttachEnabled:
        formType.value === 'LIMIT' || formType.value === 'MARKET'
          ? tpSlAttachEnabled.value
          : false,
      takeProfitPrice: takeProfitPriceInput.value,
      stopLossPrice: stopLossPriceInput.value,
    }
    const v = validateSpotOrderForm(fields, {
      symbol: symbol.value,
      baseAvailable: baseAvailable.value,
      quoteAvailable: quoteAvailable.value,
      lastPrice: ticker.value?.lastPrice ?? null,
    })
    if (!v.valid) {
      app.pushToast('error', v.errors[0] ?? '校验失败')
      return
    }

    if (formType.value === 'STOP') {
      const trigger = parseSpotOrderNum(conditionalTriggerPriceInput.value)
      const limit = parseSpotOrderNum(priceInput.value)
      const qty = parseSpotOrderNum(qtyInput.value)
      const lp = ticker.value?.lastPrice ?? null
      const intent = deriveConditionalIntent(formSide.value, trigger!, lp)
      if (intent == null || trigger == null || limit == null || qty == null) {
        app.pushToast('error', '无法识别订单意图，请检查触发价与最新价')
        return
      }
      const pref = usePreferencesStore()
      if (pref.prefs.confirmSpotOrder) {
        const summary = buildSpotConditionalConfirmSummary(
          {
            symbol: symbol.value,
            side: formSide.value,
            triggerPrice: trigger,
            limitPrice: limit,
            quantity: qty,
            intentKind: intent,
            lastPrice: lp,
          },
          baseAsset.value,
          quoteAsset.value,
        )
        try {
          await ElMessageBox({
            title: '条件限价确认',
            message: h(SpotOrderConfirmBody, { summary }),
            showCancelButton: true,
            confirmButtonText: '确认提交',
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
      const { useDemoTradeStore } = await import('@/stores/demoTrade')
      if (useDemoTradeStore().terminalActive) {
        await useDemoTradeStore().executeSpotPlaceOrderAfterConfirm()
        return
      }
      app.pushToast('info', '实盘条件单 API 暂未开放，请开启模拟交易以体验完整流程')
      return
    }

    const payload = buildSpotPlaceOrderPayload(
      fields,
      symbol.value,
      baseAvailable.value,
      quoteAvailable.value,
      ticker.value?.lastPrice ?? null,
    )
    if (!payload) {
      app.pushToast('error', '无法构造下单请求')
      return
    }
    const pref = usePreferencesStore()
    if (pref.prefs.confirmSpotOrder) {
      const summary = buildSpotOrderConfirmSummaryFromPayload(
        payload,
        baseAsset.value,
        quoteAsset.value,
        ticker.value?.lastPrice ?? null,
        {
          takeProfit: tpSlAttachEnabled.value ? takeProfitPriceInput.value : '',
          stopLoss: tpSlAttachEnabled.value ? stopLossPriceInput.value : '',
        },
      )
      try {
        await ElMessageBox({
          title: '现货下单确认',
          message: h(SpotOrderConfirmBody, { summary }),
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
    const { useDemoTradeStore } = await import('@/stores/demoTrade')
    if (useDemoTradeStore().terminalActive) {
      await useDemoTradeStore().executeSpotPlaceOrderAfterConfirm()
      return
    }
    if (isLegacyAuthMode() || isExchangeSpotApiEnabled()) {
      try {
        const { placeSpotOrder } = await import('@/api/trade/orders')
        await placeSpotOrder(payload)
        app.pushOrderSuccessToast(`下单成功 · ${payload.side} ${payload.type} ${symbol.value}`)
        await bootstrap()
        await refreshAssetsCenterAfterSpotTrade()
      } catch (e: unknown) {
        // 业务码错误已在 http 拦截器 toast，避免重复提示
        if (
          e &&
          typeof e === 'object' &&
          'isApiResult' in e &&
          (e as { isApiResult?: boolean }).isApiResult
        ) {
          return
        }
        const msg = e instanceof Error ? e.message : '下单失败'
        app.pushToast('error', msg)
      }
      return
    }
    app.pushOrderSuccessToast(`已提交（演示）· ${payload.side} ${payload.type} ${symbol.value}`)
  }

  /** 撤单：DELETE /api/v1/spot/orders/{orderNo} */
  async function cancelOrder(orderNo: string) {
    if (orderNo.startsWith('DM-')) {
      const { useDemoTradeStore } = await import('@/stores/demoTrade')
      useDemoTradeStore().cancelDemoOrder(orderNo)
      return
    }
    const app = useAppStore()
    if (isLegacyAuthMode() || isExchangeSpotApiEnabled()) {
      try {
        const { cancelSpotOrder } = await import('@/api/trade/orders')
        await cancelSpotOrder(orderNo)
        app.pushToast('success', `撤单成功 · ${orderNo}`)
        await bootstrap()
        await refreshAssetsCenterAfterSpotTrade()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '撤单失败'
        app.pushToast('error', msg)
      }
      return
    }
    openOrders.value = openOrders.value.filter((o) => o.orderNo !== orderNo)
    app.pushToast('success', `撤单请求已提交（占位） · ${orderNo}`)
  }

  /** 全部撤单：DELETE /api/v1/spot/orders?symbol=... */
  async function cancelAllOrders() {
    const { useDemoTradeStore } = await import('@/stores/demoTrade')
    if (useDemoTradeStore().terminalActive) {
      useDemoTradeStore().cancelAllDemoOrders()
      return
    }
    const app = useAppStore()
    if (isExchangeSpotApiEnabled()) {
      try {
        const { cancelAllSpotOrders } = await import('@/api/trade/orders')
        await cancelAllSpotOrders(symbol.value)
        app.pushToast('success', '已提交全部撤单')
        await bootstrap()
        await refreshAssetsCenterAfterSpotTrade()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '全部撤单失败'
        app.pushToast('error', msg)
      }
      return
    }
    const n = openOrders.value.length
    openOrders.value = []
    app.pushToast('info', `全部撤单占位 · 已清除 ${n} 条本地演示委托`)
  }

  return {
    symbol,
    loading,
    loadError,
    ticker,
    depth,
    trades,
    openOrders,
    historyOrders,
    fills,
    baseAsset,
    quoteAsset,
    baseAvailable,
    quoteAvailable,
    formSide,
    formType,
    priceInput,
    qtyInput,
    quoteQtyInput,
    takeProfitPriceInput,
    stopLossPriceInput,
    tpSlAttachEnabled,
    conditionalTriggerPriceInput,
    chartInterval,
    setSymbol,
    bootstrap,
    applyTicker,
    applyDepth,
    pushTrade,
    setFormSide,
    setFormType,
    setChartInterval,
    applyQtyPercent,
    placeOrder,
    cancelOrder,
    cancelAllOrders,
  }
})
