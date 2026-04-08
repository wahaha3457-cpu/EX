import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchHomeOverview } from '@/api/home'
import type { HomeOverviewPayload } from '@/types/home'
import { useAppStore } from '@/stores/app'

/**
 * 首页聚合数据：由 REST 初始化，后续可增量接 WebSocket 推送热门价 / 榜。
 */
export const useHomeStore = defineStore('home', () => {
  const overview = ref<HomeOverviewPayload | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadOverview() {
    loading.value = true
    error.value = null
    try {
      overview.value = await fetchHomeOverview()
    } catch {
      error.value = '数据加载失败'
      useAppStore().pushToast('error', error.value)
    } finally {
      loading.value = false
    }
  }

  function clear() {
    overview.value = null
    error.value = null
  }

  return {
    overview,
    loading,
    error,
    loadOverview,
    clear,
  }
})
