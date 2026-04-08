<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import type { AssetsRecordTab } from '@/types/assetsCenter'
import AssetsLedgerTable from './AssetsLedgerTable.vue'
import AssetsDepositRecordsTable from './AssetsDepositRecordsTable.vue'
import AssetsWithdrawRecordsTable from './AssetsWithdrawRecordsTable.vue'
import AssetsTransferRecordsTable from './AssetsTransferRecordsTable.vue'

const store = useAssetsCenterStore()
const { activeRecordTab, activeAccountTab } = storeToRefs(store)

const tabs: { key: AssetsRecordTab; label: string }[] = [
  { key: 'ledger', label: '资金流水' },
  { key: 'deposit', label: '充值记录' },
  { key: 'withdraw', label: '提现记录' },
  { key: 'transfer', label: '划转记录' },
]
</script>

<template>
  <section v-if="activeAccountTab === 'nft'" class="asc-rec asc-rec--nft" aria-label="NFT 记录说明">
    <div class="asc-rec__nft-inner">
      <p class="asc-rec__nft-title">NFT 与资金流水</p>
      <p class="asc-rec__nft-desc">
        NFT 购买、拍卖与划转记录集中在
        <RouterLink class="asc-rec__nft-link" :to="{ name: RouteNames.OrdersNft }">订单中心 · NFT 订单</RouterLink>
        ；法币充值提现与现货/合约划转仍见下方「资金流水」等 Tab（切换至总览或其他资金账户即可）。
      </p>
      <div class="asc-rec__nft-actions">
        <RouterLink class="asc-rec__nft-btn" :to="{ name: RouteNames.OrdersNft }">打开 NFT 订单</RouterLink>
        <RouterLink class="asc-rec__nft-btn asc-rec__nft-btn--ghost" :to="{ name: RouteNames.MoreNft }"> NFT 市场 </RouterLink>
      </div>
    </div>
  </section>

  <section v-else class="asc-rec" aria-label="资金记录">
    <div v-if="activeAccountTab === 'earn'" class="asc-rec__earn-banner">
      <p class="asc-rec__earn-desc">
        基金、矿机、助力贷、质押借币等明细与历史见
        <RouterLink class="asc-rec__earn-link" :to="{ name: RouteNames.OrdersEarn }">订单中心 · 理财订单</RouterLink>
        ；本区仍为现货/资金账户链上充提与划转记录。
      </p>
    </div>
    <div class="asc-rec__tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        role="tab"
        class="asc-rec__tab"
        :class="{ 'asc-rec__tab--on': activeRecordTab === t.key }"
        :aria-selected="activeRecordTab === t.key"
        @click="store.setRecordTab(t.key)"
      >
        {{ t.label }}
      </button>
    </div>
    <div class="asc-rec__body">
      <AssetsLedgerTable v-show="activeRecordTab === 'ledger'" />
      <AssetsDepositRecordsTable v-show="activeRecordTab === 'deposit'" />
      <AssetsWithdrawRecordsTable v-show="activeRecordTab === 'withdraw'" />
      <AssetsTransferRecordsTable v-show="activeRecordTab === 'transfer'" />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.asc-rec {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-bg-elevated;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.asc-rec__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.asc-rec__tab {
  position: relative;
  padding: $space-3 $space-5;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  cursor: pointer;
}

.asc-rec__tab:hover {
  color: $color-text-secondary;
}

.asc-rec__tab--on {
  color: $color-text-primary;
}

.asc-rec__tab--on::after {
  content: '';
  position: absolute;
  left: $space-4;
  right: $space-4;
  bottom: 0;
  height: 2px;
  border-radius: 1px 1px 0 0;
  background: linear-gradient(90deg, #3084fc, #6aa9ff);
}

.asc-rec__body {
  flex: 1;
  min-height: 0;
}

.asc-rec__earn-banner {
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  background: rgba(14, 203, 129, 0.06);
}

.asc-rec__earn-desc {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.asc-rec__earn-link {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;
}

.asc-rec__earn-link:hover {
  text-decoration: underline;
}

@include mq.media-down(md) {
  .asc-rec__tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .asc-rec__tab {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: $space-3 $space-4;
    min-height: $control-height-lg;
  }
}

.asc-rec--nft {
  padding: $space-4 $space-5;
  background: linear-gradient(
    135deg,
    rgba(130, 71, 229, 0.06) 0%,
    rgba(240, 185, 11, 0.05) 100%
  );
}

.asc-rec__nft-inner {
  max-width: 640px;
}

.asc-rec__nft-title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.asc-rec__nft-desc {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.6;
}

.asc-rec__nft-link {
  color: $color-brand;
  font-weight: $font-weight-semibold;
  text-decoration: none;
}

.asc-rec__nft-link:hover {
  text-decoration: underline;
}

.asc-rec__nft-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.asc-rec__nft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: $radius-md;
  text-decoration: none;
  color: #0b0e11;
  background: var(--ex-brand);
  border: 1px solid rgba(240, 185, 11, 0.55);
}

.asc-rec__nft-btn--ghost {
  color: $color-text-primary;
  background: var(--ex-fill-ghost);
  border-color: $color-border;
}

.asc-rec__nft-btn--ghost:hover {
  border-color: rgba(240, 185, 11, 0.35);
  color: $color-brand;
}
</style>
