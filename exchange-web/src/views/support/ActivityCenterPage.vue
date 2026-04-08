<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { ActivityCenterItem } from '@/types/supportHub'
import { useActivityCenterStore, type ActivityFilter } from '@/stores/activityCenter'
import ExPageState from '@/components/common/ExPageState.vue'
import SupportHubNav from '@/components/support/SupportHubNav.vue'
import ActivityDetailModal from '@/components/support/ActivityDetailModal.vue'

const store = useActivityCenterStore()
const { loading, loadError, filtered, filter } = storeToRefs(store)
const route = useRoute()
const router = useRouter()

const detailOpen = ref(false)
const detailItem = ref<ActivityCenterItem | null>(null)

const chips: { key: ActivityFilter; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'ONGOING', label: '进行中' },
  { key: 'UPCOMING', label: '即将开始' },
  { key: 'ENDED', label: '已结束' },
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

watch(detailOpen, (v) => {
  if (!v && route.query.id) {
    const q = { ...route.query }
    delete q.id
    void router.replace({ query: q })
  }
})

function openDetail(row: ActivityCenterItem) {
  detailItem.value = row
  detailOpen.value = true
  void router.replace({ query: { ...route.query, id: row.id } })
}

function toneClass(t: ActivityCenterItem['tone']) {
  return `act-card--${t}`
}

function onJoin(id: string) {
  store.joinActivity(id)
}

const selectedFromStore = computed(() => (detailItem.value ? store.getById(detailItem.value.id) : null))
</script>

<template>
  <div class="avp">
    <header class="avp__hero">
      <h1 class="avp__title">活动中心</h1>
      <p class="avp__sub">交易赛、理财加息、合约挑战等 · 报名与奖励以活动规则为准（演示）</p>
    </header>

    <SupportHubNav />

    <div class="avp__chips" role="tablist" aria-label="活动状态">
      <button
        v-for="c in chips"
        :key="c.key"
        type="button"
        role="tab"
        class="avp__chip"
        :class="{ 'avp__chip--on': filter === c.key }"
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
      loading-text="加载活动…"
      @retry="store.bootstrap(true)"
    >
      <div class="avp__grid">
        <article
          v-for="row in filtered"
          :key="row.id"
          class="act-card"
          :class="toneClass(row.tone)"
        >
          <div class="act-card__head">
            <span
              class="act-card__st"
              :class="{
                'act-card__st--on': row.status === 'ONGOING',
                'act-card__st--soon': row.status === 'UPCOMING',
                'act-card__st--end': row.status === 'ENDED',
              }"
            >
              {{ store.statusLabel(row.status) }}
            </span>
            <span v-if="row.joined" class="act-card__joined">已报名</span>
          </div>
          <h2 class="act-card__title">{{ row.title }}</h2>
          <p class="act-card__sub">{{ row.subtitle }}</p>
          <p class="act-card__reward">{{ row.rewardHint }}</p>
          <button type="button" class="act-card__btn" @click="openDetail(row)">查看详情</button>
        </article>
      </div>
      <p v-if="!loading && !filtered.length" class="avp__empty">暂无活动</p>
    </ExPageState>

    <p class="avp__foot">
      奖励发放可能存在延迟，请以「资产流水」与活动公告为准。交互参考
      <a class="avp__a" href="https://www.binance.com/zh-CN/support/announcement/c-48" target="_blank" rel="noopener noreferrer">币安活动</a>
      列表体验。
    </p>

    <ActivityDetailModal
      v-model="detailOpen"
      :item="selectedFromStore"
      :status-label="store.statusLabel"
      @join="onJoin"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.avp {
  max-width: min(1000px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.avp__hero {
  margin-bottom: $space-3;
}

.avp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.avp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.avp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $space-4;
}

.avp__chip {
  padding: 6px 14px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  border-radius: 999px;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
  color: $color-text-tertiary;
  cursor: pointer;
}

.avp__chip--on {
  color: $color-text-primary;
  border-color: rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.12);
}

.avp__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.act-card {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-height: 200px;
}

.act-card--gold {
  background: linear-gradient(155deg, rgba(60, 45, 20, 0.95) 0%, #1a1610 100%);
}

.act-card--cyan {
  background: linear-gradient(155deg, rgba(20, 45, 55, 0.95) 0%, #101a1f 100%);
}

.act-card--violet {
  background: linear-gradient(155deg, rgba(45, 30, 60, 0.95) 0%, #16101c 100%);
}

.act-card--green {
  background: linear-gradient(155deg, rgba(25, 50, 35, 0.95) 0%, #101814 100%);
}

.act-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.act-card__st {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.act-card__st--on {
  background: rgba(14, 203, 129, 0.18);
  color: $color-rise;
}

.act-card__st--soon {
  background: rgba(48, 132, 252, 0.18);
  color: #6bb6ff;
}

.act-card__st--end {
  background: var(--ex-fill-hover-subtle);
  color: $color-text-tertiary;
}

.act-card__joined {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.act-card__title {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.3;
}

.act-card__sub {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
  flex: 1;
}

.act-card__reward {
  margin: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
}

.act-card__btn {
  margin-top: auto;
  align-self: flex-start;
  padding: 8px $space-4;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  cursor: pointer;
}

.act-card__btn:hover {
  background: rgba(240, 185, 11, 0.2);
}

.avp__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.avp__foot {
  margin-top: $space-6;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.avp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.avp__a:hover {
  text-decoration: underline;
}
</style>

<style lang="scss">
/* 浅色下活动卡避免「深色渐变块」割裂白底站观感 */
[data-theme='monochrome'] .avp {
  .act-card--gold {
    background: linear-gradient(155deg, #fffbf0 0%, #fff0cc 100%);
  }

  .act-card--cyan {
    background: linear-gradient(155deg, #f0f7ff 0%, #e8f2ff 100%);
  }

  .act-card--violet {
    background: linear-gradient(155deg, #f6f0ff 0%, #ece4ff 100%);
  }

  .act-card--green {
    background: linear-gradient(155deg, #eefaf3 0%, #dff5ea 100%);
  }
}
</style>
