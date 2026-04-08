<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNewsHubStore } from '@/stores/newsHub'
import { coverForArticle } from '@/api/news'
import ExPageState from '@/components/common/ExPageState.vue'
import { NewsArticleDrawer } from '@/components/business/news'
import type { NewsArticleMeta } from '@/types/news'

type NewsExcerpt = Pick<NewsArticleMeta, 'slug' | 'external'>

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useNewsHubStore()
const {
  segment,
  categoryFilter,
  searchQuery,
  articles,
  loading,
  loadError,
  selectedSlug,
  selectedMeta,
  trending,
  filteredArticles,
} = storeToRefs(store)

function closeDrawer() {
  store.closeArticle()
  void router.replace({ path: '/more/global-news' })
}

function openArticle(m: NewsArticleMeta) {
  store.openArticle(m.slug)
  void router.replace({ path: '/more/global-news', query: { a: m.slug } })
}

const drawerOpen = computed({
  get: () => selectedSlug.value != null,
  set: (v: boolean) => {
    if (!v) closeDrawer()
  },
})

const featuredList = computed(() => articles.value.filter((x) => x.featured).slice(0, 3))

const displayArticles = computed(() => {
  let base = filteredArticles.value
  if (segment.value === 'featured') {
    const hide = new Set(featuredList.value.map((x) => x.slug))
    base = base.filter((x) => !hide.has(x.slug))
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return base
  return base.filter((a) => {
    const title = (a.external?.title ?? t(`news.items.${a.slug}.title`)).toLowerCase()
    const summary = (a.external?.summary ?? t(`news.items.${a.slug}.summary`)).toLowerCase()
    const full = (a.external?.fullText ?? '').toLowerCase()
    return title.includes(q) || summary.includes(q) || full.includes(q)
  })
})

const segments = computed(() =>
  (['featured', 'all', 'flash'] as const).map((k) => ({
    key: k,
    label: t(`news.tab.${k}`),
  })),
)

const cats = computed(() =>
  (['ALL', 'FLASH', 'MARKETS', 'REGULATION', 'PRODUCT', 'DEPTH', 'MACRO'] as const).map((k) => ({
    value: k,
    label: t(`news.cat.${k}`),
  })),
)

onMounted(() => {
  void store.bootstrap().then(() => {
    syncFromRoute()
  })
})

onBeforeUnmount(() => {
  store.closeArticle()
})

function syncFromRoute() {
  const a = route.query.a
  if (typeof a === 'string' && articles.value.some((x) => x.slug === a)) {
    store.openArticle(a)
  }
}

watch(
  () => route.query.a,
  (a) => {
    if (typeof a === 'string') {
      if (articles.value.some((x) => x.slug === a)) store.openArticle(a)
      else store.closeArticle()
    } else {
      store.closeArticle()
    }
  },
)

watch(articles, () => syncFromRoute(), { deep: true })

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function titleOf(m: NewsExcerpt) {
  return m.external?.title ?? t(`news.items.${m.slug}.title`)
}

function summaryOf(m: NewsExcerpt) {
  return m.external?.summary ?? t(`news.items.${m.slug}.summary`)
}
</script>

<template>
  <div class="gn">
    <header class="gn__hero">
      <div>
        <div class="gn__hero-row">
          <h1 class="gn__title">{{ t('news.heroTitle') }}</h1>
        </div>
        <p class="gn__lead">{{ t('news.heroLead') }}</p>
      </div>
    </header>

    <nav class="gn__tabs" :aria-label="t('news.tabsAria')">
      <button
        v-for="s in segments"
        :key="s.key"
        type="button"
        class="gn__tab"
        :class="{ 'gn__tab--on': segment === s.key }"
        @click="store.setSegment(s.key)"
      >
        {{ s.label }}
      </button>
    </nav>

    <div class="gn__toolbar">
      <el-input v-model="searchQuery" class="gn__search" clearable :placeholder="t('news.searchPh')" />
      <el-select
        :model-value="categoryFilter"
        class="gn__sel"
        :disabled="segment === 'flash'"
        :teleported="true"
        @update:model-value="store.setCategory($event as typeof categoryFilter)"
      >
        <el-option v-for="c in cats" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
    </div>

    <section class="gn__rules" :aria-label="t('news.rulesTitle')">
      <h2 class="gn__rules-h">{{ t('news.rulesTitle') }}</h2>
      <ul class="gn__rules-ul">
        <li v-for="i in 4" :key="i">{{ t(`news.rules.i${i}`) }}</li>
      </ul>
    </section>

    <div class="gn__layout">
      <ExPageState
        class="gn__main"
        :loading="loading && !articles.length"
        use-skeleton
        skeleton-variant="panel"
        :error="loadError"
        :loading-text="t('news.loading')"
        @retry="store.refresh()"
      >
        <template v-if="segment === 'featured' && featuredList.length">
          <div class="gn__spotlight">
            <article
              v-for="(m, idx) in featuredList"
              :key="m.slug"
              class="gn__spot"
              :class="{ 'gn__spot--hero': idx === 0 }"
              tabindex="0"
              role="button"
              @click="openArticle(m)"
              @keydown.enter="openArticle(m)"
            >
              <div class="gn__spot-img">
                <img :src="coverForArticle(m)" :alt="titleOf(m)" />
              </div>
              <div class="gn__spot-body">
                <span class="gn__spot-pill">{{ t(`news.cat.${m.category}`) }}</span>
                <h2 class="gn__spot-title">{{ titleOf(m) }}</h2>
                <p class="gn__spot-sum">{{ summaryOf(m) }}</p>
                <time class="gn__spot-time">{{ fmtTime(m.publishedAt) }}</time>
              </div>
            </article>
          </div>
        </template>

        <p v-if="displayArticles.length === 0" class="gn__empty">{{ t('news.empty') }}</p>

        <ul v-else class="gn__list">
          <li
            v-for="m in displayArticles"
            :key="m.slug"
            class="gn__row"
            tabindex="0"
            role="button"
            @click="openArticle(m)"
            @keydown.enter="openArticle(m)"
          >
            <div class="gn__row-img">
              <img :src="coverForArticle(m, 320, 180)" :alt="titleOf(m)" />
            </div>
            <div class="gn__row-body">
              <div class="gn__row-meta">
                <span class="gn__row-pill">{{ t(`news.cat.${m.category}`) }}</span>
                <time>{{ fmtTime(m.publishedAt) }}</time>
                <span>{{ t('news.readMin', { n: m.readMin }) }}</span>
              </div>
                <h3 class="gn__row-title">{{ titleOf(m) }}</h3>
                <p class="gn__row-sum">{{ summaryOf(m) }}</p>
            </div>
          </li>
        </ul>

        <p class="gn__disclaimer">{{ t('news.disclaimer') }}</p>
      </ExPageState>

      <aside class="gn__aside" :aria-label="t('news.sidebarTitle')">
        <h3 class="gn__aside-h">{{ t('news.sidebarTitle') }}</h3>
        <ol class="gn__trend">
          <li v-for="(m, i) in trending" :key="m.slug" class="gn__trend-item">
            <button type="button" class="gn__trend-btn" @click="openArticle(m)">
              <span class="gn__trend-rank ex-num">{{ i + 1 }}</span>
              <span class="gn__trend-text">{{ titleOf(m) }}</span>
              <span class="gn__trend-views ex-num">{{ m.views.toLocaleString() }}</span>
            </button>
          </li>
        </ol>
      </aside>
    </div>

    <NewsArticleDrawer v-model="drawerOpen" :meta="selectedMeta" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.gn {
  width: 100%;
  max-width: min(1200px, var(--ex-container-max));
  margin-inline: auto;
  min-width: 0;
}

.gn__hero {
  margin-bottom: $space-5;
}

.gn__hero-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
}

.gn__title {
  margin: 0;
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.gn__lead {
  margin: 0;
  max-width: 720px;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.gn__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $color-border;
}

.gn__tab {
  padding: 10px 16px;
  border-radius: $radius-sm;
  border: 1px solid transparent;
  background: transparent;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  cursor: pointer;

  &:hover {
    color: $color-text-primary;
    background: var(--ex-bg-muted);
  }

  &--on {
    color: $color-brand;
    background: var(--ex-brand-muted);
    border-color: color-mix(in srgb, var(--ex-brand) 28%, transparent);
  }
}

.gn__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
}

.gn__search {
  flex: 1 1 200px;
  min-width: 180px;
  max-width: 360px;
}

.gn__sel {
  width: 160px;
}

.gn__rules {
  margin-bottom: $space-5;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: color-mix(in srgb, var(--ex-brand) 4%, transparent);
}

.gn__rules-h {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.gn__rules-ul {
  margin: 0;
  padding-left: 1.2em;
  font-size: 11px;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.gn__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: $space-5;
  align-items: start;

  @include mq.media-down(lg) {
    grid-template-columns: 1fr;
  }
}

.gn__main {
  min-width: 0;
}

.gn__spotlight {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-5;

  @include mq.media-up(md) {
    grid-template-columns: 1.2fr 1fr;
    grid-template-rows: auto auto;
  }
}

.gn__spot {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-card-surface);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
    transform: translateY(-2px);
  }

  &--hero {
    @include mq.media-up(md) {
      grid-row: 1 / -1;
    }
  }
}

.gn__spot-img img {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
  display: block;
}

.gn__spot--hero .gn__spot-img img {
  aspect-ratio: 16/11;
}

.gn__spot-body {
  padding: $space-3;
}

.gn__spot-pill {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.gn__spot-title {
  margin: $space-2 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gn__spot--hero .gn__spot-title {
  font-size: $font-size-lg;
  -webkit-line-clamp: 4;
}

.gn__spot-sum {
  margin: 0 0 $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gn__spot-time {
  font-size: 10px;
  color: $color-text-tertiary;
}

.gn__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.gn__row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--ex-brand) 30%, transparent);
  }

  @include mq.media-down(sm) {
    grid-template-columns: 1fr;
  }
}

.gn__row-img img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: $radius-sm;
  display: block;
}

.gn__row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  font-size: 10px;
  color: $color-text-tertiary;
  margin-bottom: 6px;
}

.gn__row-pill {
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.gn__row-title {
  margin: 0 0 6px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.gn__row-sum {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gn__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.gn__disclaimer {
  margin: $space-6 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.gn__aside {
  position: sticky;
  top: $space-4;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);

  @include mq.media-down(lg) {
    position: static;
  }
}

.gn__aside-h {
  margin: 0 0 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.gn__trend {
  list-style: none;
  margin: 0;
  padding: 0;
}

.gn__trend-item + .gn__trend-item {
  margin-top: $space-2;
}

.gn__trend-btn {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: $space-2;
  align-items: start;
  padding: $space-2;
  border: none;
  border-radius: $radius-sm;
  background: var(--ex-bg-muted);
  color: $color-text-primary;
  text-align: left;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.4;

  &:hover {
    background: color-mix(in srgb, var(--ex-brand) 8%, transparent);
  }
}

.gn__trend-rank {
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.gn__trend-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gn__trend-views {
  font-size: 10px;
  color: $color-text-tertiary;
  white-space: nowrap;
}
</style>
