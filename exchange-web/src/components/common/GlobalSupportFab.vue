<script setup lang="ts">
/**
 * 全站右下角悬浮客服入口：点击打开币安式浮动对话窗口（非整页跳转）；长按/次要入口仍可通过导航前往客服中心。
 */
import { useI18n } from 'vue-i18n'
import { useSupportChatUiStore } from '@/stores/supportChatUi'

const { t } = useI18n()
const chatUi = useSupportChatUiStore()
</script>

<template>
  <button
    v-show="!chatUi.panelOpen"
    type="button"
    class="ex-support-fab"
    :aria-label="t('layout.supportFabAria')"
    :title="t('layout.supportFabTitle')"
    @click="chatUi.open()"
  >
    <span class="ex-support-fab__spectral" aria-hidden="true" />
    <span class="ex-support-fab__halo" aria-hidden="true" />
    <span class="ex-support-fab__inner">
      <!-- Q 版耳机客服机器人 · 微笑 -->
      <svg
        class="ex-support-fab__robot"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="exFabBotFace" x1="10" y1="7" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stop-color="#f0f9ff" />
            <stop offset="0.45" stop-color="var(--ex-fab-bot-sky, #bae6fd)" />
            <stop offset="1" stop-color="var(--ex-fab-bot-blue, #7dd3fc)" />
          </linearGradient>
          <linearGradient id="exFabBotHp" x1="4" y1="6" x2="28" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="var(--ex-fab-bot-cyan, #22d3ee)" />
            <stop offset="0.45" stop-color="var(--ex-fab-bot-aqua, #38bdf8)" />
            <stop offset="1" stop-color="var(--ex-fab-bot-violet, #a855f7)" />
          </linearGradient>
          <linearGradient id="exFabBotBody" x1="16" y1="20" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop stop-color="var(--ex-fab-bot-blue, #7dd3fc)" />
            <stop offset="1" stop-color="color-mix(in srgb, var(--ex-brand) 35%, #38bdf8)" />
          </linearGradient>
        </defs>

        <!-- 小天线 -->
        <line
          x1="16"
          y1="5.5"
          x2="16"
          y2="7.8"
          stroke="var(--ex-fab-bot-hp-deep, #0ea5e9)"
          stroke-width="1.2"
          stroke-linecap="round"
          class="ex-support-fab__ant"
        />
        <circle cx="16" cy="4.4" r="1.35" fill="url(#exFabBotHp)" class="ex-support-fab__ant-dot" />

        <!-- 耳机 · 头梁 -->
        <path
          class="ex-support-fab__hp-band"
          d="M 7.2 14.5 C 7.2 7.5 11.8 3.8 16 3.8 C 20.2 3.8 24.8 7.5 24.8 14.5"
          stroke="url(#exFabBotHp)"
          stroke-width="2.35"
          stroke-linecap="round"
          fill="none"
        />

        <!-- 耳罩 -->
        <rect
          class="ex-support-fab__hp-pad ex-support-fab__hp-pad--l"
          x="3.2"
          y="11"
          width="5.6"
          height="8.2"
          rx="2.4"
          fill="url(#exFabBotHp)"
          stroke="var(--ex-fab-bot-hp-deep, #0ea5e9)"
          stroke-width="0.85"
        />
        <rect
          class="ex-support-fab__hp-pad ex-support-fab__hp-pad--r"
          x="23.2"
          y="11"
          width="5.6"
          height="8.2"
          rx="2.4"
          fill="url(#exFabBotHp)"
          stroke="var(--ex-fab-bot-hp-deep, #0ea5e9)"
          stroke-width="0.85"
        />
        <ellipse cx="6" cy="15.1" rx="1.15" ry="1.35" fill="color-mix(in srgb, #fff 65%, transparent)" opacity="0.9" />
        <ellipse cx="26" cy="15.1" rx="1.15" ry="1.35" fill="color-mix(in srgb, #fff 65%, transparent)" opacity="0.9" />

        <!-- 脸部 Q 版圆脸 -->
        <ellipse
          class="ex-support-fab__face"
          cx="16"
          cy="14.8"
          rx="7.35"
          ry="6.85"
          fill="url(#exFabBotFace)"
          stroke="var(--ex-fab-bot-outline, #0369a1)"
          stroke-width="1.05"
        />

        <!-- 腮红 -->
        <ellipse cx="11" cy="16.8" rx="1.65" ry="1.05" fill="#fda4af" opacity="0.55" />
        <ellipse cx="21" cy="16.8" rx="1.65" ry="1.05" fill="#fda4af" opacity="0.55" />

        <!-- 眼睛 -->
        <g class="ex-support-fab__eyes">
          <ellipse cx="12.35" cy="14" rx="1.45" ry="1.65" fill="#0f172a" />
          <ellipse cx="19.65" cy="14" rx="1.45" ry="1.65" fill="#0f172a" />
          <circle cx="12.9" cy="13.45" r="0.55" fill="#fff" />
          <circle cx="20.2" cy="13.45" r="0.55" fill="#fff" />
        </g>

        <!-- 微笑 -->
        <path
          class="ex-support-fab__smile"
          d="M 11.4 17.2 Q 16 21.2 20.6 17.2"
          stroke="#0f172a"
          stroke-width="1.15"
          stroke-linecap="round"
          fill="none"
        />

        <!-- 身体 -->
        <path
          class="ex-support-fab__body"
          d="M 10.8 21.2 H 21.2 C 22.4 21.2 23.2 22.1 23.2 23.2 V 26.5 C 23.2 27.7 22.3 28.7 21.1 28.7 H 10.9 C 9.7 28.7 8.8 27.7 8.8 26.5 V 23.2 C 8.8 22.1 9.7 21.2 10.8 21.2 Z"
          fill="url(#exFabBotBody)"
          stroke="var(--ex-fab-bot-outline, #0369a1)"
          stroke-width="0.95"
        />
        <rect x="13.5" y="23.5" width="5" height="3.2" rx="0.9" fill="color-mix(in srgb, #fff 22%, #0284c7)" opacity="0.85" />
      </svg>
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-support-fab {
  --ex-fab-bot-cyan: #22d3ee;
  --ex-fab-bot-aqua: #38bdf8;
  --ex-fab-bot-sky: #bae6fd;
  --ex-fab-bot-blue: #7dd3fc;
  --ex-fab-bot-violet: #c084fc;
  --ex-fab-bot-hp-deep: #0ea5e9;
  --ex-fab-bot-outline: #0369a1;

  position: fixed;
  right: max(18px, env(safe-area-inset-right, 0px));
  bottom: max(28px, env(safe-area-inset-bottom, 0px));
  z-index: 1010;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  padding: 0;
  text-decoration: none;
  cursor: pointer;
  isolation: isolate;
  overflow: visible;

  color: var(--ex-on-brand);
  background:
    radial-gradient(
      115% 115% at 28% 18%,
      color-mix(in srgb, #fff 38%, var(--ex-fab-bot-cyan)) 0%,
      transparent 52%
    ),
    radial-gradient(
      90% 90% at 72% 78%,
      color-mix(in srgb, var(--ex-brand) 42%, #fbbf24) 0%,
      transparent 48%
    ),
    linear-gradient(
      148deg,
      #0a1224 0%,
      color-mix(in srgb, #0c4a6e 55%, var(--ex-brand) 22%) 45%,
      #050a14 100%
    );
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, var(--ex-fab-bot-cyan) 65%, #fff 15%),
    0 0 28px color-mix(in srgb, var(--ex-fab-bot-aqua) 55%, transparent),
    0 0 56px color-mix(in srgb, var(--ex-brand) 35%, transparent),
    0 6px 22px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 color-mix(in srgb, #fff 38%, transparent);

  transition:
    transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1),
    box-shadow 0.25s ease,
    filter 0.25s ease;
}

:global([data-theme='monochrome']) .ex-support-fab {
  background:
    radial-gradient(95% 95% at 30% 15%, color-mix(in srgb, var(--ex-fab-bot-sky) 55%, #fff), transparent 52%),
    linear-gradient(155deg, #ffffff 0%, color-mix(in srgb, #e0f2fe 78%, var(--ex-brand) 14%) 100%);
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, var(--ex-fab-bot-aqua) 45%, var(--ex-border) 40%),
    0 8px 26px rgba(14, 116, 144, 0.2),
    0 0 40px color-mix(in srgb, var(--ex-fab-bot-cyan) 22%, transparent);
}

.ex-support-fab:hover {
  transform: scale(1.08) translateY(-4px);
  filter: brightness(1.14) saturate(1.18);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--ex-fab-bot-cyan) 78%, #fff 12%),
    0 0 40px color-mix(in srgb, var(--ex-fab-bot-aqua) 65%, transparent),
    0 0 72px color-mix(in srgb, var(--ex-brand) 48%, transparent),
    0 12px 34px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 color-mix(in srgb, #fff 45%, transparent);
}

.ex-support-fab:active {
  transform: scale(0.96);
  filter: brightness(1.02) saturate(1.05);
}

.ex-support-fab__spectral {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    color-mix(in srgb, var(--ex-fab-bot-cyan) 88%, #fff) 40deg,
    transparent 95deg,
    color-mix(in srgb, var(--ex-fab-bot-violet) 80%, #fff) 165deg,
    transparent 215deg,
    color-mix(in srgb, var(--ex-brand) 75%, #fde047) 300deg,
    transparent 360deg
  );
  animation: ex-support-fab-spin 5s linear infinite;
  -webkit-mask: radial-gradient(circle, transparent 61%, #000 62.5%, #000 100%);
  mask: radial-gradient(circle, transparent 61%, #000 62.5%, #000 100%);
  opacity: 1;
  z-index: 0;
}

.ex-support-fab__halo {
  position: absolute;
  inset: -9px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--ex-fab-bot-cyan) 70%, #fff 10%);
  opacity: 0.62;
  pointer-events: none;
  animation: ex-support-fab-halo-pulse 2.4s ease-in-out infinite;
  z-index: 0;
}

.ex-support-fab__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  animation: ex-support-fab-float 3s ease-in-out infinite;
}

.ex-support-fab__robot {
  display: block;
  flex-shrink: 0;
  width: 85%;
  height: 85%;
  aspect-ratio: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.22))
    drop-shadow(0 0 10px color-mix(in srgb, var(--ex-fab-bot-cyan) 55%, transparent));
}

.ex-support-fab__hp-band {
  animation: ex-support-fab-hp-glow 2.2s ease-in-out infinite;
}

.ex-support-fab__hp-pad {
  animation: ex-support-fab-pad-nod 2.6s ease-in-out infinite;
}

.ex-support-fab__hp-pad--r {
  animation-delay: 0.12s;
}

.ex-support-fab__face {
  animation: ex-support-fab-face-wobble 3.4s ease-in-out infinite;
}

.ex-support-fab__smile {
  animation: ex-support-fab-smile 2.8s ease-in-out infinite;
}

.ex-support-fab__eyes {
  animation: ex-support-fab-blink 4.2s ease-in-out infinite;
  transform-origin: 16px 14px;
}

.ex-support-fab__ant {
  animation: ex-support-fab-ant 2.5s ease-in-out infinite;
}

.ex-support-fab__ant-dot {
  animation: ex-support-fab-ant 2.5s ease-in-out infinite;
}

.ex-support-fab__body {
  animation: ex-support-fab-body 3s ease-in-out infinite;
  transform-origin: 16px 25px;
}

@keyframes ex-support-fab-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ex-support-fab-halo-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.85;
  }
}

@keyframes ex-support-fab-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes ex-support-fab-hp-glow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.94;
  }
}

@keyframes ex-support-fab-pad-nod {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(0.35px);
  }
}

@keyframes ex-support-fab-face-wobble {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-0.8deg);
  }
  75% {
    transform: rotate(0.8deg);
  }
}

@keyframes ex-support-fab-smile {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}

@keyframes ex-support-fab-blink {
  0%,
  44%,
  48%,
  100% {
    transform: scaleY(1);
  }
  46% {
    transform: scaleY(0.12);
  }
}

@keyframes ex-support-fab-ant {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.88;
  }
}

@keyframes ex-support-fab-body {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.03);
  }
}

@include mq.media-down(md) {
  .ex-support-fab {
    bottom: calc(18px + #{$mobile-dock-height} + env(safe-area-inset-bottom, 0px));
    right: max(14px, env(safe-area-inset-right, 0px));
    width: 52px;
    height: 52px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ex-support-fab__spectral,
  .ex-support-fab__halo,
  .ex-support-fab__inner,
  .ex-support-fab__hp-band,
  .ex-support-fab__hp-pad,
  .ex-support-fab__face,
  .ex-support-fab__smile,
  .ex-support-fab__eyes,
  .ex-support-fab__ant,
  .ex-support-fab__ant-dot,
  .ex-support-fab__body {
    animation: none !important;
  }

  .ex-support-fab__spectral {
    opacity: 0.65;
  }

  .ex-support-fab__halo {
    opacity: 0.4;
  }
}
</style>
