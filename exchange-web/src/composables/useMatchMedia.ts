import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 响应式 matchMedia（仅客户端）。用于与 CSS 断点一致的 **少量** 结构分支（如交易页 `v-show`）。
 *
 * **性能**：优先用纯 CSS（grid/flex、`display`、`overflow-x`）实现多端布局，避免为响应式增加大量 JS 分支。
 * 每个实例会注册 1 条 `MediaQueryList` 监听；同一页面避免重复相同 `query`，能用一条 `(max-width: 767px)` 就不用 `useBreakpoint()` 的五条组合。
 */
export function useMatchMedia(query: string) {
  const matches = ref(false)
  let mql: MediaQueryList | null = null

  function sync() {
    if (!mql) return
    matches.value = mql.matches
  }

  function onChange(e: MediaQueryListEvent) {
    matches.value = e.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    sync()
    mql.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', onChange)
  })

  return matches
}
