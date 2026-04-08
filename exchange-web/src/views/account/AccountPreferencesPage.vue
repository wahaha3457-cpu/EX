<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { storeToRefs } from 'pinia'
import { UserCenterPreferencesPanel } from '@/components/business/preferences'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useUserCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  store.setTab('preferences')
  void store.bootstrap()
})
</script>

<template>
  <div class="ah-pref">
    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载偏好设置…"
      @retry="store.bootstrap()"
    >
      <section class="ah-pref__panel">
        <UserCenterPreferencesPanel />
      </section>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ah-pref {
  min-width: 0;
}

.ah-pref__panel {
  padding: $space-4 $space-5;
  border: 1px solid var(--ex-border);
  border-radius: var(--ex-radius-lg);
  background: var(--ex-bg-elevated);
}
</style>
