<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { storeToRefs } from 'pinia'
import { UserCenterKycPanel } from '@/components/business/kyc'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useUserCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  store.setTab('kyc')
  void store.bootstrap()
})
</script>

<template>
  <div class="ah-kyc">
    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载认证信息…"
      @retry="store.bootstrap()"
    >
      <section class="ah-kyc__panel">
        <UserCenterKycPanel />
      </section>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ah-kyc {
  min-width: 0;
}

.ah-kyc__panel {
  padding: $space-4 $space-5;
  border: 1px solid var(--ex-border);
  border-radius: var(--ex-radius-lg);
  background: var(--ex-bg-elevated);
}
</style>
