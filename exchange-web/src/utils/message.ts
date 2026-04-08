import { useAppStore } from '@/stores/app'
import type { ToastType } from '@/stores/app'

/** 统一消息出口，避免组件直接耦合 store 结构 */
export function showToast(type: ToastType, message: string, duration?: number) {
  useAppStore().pushToast(type, message, duration)
}
