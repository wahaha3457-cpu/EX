<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import type { AssetsAccountTab, AssetsRecordTab } from '@/types/assetsCenter'
import {
  AssetsOverviewCard,
  AssetsAccountTabs,
  AssetsActionBar,
  AssetsBalanceTable,
  AssetsRecordsPanel,
} from '@/components/business/assets'
import { WalletDepositModal, WalletWithdrawModal, WalletTransferModal } from '@/components/business/wallet'
import ExPageState from '@/components/common/ExPageState.vue'
import { useWalletOpsStore } from '@/stores/walletOps'

const route = useRoute()
const router = useRouter()
const inHub = computed(() => route.path.startsWith('/account/'))
const store = useAssetsCenterStore()
const wallet = useWalletOpsStore()
const { loading, loadError, payload } = storeToRefs(store)

const ACCOUNT_TABS: AssetsAccountTab[] = ['overview', 'spot', 'futures', 'funding', 'earn', 'nft']
const RECORD_TABS: AssetsRecordTab[] = ['ledger', 'deposit', 'withdraw', 'transfer']

function syncQueryToStore() {
  const acc = route.query.account
  if (typeof acc === 'string' && ACCOUNT_TABS.includes(acc as AssetsAccountTab)) {
    store.setAccountTab(acc as AssetsAccountTab)
  }
  const rec = route.query.record
  if (typeof rec === 'string' && RECORD_TABS.includes(rec as AssetsRecordTab)) {
    store.setRecordTab(rec as AssetsRecordTab)
  }
}

onMounted(() => {
  void store.bootstrap().then(() => syncQueryToStore())
})

watch(
  () => [route.query.account, route.query.record],
  () => syncQueryToStore(),
)

watch(
  () => route.query.action,
  (a) => {
    const s = typeof a === 'string' ? a : Array.isArray(a) ? a[0] : ''
    if (s !== 'deposit' && s !== 'withdraw' && s !== 'transfer') return
    if (s === 'deposit') wallet.openDeposit()
    if (s === 'withdraw') wallet.openWithdraw()
    if (s === 'transfer') wallet.openTransfer()
    const q = { ...route.query }
    delete q.action
    void router.replace({ query: q })
  },
  { immediate: true },
)
</script>

<template>
  <div class="asc-page">
    <header class="asc-page__header">
      <div class="asc-page__headline">
        <h1 class="asc-page__title">资产中心</h1>
        <p class="asc-page__subtitle">账户资产一览（含 NFT）· 充值提现与划转 · 流水与记录</p>
      </div>
      <AssetsActionBar />
    </header>

    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载资产数据…"
      @retry="store.bootstrap(true)"
    >
      <div class="asc-page__stack">
        <AssetsOverviewCard />

        <AssetsAccountTabs />

        <AssetsBalanceTable />

        <AssetsRecordsPanel />
      </div>
    </ExPageState>

    <p class="asc-page__footnote">
      充值含网络/合约/Memo 与二维码（演示）、提现含 24h 额度与扣款汇总、划转含账户预览；提交后同步余额与记录。链上与真实风控以正式接口为准。
    </p>

    <WalletDepositModal />
    <WalletWithdrawModal />
    <WalletTransferModal />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.asc-page {
  width: 100%;
  max-width: min(1280px, var(--ex-container-max));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding-bottom: $space-8;
  min-width: 0;
  box-sizing: border-box;
}

.asc-page__stack {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  min-width: 0;
}

.asc-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-4;
}

@include mq.media-down(md) {
  .asc-page__header {
    flex-direction: column;
    align-items: stretch;
    gap: $space-3;
  }
}

.asc-page__headline {
  min-width: 0;
}

.asc-page__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.asc-page__subtitle {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.asc-page__footnote {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

@include mq.media-down(md) {
  .asc-page__title {
    font-size: $font-size-xl;
  }

  .asc-page__stack {
    gap: $space-4;
  }
}

.asc-page--hub {
  max-width: none;
  margin: 0;
  padding-bottom: 0;
}

.asc-page--hub .asc-page__title {
  font-size: $font-size-xl;
}

.asc-page--hub .asc-page__subtitle {
  font-size: $font-size-xs;
}

</style>
