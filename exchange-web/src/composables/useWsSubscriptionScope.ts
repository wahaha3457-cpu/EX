import { onUnmounted } from 'vue'

/**
 * 组件级 WebSocket 订阅作用域：在 onUnmounted 时统一释放，避免路由切换泄漏。
 *
 * @example
 * ```ts
 * const { onScope } = useWsSubscriptionScope()
 * onScope(() => startSpotTradeRealtime(symbol))
 * ```
 */
export function useWsSubscriptionScope() {
  const cleanups: (() => void)[] = []

  /** 注册一个返回 teardown 的工厂；立即执行并将 teardown 记入作用域 */
  function onScope(factory: () => () => void) {
    cleanups.push(factory())
  }

  onUnmounted(() => {
    while (cleanups.length) {
      const fn = cleanups.pop()
      try {
        fn?.()
      } catch {
        /* noop */
      }
    }
  })

  return { onScope }
}
