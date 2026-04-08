<script setup lang="ts">
import { computed } from 'vue'

withDefaults(
  defineProps<{
    /** 像素边长 */
    size?: number
    /** 登录页大号光晕 */
    glow?: boolean
  }>(),
  { size: 32, glow: false },
)

/** 同页多实例时避免 SVG 渐变 id 冲突 */
const uid = `m${Math.random().toString(36).slice(2, 10)}`
const g = computed(() => `ops-g-${uid}`)
const core = computed(() => `ops-core-${uid}`)
const panel = computed(() => `ops-panel-${uid}`)
</script>

<template>
  <span
    class="ops-ai-mark"
    :class="{ 'ops-ai-mark--glow': glow }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    aria-label="运营后台"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" class="ops-ai-mark__svg">
      <defs>
        <linearGradient :id="g" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#22d3ee" />
          <stop offset="0.42" stop-color="#818cf8" />
          <stop offset="1" stop-color="#e879f9" />
        </linearGradient>
        <linearGradient :id="core" x1="26" y1="24" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stop-color="#67e8f9" />
          <stop offset="1" stop-color="#c4b5fd" />
        </linearGradient>
        <linearGradient :id="panel" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0f172a" />
          <stop offset="1" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" :fill="`url(#${panel})`" />
      <rect width="64" height="64" rx="15" fill="none" :stroke="`url(#${g})`" stroke-width="1.25" opacity="0.4" />
      <path
        fill="none"
        :stroke="`url(#${g})`"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.92"
        d="M17 25L32 15l15 10M17 25l-4 16M32 15v17M47 25l4 16M13 41l19 11 19-11M32 32v20"
      />
      <circle cx="17" cy="25" r="3.25" fill="#020617" :stroke="`url(#${g})`" stroke-width="1.5" />
      <circle cx="32" cy="15" r="3.25" fill="#020617" :stroke="`url(#${g})`" stroke-width="1.5" />
      <circle cx="47" cy="25" r="3.25" fill="#020617" :stroke="`url(#${g})`" stroke-width="1.5" />
      <circle cx="13" cy="41" r="3.25" fill="#020617" :stroke="`url(#${g})`" stroke-width="1.5" />
      <circle cx="51" cy="41" r="3.25" fill="#020617" :stroke="`url(#${g})`" stroke-width="1.5" />
      <circle cx="32" cy="52" r="3.25" fill="#020617" :stroke="`url(#${g})`" stroke-width="1.5" />
      <path
        :fill="`url(#${core})`"
        :stroke="`url(#${g})`"
        stroke-width="1.2"
        d="M32 25.5l6.2 3.6v7.2L32 39.9l-6.2-3.6v-7.2l6.2-3.6z"
        opacity="0.95"
      />
      <circle cx="32" cy="32" r="2.2" fill="#020617" opacity="0.85" />
    </svg>
  </span>
</template>

<style scoped>
.ops-ai-mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
}

.ops-ai-mark__svg {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
}

.ops-ai-mark--glow {
  filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.45)) drop-shadow(0 0 28px rgba(129, 140, 248, 0.35))
    drop-shadow(0 4px 20px rgba(0, 0, 0, 0.35));
}
</style>
