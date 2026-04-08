import { watch, onUnmounted, type Ref } from 'vue'

/** 打开遮罩/抽屉时锁定背景滚动（首页顶栏等） */
export function useBodyScrollLock(active: Ref<boolean>): void {
  watch(
    active,
    (on) => {
      document.body.style.overflow = on ? 'hidden' : ''
    },
    { flush: 'sync' },
  )

  onUnmounted(() => {
    document.body.style.overflow = ''
  })
}
