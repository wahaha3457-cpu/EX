import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  computeConvertQuote,
  CONVERT_ASSET_ORDER,
  CONVERT_FEE_PCT,
  CONVERT_REFERENCE_USDT,
  MIN_CONVERT_USDT_EQ,
  usdtEquivalent,
} from '@/api/convert/flashQuote'
import type {
  ConvertFlashAssetMeta,
  ConvertFlashHistoryItem,
  ConvertFlashQuote,
  ExecuteConvertOptions,
} from '@/types/convertFlash'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

function uid() {
  return `cv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const ASSET_META: ConvertFlashAssetMeta[] = [
  { symbol: 'USDT', name: 'Tether USD', qtyDp: 2 },
  { symbol: 'BTC', name: 'Bitcoin', qtyDp: 8 },
  { symbol: 'ETH', name: 'Ethereum', qtyDp: 6 },
  { symbol: 'BNB', name: 'BNB', qtyDp: 4 },
  { symbol: 'SOL', name: 'Solana', qtyDp: 4 },
  { symbol: 'XRP', name: 'XRP', qtyDp: 2 },
]

/** 与资产中心现货演示余额对齐并补足可兑币种 */
function initialDemoBalances(): Record<string, number> {
  const b: Record<string, number> = {
    USDT: 82_000,
    BTC: 1.1,
    ETH: 24,
    BNB: 42,
    SOL: 180,
    XRP: 12_000,
  }
  return b
}

export const useConvertFlashStore = defineStore('convertFlash', () => {
  const booted = ref(false)
  const fromAsset = ref('BTC')
  const toAsset = ref('USDT')
  const amountFromStr = ref('')
  /** 演示：行情微抖动系数 */
  const priceMultiplier = ref(1)
  const history = ref<ConvertFlashHistoryItem[]>([])
  const balances = ref<Record<string, number>>({})

  const allowedSymbols = new Set<string>(CONVERT_ASSET_ORDER as unknown as string[])
  const assetsMeta = computed(() => ASSET_META.filter((a) => allowedSymbols.has(a.symbol)))

  const refUsdtLive = computed<Record<string, number>>(() => {
    const m = priceMultiplier.value
    const o: Record<string, number> = { USDT: 1 }
    for (const k of CONVERT_ASSET_ORDER) {
      if (k === 'USDT') continue
      o[k] = (CONVERT_REFERENCE_USDT[k] ?? 0) * m
    }
    return o
  })

  const amountFromNum = computed(() => {
    const n = parseFloat(amountFromStr.value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  })

  const quote = computed((): ConvertFlashQuote | null => {
    const q = computeConvertQuote(fromAsset.value, toAsset.value, amountFromNum.value, refUsdtLive.value, CONVERT_FEE_PCT)
    if (!q) return null
    const now = Date.now()
    return {
      ...q,
      generatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 10_000).toISOString(),
    }
  })

  const usdtEq = computed(() => usdtEquivalent(fromAsset.value, amountFromNum.value, refUsdtLive.value))

  const availableFrom = computed(() => balances.value[fromAsset.value] ?? 0)

  const validationError = computed((): string | null => {
    if (fromAsset.value === toAsset.value) return '请选择两种不同的资产'
    if (amountFromNum.value <= 0) return null
    if (amountFromNum.value > availableFrom.value + 1e-12) return '现货可用余额不足'
    if (usdtEq.value < MIN_CONVERT_USDT_EQ) return `单笔折合需 ≥ ${MIN_CONVERT_USDT_EQ} USDT`
    if (!quote.value) return '报价无效，请调整数量'
    return null
  })

  const canPreview = computed(() => amountFromNum.value > 0 && !validationError.value)

  function bootstrap() {
    if (!booted.value) {
      balances.value = { ...initialDemoBalances() }
      booted.value = true
    }
  }

  function randomizeQuoteMultiplier() {
    priceMultiplier.value = 1 + (Math.random() - 0.5) * 0.0012
  }

  function swapAssets() {
    const a = fromAsset.value
    const b = toAsset.value
    fromAsset.value = b
    toAsset.value = a
    amountFromStr.value = ''
  }

  function setMaxFrom() {
    const v = balances.value[fromAsset.value] ?? 0
    amountFromStr.value = String(v)
  }

  function requireAuth(): boolean {
    if (!useAuthStore().isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再进行闪兑')
      return false
    }
    return true
  }

  function executeConvert(opts?: ExecuteConvertOptions): boolean {
    if (!requireAuth()) return false
    const app = useAppStore()
    const q = quote.value
    const err = validationError.value
    if (!q || err) {
      app.pushToast('error', err ?? '无法成交，请检查输入')
      return false
    }
    const from = fromAsset.value
    const to = toAsset.value
    const af = amountFromNum.value
    const bal = balances.value[from] ?? 0
    if (af > bal + 1e-12) {
      app.pushToast('error', '余额不足')
      return false
    }
    const credit = opts?.confirmedAmountTo ?? q.amountTo
    const histUsdt = opts?.snapshotUsdtEq ?? usdtEquivalent(from, af, refUsdtLive.value)
    const row: ConvertFlashHistoryItem = {
      id: uid(),
      time: new Date().toISOString(),
      from,
      to,
      amountFrom: af,
      amountTo: credit,
      usdtEq: histUsdt,
    }
    if (opts?.orderRef) row.orderRef = opts.orderRef
    balances.value = {
      ...balances.value,
      [from]: Math.round((bal - af) * 1e12) / 1e12,
      [to]: Math.round(((balances.value[to] ?? 0) + credit) * 1e12) / 1e12,
    }
    history.value.unshift(row)
    if (history.value.length > 50) history.value.pop()
    amountFromStr.value = ''
    randomizeQuoteMultiplier()
    return true
  }

  function metaOf(symbol: string) {
    return ASSET_META.find((a) => a.symbol === symbol)
  }

  return {
    booted,
    fromAsset,
    toAsset,
    amountFromStr,
    priceMultiplier,
    history,
    balances,
    assetsMeta,
    refUsdtLive,
    amountFromNum,
    quote,
    usdtEq,
    availableFrom,
    validationError,
    canPreview,
    bootstrap,
    randomizeQuoteMultiplier,
    swapAssets,
    setMaxFrom,
    executeConvert,
    metaOf,
  }
})
