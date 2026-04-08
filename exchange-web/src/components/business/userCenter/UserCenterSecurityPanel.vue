<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserCenterStore } from '@/stores/userCenter'
import { useSecurityCenterUiStore } from '@/stores/securityCenterUi'
import { useSecurityItemAction } from '@/composables/userCenter/useSecurityItemAction'

const store = useUserCenterStore()
const { securityItems, payload } = storeToRefs(store)
const secUi = useSecurityCenterUiStore()
const { onSecurityItemAction } = useSecurityItemAction()

const displayItems = computed(() => secUi.mergeSecurityItems(securityItems.value, payload.value?.overview ?? null))
</script>

<template>
  <div class="uc-sec">
    <header class="uc-sec__head">
      <h2 class="uc-sec__title">安全中心</h2>
      <p class="uc-sec__lead">
        保护账户与资金安全。已设置资金密码后，提现等资金操作将要求输入 6
        位资金密码；以下为演示环境完整交互流程，正式策略以服务端为准。
      </p>
    </header>

    <ul class="uc-sec__list" role="list">
      <li v-for="item in displayItems" :key="item.id" class="uc-sec__item">
        <div class="uc-sec__main">
          <div class="uc-sec__titles">
            <h3 class="uc-sec__name">
              {{ item.title }}
              <span v-if="item.reserved" class="uc-sec__reserve">预留</span>
            </h3>
            <p class="uc-sec__desc">{{ item.description }}</p>
          </div>
          <div class="uc-sec__status">
            <span
              class="uc-sec__pill"
              :class="{
                'uc-sec__pill--on': item.status === 'ON',
                'uc-sec__pill--off': item.status === 'OFF',
                'uc-sec__pill--partial': item.status === 'PARTIAL',
              }"
            >
              {{ item.statusLabel }}
            </span>
          </div>
        </div>
        <button type="button" class="uc-sec__action" @click="onSecurityItemAction(item)">
          {{ item.actionLabel }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.uc-sec__head {
  margin-bottom: $space-4;
}

.uc-sec__title {
  margin: 0 0 $space-1;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.uc-sec__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.55;
  max-width: 640px;
}

.uc-sec__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  overflow: hidden;
  background: $color-bg-elevated;
}

.uc-sec__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-bottom: 1px solid var(--ex-border-subtle);
  transition: background 0.18s ease;
}

.uc-sec__item:last-child {
  border-bottom: none;
}

.uc-sec__item:hover {
  background: var(--ex-fill-ghost);
}

.uc-sec__main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: $space-4;
  flex: 1;
  min-width: 0;
}

.uc-sec__titles {
  flex: 1;
  min-width: 200px;
}

.uc-sec__name {
  margin: 0 0 $space-1;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  display: flex;
  align-items: center;
  gap: $space-2;
}

.uc-sec__reserve {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.14);
  color: $color-brand;
  font-weight: $font-weight-bold;
  letter-spacing: 0.02em;
}

.uc-sec__desc {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.uc-sec__status {
  flex-shrink: 0;
}

.uc-sec__pill {
  display: inline-block;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  padding: 4px 10px;
  border-radius: $radius-sm;
}

.uc-sec__pill--on {
  color: $color-rise;
  background: $color-rise-bg;
}

.uc-sec__pill--off {
  color: $color-text-tertiary;
  background: var(--ex-fill-hover-subtle);
}

.uc-sec__pill--partial {
  color: #8ab4ff;
  background: rgba(48, 132, 252, 0.15);
}

.uc-sec__action {
  flex-shrink: 0;
  min-width: 88px;
  min-height: 36px;
  padding: 0 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  background: $color-bg-surface;
  border: 1px solid $color-border-strong;
  border-radius: $radius-md;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.uc-sec__action:hover {
  border-color: rgba(240, 185, 11, 0.45);
  color: $color-brand;
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.12);
}

.uc-sec__action:active {
  transform: translateY(1px);
}
</style>
