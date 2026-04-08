<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

/** 与 public 目录一致：把 MP4 放到 public/videos/crypto-world/ 下即可被访问 */
const VIDEOS = [
  { src: '/videos/crypto-world/crypto-world-1.mp4', label: '加密世界 1' },
  { src: '/videos/crypto-world/crypto-world-2.mp4', label: '加密世界 2' },
  { src: '/videos/crypto-world/crypto-world-3.mp4', label: '加密世界 3' },
] as const

const videoEls = ref<(HTMLVideoElement | null)[]>(VIDEOS.map(() => null))

function setVideoRef(el: unknown, i: number) {
  videoEls.value[i] = (el as HTMLVideoElement | null) ?? null
}

let mq: MediaQueryList | null = null

function applyReducedMotion() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  for (const v of videoEls.value) {
    if (!v) continue
    if (reduce) v.pause()
  }
}

onMounted(async () => {
  await nextTick()
  mq = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  applyReducedMotion()
  mq?.addEventListener?.('change', applyReducedMotion)
})

onUnmounted(() => {
  mq?.removeEventListener?.('change', applyReducedMotion)
})
</script>

<template>
  <section class="crypto-world" aria-labelledby="crypto-world-title">
    <div class="crypto-world__head">
      <h2 id="crypto-world-title" class="crypto-world__title">加密世界</h2>
      <p class="crypto-world__sub">
        精选短片 · 需手动点击播放器播放/暂停；开启系统「减少动态效果」时将不自动播放
      </p>
    </div>

    <div class="crypto-world__grid" role="list">
      <div
        v-for="(item, i) in VIDEOS"
        :key="item.src"
        class="crypto-world__cell"
        role="listitem"
      >
        <div class="crypto-world__frame">
          <video
            :ref="(el) => setVideoRef(el, i)"
            class="crypto-world__video"
            :aria-label="item.label"
            controls
            loop
            muted
            playsinline
            preload="metadata"
          >
            <source :src="item.src" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.crypto-world {
  margin-bottom: $space-8;
}

.crypto-world__head {
  margin-bottom: $space-4;
}

.crypto-world__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: $color-text-primary;
}

.crypto-world__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.crypto-world__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;

  @include mq.media-up(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-6;
  }
}

.crypto-world__cell {
  min-width: 0;
}

.crypto-world__frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: $radius-lg;
  overflow: hidden;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.crypto-world__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
</style>
