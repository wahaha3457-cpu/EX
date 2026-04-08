import { computed } from 'vue'
import { useMatchMedia } from '@/composables/useMatchMedia'

/**
 * 与 `src/styles/breakpoints.scss` 对齐的档位（组件级条件渲染可选用）。
 *
 * **性能**：内部使用 5 个 `useMatchMedia`，会注册 5 条媒体查询监听。仅当业务 **必须** 按档（xs…2xl）分支时使用；
 * 若只需「是否手机」一类布尔，请改用单次 `useMatchMedia('(max-width: 767px)')`。
 */
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export function useBreakpoint() {
  const min2xl = useMatchMedia('(min-width: 1536px)')
  const minXl = useMatchMedia('(min-width: 1280px)')
  const minLg = useMatchMedia('(min-width: 1024px)')
  const minMd = useMatchMedia('(min-width: 768px)')
  const minSm = useMatchMedia('(min-width: 480px)')

  const name = computed<BreakpointName>(() => {
    if (min2xl.value) return '2xl'
    if (minXl.value) return 'xl'
    if (minLg.value) return 'lg'
    if (minMd.value) return 'md'
    if (minSm.value) return 'sm'
    return 'xs'
  })

  const isMobile = computed(() => !minMd.value)
  const isTablet = computed(() => minMd.value && !minLg.value)
  const isDesktop = computed(() => minLg.value)

  return {
    name,
    isMobile,
    isTablet,
    isDesktop,
    minSm,
    minMd,
    minLg,
    minXl,
    min2xl,
  }
}
