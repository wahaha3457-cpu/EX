import { defineStore } from 'pinia'
import { ref } from 'vue'
import { delistMyNft, fetchMyNft, listMyNft } from '@/api/nft/nftLiteApi'
import type { NftOrder, NftUserHolding } from '@/types/nft'
import { translate } from '@/i18n'

export const useNftUserStore = defineStore('nftUser', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const holdings = ref<NftUserHolding[]>([])
  const orders = ref<NftOrder[]>([])

  async function bootstrap(uid: string) {
    loading.value = true
    loadError.value = null
    try {
      const d = await fetchMyNft(uid)
      holdings.value = d.holdings
      orders.value = d.orders
    } catch {
      loadError.value = translate('nft.error.load')
    } finally {
      loading.value = false
    }
  }

  async function refresh(uid: string) {
    holdings.value = []
    orders.value = []
    await bootstrap(uid)
  }

  async function list(params: { uid: string; itemId: string; priceUsdt: number }) {
    return await listMyNft(params)
  }

  async function delist(params: { uid: string; listingId: string }) {
    return await delistMyNft(params)
  }

  return {
    loading,
    loadError,
    holdings,
    orders,
    bootstrap,
    refresh,
    list,
    delist,
  }
})
