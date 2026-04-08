<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import MobileTabBar from '@/components/mobile/MobileTabBar.vue'
import MobileConfirmHost from '@/components/mobile/MobileConfirmHost.vue'
import { useMobileDemoStore } from '@/stores/mobileDemo'

const demo = useMobileDemoStore()

onMounted(() => {
  demo.hydrate()
})
</script>

<template>
  <div class="mobile-shell">
    <main class="mobile-shell__main">
      <RouterView />
    </main>
    <MobileTabBar />
    <MobileConfirmHost />
  </div>
</template>

<style scoped lang="scss">
.mobile-shell {
  min-height: 100dvh;
  background: #0a0c10;
  color: #eef2f7;
  font-family:
    'DM Sans',
    system-ui,
    -apple-system,
    sans-serif;
  -webkit-font-smoothing: antialiased;
}

.mobile-shell__main {
  max-width: 430px;
  margin: 0 auto;
  padding: 0 0 calc(72px + env(safe-area-inset-bottom, 0px));
}
</style>
