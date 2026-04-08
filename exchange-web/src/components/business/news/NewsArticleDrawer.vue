<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import type { NewsArticleMeta } from '@/types/news'
import { coverForArticle } from '@/api/news'
import { RouteNames } from '@/constants/routeNames'

const props = defineProps<{
  modelValue: boolean
  meta: NewsArticleMeta | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const router = useRouter()
const { t } = useI18n()
const app = useAppStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const isExternal = computed(() => Boolean(props.meta?.external?.url))

const title = computed(() => {
  if (!props.meta) return ''
  return props.meta.external?.title ?? t(`news.items.${props.meta.slug}.title`)
})

const summary = computed(() => {
  if (!props.meta) return ''
  return props.meta.external?.summary ?? t(`news.items.${props.meta.slug}.summary`)
})

const paragraphs = computed(() => {
  if (!props.meta || isExternal.value) return []
  const raw = t(`news.items.${props.meta.slug}.body`) as string
  return raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
})

const cover = computed(() => (props.meta ? coverForArticle(props.meta, 800, 420) : ''))

function catLabel(c: string) {
  return t(`news.cat.${c}`)
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function goReadFullPage() {
  const s = props.meta?.slug
  if (!s) return
  visible.value = false
  void router.push({ name: RouteNames.MoreGlobalNewsArticle, params: { slug: s } })
}

function absoluteArticlePageUrl(): string | null {
  const s = props.meta?.slug
  if (!s) return null
  const fp = router.resolve({
    name: RouteNames.MoreGlobalNewsArticle,
    params: { slug: s },
  }).fullPath
  const base = import.meta.env.BASE_URL
  const path = base === '/' ? fp : `${String(base).replace(/\/$/, '')}${fp}`
  return `${window.location.origin}${path}`
}

function copyPageLink() {
  const abs = absoluteArticlePageUrl()
  if (!abs) return
  void navigator.clipboard?.writeText(abs).then(
    () => app.pushToast('success', t('news.toast.linkCopied')),
    () => app.pushToast('info', t('news.toast.shareDemo')),
  )
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="title"
    direction="rtl"
    size="min(100%, 520px)"
    destroy-on-close
    append-to-body
    class="news-drawer"
  >
    <template v-if="meta">
      <article class="news-article">
        <div class="news-article__cover">
          <img :src="cover" :alt="title" />
        </div>
        <div class="news-article__meta">
          <span class="news-article__pill">{{ catLabel(meta.category) }}</span>
          <span class="news-article__time">{{ fmtTime(meta.publishedAt) }}</span>
          <span class="news-article__read">{{ t('news.readMin', { n: meta.readMin }) }}</span>
          <span class="news-article__views">{{ t('news.views', { n: meta.views.toLocaleString() }) }}</span>
        </div>
        <p class="news-article__summary">{{ summary }}</p>

        <template v-if="isExternal">
          <p class="news-article__read-lead">{{ t('news.readFullLead') }}</p>
          <button type="button" class="news-article__origin" @click="goReadFullPage">
            {{ t('news.readFullArticle') }}
          </button>
        </template>
        <div v-else class="news-article__body">
          <p v-for="(p, i) in paragraphs" :key="i" class="news-article__p">{{ p }}</p>
        </div>

        <p class="news-article__risk">{{ t('news.detailRisk') }}</p>
        <button type="button" class="news-article__share" @click="copyPageLink">
          {{ t('news.copyPageLink') }}
        </button>
      </article>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.news-article__cover {
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid $color-border;
  margin-bottom: $space-3;
  background: var(--ex-bg-muted);
}

.news-article__cover img {
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.news-article__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  font-size: 11px;
  color: $color-text-tertiary;
  margin-bottom: $space-3;
}

.news-article__pill {
  padding: 4px 10px;
  border-radius: $radius-sm;
  font-weight: $font-weight-bold;
  background: var(--ex-brand-muted);
  color: $color-brand;
  border: 1px solid color-mix(in srgb, var(--ex-brand) 25%, transparent);
}

.news-article__summary {
  margin: 0 0 $space-4;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.news-article__read-lead {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.news-article__origin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: $space-4;
  padding: 12px 18px;
  border-radius: $radius-sm;
  border: none;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, color-mix(in srgb, var(--ex-brand) 92%, #000) 0%, var(--ex-brand) 100%);
}

.news-article__origin:hover {
  filter: brightness(1.06);
}

.news-article__body {
  font-size: $font-size-sm;
  line-height: 1.65;
  color: $color-text-primary;
}

.news-article__p + .news-article__p {
  margin-top: $space-3;
}

.news-article__risk {
  margin: $space-5 0 0;
  padding: $space-3;
  border-radius: $radius-sm;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
  background: var(--ex-bg-muted);
  border: 1px solid $color-border;
}

.news-article__share {
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

.news-article__share:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
}
</style>

<style lang="scss">
.news-drawer.el-drawer {
  --el-drawer-bg-color: var(--ex-card-surface);
}
</style>
