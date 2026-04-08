import { defineStore } from 'pinia'
import { ref } from 'vue'

export type WalletModalKind = 'deposit' | 'withdraw' | 'transfer'

/** 资产中心充值/提现/划转弹窗状态（与 {@link useAssetsCenterStore} 配合） */
export const useWalletOpsStore = defineStore('walletOps', () => {
  const active = ref<WalletModalKind | null>(null)
  /** 从列表行点入时预填币种 */
  const prefillAsset = ref<string | null>(null)

  function openDeposit(asset?: string) {
    prefillAsset.value = asset?.trim() || null
    active.value = 'deposit'
  }

  function openWithdraw(asset?: string) {
    prefillAsset.value = asset?.trim() || null
    active.value = 'withdraw'
  }

  function openTransfer(asset?: string) {
    prefillAsset.value = asset?.trim() || null
    active.value = 'transfer'
  }

  function close() {
    active.value = null
    prefillAsset.value = null
  }

  return {
    active,
    prefillAsset,
    openDeposit,
    openWithdraw,
    openTransfer,
    close,
  }
})
