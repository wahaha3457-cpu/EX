<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ANNOUNCE_CATEGORY_LABEL } from '@/api/support/announceMock'
import type { AnnounceCategory, AnnounceCenterItem } from '@/types/supportHub'
import { useAnnounceCenterStore, type AnnounceFilter } from '@/stores/announceCenter'
import ExPageState from '@/components/common/ExPageState.vue'
import SupportHubNav from '@/components/support/SupportHubNav.vue'
import AnnounceDetailModal from '@/components/support/AnnounceDetailModal.vue'

const store = useAnnounceCenterStore()
const { loading, loadError, filtered, filter } = storeToRefs(store)
const route = useRoute()
const router = useRouter()

const detailOpen = ref(false)
const detailItem = ref<AnnounceCenterItem | null>(null)

const chips: { key: AnnounceFilter; label: string }[] = [
  { key: 'ALL', label: '全部' },
  ...Object.entries(ANNOUNCE_CATEGORY_LABEL).map(([key, label]) => ({
    key: key as AnnounceCategory,
    label,
  })),
]

onMounted(() => {
  void store.bootstrap()
})

watch(
  () => route.query.id,
  (id) => {
    const sid = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
    if (!sid) return
    void store.bootstrap().then(() => {
      const row = store.getById(sid)
      if (row) {
        detailItem.value = row
        detailOpen.value = true
      }
    })
  },
  { immediate: true },
)

function openDetail(row: AnnounceCenterItem) {
  detailItem.value = row
  detailOpen.value = true
  void router.replace({ query: { ...route.query, id: row.id } })
}

watch(detailOpen, (v) => {
  if (!v && route.query.id) {
    const q = { ...route.query }
    delete q.id
    void router.replace({ query: q })
  }
})

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('zh-CN')
}

const categoryLabel = (c: AnnounceCenterItem['category']) => store.categoryLabel(c)
</script>

<template>
  <div class="acp">
    <header class="acp__hero">
      <h1 class="acp__title">公告中心</h1>
      <p class="acp__sub">平台维护、上新、风控与活动通知 · 按类型筛选（演示数据）</p>
    </header>

    <SupportHubNav />

    <div class="acp__chips" role="tablist" aria-label="公告分类">
      <button
        v-for="c in chips"
        :key="c.key"
        type="button"
        role="tab"
        class="acp__chip"
        :class="{ 'acp__chip--on': filter === c.key }"
        @click="filter = c.key"
      >
        {{ c.label }}
      </button>
    </div>

    <ExPageState
      :loading="loading && filtered.length === 0"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载公告…"
      @retry="store.bootstrap(true)"
    >
      <ul class="acp__list">
        <li v-for="row in filtered" :key="row.id" class="acp-row">
          <button type="button" class="acp-row__btn" @click="openDetail(row)">
            <div class="acp-row__top">
              <span v-if="row.pinned" class="acp-row__pin">置顶</span>
              <span class="acp-row__cat">{{ categoryLabel(row.category) }}</span>
              <time class="acp-row__time" :datetime="row.publishedAt">{{ fmtDate(row.publishedAt) }}</time>
            </div>
            <span class="acp-row__title">{{ row.title }}</span>
            <p class="acp-row__sum">{{ row.summary }}</p>
          </button>
        </li>
      </ul>
      <p v-if="!loading && !filtered.length" class="acp__empty">该分类下暂无公告</p>
    </ExPageState>

    <p class="acp__foot">
      重要公告可能通过站内信与邮件同步推送。设计参考
      <a class="acp__a" href="https://www.binance.com/zh-CN/support/announcement" target="_blank" rel="noopener noreferrer">币安公告</a>
      信息架构。
    </p>

    <AnnounceDetailModal v-model="detailOpen" :item="detailItem" :category-label="categoryLabel" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.acp {
  max-width: min(800px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.acp__hero {
  margin-bottom: $space-3;
}

.acp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.acp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.acp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $space-4;
}

.acp__chip {
  padding: 6px 14px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: 999px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-tertiary;
  cursor: pointer;
}

.acp__chip--on {
  color: $color-text-primary;
  border-color: rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.12);
}

.acp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.acp-row__btn {
  width: 100%;
  text-align: left;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(240, 185, 11, 0.35);
  }
}

.acp-row__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: $space-2;
}

.acp-row__pin {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.2);
  color: $color-brand;
}

.acp-row__cat {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.12);
  color: #6bb6ff;
}

.acp-row__time {
  margin-left: auto;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.acp-row__title {
  display: block;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
  margin-bottom: $space-2;
}

.acp-row__sum {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.acp__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.acp__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.acp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.acp__a:hover {
  text-decoration: underline;
}
</style>
