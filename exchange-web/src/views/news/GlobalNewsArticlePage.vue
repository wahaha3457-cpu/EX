<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useNewsHubStore } from '@/stores/newsHub'
import { useAppStore } from '@/stores/app'
import { coverForArticle } from '@/api/news'
import ExPageState from '@/components/common/ExPageState.vue'
import { RouteNames } from '@/constants/routeNames'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const app = useAppStore()
const store = useNewsHubStore()
const { articles, loading, loadError } = storeToRefs(store)

const slug = computed(() => String(route.params.slug ?? '').trim())

onMounted(() => {
  void store.bootstrap()
})

watch(slug, (s) => {
  if (!s) void router.replace({ name: RouteNames.MoreGlobalNews })
})

const meta = computed(() => articles.value.find((a) => a.slug === slug.value) ?? null)

const title = computed(() => {
  const m = meta.value
  if (!m) return ''
  return m.external?.title ?? t(`news.items.${m.slug}.title`)
})

const summary = computed(() => {
  const m = meta.value
  if (!m) return ''
  return m.external?.summary ?? t(`news.items.${m.slug}.summary`)
})

const bodyParagraphs = computed(() => {
  const m = meta.value
  if (!m) return []
  if (m.external?.url) {
    const ft = (m.external.fullText ?? m.external.summary).trim()
    if (!ft) return []
    const parts = ft.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    return parts.length ? parts : [ft]
  }
  const raw = t(`news.items.${m.slug}.body`) as string
  return raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
})

const cover = computed(() => (meta.value ? coverForArticle(meta.value, 960, 480) : ''))

function catLabel(c: string) {
  return t(`news.cat.${c}`)
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function backToList() {
  void router.push({ name: RouteNames.MoreGlobalNews })
}

function absoluteArticlePageUrl(): string {
  const fp = router.resolve({
    name: RouteNames.MoreGlobalNewsArticle,
    params: { slug: slug.value },
  }).fullPath
  const base = import.meta.env.BASE_URL
  const path = base === '/' ? fp : `${String(base).replace(/\/$/, '')}${fp}`
  return `${window.location.origin}${path}`
}

function copyArticleLink() {
  void navigator.clipboard?.writeText(absoluteArticlePageUrl()).then(
    () => app.pushToast('success', t('news.toast.linkCopied')),
    () => app.pushToast('info', t('news.toast.shareDemo')),
  )
}

const initialLoading = computed(() => loading.value && articles.value.length === 0)

watch(
  () =>
    [loading.value, loadError.value, articles.value.length, slug.value, meta.value] as const,
  ([isLoading, err, len, s, m]) => {
    if (isLoading || err) return
    if (len > 0 && s && !m) {
      app.pushToast('info', t('news.articleNotFound'))
      void router.replace({ name: RouteNames.MoreGlobalNews })
    }
  },
)
</script>

<template>
  <div class="gna">
    <ExPageState
      :loading="initialLoading"
      :error="loadError && articles.length === 0 ? loadError : null"
      :loading-text="t('news.loading')"
      @retry="store.refresh()"
    >
      <template v-if="meta">
        <nav class="gna__nav">
          <button type="button" class="gna__back" @click="backToList">
            {{ t('news.backToNewsList') }}
          </button>
        </nav>

        <article class="gna__article">
          <div class="gna__cover">
            <img :src="cover" :alt="title" />
          </div>

          <div class="gna__meta">
            <span class="gna__pill">{{ catLabel(meta.category) }}</span>
            <span class="gna__time">{{ fmtTime(meta.publishedAt) }}</span>
            <span class="gna__read">{{ t('news.readMin', { n: meta.readMin }) }}</span>
            <span class="gna__views">{{ t('news.views', { n: meta.views.toLocaleString() }) }}</span>
          </div>

          <h1 class="gna__title">{{ title }}</h1>

          <p class="gna__summary">{{ summary }}</p>

          <div class="gna__body">
            <p v-for="(p, i) in bodyParagraphs" :key="i" class="gna__p">{{ p }}</p>
          </div>

          <p class="gna__risk">{{ t('news.detailRisk') }}</p>
          <p class="gna__footer-note">{{ t('news.footerNote') }}</p>

          <button type="button" class="gna__copy" @click="copyArticleLink">
            {{ t('news.copyPageLink') }}
          </button>
        </article>
      </template>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.gna {
  width: 100%;
  max-width: min(720px, var(--ex-container-max));
  margin-inline: auto;
  padding: $space-4 $space-3 $space-6;
  box-sizing: border-box;
}

.gna__nav {
  margin-bottom: $space-4;
}

.gna__back {
  padding: 8px 14px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
  font-size: $font-size-xs;
  cursor: pointer;
}

.gna__back:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
  color: $color-text-primary;
}

.gna__article {
  text-align: left;
}

.gna__cover {
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid $color-border;
  margin-bottom: $space-4;
  background: var(--ex-bg-muted);
}

.gna__cover img {
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.gna__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  font-size: 11px;
  color: $color-text-tertiary;
  margin-bottom: $space-3;
}

.gna__pill {
  padding: 4px 10px;
  border-radius: $radius-sm;
  font-weight: $font-weight-bold;
  background: var(--ex-brand-muted);
  color: $color-brand;
  border: 1px solid color-mix(in srgb, var(--ex-brand) 25%, transparent);
}

.gna__title {
  margin: 0 0 $space-3;
  font-size: clamp(1.25rem, 3vw, 1.6rem);
  font-weight: $font-weight-bold;
  line-height: 1.35;
  color: $color-text-primary;
  letter-spacing: -0.02em;
}

.gna__summary {
  margin: 0 0 $space-4;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.gna__body {
  font-size: $font-size-md;
  line-height: 1.75;
  color: $color-text-primary;
  letter-spacing: 0.01em;
}

.gna__p + .gna__p {
  margin-top: $space-4;
}

.gna__risk {
  margin: $space-5 0 0;
  padding: $space-3;
  border-radius: $radius-sm;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
  background: var(--ex-bg-muted);
  border: 1px solid $color-border;
}

.gna__footer-note {
  margin: $space-3 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.gna__copy {
  margin-top: $space-4;
  padding: 10px 18px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-brand;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  cursor: pointer;
}

.gna__copy:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
}
</style>
