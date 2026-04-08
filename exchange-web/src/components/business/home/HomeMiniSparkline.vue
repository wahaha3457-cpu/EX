<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 根据涨跌决定微趋势色 */
  changePct: number
}>()

const tone = computed(() => {
  if (props.changePct > 0.05) return 'up'
  if (props.changePct < -0.05) return 'down'
  return 'flat'
})

/** 轻量折线占位，后续可换为 kline 点列或 canvas */
const pathD = computed(() => {
  if (tone.value === 'up') return 'M0,14 L3,12 L6,10 L9,8 L12,6 L15,5 L18,3 L20,2'
  if (tone.value === 'down') return 'M0,4 L3,6 L6,8 L9,10 L12,12 L15,13 L18,15 L20,16'
  return 'M0,10 L4,9 L8,11 L12,8 L16,10 L20,9'
})
</script>

<template>
  <svg
    class="spark"
    viewBox="0 0 20 18"
    aria-hidden="true"
    :class="{
      'spark--up': tone === 'up',
      'spark--down': tone === 'down',
      'spark--flat': tone === 'flat',
    }"
  >
    <path :d="pathD" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<style scoped lang="scss">
.spark {
  width: 56px;
  height: 22px;
  flex-shrink: 0;
}

.spark--up path {
  stroke: rgba(14, 203, 129, 0.85);
}

.spark--down path {
  stroke: rgba(246, 70, 93, 0.85);
}

.spark--flat path {
  stroke: rgba(132, 142, 156, 0.75);
}
</style>
