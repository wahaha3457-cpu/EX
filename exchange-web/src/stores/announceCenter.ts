import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ANNOUNCE_CATEGORY_LABEL, fetchAnnounceList } from '@/api/support/announceMock'
import type { AnnounceCategory, AnnounceCenterItem } from '@/types/supportHub'

export type AnnounceFilter = 'ALL' | AnnounceCategory

export const useAnnounceCenterStore = defineStore('announceCenter', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  /** 接口/种子公告 */
  const seedItems = ref<AnnounceCenterItem[]>([])
  /** 前端演示注入（如助力贷审核通过通知），与种子合并展示 */
  const injectedItems = ref<AnnounceCenterItem[]>([])
  const filter = ref<AnnounceFilter>('ALL')

  const items = computed(() => {
    const seen = new Set(injectedItems.value.map((x) => x.id))
    return [...injectedItems.value, ...seedItems.value.filter((x) => !seen.has(x.id))]
  })

  const filtered = computed(() => {
    if (filter.value === 'ALL') return items.value
    return items.value.filter((x) => x.category === filter.value)
  })

  async function bootstrap(force = false) {
    if (seedItems.value.length > 0 && !force) return
    loading.value = true
    loadError.value = null
    try {
      seedItems.value = await fetchAnnounceList()
    } catch {
      loadError.value = '公告列表加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 演示：助力贷等场景推送一条公告（前置展示） */
  function prependInjectedNotice(entry: AnnounceCenterItem) {
    if (injectedItems.value.some((x) => x.id === entry.id)) return
    injectedItems.value = [{ ...entry, pinned: true }, ...injectedItems.value]
  }

  function getById(id: string) {
    return items.value.find((x) => x.id === id) ?? null
  }

  function categoryLabel(c: AnnounceCategory) {
    return ANNOUNCE_CATEGORY_LABEL[c] ?? c
  }

  return {
    loading,
    loadError,
    seedItems,
    injectedItems,
    items,
    filter,
    filtered,
    bootstrap,
    prependInjectedNotice,
    getById,
    categoryLabel,
  }
})
