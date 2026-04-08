<script setup lang="ts">
const emit = defineEmits<{ open: [] }>()

function onOpen() {
  emit('open')
}
</script>

<template>
  <button type="button" class="qe" aria-label="打开快捷买卖" @click="onOpen">
    <span class="qe__glow" aria-hidden="true" />
    <span class="qe__grid" aria-hidden="true" />
    <span class="qe__badge" aria-hidden="true">AI</span>
    <div class="qe__main">
      <div class="qe__illus" aria-hidden="true">
        <span class="qe__orb qe__orb--a" />
        <span class="qe__orb qe__orb--b" />
        <span class="qe__ring" />
        <svg class="qe__spark" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M24 4l2.2 8.2L34 14l-8.2 2.2L24 24l-1.8-7.8L14 14l7.8-1.8L24 4z"
            fill="url(#qe-g)"
            opacity="0.9"
          />
          <defs>
            <linearGradient id="qe-g" x1="14" y1="4" x2="34" y2="24" gradientUnits="userSpaceOnUse">
              <stop stop-color="#f0b90b" />
              <stop offset="1" stop-color="#00c896" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="qe__text">
        <span class="qe__title">快捷买卖</span>
        <span class="qe__desc">一键匹配优质报价 · 参考币安 Express</span>
      </div>
    </div>
    <span class="qe__cta">
      立即体验
      <span class="qe__arrow" aria-hidden="true">›</span>
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.qe {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding: 10px $space-3;
  margin: 0;
  border: 1px solid rgba(240, 185, 11, 0.35);
  border-radius: $radius-md;
  background: linear-gradient(135deg, rgba(240, 185, 11, 0.12) 0%, rgba(0, 200, 150, 0.06) 45%, rgba(48, 132, 252, 0.08) 100%);
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 12px 32px rgba(0, 0, 0, 0.35);

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(240, 185, 11, 0.55);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06) inset,
      0 16px 40px rgba(240, 185, 11, 0.12);
  }

  &:focus-visible {
    outline: 2px solid rgba(240, 185, 11, 0.6);
    outline-offset: 2px;
  }
}

.qe__glow {
  pointer-events: none;
  position: absolute;
  inset: -40% -20% auto auto;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(240, 185, 11, 0.35) 0%, transparent 70%);
  opacity: 0.85;
}

.qe__grid {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 12px 12px;
  mask-image: linear-gradient(90deg, transparent, black 35%);
  opacity: 0.5;
}

.qe__badge {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 9px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0a0e17;
  background: linear-gradient(90deg, #f0b90b, #7dffb3);
  box-shadow: 0 0 12px rgba(240, 185, 11, 0.45);
}

.qe__main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $space-3;
  min-width: 0;
}

.qe__illus {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.qe__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(0);

  &--a {
    width: 36px;
    height: 36px;
    left: 2px;
    top: 10px;
    background: radial-gradient(circle at 30% 30%, rgba(240, 185, 11, 0.9), rgba(240, 185, 11, 0.15));
    opacity: 0.9;
  }

  &--b {
    width: 22px;
    height: 22px;
    right: 0;
    top: 0;
    background: radial-gradient(circle at 40% 40%, rgba(0, 200, 150, 0.85), transparent);
  }
}

.qe__ring {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  animation: qe-pulse 2.8s ease-in-out infinite;
}

@keyframes qe-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

.qe__spark {
  position: absolute;
  left: 10px;
  top: 4px;
  width: 28px;
  height: 28px;
  opacity: 0.95;
}

.qe__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.qe__title {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.qe__desc {
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.35;
}

.qe__cta {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-brand;
  white-space: nowrap;
}

.qe__arrow {
  font-size: 16px;
  line-height: 1;
  opacity: 0.85;
}
</style>
