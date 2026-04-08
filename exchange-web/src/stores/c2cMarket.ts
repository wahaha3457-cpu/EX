import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { C2cAd, C2cAppealReason, C2cOrder, C2cOrderStatus, C2cPayMethod } from '@/types/c2c'
import {
  createC2cOrder,
  fetchC2cAds,
  fetchC2cOrders,
  markC2cAppealResolved,
  patchC2cOrderStatus,
  submitC2cAppeal as submitC2cAppealApi,
  withdrawC2cAppeal as withdrawC2cAppealApi,
} from '@/api/c2c/c2cMock'
import { useAppStore } from '@/stores/app'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useAuthStore } from '@/stores/auth'

export type C2cUserTab = 'buy' | 'sell'

/** 仅支持 CNY / USD（与广告数据对齐） */
export const C2C_SUPPORTED_FIATS = ['CNY', 'USD'] as const

function storageUserKey(): string {
  const u = useAuthStore().user?.userCode
  return u && u.length > 0 ? u : '__guest__'
}

export const useC2cMarketStore = defineStore('c2cMarket', () => {
  const ads = ref<C2cAd[]>([])
  const orders = ref<C2cOrder[]>([])
  const loadingAds = ref(false)
  const loadingOrders = ref(false)
  const adsError = ref<string | null>(null)
  const ordersError = ref<string | null>(null)

  const mainTab = ref<C2cUserTab>('buy')
  const fiatFilter = ref('CNY')
  const cryptoFilter = ref('USDT')
  const payFilter = ref<C2cPayMethod | ''>('')

  const filteredAds = computed(() => {
    const side = mainTab.value === 'buy' ? 'MERCHANT_SELLS' : 'MERCHANT_BUYS'
    let list = ads.value.filter(
      (a) =>
        a.listingSide === side && a.fiat === fiatFilter.value && a.crypto === cryptoFilter.value,
    )
    if (payFilter.value) {
      list = list.filter((a) => a.methods.includes(payFilter.value as C2cPayMethod))
    }
    const mul = mainTab.value === 'buy' ? 1 : -1
    return [...list].sort((a, b) => (a.price - b.price) * mul)
  })

  const fiatOptions = computed(() => [...C2C_SUPPORTED_FIATS])

  const cryptoOptions = computed(() => {
    const s = new Set(ads.value.filter((a) => a.fiat === fiatFilter.value).map((a) => a.crypto))
    return [...s].sort()
  })

  async function bootstrapAds(force = false) {
    if (ads.value.length && !force) return
    loadingAds.value = true
    adsError.value = null
    try {
      ads.value = await fetchC2cAds()
      if (!C2C_SUPPORTED_FIATS.includes(fiatFilter.value as (typeof C2C_SUPPORTED_FIATS)[number])) {
        fiatFilter.value = 'CNY'
      }
      syncCryptoFilter()
    } catch {
      adsError.value = '广告列表加载失败'
    } finally {
      loadingAds.value = false
    }
  }

  function syncCryptoFilter() {
    const opts = cryptoOptions.value
    if (!opts.includes(cryptoFilter.value) && opts.length) {
      cryptoFilter.value = opts[0]!
    }
  }

  watch(fiatFilter, () => {
    syncCryptoFilter()
  })

  async function refreshOrders() {
    const key = storageUserKey()
    if (key === '__guest__') {
      orders.value = []
      return
    }
    loadingOrders.value = true
    ordersError.value = null
    try {
      orders.value = await fetchC2cOrders(key)
    } catch {
      ordersError.value = '订单加载失败'
    } finally {
      loadingOrders.value = false
    }
  }

  async function placeOrder(ad: C2cAd, userSide: 'buy' | 'sell', fiatAmount: number) {
    const app = useAppStore()
    const auth = useAuthStore()
    const assets = useAssetsCenterStore()
    if (!auth.isAuthenticated || !auth.user?.userCode) {
      app.pushToast('warning', '请先登录后再下单')
      return null
    }
    if (fiatAmount < ad.minFiat || fiatAmount > ad.maxFiat) {
      app.pushToast('error', `单笔限额 ${ad.minFiat} – ${ad.maxFiat} ${ad.fiat}`)
      return null
    }
    const estCrypto = Math.round((fiatAmount / ad.price) * 1e8) / 1e8
    if (estCrypto > ad.availableCrypto + 1e-8) {
      app.pushToast('error', '对方可售余额不足，请调低金额或换一家')
      return null
    }
    await assets.bootstrap()
    if (!assets.payload) {
      app.pushToast('error', '资产数据未就绪，请稍后重试')
      return null
    }
    if (userSide === 'sell') {
      const ok = assets.c2cSpotFreeze(ad.crypto, estCrypto)
      if (!ok) {
        app.pushToast('error', `现货 ${ad.crypto} 可用不足，无法出售（演示将冻结对应数量）`)
        return null
      }
    }
    try {
      const o = await createC2cOrder(auth.user.userCode, { ad, userSide, fiatAmount })
      orders.value = await fetchC2cOrders(auth.user.userCode)
      if (userSide === 'sell') {
        const row = assets.payload.balances.spot.find((r) => r.asset === ad.crypto)
        assets.pushLedger({
          type: 'OTHER',
          asset: ad.crypto,
          amount: -estCrypto,
          balanceAfter: row?.available ?? null,
          remark: `C2C 卖出冻结 ${estCrypto} ${ad.crypto}（演示）`,
        })
        app.pushToast('success', '订单已创建，已冻结现货，等待买家付款')
      } else {
        app.pushToast('success', '订单已创建，请在时限内完成线下付款')
      }
      return o
    } catch {
      if (userSide === 'sell') {
        assets.c2cSpotUnfreeze(ad.crypto, estCrypto)
      }
      app.pushToast('error', '下单失败，请重试')
      return null
    }
  }

  async function setOrderStatus(orderId: string, status: C2cOrderStatus) {
    const app = useAppStore()
    const auth = useAuthStore()
    const assets = useAssetsCenterStore()
    if (!auth.isAuthenticated || !auth.user?.userCode) return
    const prev = orders.value.find((x) => x.id === orderId)
    try {
      const o = await patchC2cOrderStatus(auth.user.userCode, orderId, status)
      if (!o) {
        app.pushToast('error', '订单不存在')
        return
      }
      orders.value = await fetchC2cOrders(auth.user.userCode)
      await assets.bootstrap()
      if (assets.payload) {
        if (status === 'cancelled' && prev && prev.status !== 'cancelled' && o.userSide === 'sell') {
          assets.c2cSpotUnfreeze(o.crypto, o.cryptoAmount)
          const row = assets.payload.balances.spot.find((r) => r.asset === o.crypto)
          assets.pushLedger({
            type: 'OTHER',
            asset: o.crypto,
            amount: o.cryptoAmount,
            balanceAfter: row?.available ?? null,
            remark: `C2C 卖出取消，冻结退回 ${o.cryptoAmount} ${o.crypto}（演示）`,
          })
        }
        if (
          status === 'completed' &&
          prev &&
          prev.status !== 'completed' &&
          o.userSide === 'buy'
        ) {
          assets.adjustWalletBalance('spot', o.crypto, o.cryptoAmount, o.cryptoAmount)
          const row = assets.payload.balances.spot.find((r) => r.asset === o.crypto)
          assets.pushLedger({
            type: 'OTHER',
            asset: o.crypto,
            amount: o.cryptoAmount,
            balanceAfter: row?.available ?? null,
            remark: `C2C 买入成交到账 ${o.cryptoAmount} ${o.crypto}（演示）`,
          })
        }
        if (
          status === 'completed' &&
          prev &&
          prev.status !== 'completed' &&
          o.userSide === 'sell'
        ) {
          assets.c2cSpotConsumeFrozen(o.crypto, o.cryptoAmount)
          const row = assets.payload.balances.spot.find((r) => r.asset === o.crypto)
          assets.pushLedger({
            type: 'OTHER',
            asset: o.crypto,
            amount: -o.cryptoAmount,
            balanceAfter: row?.available ?? null,
            remark: `C2C 卖出成交划出 ${o.cryptoAmount} ${o.crypto}（演示）`,
          })
        }
      }
      if (status === 'completed') app.pushToast('success', '订单已完成（演示）')
      else if (status === 'cancelled') app.pushToast('info', '订单已取消')
      else if (status === 'pending_release') app.pushToast('success', '已标记付款，等待对方放币')
    } catch {
      app.pushToast('error', '操作失败')
    }
  }

  async function submitAppeal(orderId: string, payload: { reason: C2cAppealReason; detail: string }) {
    const app = useAppStore()
    const auth = useAuthStore()
    if (!auth.isAuthenticated || !auth.user?.userCode) return null
    try {
      const r = await submitC2cAppealApi(auth.user.userCode, orderId, payload)
      if (!r) {
        app.pushToast('error', '提交失败：请确认订单为「待放币」且说明不少于 8 个字')
        return null
      }
      orders.value = await fetchC2cOrders(auth.user.userCode)
      app.pushToast('success', '申诉已提交，可在进度中联系在线客服补充材料')
      return r
    } catch {
      app.pushToast('error', '提交失败')
      return null
    }
  }

  async function withdrawAppeal(orderId: string) {
    const app = useAppStore()
    const auth = useAuthStore()
    if (!auth.isAuthenticated || !auth.user?.userCode) return false
    try {
      const o = await withdrawC2cAppealApi(auth.user.userCode, orderId)
      if (!o) {
        app.pushToast('error', '撤诉失败')
        return false
      }
      orders.value = await fetchC2cOrders(auth.user.userCode)
      app.pushToast('success', '已撤诉，订单回到待放币')
      return true
    } catch {
      app.pushToast('error', '撤诉失败')
      return false
    }
  }

  /** 演示：客服裁定后完结订单（与正常放币/取消共用资产逻辑） */
  async function appealResolveDemo(orderId: string, outcome: 'release' | 'cancel') {
    const app = useAppStore()
    const auth = useAuthStore()
    if (!auth.isAuthenticated || !auth.user?.userCode) return
    const note =
      outcome === 'release'
        ? '客服裁定：放行放币，订单按成交处理（演示）。'
        : '客服裁定：取消订单并按规则处理资金（演示）。'
    try {
      await markC2cAppealResolved(orderId, note)
      await setOrderStatus(orderId, outcome === 'release' ? 'completed' : 'cancelled')
    } catch {
      app.pushToast('error', '操作失败')
    }
  }

  function setFiat(f: string) {
    fiatFilter.value = f
    syncCryptoFilter()
  }

  /** 快捷买卖：按当前法币、币种与方向选取排序后的最优一条广告（逻辑与列表一致） */
  function pickBestExpressAd(params: {
    userSide: 'buy' | 'sell'
    crypto: string
    pay?: C2cPayMethod | ''
  }): C2cAd | null {
    const listingSide = params.userSide === 'buy' ? 'MERCHANT_SELLS' : 'MERCHANT_BUYS'
    let list = ads.value.filter(
      (a) => a.listingSide === listingSide && a.fiat === fiatFilter.value && a.crypto === params.crypto,
    )
    const pay = params.pay ?? ''
    if (pay) {
      list = list.filter((a) => a.methods.includes(pay as C2cPayMethod))
    }
    const mul = params.userSide === 'buy' ? 1 : -1
    const sorted = [...list].sort((a, b) => (a.price - b.price) * mul)
    return sorted[0] ?? null
  }

  return {
    ads,
    orders,
    loadingAds,
    loadingOrders,
    adsError,
    ordersError,
    mainTab,
    fiatFilter,
    cryptoFilter,
    payFilter,
    filteredAds,
    fiatOptions,
    cryptoOptions,
    bootstrapAds,
    refreshOrders,
    placeOrder,
    setOrderStatus,
    submitAppeal,
    withdrawAppeal,
    appealResolveDemo,
    setFiat,
    syncCryptoFilter,
    pickBestExpressAd,
  }
})
