<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCharityHubStore } from '@/stores/charityHub'
import { charityCoverUrl, getCampaignBySlug } from '@/api/charity/charityMock'
import ExPageState from '@/components/common/ExPageState.vue'
import { CharityCampaignDrawer } from '@/components/business/charity'
import { formatPrice } from '@/utils/format'
import type { CharityCampaign, CharityDonationLedgerEntry } from '@/types/charity'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useCharityHubStore()
const {
  segment,
  categoryFilter,
  searchQuery,
  campaigns,
  stats,
  loading,
  loadError,
  selectedSlug,
  selectedMeta,
  filteredCampaigns,
  donationLedger,
} = storeToRefs(store)

function closeDrawer() {
  store.closeCampaign()
  void router.replace({ path: '/more/charity' })
}

function openCampaign(m: CharityCampaign) {
  store.openCampaign(m.slug)
  void router.replace({ path: '/more/charity', query: { c: m.slug } })
}

const drawerOpen = computed({
  get: () => selectedSlug.value != null,
  set: (v: boolean) => {
    if (!v) closeDrawer()
  },
})

const displayCampaigns = computed(() => {
  const base = filteredCampaigns.value
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return base
  return base.filter((c) => {
    const title = t(`charity.items.${c.slug}.title`).toLowerCase()
    const summary = t(`charity.items.${c.slug}.summary`).toLowerCase()
    return title.includes(q) || summary.includes(q)
  })
})

const segments = computed(() =>
  (['all', 'active', 'completed'] as const).map((k) => ({
    key: k,
    label: t(`charity.tab.${k}`),
  })),
)

const cats = computed(() =>
  (['ALL', 'EDUCATION', 'DISASTER', 'ENVIRONMENT', 'CHILDREN', 'HEALTH'] as const).map((k) => ({
    value: k,
    label: t(`charity.cat.${k}`),
  })),
)

onMounted(() => {
  void store.bootstrap().then(syncFromRoute)
})

function syncFromRoute() {
  const c = route.query.c
  if (typeof c === 'string' && getCampaignBySlug(c)) {
    store.openCampaign(c)
  }
}

watch(
  () => route.query.c,
  (c) => {
    if (typeof c === 'string' && getCampaignBySlug(c)) {
      store.openCampaign(c)
    } else {
      store.closeCampaign()
    }
  },
)

function pct(m: CharityCampaign) {
  if (m.goalUsdt <= 0) return 0
  return Math.min(100, Math.round((m.raisedUsdt / m.goalUsdt) * 1000) / 10)
}

function titleOf(slug: string) {
  return t(`charity.items.${slug}.title`)
}

function summaryOf(slug: string) {
  return t(`charity.items.${slug}.summary`)
}

function fmtLedgerTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function openDonationProject(row: CharityDonationLedgerEntry) {
  const m = campaigns.value.find((c) => c.slug === row.slug)
  if (m) openCampaign(m)
}
</script>

<template>
  <div class="ch-page">
    <header class="ch-page__hero">
      <div class="ch-page__hero-text">
        <h1 class="ch-page__title">{{ t('charity.heroTitle') }}</h1>
        <p class="ch-page__lead">{{ t('charity.heroLead') }}</p>
      </div>
      <div v-if="stats" class="ch-page__stats">
        <div class="ch-page__stat">
          <span class="ch-page__stat-v ex-num">{{ formatPrice(stats.totalRaisedUsdt) }}</span>
          <span class="ch-page__stat-k">{{ t('charity.stats.raised') }}</span>
        </div>
        <div class="ch-page__stat">
          <span class="ch-page__stat-v ex-num">{{ stats.totalDonors.toLocaleString() }}</span>
          <span class="ch-page__stat-k">{{ t('charity.stats.donors') }}</span>
        </div>
        <div class="ch-page__stat">
          <span class="ch-page__stat-v ex-num">{{ stats.projectCount }}</span>
          <span class="ch-page__stat-k">{{ t('charity.stats.projects') }}</span>
        </div>
      </div>
    </header>

    <section class="ch-page__how" :aria-label="t('charity.howTitle')">
      <h2 class="ch-page__how-h">{{ t('charity.howTitle') }}</h2>
      <div class="ch-page__how-grid">
        <div v-for="i in 3" :key="i" class="ch-page__how-card">
          <span class="ch-page__how-n ex-num">{{ i }}</span>
          <h3 class="ch-page__how-t">{{ t(`charity.how.${i}.title`) }}</h3>
          <p class="ch-page__how-p">{{ t(`charity.how.${i}.body`) }}</p>
        </div>
      </div>
    </section>

    <section class="ch-page__ledger" :aria-label="t('charity.myDonations.aria')">
      <h2 class="ch-page__ledger-h">{{ t('charity.myDonations.title') }}</h2>
      <p class="ch-page__ledger-hint">{{ t('charity.myDonations.hint') }}</p>
      <p v-if="!donationLedger.length" class="ch-page__ledger-empty">{{ t('charity.myDonations.empty') }}</p>
      <ul v-else class="ch-page__ledger-ul">
        <li v-for="row in donationLedger" :key="row.id" class="ch-page__ledger-li">
          <div class="ch-page__ledger-main">
            <span class="ch-page__ledger-title">{{ titleOf(row.slug) }}</span>
            <span class="ch-page__ledger-amt ex-num">{{ formatPrice(row.amountUsdt) }} USDT</span>
          </div>
          <div class="ch-page__ledger-meta">
            <span>{{ fmtLedgerTime(row.time) }}</span>
            <span class="ch-page__ledger-ref">{{ t('charity.myDonations.orderRef') }}：{{ row.orderRef }}</span>
          </div>
          <button type="button" class="ch-page__ledger-link" @click="openDonationProject(row)">
            {{ t('charity.myDonations.open') }}
          </button>
        </li>
      </ul>
    </section>

    <nav class="ch-page__tabs" :aria-label="t('charity.tabsAria')">
      <button
        v-for="s in segments"
        :key="s.key"
        type="button"
        class="ch-page__tab"
        :class="{ 'ch-page__tab--on': segment === s.key }"
        @click="store.setSegment(s.key)"
      >
        {{ s.label }}
      </button>
    </nav>

    <div class="ch-page__toolbar">
      <el-input v-model="searchQuery" class="ch-page__search" clearable :placeholder="t('charity.searchPh')" />
      <el-select
        :model-value="categoryFilter"
        class="ch-page__sel"
        :teleported="true"
        @update:model-value="store.setCategory($event as typeof categoryFilter)"
      >
        <el-option v-for="c in cats" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
    </div>

    <section class="ch-page__rules">
      <h2 class="ch-page__rules-h">{{ t('charity.rulesTitle') }}</h2>
      <ul class="ch-page__rules-ul">
        <li v-for="i in 4" :key="i">{{ t(`charity.rules.i${i}`) }}</li>
      </ul>
    </section>

    <ExPageState
      :loading="loading && !campaigns.length"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      :loading-text="t('charity.loading')"
      @retry="store.refresh()"
    >
      <p v-if="displayCampaigns.length === 0" class="ch-page__empty">{{ t('charity.empty') }}</p>

      <div v-else class="ch-page__grid">
        <article
          v-for="m in displayCampaigns"
          :key="m.slug"
          class="ch-card"
          tabindex="0"
          role="button"
          @click="openCampaign(m)"
          @keydown.enter="openCampaign(m)"
        >
          <div class="ch-card__media">
            <img :src="charityCoverUrl(m.coverSeed)" :alt="titleOf(m.slug)" />
            <span
              class="ch-card__badge"
              :class="m.status === 'ACTIVE' ? 'ch-card__badge--ok' : 'ch-card__badge--done'"
              >{{ m.status === 'ACTIVE' ? t('charity.badge.active') : t('charity.badge.completed') }}</span
            >
          </div>
          <div class="ch-card__body">
            <span class="ch-card__cat">{{ t(`charity.cat.${m.category}`) }}</span>
            <h3 class="ch-card__title">{{ titleOf(m.slug) }}</h3>
            <p class="ch-card__sum">{{ summaryOf(m.slug) }}</p>
            <div class="ch-card__prog">
              <div class="ch-card__track">
                <div class="ch-card__fill" :style="{ width: `${pct(m)}%` }" />
              </div>
              <div class="ch-card__nums">
                <span>{{ formatPrice(m.raisedUsdt) }} / {{ formatPrice(m.goalUsdt) }} USDT</span>
                <span>{{ pct(m) }}%</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <p class="ch-page__disclaimer">{{ t('charity.disclaimer') }}</p>
    </ExPageState>

    <CharityCampaignDrawer v-model="drawerOpen" :meta="selectedMeta" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ch-page {
  width: 100%;
  max-width: min(1200px, var(--ex-container-max));
  margin-inline: auto;
  min-width: 0;
}

.ch-page__hero {
  display: grid;
  gap: $space-4;
  margin-bottom: $space-5;
  align-items: end;

  @include mq.media-up(md) {
    grid-template-columns: 1fr auto;
  }
}

.ch-page__title {
  margin: 0 0 $space-2;
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ch-page__lead {
  margin: 0;
  max-width: 680px;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.ch-page__stats {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.ch-page__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.ch-page__stat-v {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-rise;
}

.ch-page__stat-k {
  font-size: 10px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ch-page__how {
  margin-bottom: $space-5;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: color-mix(in srgb, var(--ex-rise) 5%, transparent);
}

.ch-page__how-h {
  margin: 0 0 $space-4;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ch-page__how-grid {
  display: grid;
  gap: $space-3;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.ch-page__how-card {
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.ch-page__how-n {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: $font-weight-bold;
  background: var(--ex-brand-muted);
  color: $color-brand;
  margin-bottom: $space-2;
}

.ch-page__how-t {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ch-page__how-p {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.ch-page__ledger {
  margin-bottom: $space-5;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid color-mix(in srgb, var(--ex-rise) 22%, transparent);
  background: color-mix(in srgb, var(--ex-rise) 6%, transparent);
}

.ch-page__ledger-h {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ch-page__ledger-hint {
  margin: 0 0 $space-3;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.ch-page__ledger-empty {
  margin: 0;
  padding: $space-4 0;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.ch-page__ledger-ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.ch-page__ledger-li {
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.ch-page__ledger-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $space-2;
  margin-bottom: 6px;
}

.ch-page__ledger-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
}

.ch-page__ledger-amt {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-rise;
  flex-shrink: 0;
}

.ch-page__ledger-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  font-size: 10px;
  color: $color-text-tertiary;
  margin-bottom: $space-2;
}

.ch-page__ledger-ref {
  font-family: $font-family-mono;
  word-break: break-all;
}

.ch-page__ledger-link {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid color-mix(in srgb, var(--ex-rise) 35%, transparent);
  background: var(--ex-rise-bg);
  color: $color-rise;
  cursor: pointer;
}

.ch-page__ledger-link:hover {
  filter: brightness(1.05);
}

.ch-page__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $color-border;
}

.ch-page__tab {
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
    color: $color-rise;
    background: color-mix(in srgb, var(--ex-rise) 12%, transparent);
    border-color: color-mix(in srgb, var(--ex-rise) 28%, transparent);
  }
}

.ch-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
}

.ch-page__search {
  flex: 1 1 200px;
  min-width: 180px;
  max-width: 360px;
}

.ch-page__sel {
  width: 180px;
}

.ch-page__rules {
  margin-bottom: $space-5;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
}

.ch-page__rules-h {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ch-page__rules-ul {
  margin: 0;
  padding-left: 1.2em;
  font-size: 11px;
  line-height: 1.55;
  color: $color-text-tertiary;
}

.ch-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $space-4;
}

.ch-card {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: hidden;
  background: var(--ex-card-surface);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--ex-rise) 35%, transparent);
    transform: translateY(-2px);
  }
}

.ch-card__media {
  position: relative;
  aspect-ratio: 16/10;
  background: var(--ex-bg-muted);
}

.ch-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ch-card__badge {
  position: absolute;
  top: $space-2;
  right: $space-2;
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 4px 8px;
  border-radius: $radius-sm;

  &--ok {
    background: var(--ex-rise-bg);
    color: $color-rise;
  }

  &--done {
    background: var(--ex-bg-elevated);
    color: $color-text-tertiary;
    border: 1px solid $color-border;
  }
}

.ch-card__body {
  padding: $space-3;
}

.ch-card__cat {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.ch-card__title {
  margin: $space-2 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ch-card__sum {
  margin: 0 0 $space-3;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ch-card__prog {
  font-size: 10px;
  color: $color-text-secondary;
}

.ch-card__track {
  height: 6px;
  border-radius: 3px;
  background: var(--ex-fill-ghost);
  overflow: hidden;
  margin-bottom: 6px;
}

.ch-card__fill {
  height: 100%;
  border-radius: 3px;
  background: var(--ex-brand);
}

.ch-card__nums {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
}

.ch-page__empty {
  text-align: center;
  padding: $space-8;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
}

.ch-page__disclaimer {
  margin: $space-6 0 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}
</style>
