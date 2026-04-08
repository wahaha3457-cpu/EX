<script setup lang="ts">
/** 资产列表：账户 Tab + Pinia → {@link AssetsTableRow} → {@link TradingAssetsTable} */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useWalletOpsStore } from '@/stores/walletOps'
import { TradingAssetsTable } from '@/components/trading'
import { mapBalancesToAssetsTableRows } from '@/composables/assets/mapBalancesToAssetsTableRows'
import AssetsEarnAccountPanel from './AssetsEarnAccountPanel.vue'
import AssetsNftAccountPanel from './AssetsNftAccountPanel.vue'

const store = useAssetsCenterStore()
const wallet = useWalletOpsStore()
const { balanceRows, showMarginColumn, activeAccountTab, loading } = storeToRefs(store)

const rows = computed(() => mapBalancesToAssetsTableRows(balanceRows.value, showMarginColumn.value))

function onDeposit(asset: string) {
  wallet.openDeposit(asset)
}

function onWithdraw(asset: string) {
  wallet.openWithdraw(asset)
}

function onTransfer(asset: string) {
  wallet.openTransfer(asset)
}
</script>

<template>
  <section class="asc-bal" aria-label="资产列表">
    <AssetsNftAccountPanel v-if="activeAccountTab === 'nft'" />

    <div v-else-if="activeAccountTab === 'earn'" class="asc-bal__empty">
      <p class="asc-bal__empty-title">理财账户</p>
      <p class="asc-bal__empty-desc">理财产品、定期/活期接入后在此展示；频道 user.earn.balance</p>
    </div>

    <TradingAssetsTable
      v-else
      :rows="rows"
      :loading="loading"
      :show-margin-column="showMarginColumn"
      toolbar-title="资产列表"
      @deposit="onDeposit"
      @withdraw="onWithdraw"
      @transfer="onTransfer"
    />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.asc-bal {
  min-height: 0;
}

</style>
