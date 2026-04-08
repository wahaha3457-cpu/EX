import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NftChain, NftCategory, NftMarketRow, NftSort } from '@/types/nft'
import { buyNft, ensureNftLiteSeed, fetchNftMarketplace } from '@/api/nft/nftLiteApi'
import { getNftImageUrl } from '@/api/nft/nftMock'
import { translate } from '@/i18n'

const ALL = 'ALL' as const

export const useNftMarketStore = defineStore('nftMarket', () => {
  const chainFilter = ref<NftChain | typeof ALL>(ALL)
  const categoryFilter = ref<NftCategory | typeof ALL>(ALL)
  const sort = ref<NftSort>('latest')
  const searchQuery = ref('')

  const rows = ref<NftMarketRow[]>([])

  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const selected = ref<NftMarketRow | null>(null)

  async function bootstrap() {
    loading.value = true
    loadError.value = null
    try {
      await ensureNftLiteSeed()
      const d = await fetchNftMarketplace({ q: searchQuery.value, sort: sort.value })
      rows.value = d.rows
    } catch {
      loadError.value = translate('nft.error.load')
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    loading.value = true
    loadError.value = null
    try {
      const d = await fetchNftMarketplace({ q: searchQuery.value, sort: sort.value })
      rows.value = d.rows
    } catch {
      loadError.value = translate('nft.error.load')
    } finally {
      loading.value = false
    }
  }

  function setChain(c: NftChain | typeof ALL) {
    chainFilter.value = c
  }

  function setCategory(c: NftCategory | typeof ALL) {
    categoryFilter.value = c
  }

  function setSort(s: NftSort) {
    sort.value = s
    void refresh()
  }

  function setSearch(q: string) {
    searchQuery.value = q
  }

  function openRow(r: NftMarketRow) {
    selected.value = r
  }

  function closeItem() {
    selected.value = null
  }

  const filteredRows = computed(() => {
    let out = [...rows.value]
    if (chainFilter.value !== ALL) out = out.filter((x) => x.item.chain === chainFilter.value)
    if (categoryFilter.value !== ALL) out = out.filter((x) => x.item.category === categoryFilter.value)
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (x) =>
          x.item.title.toLowerCase().includes(q) ||
          x.item.collectionName.toLowerCase().includes(q) ||
          x.item.creator.toLowerCase().includes(q),
      )
    }
    return out
  })

  function imageUrl(seed: string) {
    return getNftImageUrl(seed)
  }

  async function buyListing(params: { buyerUid: string; listingId: string }) {
    return await buyNft(params)
  }

  return {
    chainFilter,
    categoryFilter,
    sort,
    searchQuery,
    rows,
    loading,
    loadError,
    selected,
    filteredRows,
    bootstrap,
    refresh,
    setChain,
    setCategory,
    setSort,
    setSearch,
    openRow,
    closeItem,
    imageUrl,
    buyListing,
  }
})
