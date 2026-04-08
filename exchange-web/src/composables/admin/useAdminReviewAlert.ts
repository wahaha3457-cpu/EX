import { useAdminReviewAlertStore, type AdminReviewAlertPayload } from '@/stores/adminReviewAlert'

export type { AdminReviewAlertPayload }

/** 弹出右下角「待审核」AI 提醒（订单/风控等业务可调用） */
export function useAdminReviewAlert() {
  const store = useAdminReviewAlertStore()
  return {
    show: store.show,
    dismiss: store.dismiss,
    clearQueue: store.clearQueue,
  }
}
