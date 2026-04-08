<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { storeToRefs } from 'pinia'
import { UserCenterLoginHistoryTable } from '@/components/business/userCenter'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useUserCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  store.setTab('login')
  void store.bootstrap()
})
</script>

<template>
  <div class="ah-sess">
    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载登录记录…"
      @retry="store.bootstrap()"
    >
      <section class="ah-sess__panel">
        <UserCenterLoginHistoryTable />
      </section>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ah-sess {
  min-width: 0;
}

.ah-sess__panel {
  padding: $space-4 $space-5;
  border: 1px solid var(--ex-border);
  border-radius: var(--ex-radius-lg);
  background: var(--ex-bg-elevated);
}
</style>
