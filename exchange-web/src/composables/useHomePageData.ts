import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useHomeStore } from '@/stores/home'

/** 首页数据：统一走 Pinia，便于骨架屏与后续 WS 补丁合并。 */
export function useHomePageData() {
  const homeStore = useHomeStore()
  const { loading, overview, error } = storeToRefs(homeStore)

  const data = computed(() => overview.value)

  onMounted(() => {
    if (import.meta.env.DEV) {
      console.debug('[home] mounted → loadOverview()')
    }
    void homeStore.loadOverview()
  })

  if (import.meta.env.DEV) {
    watch(
      [loading, overview, error],
      ([l, o, e]) => {
        console.debug('[home] store', {
          loading: l,
          hasData: !!o,
          error: e,
        })
      },
      { flush: 'post', immediate: true },
    )
  }

  return {
    loading,
    data,
    error,
    reload: () => homeStore.loadOverview(),
  }
}
