<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { storeToRefs } from 'pinia'
import { UserCenterPlaceholderPanel } from '@/components/business/userCenter'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useUserCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  store.setTab('api')
  void store.bootstrap()
})
</script>

<template>
  <div class="ah-api">
    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载…"
      @retry="store.bootstrap()"
    >
      <section class="ah-api__panel">
        <UserCenterPlaceholderPanel kind="api" />
      </section>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ah-api {
  min-width: 0;
}

.ah-api__panel {
  padding: $space-4 $space-5;
  border: 1px solid var(--ex-border);
  border-radius: var(--ex-radius-lg);
  background: var(--ex-bg-elevated);
}
</style>
