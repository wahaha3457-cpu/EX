<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useWalletOpsStore } from '@/stores/walletOps'

const app = useAppStore()
const wallet = useWalletOpsStore()

function onDeposit() {
  wallet.openDeposit()
}

function onWithdraw() {
  wallet.openWithdraw()
}

function onTransfer() {
  wallet.openTransfer()
}

function onBuyCrypto() {
  app.pushToast('warning', '买币：预留 · 法币/快捷买币入口')
}
</script>

<template>
  <div class="asc-act" aria-label="资产操作">
    <button type="button" class="asc-act__btn asc-act__btn--primary" @click="onDeposit">
      充值
    </button>
    <button type="button" class="asc-act__btn asc-act__btn--primary" @click="onWithdraw">
      提现
    </button>
    <button type="button" class="asc-act__btn asc-act__btn--secondary" @click="onTransfer">
      划转
    </button>
    <button type="button" class="asc-act__btn asc-act__btn--ghost" @click="onBuyCrypto">
      买币
      <span class="asc-act__badge">预留</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.asc-act {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

@include mq.media-down(md) {
  .asc-act {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-2;
    width: 100%;
  }

  .asc-act__btn {
    min-height: $control-height-lg;
    width: 100%;
  }
}

@include mq.media-down(sm) {
  .asc-act {
    grid-template-columns: 1fr 1fr;
  }
}

.asc-act__btn {
  min-height: 36px;
  padding: 0 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border-radius: $radius-md;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.asc-act__btn--primary {
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.asc-act__btn--primary:hover {
  background: var(--ex-brand-hover);
}

.asc-act__btn--secondary {
  color: $color-text-primary;
  background: $color-bg-surface;
  border-color: $color-border-strong;
}

.asc-act__btn--secondary:hover {
  background: $color-bg-hover;
  border-color: $color-text-tertiary;
}

.asc-act__btn--ghost {
  color: $color-text-secondary;
  background: transparent;
  border-color: var(--ex-border-strong);
}

.asc-act__btn--ghost:hover {
  color: $color-text-primary;
  border-color: var(--ex-border-strong);
}

.asc-act__badge {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}
</style>
