<script setup lang="ts">
/**
 * 主导航 / 更多菜单二级项图标：白描边 + 小面积品牌色点缀（对标币安 mega menu）
 */
import type { NavIconKey } from '@/config/mainNav'

defineProps<{
  name: NavIconKey | string
}>()

const A = 'var(--ex-brand)'
</script>

<template>
  <!-- spot -->
  <svg
    v-if="name === 'spot'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 15.5 8.5 10 12 13 20 5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="20" cy="5" r="2" :fill="A" />
  </svg>

  <!-- copy -->
  <svg
    v-else-if="name === 'copy'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="7" cy="12" r="2.25" stroke="currentColor" stroke-width="1.5" />
    <circle cx="17" cy="12" r="2.25" stroke="currentColor" stroke-width="1.5" />
    <path d="M9.25 12h5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="12" cy="12" r="1.25" :fill="A" />
  </svg>

  <!-- demo -->
  <svg
    v-else-if="name === 'demo'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="5"
      y="6"
      width="14"
      height="12"
      rx="2"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <rect x="8" y="9" width="8" height="5" rx="0.5" stroke="currentColor" stroke-width="1.2" />
    <circle cx="16.5" cy="8" r="1.1" :fill="A" />
  </svg>

  <!-- convert -->
  <svg
    v-else-if="name === 'convert'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 10h11M6 10l2.2-2.2M6 10l2.2 2.2M18 14H7M18 14l-2.2 2.2M18 14l-2.2-2.2"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="12" r="2" :fill="A" />
  </svg>

  <!-- c2c -->
  <svg
    v-else-if="name === 'c2c'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="4.5"
      y="7"
      width="15"
      height="10"
      rx="1.5"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path d="M4.5 10h15" stroke="currentColor" stroke-width="1.5" />
    <rect x="13" y="12" width="4" height="2.5" rx="0.4" :fill="A" />
  </svg>

  <!-- perpetual -->
  <svg
    v-else-if="name === 'perpetual'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M6 17V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <path d="M12 17V6" :stroke="A" stroke-width="1.75" stroke-linecap="round" />
    <path d="M18 17v-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>

  <!-- options / delivery -->
  <svg
    v-else-if="name === 'options'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7.5 8h7l2.5 2.5V17a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path d="M14.5 8V11H17" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
    <circle cx="10.5" cy="13.5" r="1.2" :fill="A" />
  </svg>

  <!-- fund -->
  <svg
    v-else-if="name === 'fund'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 10c0-1.5 1.2-2.5 3.5-2.5h7c2.3 0 3.5 1 3.5 2.5v6c0 1.5-1.2 2.5-3.5 2.5h-7C6.2 18.5 5 17.5 5 16v-6z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path
      d="M5 12h15"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <rect x="13" y="13.2" width="4" height="2" rx="0.5" :fill="A" />
  </svg>

  <!-- miner -->
  <svg
    v-else-if="name === 'miner'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="6.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
    <circle cx="12" cy="5" r="1.15" :fill="A" />
  </svg>

  <!-- lending -->
  <svg
    v-else-if="name === 'lending'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="4.5"
      y="6"
      width="15"
      height="12"
      rx="2"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path d="M5 10h14" :stroke="A" stroke-width="2" stroke-linecap="round" />
    <path
      d="M8 14.5h4M14 14.5h2.5"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
    />
  </svg>

  <!-- staking -->
  <svg
    v-else-if="name === 'staking'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="7.5"
      y="10"
      width="9"
      height="9"
      rx="1.2"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M9 10V8.5a3 3 0 0 1 6 0V10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <circle cx="12" cy="14.5" r="1.35" :fill="A" />
  </svg>

  <!-- announce -->
  <svg
    v-else-if="name === 'announce'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 6.5a5 5 0 0 0-5 5v4.5l-1.8.9a1 1 0 0 0 1.45.9L12 16l5.35 1.8a1 1 0 0 0 1.45-.9L17 16v-4.5a5 5 0 0 0-5-5z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="11" r="1.25" :fill="A" />
  </svg>

  <!-- activity -->
  <svg
    v-else-if="name === 'activity'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 20V6l3-2 3 2 3-2v8"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path d="M7 13h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="15" cy="9" r="1.35" :fill="A" />
  </svg>

  <!-- support -->
  <svg
    v-else-if="name === 'support'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 14.5v-2a7 7 0 0 1 14 0v2"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M5 14.5h2.5v2.8A1.7 1.7 0 0 0 9.2 19h.8M19 14.5h-2.5v2.8A1.7 1.7 0 0 1 14.8 19h-.8"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="9" cy="14" r="1.1" :fill="A" />
  </svg>

  <!-- news (global info) -->
  <svg
    v-else-if="name === 'news'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" />
    <path
      d="M4 12h2.5a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2h7M12 16v4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="8.5" r="1.35" :fill="A" />
  </svg>

  <!-- nft -->
  <svg
    v-else-if="name === 'nft'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path d="M12 12v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="12" cy="10" r="1.35" :fill="A" />
  </svg>

  <!-- charity -->
  <svg
    v-else-if="name === 'charity'"
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 20s-6.5-4.35-8.5-8.5C2.5 8.5 4 6 6.75 6c1.8 0 3 1.2 3.75 2.1.75-.9 1.95-2.1 3.75-2.1C17 6 18.5 8.5 17.25 11.5 15.25 15.65 12 20 12 20Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="10.5" r="1.25" :fill="A" />
  </svg>

  <!-- fallback -->
  <svg
    v-else
    class="nav-mega-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.5" />
    <circle cx="12" cy="12" r="2" :fill="A" />
  </svg>
</template>

<style scoped lang="scss">
.nav-mega-icon {
  display: block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  color: inherit;
}
</style>
