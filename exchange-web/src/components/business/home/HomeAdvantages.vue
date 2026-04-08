<script setup lang="ts">
const items = [
  {
    title: '专业撮合',
    desc: '高性能撮合引擎与订单簿维护；延迟与吞吐指标可观测，支持灰度与分片演进。',
    icon: 'match',
  },
  {
    title: '深度流动性',
    desc: '聚合深度与做市接入预留；盘口与成交流水同源，降低滑点与异常波动感知。',
    icon: 'liquidity',
  },
  {
    title: '多终端支持',
    desc: 'Web、移动端与桌面端一致交互；关键路径与权限模型可跨端复用。',
    icon: 'devices',
  },
  {
    title: '安全保障',
    desc: '账户安全策略、提现风控与操作审计；与合规与灾备链路可对接。',
    icon: 'shield',
  },
  {
    title: '实时行情',
    desc: 'Ticker / 深度 / 成交流多渠道推送；终端级刷新与节流策略可配置。',
    icon: 'pulse',
  },
] as const
</script>

<template>
  <section class="adv" aria-labelledby="adv-title">
    <div class="adv__inner">
      <h2 id="adv-title" class="adv__title">平台优势</h2>
      <ul class="adv__grid">
        <li v-for="it in items" :key="it.title" class="adv__item">
          <div class="adv__icon" aria-hidden="true">
            <!-- 专业撮合：柱状 + 趋势线 -->
            <svg
              v-if="it.icon === 'match'"
              class="adv__svg"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 34h6v10h-6V34Zm10-8h6v18h-6V26Zm10-10h6v28h-6V16Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M8 38c6-4 10-10 18-14s12-6 18-8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <!-- 深度流动性：层叠盘口 -->
            <svg
              v-else-if="it.icon === 'liquidity'"
              class="adv__svg"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="24" cy="34" rx="16" ry="5" stroke="currentColor" stroke-width="1.5" />
              <ellipse cx="24" cy="28" rx="13" ry="4" stroke="currentColor" stroke-width="1.5" />
              <ellipse cx="24" cy="22" rx="10" ry="3.5" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M18 14c2-1.5 4-2.2 6-2.2s4 .7 6 2.2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <!-- 多终端 -->
            <svg
              v-else-if="it.icon === 'devices'"
              class="adv__svg"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="8" y="14" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
              <path d="M12 28h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <rect x="26" y="20" width="14" height="22" rx="2.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M30 40h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <!-- 安全保障 -->
            <svg
              v-else-if="it.icon === 'shield'"
              class="adv__svg"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 6 38 12v14c0 9.5-6 18.2-14 21-8-2.8-14-11.5-14-21V12l14-6Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M17 24l5 5 10-11"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <!-- 实时行情 -->
            <svg v-else class="adv__svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 32 L12 24 l6 8 8-14 8 10 8-8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="24" r="2" fill="currentColor" />
              <circle cx="26" cy="18" r="2" fill="currentColor" />
              <circle cx="42" cy="22" r="2" fill="currentColor" />
            </svg>
          </div>
          <h3 class="adv__name">{{ it.title }}</h3>
          <p class="adv__text">{{ it.desc }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

/* 欧意式：全宽深色带 + 居中主标题 + 线描图标 + 五列卖点 */
.adv {
  position: relative;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  box-sizing: border-box;
  margin-bottom: $space-8;
  padding: clamp($space-8, 7vw, 5.5rem) var(--ex-gutter-x);
  background: #000000;
  color: #ffffff;
}

.adv__inner {
  max-width: var(--ex-container-max);
  margin-inline: auto;
}

.adv__title {
  margin: 0 0 clamp($space-6, 4vw, $space-8);
  font-size: clamp(1.375rem, 3.2vw, 2rem);
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  text-align: center;
  color: #ffffff;
  line-height: 1.25;
}

.adv__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp($space-6, 4vw, $space-8);
  list-style: none;
  margin: 0;
  padding: 0;

  @include mq.media-up(md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: $space-6;
    row-gap: $space-8;
  }

  @include mq.media-up(lg) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @include mq.media-up(xl) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $space-5 $space-4;
  }
}

.adv__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $space-5 $space-4;
  margin: 0;
  border-radius: 12px;
  border: 1px solid transparent;
  box-sizing: border-box;
  transition:
    background-color 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.28s ease,
    transform 0.28s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background-color: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
      transform: translateY(-4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition-duration: 0.01ms;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: none;
      }
    }
  }
}

.adv__icon {
  width: 56px;
  height: 56px;
  margin-bottom: $space-4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.adv__svg {
  width: 48px;
  height: 48px;
  display: block;
}

.adv__name {
  margin: 0 0 $space-3;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: #ffffff;
  line-height: 1.35;
  max-width: 16rem;
}

.adv__text {
  margin: 0;
  font-size: $font-size-sm;
  line-height: 1.65;
  color: #a8a8a8;
  max-width: 17rem;
}

/* 浅色主题：与全站 monochrome 可读性对齐 */
:global([data-theme='monochrome']) .adv {
  background: #f5f5f5;
  color: #111111;
}

:global([data-theme='monochrome']) .adv__title,
:global([data-theme='monochrome']) .adv__name {
  color: #111111;
}

:global([data-theme='monochrome']) .adv__text {
  color: #5c5c5c;
}

:global([data-theme='monochrome']) .adv__icon {
  color: #111111;
}

@media (hover: hover) and (pointer: fine) {
  :global([data-theme='monochrome']) .adv__item:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
  }
}
</style>
