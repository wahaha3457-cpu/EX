<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import AssetsLedgerTable from '@/components/business/assets/AssetsLedgerTable.vue'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useAssetsCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  void store.bootstrap()
})
</script>

<template>
  <div class="ocv">
    <section class="ocv__intro" aria-label="说明">
      <p class="ocv__intro-p">
        资金流水汇总现货、合约、资金账户等资产变动（演示数据）。正式环境以账务服务为准，支持按币种与时间筛选导出。
      </p>
      <ul class="ocv__intro-ul">
        <li>充值、提现、划转、成交、手续费等类型将在此按时间倒序展示。</li>
        <li>若与资产页余额不一致，请刷新或联系客服核对链上确认状态。</li>
      </ul>
    </section>

    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载流水…"
      @retry="store.bootstrap(true)"
    >
      <div class="ocv__panel">
        <div class="ocv__panel-hd">
          <h2 class="ocv__h2">资金流水</h2>
          <RouterLink
            class="ocv__link"
            :to="{ name: RouteNames.Assets, query: { account: 'overview', record: 'deposit' } }"
          >
            查看充值记录
          </RouterLink>
        </div>
        <div class="ocv__ledger-wrap">
          <AssetsLedgerTable />
        </div>
      </div>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ocv__intro {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__intro-p {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.ocv__intro-ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ocv__panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
}

.ocv__panel-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__h2 {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ocv__link {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ocv__ledger-wrap {
  padding: 0;

  :deep(.asc-ledger) {
    max-height: min(520px, 62vh);
  }
}
</style>
