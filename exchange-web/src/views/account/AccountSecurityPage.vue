<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { storeToRefs } from 'pinia'
import { UserCenterSecurityPanel } from '@/components/business/userCenter'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useUserCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  store.setTab('security')
  void store.bootstrap()
})
</script>

<template>
  <div class="ah-sec">
    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载安全设置…"
      @retry="store.bootstrap()"
    >
      <section class="ah-sec__panel">
        <UserCenterSecurityPanel />
      </section>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ah-sec {
  min-width: 0;
}

.ah-sec__panel {
  padding: $space-4 $space-5;
  border: 1px solid var(--ex-border);
  border-radius: var(--ex-radius-lg);
  background: var(--ex-bg-elevated);
  box-shadow: var(--ex-shadow-sm);
}
</style>
