<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { storeToRefs } from 'pinia'
import { UserCenterAccountCard, UserCenterOverviewPanel } from '@/components/business/userCenter'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useUserCenterStore()
const { loading, loadError, payload } = storeToRefs(store)

onMounted(() => {
  store.setTab('overview')
  void store.bootstrap()
})
</script>

<template>
  <div class="ah-ov">
    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载账户总览…"
      @retry="store.bootstrap()"
    >
      <div class="ah-ov__stack">
        <UserCenterAccountCard />
        <UserCenterOverviewPanel />
      </div>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ah-ov {
  min-width: 0;
}

.ah-ov__stack {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  min-width: 0;
}
</style>
