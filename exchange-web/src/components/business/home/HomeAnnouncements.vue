<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import type { HomeAnnouncementItem, HomeFeedKind } from '@/types/home'

defineProps<{
  items: HomeAnnouncementItem[]
}>()

const router = useRouter()

function tagClass(kind: HomeFeedKind) {
  return {
    'ann__tag--announcement': kind === 'announcement',
    'ann__tag--activity': kind === 'activity',
    'ann__tag--maintenance': kind === 'maintenance',
  }
}

function goMarket() {
  router.push({ name: RouteNames.Market })
}

function onRowClick() {
  goMarket()
}
</script>

<template>
  <section id="home-announcements" class="ann" aria-labelledby="ann-title">
    <div class="ann__head">
      <h2 id="ann-title" class="ann__title">公告与平台动态</h2>
      <button type="button" class="ann__more" @click="goMarket">查看更多</button>
    </div>
    <ul class="ann__list">
      <li v-for="a in items" :key="a.id" class="ann__row">
        <button type="button" class="ann__link" @click="onRowClick">
          <span class="ann__tag" :class="tagClass(a.kind)">{{ a.tag }}</span>
          <span class="ann__text">{{ a.title }}</span>
          <time class="ann__time" :datetime="a.publishedAt">{{ a.publishedAt }}</time>
        </button>
      </li>
    </ul>
    <p class="ann__hint">
      详情路由与公告中心 API 接入后，可将行点击改为 <code class="ann__code">/announcements/:id</code>。
    </p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ann {
  margin-bottom: $space-8;
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  background: var(--ex-home-card-tint);
  scroll-margin-top: $header-height;
}

.ann__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
}

.ann__title {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
}

.ann__more {
  background: none;
  border: none;
  color: $color-brand;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  padding: $space-2;
}

.ann__more:hover {
  text-decoration: underline;
}

.ann__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ann__row {
  border-bottom: 1px solid var(--ex-border-subtle);
}

.ann__row:last-child {
  border-bottom: none;
}

.ann__link {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: $space-3;
  align-items: baseline;
  padding: $space-3 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease;
}

.ann__link:hover {
  background: var(--ex-fill-ghost);
}

.ann__tag {
  flex-shrink: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  padding: 2px $space-2;
  border-radius: $radius-sm;
}

.ann__tag--announcement {
  color: $color-brand;
  background: $color-brand-muted;
}

.ann__tag--activity {
  color: #6aa9ff;
  background: rgba(48, 132, 252, 0.15);
}

.ann__tag--maintenance {
  color: #c8cdd4;
  background: rgba(234, 236, 239, 0.08);
}

.ann__text {
  font-size: $font-size-sm;
  color: $color-text-primary;
  line-height: 1.45;
}

.ann__time {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-variant-numeric: tabular-nums;
}

.ann__hint {
  margin: $space-3 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ann__code {
  font-family: $font-family-mono;
  font-size: 0.95em;
  color: $color-text-secondary;
}

@include mq.media-down(md) {
  .ann__head {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-2;
  }

  .ann__more {
    min-height: $control-height-md;
    padding: $space-2 $space-3;
  }

  .ann__link {
    grid-template-columns: 1fr;
    gap: $space-1;
  }

  .ann__time {
    justify-self: start;
  }
}
</style>
