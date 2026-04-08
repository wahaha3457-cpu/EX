<script setup lang="ts">
/**
 * 全局 Toast：默认右上角；订单成功等使用 order-ai 居中卡片（2s 渐变消失）。
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const { toasts } = storeToRefs(app)
const { t } = useI18n()

const cornerToasts = computed(() => toasts.value.filter((x) => x.presentation !== 'order-ai'))
const orderAiToasts = computed(() => toasts.value.filter((x) => x.presentation === 'order-ai'))
</script>

<template>
  <!-- 订单成功 · AI 居中层 -->
  <Teleport to="body">
    <div class="ex-order-ai-host" aria-live="polite">
      <TransitionGroup name="ex-order-ai" tag="div" class="ex-order-ai-stack">
        <article
          v-for="item in orderAiToasts"
          :key="item.id"
          class="ex-order-ai-card"
          role="status"
        >
          <div class="ex-order-ai-card__aurora" aria-hidden="true" />
          <div class="ex-order-ai-card__grid" aria-hidden="true" />
          <div class="ex-order-ai-card__inner">
            <div class="ex-order-ai-card__glyph" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  class="ex-order-ai-card__orbit"
                  d="M24 6c9.94 0 18 8.06 18 18s-8.06 18-18 18S6 33.94 6 24 14.06 6 24 6Z"
                  stroke="currentColor"
                  stroke-width="1.25"
                  stroke-dasharray="4 6"
                />
                <path
                  d="M24 14l3.2 6.5 7.2 1-5.2 5.1 1.2 7.2L24 30.8l-6.4 3 1.2-7.2-5.2-5.1 7.2-1L24 14Z"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linejoin="round"
                  fill="color-mix(in srgb, currentColor 12%, transparent)"
                />
                <circle cx="24" cy="24" r="2.2" fill="currentColor" class="ex-order-ai-card__pulse" />
              </svg>
            </div>
            <div class="ex-order-ai-card__body">
              <p class="ex-order-ai-card__kicker">{{ t('common.orderAiKicker') }}</p>
              <p class="ex-order-ai-card__sub">{{ t('common.orderAiSub') }}</p>
              <p class="ex-order-ai-card__msg">{{ item.message }}</p>
            </div>
          </div>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>

  <!-- 常规 Toast -->
  <div class="ex-toast-host" aria-live="polite">
    <TransitionGroup name="ex-toast" tag="div">
      <div
        v-for="titem in cornerToasts"
        :key="titem.id"
        class="ex-toast"
        :data-type="titem.type"
        role="status"
      >
        <span class="ex-toast__msg">{{ titem.message }}</span>
        <button type="button" class="ex-toast__close" @click="app.dismissToast(titem.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

/* ========== 居中 AI 订单成功 ========== */
.ex-order-ai-host {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: $space-4;
}

.ex-order-ai-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  max-width: min(420px, 100%);
}

.ex-order-ai-card {
  position: relative;
  width: min(400px, calc(100vw - 32px));
  border-radius: 16px;
  padding: 1px;
  overflow: hidden;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--ex-brand) 55%, transparent) 0%,
    color-mix(in srgb, #a78bfa 45%, transparent) 38%,
    color-mix(in srgb, #22d3ee 40%, transparent) 72%,
    color-mix(in srgb, var(--ex-brand) 50%, transparent) 100%
  );
  background-size: 200% 200%;
  animation: ex-order-ai-border-flow 4s ease-in-out infinite;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ex-border) 65%, transparent),
    0 24px 64px color-mix(in srgb, #000 28%, transparent),
    0 0 80px color-mix(in srgb, var(--ex-brand) 12%, transparent);
}

@keyframes ex-order-ai-border-flow {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.ex-order-ai-card__aurora {
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    circle at 30% 30%,
    color-mix(in srgb, var(--ex-brand) 22%, transparent),
    transparent 55%
  );
  opacity: 0.55;
  pointer-events: none;
  animation: ex-order-ai-aurora 5s ease-in-out infinite;
}

@keyframes ex-order-ai-aurora {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.45;
  }
  50% {
    transform: translate(6%, -4%) scale(1.08);
    opacity: 0.65;
  }
}

.ex-order-ai-card__grid {
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image:
    linear-gradient(color-mix(in srgb, var(--ex-text-primary) 100%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--ex-text-primary) 100%, transparent) 1px, transparent 1px);
  background-size: 14px 14px;
  pointer-events: none;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 45%, black 20%, transparent 100%);
}

.ex-order-ai-card__inner {
  position: relative;
  display: flex;
  gap: $space-4;
  align-items: flex-start;
  padding: $space-5 $space-5 $space-4;
  border-radius: 15px;
  background: color-mix(in srgb, var(--ex-bg-elevated) 92%, transparent);
  backdrop-filter: blur(22px) saturate(1.35);
  -webkit-backdrop-filter: blur(22px) saturate(1.35);
}

.ex-order-ai-card__glyph {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  color: color-mix(in srgb, var(--ex-brand) 85%, #22d3ee);
}

.ex-order-ai-card__orbit {
  opacity: 0.85;
}

.ex-order-ai-card__pulse {
  animation: ex-order-ai-pulse 1.6s ease-in-out infinite;
}

@keyframes ex-order-ai-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(1.15);
  }
}

.ex-order-ai-card__body {
  flex: 1;
  min-width: 0;
}

.ex-order-ai-card__kicker {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ex-text-secondary) 92%, var(--ex-brand));
  line-height: 1.35;
}

.ex-order-ai-card__sub {
  margin: 0 0 $space-3;
  font-size: 10px;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  color: $color-text-tertiary;
  font-family: $font-family-mono;
  opacity: 0.92;
}

.ex-order-ai-card__msg {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  line-height: 1.5;
  word-break: break-word;
}

/* 黑白 / 浅色壳（monochrome）：更实底、阴影略收 */
:root[data-theme='monochrome'] .ex-order-ai-card__inner {
  background: color-mix(in srgb, var(--ex-bg-elevated) 96%, #fff);
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent);
}

:root[data-theme='monochrome'] .ex-order-ai-card {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--ex-border) 80%, transparent),
    0 20px 48px color-mix(in srgb, #000 12%, transparent),
    0 0 64px color-mix(in srgb, var(--ex-brand) 10%, transparent);
}

.ex-order-ai-enter-active {
  transition:
    opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.ex-order-ai-leave-active {
  transition:
    opacity 0.52s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.52s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.52s cubic-bezier(0.4, 0, 0.2, 1);
}

.ex-order-ai-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: scale(0.9) translateY(16px);
}

.ex-order-ai-leave-to {
  opacity: 0;
  filter: blur(10px);
  transform: scale(0.94) translateY(-12px);
}

.ex-order-ai-move {
  transition: transform 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .ex-order-ai-card {
    animation: none;
    background: linear-gradient(
      125deg,
      color-mix(in srgb, var(--ex-brand) 40%, transparent),
      color-mix(in srgb, #a78bfa 35%, transparent)
    );
  }

  .ex-order-ai-card__aurora {
    animation: none;
  }

  .ex-order-ai-card__pulse {
    animation: none;
  }

  .ex-order-ai-enter-active,
  .ex-order-ai-leave-active {
    transition: opacity 0.2s ease;
  }

  .ex-order-ai-enter-from,
  .ex-order-ai-leave-to {
    filter: none;
    transform: none;
  }
}

/* ========== 常规右上角 Toast ========== */
.ex-toast-host {
  position: fixed;
  top: calc(#{$header-height} + #{$space-3});
  right: $space-4;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  pointer-events: none;
  max-width: min(420px, calc(100vw - 32px));
}

.ex-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-bg-elevated;
  box-shadow: $shadow-card;
  font-size: $font-size-sm;
  color: $color-text-primary;
}

.ex-toast[data-type='error'] {
  border-color: color-mix(in srgb, var(--ex-danger) 45%, transparent);
}

.ex-toast[data-type='warning'] {
  border-color: color-mix(in srgb, var(--ex-warning) 45%, transparent);
}

.ex-toast[data-type='success'] {
  border-color: color-mix(in srgb, var(--ex-success) 45%, transparent);
}

.ex-toast__msg {
  flex: 1;
  line-height: 1.4;
}

.ex-toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: $color-text-tertiary;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}

.ex-toast-enter-active,
.ex-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ex-toast-enter-from,
.ex-toast-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
