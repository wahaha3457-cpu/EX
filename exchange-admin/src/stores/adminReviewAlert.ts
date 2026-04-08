import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AdminReviewAlertPayload {
  id: string
  /** 主标题，缺省用 i18n */
  title?: string
  /** 副标题 / 摘要 */
  subtitle?: string
  /** 跳转路由 name */
  routeName?: string
  query?: Record<string, string>
}

function genId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 后台「待审核订单」右下角提醒：可由 WebSocket / 轮询 / 业务层调用 `show()`。
 */
export const useAdminReviewAlertStore = defineStore('adminReviewAlert', () => {
  const visible = ref(false)
  const payload = ref<AdminReviewAlertPayload | null>(null)
  const queue = ref<AdminReviewAlertPayload[]>([])

  function show(input: Omit<AdminReviewAlertPayload, 'id'> & { id?: string }): string {
    const item: AdminReviewAlertPayload = {
      id: input.id ?? genId(),
      title: input.title,
      subtitle: input.subtitle,
      routeName: input.routeName,
      query: input.query,
    }
    if (visible.value) {
      queue.value.push(item)
      return item.id
    }
    payload.value = item
    visible.value = true
    return item.id
  }

  function dismiss() {
    if (!visible.value) return
    visible.value = false
    window.setTimeout(() => {
      payload.value = null
      const next = queue.value.shift()
      if (next) {
        payload.value = next
        visible.value = true
      }
    }, 360)
  }

  function clearQueue() {
    queue.value = []
  }

  return {
    visible,
    payload,
    queue,
    show,
    dismiss,
    clearQueue,
  }
})
