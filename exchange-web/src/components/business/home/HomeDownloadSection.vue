<script setup lang="ts">
const platforms = [
  { label: 'Web', sub: '浏览器全功能终端', action: '打开 Web 版' },
  { label: 'iOS', sub: 'App Store', action: 'App Store' },
  { label: 'Android', sub: 'APK / Google Play', action: '下载 APK' },
  { label: 'Desktop', sub: 'Windows / macOS', action: '桌面端' },
] as const
</script>

<template>
  <section class="dl" aria-labelledby="dl-title">
    <div class="dl__inner">
      <div class="dl__copy">
        <h2 id="dl-title" class="dl__title">多端入口</h2>
        <p class="dl__lead">
          Web 用于深度交易与多屏协作；移动端用于盯盘与快捷操作；桌面端用于低延迟场景。以下为占位按钮，接入下载中心 API 后替换真实链接。
        </p>
        <ul class="dl__pills">
          <li v-for="p in platforms" :key="p.label" class="dl__pill">
            <div class="dl__pill-main">
              <span class="dl__pill-label">{{ p.label }}</span>
              <span class="dl__pill-sub">{{ p.sub }}</span>
            </div>
            <button type="button" class="dl__pill-btn" disabled>{{ p.action }}</button>
          </li>
        </ul>
      </div>
      <div class="dl__qr" aria-label="下载二维码占位">
        <div class="dl__qr-box">
          <span class="dl__qr-placeholder">QR</span>
        </div>
        <p class="dl__qr-caption">扫码下载（演示占位）</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.dl {
  margin-bottom: $space-8;
  padding: $space-6;
  border-radius: $radius-lg;
  border: 1px solid rgba(240, 185, 11, 0.18);
  background: var(--ex-home-download-bg);
}

.dl__inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: $space-6;

  @include mq.media-up(md) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: $space-8;
  }
}

.dl__title {
  margin: 0 0 $space-3;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
}

.dl__lead {
  margin: 0 0 $space-4;
  max-width: 560px;
  font-size: $font-size-sm;
  line-height: 1.65;
  color: $color-text-secondary;
}

.dl__pills {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  list-style: none;
  margin: 0;
  padding: 0;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mq.media-up(lg) {
    display: flex;
    flex-wrap: wrap;
    grid-template-columns: none;
  }
}

.dl__pill {
  min-width: 200px;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.dl__pill-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dl__pill-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.dl__pill-sub {
  font-size: 10px;
  color: $color-text-tertiary;
}

.dl__pill-btn {
  min-height: $control-height-md;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: var(--ex-fill-ghost);
  border: 1px dashed var(--ex-border);
  border-radius: $radius-sm;
  cursor: not-allowed;
}

.dl__qr {
  flex-shrink: 0;
  text-align: center;
}

.dl__qr-box {
  width: 112px;
  height: 112px;
  margin: 0 auto $space-2;
  border-radius: $radius-md;
  border: 1px dashed var(--ex-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    -45deg,
    var(--ex-divider-on-white),
    var(--ex-divider-on-white) 8px,
    transparent 8px,
    transparent 16px
  );
}

.dl__qr-placeholder {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  letter-spacing: 0.08em;
}

.dl__qr-caption {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}
</style>
