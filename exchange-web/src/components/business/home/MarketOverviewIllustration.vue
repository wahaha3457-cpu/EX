<script setup lang="ts">
defineProps<{
  statId: string
}>()
</script>

<template>
  <!-- 96×96 矢量装饰：与 HomeMarketStat.id 对齐 -->
  <svg
    class="ov-art"
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- 24h 成交额：成交量柱 + 趋势线 -->
    <g v-if="statId === 'vol'" class="ov-art__g ov-art__g--vol">
      <defs>
        <linearGradient id="ov-vol-a" x1="18" y1="72" x2="78" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--ov-art-accent, #f0b90b)" stop-opacity="0.95" />
          <stop offset="1" stop-color="var(--ov-art-accent, #f0b90b)" stop-opacity="0.25" />
        </linearGradient>
        <linearGradient id="ov-vol-b" x1="24" y1="68" x2="72" y2="36" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--ov-art-line, rgba(255,255,255,0.5))" />
          <stop offset="1" stop-color="var(--ov-art-line, rgba(255,255,255,0.15))" />
        </linearGradient>
      </defs>
      <rect x="14" y="52" width="12" height="28" rx="3" fill="url(#ov-vol-a)" opacity="0.35" />
      <rect x="30" y="40" width="12" height="40" rx="3" fill="url(#ov-vol-a)" opacity="0.55" />
      <rect x="46" y="28" width="12" height="52" rx="3" fill="url(#ov-vol-a)" opacity="0.75" />
      <rect x="62" y="34" width="12" height="46" rx="3" fill="url(#ov-vol-a)" />
      <path
        d="M20 58 C32 52 40 44 52 38 C60 34 68 30 76 26"
        stroke="url(#ov-vol-b)"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <circle cx="76" cy="26" r="3.5" fill="var(--ov-art-accent, #f0b90b)" />
    </g>

    <!-- 上架交易对：网格 / 订单簿意象 -->
    <g v-else-if="statId === 'pairs'" class="ov-art__g ov-art__g--pairs">
      <defs>
        <linearGradient id="ov-pair-a" x1="48" y1="18" x2="48" y2="78" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--ov-art-accent-2, #3084fc)" stop-opacity="0.9" />
          <stop offset="1" stop-color="var(--ov-art-accent-2, #3084fc)" stop-opacity="0.2" />
        </linearGradient>
      </defs>
      <rect
        x="18"
        y="22"
        width="60"
        height="52"
        rx="8"
        stroke="var(--ov-art-line, rgba(255,255,255,0.2))"
        stroke-width="1.5"
        fill="url(#ov-pair-a)"
        opacity="0.12"
      />
      <path
        d="M26 34h20M54 34h16M26 46h44M26 58h28M26 70h36"
        stroke="var(--ov-art-line, rgba(255,255,255,0.35))"
        stroke-width="2"
        stroke-linecap="round"
      />
      <rect x="26" y="30" width="10" height="10" rx="2" fill="var(--ov-art-accent-2, #3084fc)" opacity="0.85" />
      <rect x="40" y="30" width="10" height="10" rx="2" fill="var(--ov-art-accent-2, #3084fc)" opacity="0.45" />
      <rect x="54" y="42" width="10" height="10" rx="2" fill="var(--ov-art-accent-2, #3084fc)" opacity="0.65" />
      <rect x="68" y="54" width="10" height="10" rx="2" fill="var(--ov-art-accent-2, #3084fc)" opacity="0.35" />
    </g>

    <!-- 撮合延迟：电脉冲 / 低延迟波形 -->
    <g v-else-if="statId === 'latency'" class="ov-art__g ov-art__g--latency">
      <defs>
        <linearGradient id="ov-lat-a" x1="12" y1="48" x2="84" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--ov-art-accent-3, #00c087)" />
          <stop offset="1" stop-color="var(--ov-art-accent-3, #00c087)" stop-opacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M12 48h10l6-18 8 36 10-28 8 20 12-30 8 20h14"
        stroke="url(#ov-lat-a)"
        stroke-width="2.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <circle cx="12" cy="48" r="4" fill="var(--ov-art-accent-3, #00c087)" opacity="0.9" />
      <circle cx="84" cy="48" r="4" fill="var(--ov-art-accent-3, #00c087)" opacity="0.5" />
      <path
        d="M72 20 L78 14 L84 20"
        stroke="var(--ov-art-accent-3, #00c087)"
        stroke-width="2"
        stroke-linecap="round"
        fill="none"
        opacity="0.8"
      />
    </g>

    <!-- 核心可用性：环形 + 对勾盾 -->
    <g v-else-if="statId === 'uptime'" class="ov-art__g ov-art__g--uptime">
      <defs>
        <linearGradient id="ov-up-a" x1="48" y1="16" x2="48" y2="80" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--ov-art-accent-4, #0ecb81)" stop-opacity="0.9" />
          <stop offset="1" stop-color="var(--ov-art-accent-4, #0ecb81)" stop-opacity="0.25" />
        </linearGradient>
      </defs>
      <circle
        cx="48"
        cy="48"
        r="30"
        stroke="var(--ov-art-line, rgba(255,255,255,0.12))"
        stroke-width="5"
        fill="none"
      />
      <path
        d="M48 18a30 30 0 0 1 26 44"
        stroke="url(#ov-up-a)"
        stroke-width="5"
        stroke-linecap="round"
        fill="none"
      />
      <path
        d="M38 48 l6 6 14-16"
        stroke="var(--ov-art-accent-4, #0ecb81)"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <circle cx="48" cy="48" r="14" fill="var(--ov-art-accent-4, #0ecb81)" opacity="0.12" />
    </g>

    <!-- 兜底 -->
    <g v-else class="ov-art__g">
      <rect
        x="20"
        y="28"
        width="56"
        height="40"
        rx="6"
        stroke="var(--ov-art-line, rgba(255,255,255,0.25))"
        stroke-width="2"
        fill="none"
      />
      <path
        d="M28 44h40M28 52h28"
        stroke="var(--ov-art-line, rgba(255,255,255,0.35))"
        stroke-width="2"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.ov-art {
  display: block;
  width: 100%;
  height: auto;
  max-width: 88px;
  flex-shrink: 0;
  opacity: 0.92;
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.12));
}
</style>
