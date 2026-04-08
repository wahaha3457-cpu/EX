import { defineStore } from 'pinia'

export interface ConfirmPayload {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  dangerous?: boolean
}

type Resolver = (v: boolean) => void

export const useMobileUiStore = defineStore('mobileUi', {
  state: () => ({
    confirm: null as (ConfirmPayload & { resolve: Resolver }) | null,
  }),
  actions: {
    openConfirm(payload: ConfirmPayload): Promise<boolean> {
      return new Promise((resolve) => {
        this.confirm = {
          ...payload,
          resolve,
        }
      })
    },
    answerConfirm(ok: boolean) {
      const c = this.confirm
      if (c) {
        c.resolve(ok)
        this.confirm = null
      }
    },
  },
})
