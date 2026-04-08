import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  CharityCampaign,
  CharityCategory,
  CharityDonationLedgerEntry,
  CharitySegment,
} from '@/types/charity'
import { fetchCharityHub } from '@/api/charity/charityMock'
import { translate } from '@/i18n'
import { i18n } from '@/i18n'
import { useAppStore } from '@/stores/app'

const ALL = 'ALL' as const

function ledgerId() {
  return `cdl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useCharityHubStore = defineStore('charityHub', () => {
  const segment = ref<CharitySegment>('all')
  const categoryFilter = ref<CharityCategory | typeof ALL>(ALL)
  const searchQuery = ref('')

  const campaigns = ref<CharityCampaign[]>([])
  const stats = ref<{ totalRaisedUsdt: number; totalDonors: number; projectCount: number } | null>(null)
  const loading = ref(false)
  const loadError = ref<string | null>(null)

  const selectedSlug = ref<string | null>(null)

  /** 演示：当前浏览器会话内的捐赠记录（成功捐款时追加） */
  const donationLedger = ref<CharityDonationLedgerEntry[]>([])

  async function bootstrap() {
    if (campaigns.value.length > 0) return
    loading.value = true
    loadError.value = null
    try {
      const d = await fetchCharityHub()
      campaigns.value = d.campaigns
      stats.value = d.stats
    } catch {
      loadError.value = translate('charity.error.load')
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    loading.value = true
    loadError.value = null
    try {
      const d = await fetchCharityHub()
      campaigns.value = d.campaigns
      stats.value = d.stats
    } catch {
      loadError.value = translate('charity.error.load')
    } finally {
      loading.value = false
    }
  }

  function setSegment(s: CharitySegment) {
    segment.value = s
  }

  function setCategory(c: CharityCategory | typeof ALL) {
    categoryFilter.value = c
  }

  function setSearch(q: string) {
    searchQuery.value = q
  }

  function openCampaign(slug: string) {
    selectedSlug.value = slug
  }

  function closeCampaign() {
    selectedSlug.value = null
  }

  const selectedMeta = computed(() => {
    const s = selectedSlug.value
    if (!s) return null
    return campaigns.value.find((c) => c.slug === s) ?? null
  })

  const filteredCampaigns = computed(() => {
    let rows = [...campaigns.value]
    if (segment.value === 'active') rows = rows.filter((x) => x.status === 'ACTIVE')
    if (segment.value === 'completed') rows = rows.filter((x) => x.status === 'COMPLETED')
    if (categoryFilter.value !== ALL) {
      rows = rows.filter((x) => x.category === categoryFilter.value)
    }
    return rows
  })

  /**
   * 演示捐赠入账：更新项目已筹/人次与全局统计，并写入「我的捐赠」流水；不关闭抽屉、不弹成功 Toast。
   * @returns 是否成功
   */
  function mockDonate(slug: string, usdt: number, orderRef: string): boolean {
    const app = useAppStore()
    if (!Number.isFinite(usdt) || usdt <= 0) {
      app.pushToast('error', i18n.global.t('charity.amountInvalid') as string)
      return false
    }
    const c = campaigns.value.find((x) => x.slug === slug)
    if (!c) {
      app.pushToast('error', translate('charity.error.load'))
      return false
    }
    c.raisedUsdt += usdt
    c.donors += 1
    if (stats.value) {
      stats.value.totalRaisedUsdt += usdt
      stats.value.totalDonors += 1
    }
    const refStr = orderRef.trim() || `CH-DN-${Date.now().toString(36).toUpperCase()}`
    donationLedger.value = [
      {
        id: ledgerId(),
        time: new Date().toISOString(),
        slug,
        amountUsdt: usdt,
        orderRef: refStr,
      },
      ...donationLedger.value,
    ]
    return true
  }

  return {
    segment,
    categoryFilter,
    searchQuery,
    campaigns,
    stats,
    loading,
    loadError,
    selectedSlug,
    selectedMeta,
    filteredCampaigns,
    donationLedger,
    bootstrap,
    refresh,
    setSegment,
    setCategory,
    setSearch,
    openCampaign,
    closeCampaign,
    mockDonate,
  }
})
