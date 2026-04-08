<script setup lang="ts">
import HomeHeroBanner from '@/components/business/home/HomeHeroBanner.vue'
import HomeMarqueeStrip from '@/components/business/home/HomeMarqueeStrip.vue'
import HomeHotMarkets from '@/components/business/home/HomeHotMarkets.vue'
import HomeMarketOverview from '@/components/business/home/HomeMarketOverview.vue'
import HomeRankBoard from '@/components/business/home/HomeRankBoard.vue'
import HomeCryptoWorld from '@/components/business/home/HomeCryptoWorld.vue'
import HomeProductEntry from '@/components/business/home/HomeProductEntry.vue'
import HomeAdvantages from '@/components/business/home/HomeAdvantages.vue'
import HomeAnnouncements from '@/components/business/home/HomeAnnouncements.vue'
import HomeDownloadSection from '@/components/business/home/HomeDownloadSection.vue'
import ExPageState from '@/components/common/ExPageState.vue'
import { useHomePageData } from '@/composables/useHomePageData'

const { loading, data, error, reload } = useHomePageData()
</script>

<template>
  <div class="home-page">
    <HomeHeroBanner />
    <HomeMarqueeStrip />

    <div class="home-page__container">
      <ExPageState
        :loading="loading && !data"
        use-skeleton
        skeleton-variant="table"
        :error="error"
        loading-text="加载市场概览…"
        @retry="reload()"
      >
        <HomeMarketOverview :stats="data?.marketStats ?? []" :loading="loading" />
        <HomeHotMarkets :items="data?.hotTickers ?? []" :loading="loading" />
        <HomeRankBoard
          :rank-hot="data?.rankHot ?? []"
          :gainers="data?.gainers ?? []"
          :losers="data?.losers ?? []"
          :rank-volume="data?.rankVolume ?? []"
          :loading="loading"
        />
        <HomeCryptoWorld />
        <HomeProductEntry />
        <HomeAdvantages />
        <HomeAnnouncements v-if="data?.announcements?.length" :items="data.announcements" />
        <HomeDownloadSection />
      </ExPageState>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.home-page {
  width: 100%;
  min-width: 0;
}

.home-page__container {
  width: 100%;
  max-width: var(--ex-container-max);
  margin-inline: auto;
  padding-inline: var(--ex-gutter-x);
  padding-bottom: $space-10;

  @include mq.media-down(sm) {
    padding-bottom: $space-8;
  }
}
</style>
