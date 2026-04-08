<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const title = computed(() => {
  const k = route.meta.titleKey as string | undefined
  return k ? (t(k) as string) : t('pages.feature.building')
})
</script>

<template>
  <div class="ex-feature-placeholder">
    <h1 class="ex-feature-placeholder__title">{{ title }}</h1>
    <p class="ex-feature-placeholder__hint">{{ t('pages.feature.hint') }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ex-feature-placeholder {
  max-width: 560px;
  margin: 0 auto;
  padding: $space-10 $space-4;
  text-align: center;
}

.ex-feature-placeholder__title {
  margin: 0 0 $space-3;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary);
}

.ex-feature-placeholder__hint {
  margin: 0;
  font-size: $font-size-sm;
  color: var(--ex-text-tertiary);
}
</style>
