<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'

const { t } = useI18n()
const router = useRouter()
const year = new Date().getFullYear()

const columns = computed(() => [
  {
    titleKey: 'footer.colTrade',
    links: [
      { labelKey: 'footer.marketCenter', name: RouteNames.Market },
      {
        labelKey: 'footer.spot',
        name: RouteNames.SpotTrade,
        params: { symbol: 'BTC_USDT' },
      },
      {
        labelKey: 'footer.contract',
        name: RouteNames.ContractTrade,
        params: { symbol: 'BTCUSDT' },
      },
    ],
  },
  {
    titleKey: 'footer.colService',
    links: [
      { labelKey: 'footer.assetsCenter', name: RouteNames.Assets },
      { labelKey: 'footer.userCenter', name: RouteNames.AccountOverview },
      {
        labelKey: 'footer.announce',
        name: RouteNames.Home,
        hash: '#home-announcements' as const,
      },
    ],
  },
  {
    titleKey: 'footer.colSupport',
    links: [
      { labelKey: 'footer.fees', href: '#' },
      { labelKey: 'footer.apiDoc', href: '#' },
      { labelKey: 'footer.statusPage', href: '#' },
    ],
  },
])

function go(to: { name: string; params?: Record<string, string>; hash?: string }) {
  router.push({
    name: to.name as never,
    params: to.params as never,
    hash: to.hash,
  })
}
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <img class="site-footer__logo" src="/brand-logo.png" alt="" width="36" height="36" decoding="async" />
        <p class="site-footer__tagline">{{ t('footer.tagline') }}</p>
        <p class="site-footer__risk">
          {{ t('footer.risk') }}
        </p>
      </div>

      <div v-for="(col, ci) in columns" :key="col.titleKey" class="site-footer__col">
        <h3 class="site-footer__heading">{{ t(col.titleKey) }}</h3>
        <ul class="site-footer__list">
          <li v-for="(link, i) in col.links" :key="`${ci}-${i}`">
            <button
              v-if="'name' in link"
              type="button"
              class="site-footer__link"
              @click="go(link)"
            >
              {{ t(link.labelKey) }}
            </button>
            <a v-else :href="link.href" class="site-footer__link" @click.prevent>{{
              t(link.labelKey)
            }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="site-footer__social" :aria-label="t('footer.socialAria')">
      <span class="site-footer__social-label">{{ t('footer.followUs') }}</span>
      <span class="site-footer__social-pill">X</span>
      <span class="site-footer__social-pill">Telegram</span>
      <span class="site-footer__social-pill">Discord</span>
    </div>

    <div class="site-footer__bar">
      <span>{{ t('footer.copyright', { year }) }}</span>
      <span class="site-footer__sep">|</span>
      <span>{{ t('footer.privacy') }}</span>
      <span class="site-footer__sep">|</span>
      <span>{{ t('footer.terms') }}</span>
      <span class="site-footer__sep">|</span>
      <span>{{ t('footer.compliance') }}</span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.site-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--ex-border);
  background: var(--ex-bg-muted);
}

:global([data-theme='monochrome']) .site-footer {
  background: var(--ex-bg-canvas);
  border-top-color: var(--ex-border-subtle);
}

.site-footer__grid {
  max-width: var(--ex-container-max);
  margin: 0 auto;
  padding: clamp($space-6, 4vw, $space-8) var(--ex-gutter-x);
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr);
  gap: $space-8;

  @include mq.media-down(xl) {
    grid-template-columns: 1fr 1fr;
    gap: $space-6;
  }

  @include mq.media-down(sm) {
    grid-template-columns: 1fr;
  }
}

.site-footer__logo {
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  margin-bottom: $space-3;
  object-fit: contain;
  display: block;
}

.site-footer__tagline {
  margin: 0 0 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary);
}

.site-footer__risk {
  margin: 0;
  font-size: $font-size-xs;
  line-height: 1.6;
  color: var(--ex-text-tertiary);
  max-width: 320px;
}

.site-footer__heading {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ex-text-tertiary);
}

.site-footer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.site-footer__link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: $font-size-sm;
  color: var(--ex-text-secondary);
  cursor: pointer;
  text-align: left;
}

.site-footer__link:hover {
  color: var(--ex-brand);
}

.site-footer__social {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $space-4 $space-6;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: $space-2;
}

.site-footer__social-label {
  font-size: $font-size-xs;
  color: var(--ex-text-tertiary);
  margin-right: $space-2;
}

.site-footer__social-pill {
  font-size: $font-size-xs;
  padding: 4px $space-2;
  border-radius: 999px;
  border: 1px solid var(--ex-border);
  color: var(--ex-text-tertiary);
  opacity: 0.85;
}

.site-footer__bar {
  max-width: var(--ex-container-max);
  margin: 0 auto;
  padding: $space-4 var(--ex-gutter-x);
  border-top: 1px solid var(--ex-border);
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xs;
  color: var(--ex-text-tertiary);
}

.site-footer__sep {
  opacity: 0.35;
}
</style>
