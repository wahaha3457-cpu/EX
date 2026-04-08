<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

/** 动图优先；GIF 由浏览器自动循环播放，无需额外 CSS。须为真实 GIF 二进制，不能是改后缀的 JPG/PNG。 */
const HERO_VISUAL_GIF = '/images/home/hero-mining.gif'
const HERO_VISUAL_STATIC = '/images/home/hero-mining.jpg'

const heroVisualSrc = ref(HERO_VISUAL_GIF)

function onHeroVisualError(ev: Event) {
  const el = ev.target as HTMLImageElement
  if (el.src.includes(HERO_VISUAL_GIF)) {
    heroVisualSrc.value = HERO_VISUAL_STATIC
  }
}

const router = useRouter()

function goMarket() {
  router.push({ name: RouteNames.Market })
}

function goSpot() {
  router.push({ name: RouteNames.SpotTrade, params: { symbol: 'BTC_USDT' } })
}
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__bg" />
    <div class="hero__grid" aria-hidden="true" />
    <div class="hero__inner">
      <div class="hero__row">
        <div class="hero__copy">
          <p class="hero__eyebrow">专业级交易终端</p>
          <h1 id="hero-title" class="hero__title">
            更低延迟的行情，
            <span class="hero__title-accent">更清晰的资产视图</span>
          </h1>
          <p class="hero__lead">
            统一账户体系、企业级风控与可审计流水。为高频交易与机构级协作而设计。
          </p>
          <div class="hero__actions">
            <button
              type="button"
              class="ex-btn ex-btn--primary ex-btn--logo-grad hero__btn"
              @click="goSpot"
            >
              开始交易
            </button>
            <button type="button" class="ex-btn ex-btn--secondary hero__btn" @click="goMarket">
              查看行情
            </button>
          </div>
        </div>

        <div class="hero__visual" aria-hidden="true">
          <div class="hero__visual-frame">
            <img
              class="hero__visual-img"
              :src="heroVisualSrc"
              width="800"
              height="600"
              alt=""
              loading="eager"
              decoding="async"
              fetchpriority="high"
              @error="onHeroVisualError"
            />
          </div>
        </div>

        <dl class="hero__metrics">
          <div class="hero__metric">
            <dt class="hero__metric-label">撮合目标</dt>
            <dd class="hero__metric-value">&lt; 5ms P99</dd>
          </div>
          <div class="hero__metric">
            <dt class="hero__metric-label">终端主题</dt>
            <dd class="hero__metric-value">深色金融</dd>
          </div>
          <div class="hero__metric">
            <dt class="hero__metric-label">多端</dt>
            <dd class="hero__metric-value">Web · App</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.hero {
  position: relative;
  overflow: hidden;
  padding: clamp($space-6, 4vw, $space-10) 0 clamp($space-6, 3vw, $space-8);
  margin-bottom: $space-2;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 0%, color-mix(in srgb, var(--ex-brand) 14%, transparent) 0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 85% 20%, color-mix(in srgb, var(--ex-info) 10%, transparent) 0%, transparent 50%),
    var(--ex-hero-bg);
  pointer-events: none;
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--ex-hero-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ex-hero-grid-line) 1px, transparent 1px);
  background-size: 48px 48px;
  /* 使用弱网格线色与径向透明渐变底色，避免 mask/整层 opacity 引发「蒙层」观感 */
  background-color: transparent;
  pointer-events: none;
}

.hero__inner {
  position: relative;
  max-width: var(--ex-container-max);
  margin: 0 auto;
  padding: 0 var(--ex-gutter-x);
}

.hero__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-6;
  align-items: start;

  @include mq.media-up(md) {
    grid-template-columns: minmax(0, 1fr) minmax(240px, min(42vw, 520px));
    grid-template-rows: auto auto;
    column-gap: clamp($space-6, 4.5vw, $space-10);
    row-gap: $space-8;
    align-items: start;
  }
}

.hero__copy {
  min-width: 0;
}

@include mq.media-up(md) {
  .hero__copy {
    grid-column: 1;
    grid-row: 1;
  }

  .hero__visual {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    justify-self: end;
    width: 100%;
    max-width: 520px;
  }

  .hero__metrics {
    grid-column: 1;
    grid-row: 2;
  }
}

.hero__visual {
  width: 100%;
  max-width: min(520px, 100%);
  margin: 0 auto;

  @include mq.media-up(md) {
    margin: 0;
  }
}

.hero__visual-frame {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(
    155deg,
    rgba(22, 26, 32, 0.96) 0%,
    rgba(10, 12, 16, 0.99) 100%
  );
  border: 1px solid var(--ex-border-subtle);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #fff 4%, transparent),
    0 24px 48px rgba(0, 0, 0, 0.45),
    0 0 80px color-mix(in srgb, var(--ex-brand) 12%, transparent);
}

.hero__visual-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.hero__eyebrow {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: $color-brand;
}

.hero__title {
  margin: 0 0 $space-4;
  max-width: 16ch;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: $font-weight-bold;
  line-height: 1.12;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.hero__title-accent {
  color: var(--ex-accent, var(--ex-brand));
}

.hero__lead {
  margin: 0 0 $space-6;
  max-width: 520px;
  font-size: $font-size-md;
  line-height: 1.65;
  color: $color-text-secondary;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-bottom: 0;
}

@include mq.media-down(sm) {
  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.hero__btn {
  min-width: 132px;
  min-height: $control-height-lg;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  @include mq.media-down(sm) {
    min-width: 0;
    width: 100%;
  }
}

.hero__btn:hover {
  transform: translateY(-1px);
}

/* 次级按钮保留统一浮起阴影；渐变主 CTA 由全局 .ex-btn--logo-grad 控制光晕 */
.hero__btn:hover:not(.ex-btn--logo-grad) {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.hero__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;
  margin: 0;
  padding: $space-5 0 0;
  border-top: 1px solid var(--ex-border-subtle);

  @include mq.media-down(md) {
    margin-top: $space-2;
    padding-top: $space-4;
  }
}

@include mq.media-down(md) {
  .hero__metrics {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}

.hero__metric {
  margin: 0;
}

.hero__metric-label {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-medium;
}

.hero__metric-value {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}

/* 浅色：浅金渐变 + clip 在白底上对比度极低，改为深金渐变 */
:global([data-theme='monochrome']) .hero__eyebrow {
  color: var(--ex-brand);
}

:global([data-theme='monochrome']) .hero__title-accent {
  color: var(--ex-brand);
}

/* 浅色：网格层减淡，避免与浅底叠加发脏；插图区改为浅卡，避免深色块像「蒙层」 */
:global([data-theme='monochrome']) .hero__visual-frame {
  background: linear-gradient(155deg, #ffffff 0%, #eef1f5 100%);
  box-shadow:
    0 0 0 1px var(--ex-border-subtle),
    0 12px 32px rgba(30, 35, 41, 0.08);
}

:global([data-theme='monochrome']) .hero__btn:hover:not(.ex-btn--logo-grad) {
  box-shadow: 0 8px 24px rgba(30, 35, 41, 0.12);
}
</style>
