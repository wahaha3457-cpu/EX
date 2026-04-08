<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import {
  MAIN_NAV_ENTRIES,
  HEADER_MORE_MENU,
  isNavDropdown,
  type NavMenuDropdown,
  type NavMenuFlatHash,
  type NavMenuFlatRoute,
} from '@/config/mainNav'
import { HEADER_EARN_CARDS, HEADER_HOT_PAIRS } from '@/config/headerSearchMock'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'
import NavMenuIcon from '@/components/layout/nav/NavMenuIcon.vue'
import NavMegaMenuIcon from '@/components/layout/nav/NavMegaMenuIcon.vue'
import { SUPPORTED_LANGUAGES, type AppLocaleCode } from '@/locales/supportedLanguages'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { user } = storeToRefs(auth)
const app = useAppStore()
const { locale: currentLocale } = storeToRefs(app)
const theme = useThemeStore()

/** 方案 B：hover/无障碍文案仅描述将切换到的模式 */
const themeSwitchHint = computed(() =>
  theme.theme === 'default' ? t('layout.themeSwitchToMonochrome') : t('layout.themeSwitchToDefault'),
)

/** 默认(深色)：月亮；黑白：太阳（回到深色终端） */
const themeIconKind = computed(() => (theme.theme === 'default' ? 'moon' : 'sun'))

const mobileNavOpen = ref(false)
useBodyScrollLock(mobileNavOpen)

const openHoverMenu = ref<string | null>(null)
let hoverCloseTimer: number | null = null

const mobileOpenSection = ref<string | null>(null)

const searchOpen = ref(false)
const searchQuery = ref('')
const searchWrapRef = ref<HTMLElement | null>(null)

const filteredHotPairs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return HEADER_HOT_PAIRS
  return HEADER_HOT_PAIRS.filter(
    (p) => p.label.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q),
  )
})

const userDisplayName = computed(
  () => user.value?.nickname || user.value?.emailMasked || t('layout.userFallback'),
)
const userUid = computed(() => user.value?.userCode ?? '--')
const userInitial = computed(() => {
  const n = userDisplayName.value.trim()
  return n ? n.slice(0, 1).toUpperCase() : 'U'
})
const isKycVerified = computed(() => (user.value?.kycLevel ?? 0) >= 1)

const isAppDownloadRoute = computed(() => route.name === RouteNames.AppDownload)

function formatSearchPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) searchQuery.value = ''
}

function closeSearch() {
  searchOpen.value = false
}

function onGlobalDocPointerDown(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (searchOpen.value) {
    if (searchWrapRef.value?.contains(el)) return
    if (el.closest('.ex-header__search-pop')) return
    if (el.closest('.ex-header__search-trigger')) return
    searchOpen.value = false
  }
  if (openHoverMenu.value === 'locale' && !el.closest('.ex-header__locale-dd')) {
    openHoverMenu.value = null
  }
  if (openHoverMenu.value === 'appdl' && !el.closest('.ex-header__app-dd')) {
    openHoverMenu.value = null
  }
}

async function runLogoutFlow() {
  await auth.logout()
  void router.push({ name: RouteNames.Home })
  app.openWelcomeModal(
    {
      illustration: 'shield',
      title: '已安全退出',
      subtitle: '你的账户信息已清除，本设备不再保留登录状态。',
    },
    2200,
  )
}

function logoutAndCloseMenus() {
  openHoverMenu.value = null
  void runLogoutFlow()
}

async function logoutFromMobileDrawer() {
  await runLogoutFlow()
  closeMobileNav()
}

let mqLg: MediaQueryList | null = null

function closeMobileNav() {
  mobileNavOpen.value = false
}

function onMqChange() {
  if (mqLg?.matches) mobileNavOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeMobileNav()
    openHoverMenu.value = null
    mobileOpenSection.value = null
    closeSearch()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMobileNav()
    openHoverMenu.value = null
    closeSearch()
  },
)

onMounted(() => {
  mqLg = window.matchMedia('(min-width: 1024px)')
  mqLg.addEventListener('change', onMqChange)
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onGlobalDocPointerDown, true)
})

onUnmounted(() => {
  mqLg?.removeEventListener('change', onMqChange)
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onGlobalDocPointerDown, true)
  if (hoverCloseTimer) clearTimeout(hoverCloseTimer)
})

function onMenuEnter(key: string) {
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = null
  }
  openHoverMenu.value = key
}

function onMenuLeave() {
  hoverCloseTimer = window.setTimeout(() => {
    openHoverMenu.value = null
  }, 200)
}

function navToFlat(entry: NavMenuFlatRoute | NavMenuFlatHash) {
  if (entry.kind === 'hash') return { path: entry.path, hash: entry.hash }
  return entry.to
}

function isFlatActive(entry: NavMenuFlatRoute | NavMenuFlatHash): boolean {
  if (entry.kind === 'hash') {
    return route.name === entry.routeName && route.hash === entry.hash
  }
  if (entry.routeName === RouteNames.C2C) {
    return (
      route.name === RouteNames.C2CMarket ||
      route.name === RouteNames.C2COrdersRunning ||
      route.name === RouteNames.C2COrdersEnded
    )
  }
  return route.name === entry.routeName
}

function isDropdownActive(entry: NavMenuDropdown): boolean {
  if (entry.children.some((c) => c.routeName === route.name)) return true
  if (entry.key === 'trade' && route.path.startsWith('/trade/demo')) return true
  return false
}

/** 抽屉内二级项：模拟现货路由名与「模拟交易」落地页不同，需合并高亮 */
function isDrawerTradeChildActive(child: { key: string; routeName: string }): boolean {
  if (route.name === child.routeName) return true
  if (child.key === 'demo' && route.name === RouteNames.DemoSpotTrade) return true
  if (
    child.key === 'c2c' &&
    (route.name === RouteNames.C2COrdersRunning || route.name === RouteNames.C2COrdersEnded)
  ) {
    return true
  }
  return false
}

function isMoreMenuActive(): boolean {
  return HEADER_MORE_MENU.some((c) => c.routeName === route.name)
}

const ORDER_ROUTE_NAMES = new Set<string>([
  RouteNames.OrdersLedger,
  RouteNames.OrdersSpot,
  RouteNames.OrdersContract,
  RouteNames.OrdersC2C,
  RouteNames.OrdersConvert,
  RouteNames.OrdersEarn,
])

const isOrdersAreaActive = computed(
  () => typeof route.name === 'string' && ORDER_ROUTE_NAMES.has(route.name),
)

function toggleMobileSection(key: string) {
  mobileOpenSection.value = mobileOpenSection.value === key ? null : key
}

function selectLocale(code: AppLocaleCode) {
  app.setLocale(code)
  openHoverMenu.value = null
}

function onLocaleBtnClick() {
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = null
  }
  openHoverMenu.value = openHoverMenu.value === 'locale' ? null : 'locale'
}

function onAppDlBtnClick() {
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = null
  }
  openHoverMenu.value = openHoverMenu.value === 'appdl' ? null : 'appdl'
}

function closeAppDlPanel() {
  openHoverMenu.value = null
}

function toggleColorMode() {
  theme.toggleTheme()
}

function openMobileMoreMenu() {
  mobileNavOpen.value = true
  mobileOpenSection.value = 'more'
}

function expandDrawerMoreFromTools() {
  mobileOpenSection.value = 'more'
  nextTick(() => {
    document.getElementById('ex-header-drawer-more')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}
</script>

<template>
  <header class="ex-header">
    <div class="ex-header__brand">
      <RouterLink to="/" class="ex-header__logo" @click="closeMobileNav">
        <img class="ex-header__logo-mark" src="/brand-logo.png" alt="" width="28" height="28" decoding="async" />
        <span class="ex-header__logo-text">EXCHANGE</span>
      </RouterLink>
    </div>

    <nav class="ex-header__nav ex-header__nav--desktop" :aria-label="t('layout.ariaMainNav')">
      <template v-for="entry in MAIN_NAV_ENTRIES" :key="entry.key">
        <div
          v-if="isNavDropdown(entry)"
          class="ex-nav-dd"
          @mouseenter="onMenuEnter(entry.key)"
          @mouseleave="onMenuLeave"
        >
          <button
            type="button"
            class="ex-header__link ex-header__link--trigger"
            :class="{ 'ex-header__link--active': isDropdownActive(entry) }"
            :aria-expanded="openHoverMenu === entry.key"
            aria-haspopup="true"
          >
            {{ t(entry.labelKey) }}
            <svg
              class="ex-nav-dd__chev"
              :class="{ 'ex-nav-dd__chev--open': openHoverMenu === entry.key }"
              width="10"
              height="7"
              viewBox="0 0 12 8"
              aria-hidden="true"
            >
              <path
                d="M1 1.5 L6 6.5 L11 1.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div
            v-show="openHoverMenu === entry.key"
            class="ex-nav-dd__panel ex-nav-dd__panel--mega"
            role="menu"
            @mouseenter="onMenuEnter(entry.key)"
            @mouseleave="onMenuLeave"
          >
            <RouterLink
              v-for="child in entry.children"
              :key="child.key"
              :to="child.to"
              class="ex-nav-dd__row"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--mega">
                <NavMegaMenuIcon :name="child.icon" />
              </span>
              <span class="ex-nav-dd__label">{{ t(child.labelKey) }}</span>
            </RouterLink>
          </div>
        </div>

        <RouterLink
          v-else
          :to="navToFlat(entry)"
          class="ex-header__link"
          :class="{ 'ex-header__link--active': isFlatActive(entry) }"
        >
          {{ t(entry.labelKey) }}
        </RouterLink>
      </template>
    </nav>

    <div class="ex-header__actions ex-header__actions--desktop">
      <div ref="searchWrapRef" class="ex-header__search-wrap">
        <button
          type="button"
          class="ex-header__icon-btn ex-header__search-trigger"
          :class="{ 'ex-header__icon-btn--active': searchOpen }"
          :aria-label="t('layout.search')"
          :aria-expanded="searchOpen"
          @click="toggleSearch"
        >
          <span class="ex-header__icon-el"><NavMenuIcon name="search" /></span>
        </button>
      </div>

      <button
        type="button"
        class="ex-header__icon-btn"
        :aria-label="themeSwitchHint"
        :title="themeSwitchHint"
        @click="toggleColorMode"
      >
        <svg
          v-if="themeIconKind === 'moon'"
          class="ex-header__icon-svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          />
        </svg>
        <svg
          v-else
          class="ex-header__icon-svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      </button>

      <div
        class="ex-nav-dd ex-nav-dd--right ex-header__locale-dd"
        @mouseenter="onMenuEnter('locale')"
        @mouseleave="onMenuLeave"
      >
        <button
          type="button"
          class="ex-header__icon-btn"
          :class="{ 'ex-header__icon-btn--active': openHoverMenu === 'locale' }"
          :aria-label="t('layout.localeRegion')"
          :aria-expanded="openHoverMenu === 'locale'"
          aria-haspopup="true"
          @click.stop="onLocaleBtnClick"
        >
          <span class="ex-header__icon-el"><NavMenuIcon name="locale" /></span>
        </button>
        <div
          v-show="openHoverMenu === 'locale'"
          class="ex-nav-dd__panel ex-nav-dd__panel--right ex-nav-dd__panel--lang"
          role="menu"
          @mouseenter="onMenuEnter('locale')"
          @mouseleave="onMenuLeave"
        >
          <button
            v-for="lang in SUPPORTED_LANGUAGES"
            :key="lang.code"
            type="button"
            class="ex-lang-dd__btn"
            :class="{ 'ex-lang-dd__btn--active': currentLocale === lang.code }"
            role="menuitem"
            @click="selectLocale(lang.code)"
          >
            {{ lang.nativeName }}
          </button>
        </div>
      </div>

      <div
        v-if="auth.isAuthenticated"
        class="ex-nav-dd ex-nav-dd--right"
        @mouseenter="onMenuEnter('more')"
        @mouseleave="onMenuLeave"
      >
        <button
          type="button"
          class="ex-header__icon-btn ex-header__icon-btn--chat"
          :class="{ 'ex-header__icon-btn--active': isMoreMenuActive() }"
          :aria-expanded="openHoverMenu === 'more'"
          aria-haspopup="true"
          :aria-label="t('layout.messages')"
        >
          <span class="ex-header__icon-el"><NavMenuIcon name="chat" /></span>
          <span class="ex-header__chat-ping" aria-hidden="true" />
        </button>
        <div
          v-show="openHoverMenu === 'more'"
          class="ex-nav-dd__panel ex-nav-dd__panel--right ex-nav-dd__panel--mega"
          role="menu"
          @mouseenter="onMenuEnter('more')"
          @mouseleave="onMenuLeave"
        >
          <RouterLink
            v-for="item in HEADER_MORE_MENU"
            :key="item.key"
            :to="item.to"
            class="ex-nav-dd__row"
            role="menuitem"
          >
            <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--mega">
              <NavMegaMenuIcon :name="item.icon" />
            </span>
            <span class="ex-nav-dd__label">{{ t(item.labelKey) }}</span>
          </RouterLink>
        </div>
      </div>

      <div
        class="ex-nav-dd ex-nav-dd--right ex-header__app-dd"
        @mouseenter="onMenuEnter('appdl')"
        @mouseleave="onMenuLeave"
      >
        <button
          type="button"
          class="ex-header__icon-btn ex-header__app-nav"
          :class="{
            'ex-header__icon-btn--active ex-header__app-nav--on':
              openHoverMenu === 'appdl' || isAppDownloadRoute,
          }"
          :aria-label="t('layout.appDownload')"
          :aria-expanded="openHoverMenu === 'appdl'"
          aria-haspopup="true"
          aria-controls="ex-header-app-panel"
          @click.stop="onAppDlBtnClick"
        >
          <span class="ex-header__icon-el"><NavMenuIcon name="app" /></span>
          <span v-show="isAppDownloadRoute" class="ex-header__app-nav-label">{{ t('layout.appDownloadShort') }}</span>
        </button>
        <div
          v-show="openHoverMenu === 'appdl'"
          id="ex-header-app-panel"
          class="ex-nav-dd__panel ex-nav-dd__panel--right ex-header__app-panel"
          role="region"
          :aria-label="t('layout.appDownload')"
          @mouseenter="onMenuEnter('appdl')"
          @mouseleave="onMenuLeave"
        >
          <div class="ex-header__app-panel-inner">
            <header class="ex-header__app-panel-head">
              <p class="ex-header__app-panel-kicker">{{ t('layout.appDownloadPanelKicker') }}</p>
              <p class="ex-header__app-panel-title">{{ t('layout.appDownload') }}</p>
              <p class="ex-header__app-panel-sub">{{ t('layout.appDownloadPanelSub') }}</p>
            </header>
            <div class="ex-header__app-panel-body">
              <div class="ex-header__app-qr">
                <div class="ex-header__app-qr-frame">
                  <div class="ex-header__app-qr-mosaic" aria-hidden="true" />
                  <div class="ex-header__app-qr-logo">
                    <img src="/brand-logo.png" alt="" width="28" height="28" decoding="async" />
                  </div>
                </div>
                <span class="ex-header__app-qr-cap">{{ t('layout.appDownloadScanHint') }}</span>
              </div>
              <div class="ex-header__app-stores">
                <RouterLink
                  :to="{ name: RouteNames.AppDownload }"
                  class="ex-header__app-store ex-header__app-store--ios"
                  @click="closeAppDlPanel"
                >
                  <span class="ex-header__app-store-glyph" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path
                        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                      />
                    </svg>
                  </span>
                  <span class="ex-header__app-store-text">
                    <span class="ex-header__app-store-line">{{ t('layout.appDownloadIosLine1') }}</span>
                    <span class="ex-header__app-store-line ex-header__app-store-line--emph">{{ t('layout.appDownloadIosLine2') }}</span>
                  </span>
                  <span class="ex-header__app-store-chev" aria-hidden="true">
                    <svg width="7" height="12" viewBox="0 0 8 14" fill="none">
                      <path
                        d="M1 1l6 6-6 6"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                </RouterLink>
                <RouterLink
                  :to="{ name: RouteNames.AppDownload }"
                  class="ex-header__app-store ex-header__app-store--android"
                  @click="closeAppDlPanel"
                >
                  <span class="ex-header__app-store-glyph" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path
                        d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.5758 12 7.5758s-3.5902.6681-4.7699 1.7159L5.2078 5.7887a.4161.4161 0 00-.5676-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.186.8532 13.3064.8532 15.8818v.2429c0 1.01.8189 1.8288 1.8288 1.8288h19.6359c1.01 0 1.8288-.8188 1.8288-1.8288v-.2429c0-2.5754-1.8357-4.6958-4.269-5.5604"
                      />
                    </svg>
                  </span>
                  <span class="ex-header__app-store-text">
                    <span class="ex-header__app-store-line">{{ t('layout.appDownloadAndroidLine1') }}</span>
                    <span class="ex-header__app-store-line ex-header__app-store-line--emph">{{ t('layout.appDownloadAndroidLine2') }}</span>
                  </span>
                  <span class="ex-header__app-store-chev" aria-hidden="true">
                    <svg width="7" height="12" viewBox="0 0 8 14" fill="none">
                      <path
                        d="M1 1l6 6-6 6"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                </RouterLink>
              </div>
            </div>
            <footer class="ex-header__app-panel-foot">
              <RouterLink
                :to="{ name: RouteNames.AppDownload }"
                class="ex-header__app-panel-more"
                @click="closeAppDlPanel"
              >
                {{ t('layout.appDownloadViewAll') }}
              </RouterLink>
            </footer>
          </div>
        </div>
      </div>

      <template v-if="auth.isAuthenticated">
        <div
          class="ex-nav-dd ex-nav-dd--right"
          @mouseenter="onMenuEnter('wallet')"
          @mouseleave="onMenuLeave"
        >
          <button
            type="button"
            class="ex-header__icon-btn"
            :class="{ 'ex-header__icon-btn--active': openHoverMenu === 'wallet' }"
            :aria-expanded="openHoverMenu === 'wallet'"
            aria-haspopup="true"
            :aria-label="t('layout.wallet')"
          >
            <span class="ex-header__icon-el"><NavMenuIcon name="walletFunding" /></span>
          </button>
          <div
            v-show="openHoverMenu === 'wallet'"
            class="ex-nav-dd__panel ex-nav-dd__panel--right ex-nav-dd__panel--wallet"
            role="menu"
            @mouseenter="onMenuEnter('wallet')"
            @mouseleave="onMenuLeave"
          >
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'overview' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletOverview" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletOverview') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'spot' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletSpot" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletSpot') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'futures' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletFutures" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletFutures') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'earn' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletEarn" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletEarn') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'funding' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletFunding" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletFunding') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'nft' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletNft" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletNft') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { record: 'transfer' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletTransfer" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletTransfer') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.OrdersLedger }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="walletHistory" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.walletHistory') }}</span>
            </RouterLink>
          </div>
        </div>

        <div
          class="ex-nav-dd ex-nav-dd--right ex-nav-dd--user"
          @mouseenter="onMenuEnter('user')"
          @mouseleave="onMenuLeave"
        >
          <button
            type="button"
            class="ex-header__icon-btn ex-header__user-trigger"
            :class="{ 'ex-header__icon-btn--active': openHoverMenu === 'user' }"
            :aria-expanded="openHoverMenu === 'user'"
            aria-haspopup="true"
            :aria-label="t('layout.userCenter')"
          >
            <img
              v-if="user?.avatarUrl"
              class="ex-header__user-avatar ex-header__user-avatar--photo"
              :src="user.avatarUrl"
              alt=""
            />
            <span v-else class="ex-header__user-avatar">{{ userInitial }}</span>
          </button>
          <div
            v-show="openHoverMenu === 'user'"
            class="ex-nav-dd__panel ex-nav-dd__panel--right ex-nav-dd__panel--user"
            role="menu"
            @mouseenter="onMenuEnter('user')"
            @mouseleave="onMenuLeave"
          >
            <div class="ex-user-dd__head">
              <img
                v-if="user?.avatarUrl"
                class="ex-user-dd__avatar ex-user-dd__avatar--photo"
                :src="user.avatarUrl"
                alt=""
              />
              <div v-else class="ex-user-dd__avatar" aria-hidden="true">{{ userInitial }}</div>
              <div class="ex-user-dd__meta">
                <div class="ex-user-dd__name">{{ userDisplayName }}</div>
                <div class="ex-user-dd__uid">{{ t('layout.idLine', { id: userUid }) }}</div>
                <div class="ex-user-dd__badges">
                  <span class="ex-user-dd__pill ex-user-dd__pill--vip">{{
                    t('layout.vipBadge', { level: user?.kycLevel ?? 0 })
                  }}</span>
                  <span class="ex-user-dd__pill ex-user-dd__pill--muted">{{ t('layout.roleRegular') }}</span>
                  <span v-if="!isKycVerified" class="ex-user-dd__pill ex-user-dd__pill--warn">{{
                    t('layout.unverified')
                  }}</span>
                  <span v-else class="ex-user-dd__pill ex-user-dd__pill--ok">{{ t('layout.verified') }}</span>
                </div>
              </div>
            </div>
            <RouterLink
              :to="{ name: RouteNames.AccountOverview }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userOverview" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.overview') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Assets, query: { account: 'overview' } }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userAssets" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.assets') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.OrdersLedger }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              :class="{ 'ex-nav-dd__row--orders-on': isOrdersAreaActive }"
              role="menuitem"
              @click="openHoverMenu = null"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userOrders" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.orders') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Preferences }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userAccount" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.account') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.AccountSecurity }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userSecurity" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.securityCenter') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.Verification }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userKyc" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.verifyCenter') }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: RouteNames.ReferralInvite }"
              class="ex-nav-dd__row ex-nav-dd__row--compact"
              role="menuitem"
            >
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userInvite" />
              </span>
              <span class="ex-nav-dd__label">{{ t('layout.inviteRebate') }}</span>
            </RouterLink>
            <div class="ex-user-dd__sep" role="separator" />
            <button type="button" class="ex-user-dd__logout" @click="logoutAndCloseMenus">
              <span class="ex-nav-dd__icon-wrap ex-nav-dd__icon-wrap--sm">
                <NavMenuIcon name="userLogout" />
              </span>
              <span>{{ t('layout.logout') }}</span>
            </button>
          </div>
        </div>
      </template>
      <template v-else>
        <RouterLink :to="{ name: RouteNames.Login }" class="ex-header__link">
          {{ t('layout.login') }}
        </RouterLink>
        <RouterLink :to="{ name: RouteNames.Register }" class="ex-btn ex-btn--primary ex-btn--sm">
          {{ t('layout.register') }}
        </RouterLink>
      </template>
    </div>

    <div class="ex-header__mobile-tools">
      <button
        type="button"
        class="ex-header__icon-btn ex-header__icon-btn--mobile ex-header__search-trigger"
        :class="{ 'ex-header__icon-btn--active': searchOpen }"
        :aria-label="t('layout.search')"
        :aria-expanded="searchOpen"
        @click="toggleSearch"
      >
        <span class="ex-header__icon-el"><NavMenuIcon name="search" /></span>
      </button>
      <!-- 窄屏隐藏：改由侧滑抽屉「快捷设置」进入，避免顶栏图标溢出 -->
      <div class="ex-header__mobile-cluster" aria-hidden="false">
        <button
          type="button"
          class="ex-header__icon-btn ex-header__icon-btn--mobile"
          :aria-label="themeSwitchHint"
          :title="themeSwitchHint"
          @click="toggleColorMode"
        >
          <svg
            v-if="themeIconKind === 'moon'"
            class="ex-header__icon-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            />
          </svg>
          <svg
            v-else
            class="ex-header__icon-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            />
          </svg>
        </button>
        <div
          class="ex-nav-dd ex-header__locale-dd ex-header__locale-dd--mobile"
          @mouseenter="onMenuEnter('locale')"
          @mouseleave="onMenuLeave"
        >
          <button
            type="button"
            class="ex-header__icon-btn ex-header__icon-btn--mobile"
            :class="{ 'ex-header__icon-btn--active': openHoverMenu === 'locale' }"
            :aria-label="t('layout.localeRegion')"
            :aria-expanded="openHoverMenu === 'locale'"
            aria-haspopup="true"
            @click.stop="onLocaleBtnClick"
          >
            <span class="ex-header__icon-el"><NavMenuIcon name="locale" /></span>
          </button>
          <div
            v-show="openHoverMenu === 'locale'"
            class="ex-nav-dd__panel ex-nav-dd__panel--right ex-nav-dd__panel--lang ex-nav-dd__panel--lang-mobile"
            role="menu"
            @mouseenter="onMenuEnter('locale')"
            @mouseleave="onMenuLeave"
          >
            <button
              v-for="lang in SUPPORTED_LANGUAGES"
              :key="'m-' + lang.code"
              type="button"
              class="ex-lang-dd__btn"
              :class="{ 'ex-lang-dd__btn--active': currentLocale === lang.code }"
              role="menuitem"
              @click="selectLocale(lang.code)"
            >
              {{ lang.nativeName }}
            </button>
          </div>
        </div>
        <button
          v-if="auth.isAuthenticated"
          type="button"
          class="ex-header__icon-btn ex-header__icon-btn--mobile ex-header__icon-btn--chat"
          :aria-label="t('layout.messages')"
          @click="openMobileMoreMenu"
        >
          <span class="ex-header__icon-el"><NavMenuIcon name="chat" /></span>
          <span class="ex-header__chat-ping" aria-hidden="true" />
        </button>
        <div
          class="ex-nav-dd ex-header__app-dd ex-header__app-dd--mobile"
          @mouseenter="onMenuEnter('appdl')"
          @mouseleave="onMenuLeave"
        >
          <button
            type="button"
            class="ex-header__icon-btn ex-header__icon-btn--mobile ex-header__app-nav"
            :class="{
              'ex-header__icon-btn--active ex-header__app-nav--on':
                openHoverMenu === 'appdl' || isAppDownloadRoute,
            }"
            :aria-label="t('layout.appDownload')"
            :aria-expanded="openHoverMenu === 'appdl'"
            aria-haspopup="true"
            aria-controls="ex-header-app-panel-mobile"
            @click.stop="onAppDlBtnClick"
          >
            <span class="ex-header__icon-el"><NavMenuIcon name="app" /></span>
            <span v-show="isAppDownloadRoute" class="ex-header__app-nav-label">{{ t('layout.appDownloadShort') }}</span>
          </button>
          <div
            v-show="openHoverMenu === 'appdl'"
            id="ex-header-app-panel-mobile"
            class="ex-nav-dd__panel ex-nav-dd__panel--right ex-header__app-panel ex-header__app-panel--mobile"
            role="region"
            :aria-label="t('layout.appDownload')"
            @mouseenter="onMenuEnter('appdl')"
            @mouseleave="onMenuLeave"
          >
            <div class="ex-header__app-panel-inner">
              <header class="ex-header__app-panel-head">
                <p class="ex-header__app-panel-kicker">{{ t('layout.appDownloadPanelKicker') }}</p>
                <p class="ex-header__app-panel-title">{{ t('layout.appDownload') }}</p>
                <p class="ex-header__app-panel-sub">{{ t('layout.appDownloadPanelSub') }}</p>
              </header>
              <div class="ex-header__app-panel-body">
                <div class="ex-header__app-qr">
                  <div class="ex-header__app-qr-frame">
                    <div class="ex-header__app-qr-mosaic" aria-hidden="true" />
                    <div class="ex-header__app-qr-logo">
                      <img src="/brand-logo.png" alt="" width="28" height="28" decoding="async" />
                    </div>
                  </div>
                  <span class="ex-header__app-qr-cap">{{ t('layout.appDownloadScanHint') }}</span>
                </div>
                <div class="ex-header__app-stores">
                  <RouterLink
                    :to="{ name: RouteNames.AppDownload }"
                    class="ex-header__app-store ex-header__app-store--ios"
                    @click="closeAppDlPanel"
                  >
                    <span class="ex-header__app-store-glyph" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path
                          d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                        />
                      </svg>
                    </span>
                    <span class="ex-header__app-store-text">
                      <span class="ex-header__app-store-line">{{ t('layout.appDownloadIosLine1') }}</span>
                      <span class="ex-header__app-store-line ex-header__app-store-line--emph">{{ t('layout.appDownloadIosLine2') }}</span>
                    </span>
                    <span class="ex-header__app-store-chev" aria-hidden="true">
                      <svg width="7" height="12" viewBox="0 0 8 14" fill="none">
                        <path
                          d="M1 1l6 6-6 6"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </RouterLink>
                  <RouterLink
                    :to="{ name: RouteNames.AppDownload }"
                    class="ex-header__app-store ex-header__app-store--android"
                    @click="closeAppDlPanel"
                  >
                    <span class="ex-header__app-store-glyph" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path
                          d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.5758 12 7.5758s-3.5902.6681-4.7699 1.7159L5.2078 5.7887a.4161.4161 0 00-.5676-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.186.8532 13.3064.8532 15.8818v.2429c0 1.01.8189 1.8288 1.8288 1.8288h19.6359c1.01 0 1.8288-.8188 1.8288-1.8288v-.2429c0-2.5754-1.8357-4.6958-4.269-5.5604"
                        />
                      </svg>
                    </span>
                    <span class="ex-header__app-store-text">
                      <span class="ex-header__app-store-line">{{ t('layout.appDownloadAndroidLine1') }}</span>
                      <span class="ex-header__app-store-line ex-header__app-store-line--emph">{{ t('layout.appDownloadAndroidLine2') }}</span>
                    </span>
                    <span class="ex-header__app-store-chev" aria-hidden="true">
                      <svg width="7" height="12" viewBox="0 0 8 14" fill="none">
                        <path
                          d="M1 1l6 6-6 6"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  </RouterLink>
                </div>
              </div>
              <footer class="ex-header__app-panel-foot">
                <RouterLink
                  :to="{ name: RouteNames.AppDownload }"
                  class="ex-header__app-panel-more"
                  @click="closeAppDlPanel"
                >
                  {{ t('layout.appDownloadViewAll') }}
                </RouterLink>
              </footer>
            </div>
          </div>
        </div>
      </div>
      <RouterLink
        v-if="auth.isAuthenticated"
        :to="{ name: RouteNames.AccountOverview }"
        class="ex-header__account-pill"
        @click="closeMobileNav"
      >
        {{ t('layout.accountPill') }}
      </RouterLink>
      <RouterLink
        v-else
        :to="{ name: RouteNames.Login }"
        class="ex-header__login-pill"
      >
        {{ t('layout.login') }}
      </RouterLink>
      <button
        type="button"
        class="ex-header__burger"
        :aria-expanded="mobileNavOpen"
        aria-controls="ex-header-drawer"
        :aria-label="t('layout.openMenu')"
        @click="mobileNavOpen = true"
      >
        <span class="ex-header__burger-line" aria-hidden="true" />
        <span class="ex-header__burger-line" aria-hidden="true" />
        <span class="ex-header__burger-line" aria-hidden="true" />
      </button>
    </div>

    <div
      v-show="mobileNavOpen"
      class="ex-header__backdrop"
      aria-hidden="true"
      @click="closeMobileNav"
    />

    <aside
      id="ex-header-drawer"
      class="ex-header__drawer"
      :class="{ 'ex-header__drawer--open': mobileNavOpen }"
      :aria-label="t('layout.drawerNavAria')"
    >
      <div class="ex-header__drawer-head">
        <span class="ex-header__drawer-title">{{ t('layout.drawerMenu') }}</span>
        <button
          type="button"
          class="ex-header__drawer-close"
          :aria-label="t('layout.closeMenu')"
          @click="closeMobileNav"
        >
          ×
        </button>
      </div>

      <nav class="ex-header__drawer-nav" :aria-label="t('layout.ariaMainNav')">
        <template v-for="entry in MAIN_NAV_ENTRIES" :key="'d-' + entry.key">
          <div v-if="isNavDropdown(entry)" class="ex-drawer-dd">
            <button
              type="button"
              class="ex-drawer-dd__trigger"
              :class="{ 'ex-drawer-dd__trigger--open': mobileOpenSection === entry.key }"
              @click="toggleMobileSection(entry.key)"
            >
              <span>{{ t(entry.labelKey) }}</span>
              <span class="ex-drawer-dd__chev" aria-hidden="true" />
            </button>
            <div v-show="mobileOpenSection === entry.key" class="ex-drawer-dd__panel">
              <RouterLink
                v-for="child in entry.children"
                :key="'m-' + child.key"
                :to="child.to"
                class="ex-drawer-dd__link"
                :class="{ 'ex-drawer-dd__link--active': isDrawerTradeChildActive(child) }"
                @click="closeMobileNav"
              >
                <span class="ex-drawer-dd__icon ex-drawer-dd__icon--mega">
                  <NavMegaMenuIcon :name="child.icon" />
                </span>
                <span class="ex-drawer-dd__text">{{ t(child.labelKey) }}</span>
              </RouterLink>
            </div>
          </div>

          <RouterLink
            v-else
            :to="navToFlat(entry)"
            class="ex-header__drawer-link"
            :class="{ 'ex-header__drawer-link--active': isFlatActive(entry) }"
            @click="closeMobileNav"
          >
            {{ t(entry.labelKey) }}
          </RouterLink>
        </template>

        <div v-if="auth.isAuthenticated" id="ex-header-drawer-more" class="ex-drawer-dd">
          <button
            type="button"
            class="ex-drawer-dd__trigger"
            :class="{ 'ex-drawer-dd__trigger--open': mobileOpenSection === 'more' }"
            @click="toggleMobileSection('more')"
          >
            <span>{{ t('layout.messagesSection') }}</span>
            <span class="ex-drawer-dd__chev" aria-hidden="true" />
          </button>
          <div v-show="mobileOpenSection === 'more'" class="ex-drawer-dd__panel">
            <RouterLink
              v-for="item in HEADER_MORE_MENU"
              :key="'dm-' + item.key"
              :to="item.to"
              class="ex-drawer-dd__link"
              :class="{ 'ex-drawer-dd__link--active': route.name === item.routeName }"
              @click="closeMobileNav"
            >
              <span class="ex-drawer-dd__icon ex-drawer-dd__icon--mega">
                <NavMegaMenuIcon :name="item.icon" />
              </span>
              <span class="ex-drawer-dd__text">{{ t(item.labelKey) }}</span>
            </RouterLink>
          </div>
        </div>

        <RouterLink
          v-if="auth.isAuthenticated"
          :to="{ name: RouteNames.OrdersLedger }"
          class="ex-header__drawer-link"
          :class="{ 'ex-header__drawer-link--active': isOrdersAreaActive }"
          @click="closeMobileNav"
        >
          {{ t('layout.orders') }}
        </RouterLink>
      </nav>

      <div class="ex-header__drawer-tools">
        <p class="ex-header__drawer-tools-title">{{ t('layout.drawerQuickSettings') }}</p>
        <button type="button" class="ex-header__drawer-tool" @click="toggleColorMode">
          {{ themeSwitchHint }}
        </button>
        <div class="ex-header__drawer-lang" role="group" :aria-label="t('layout.localeRegion')">
          <button
            v-for="lang in SUPPORTED_LANGUAGES"
            :key="'dl-' + lang.code"
            type="button"
            class="ex-header__drawer-lang-btn"
            :class="{ 'ex-header__drawer-lang-btn--active': currentLocale === lang.code }"
            @click="selectLocale(lang.code); closeMobileNav()"
          >
            {{ lang.nativeName }}
          </button>
        </div>
        <RouterLink
          :to="{ name: RouteNames.AppDownload }"
          class="ex-header__drawer-tool ex-header__drawer-tool--link"
          @click="closeMobileNav"
        >
          {{ t('layout.appDownload') }}
        </RouterLink>
        <button
          v-if="auth.isAuthenticated"
          type="button"
          class="ex-header__drawer-tool"
          @click="expandDrawerMoreFromTools"
        >
          {{ t('layout.messagesSection') }}
        </button>
      </div>

      <div class="ex-header__drawer-auth">
        <template v-if="auth.isAuthenticated">
          <RouterLink
            :to="{ name: RouteNames.AccountOverview }"
            class="ex-btn ex-btn--secondary ex-btn--block"
            @click="closeMobileNav"
          >
            {{ t('layout.userCenterPage') }}
          </RouterLink>
          <button
            type="button"
            class="ex-header__drawer-ghost"
            @click="logoutFromMobileDrawer"
          >
            {{ t('layout.logout') }}
          </button>
        </template>
        <template v-else>
          <RouterLink
            :to="{ name: RouteNames.Login }"
            class="ex-btn ex-btn--secondary ex-btn--block"
            @click="closeMobileNav"
          >
            {{ t('layout.login') }}
          </RouterLink>
          <RouterLink
            :to="{ name: RouteNames.Register }"
            class="ex-btn ex-btn--primary ex-btn--block"
            @click="closeMobileNav"
          >
            {{ t('layout.register') }}
          </RouterLink>
        </template>
      </div>
    </aside>

    <div
      v-show="searchOpen"
      class="ex-header__search-pop"
      role="dialog"
      :aria-label="t('layout.searchDialog')"
    >
      <div class="ex-header__search-pop__field">
        <span class="ex-header__search-pop__mag" aria-hidden="true">
          <NavMenuIcon name="search" />
        </span>
        <input
          v-model="searchQuery"
          type="search"
          class="ex-header__search-input"
          :placeholder="t('layout.searchPairsPlaceholder')"
          autocomplete="off"
        />
        <button type="button" class="ex-header__search-cancel" @click="closeSearch">
          {{ t('layout.cancel') }}
        </button>
      </div>
      <div class="ex-header__search-pop__section">
        <div class="ex-header__search-pop__title">{{ t('layout.hotTrades') }}</div>
        <RouterLink
          v-for="p in filteredHotPairs"
          :key="p.symbol"
          :to="`/trade/spot/${p.symbol}`"
          class="ex-header__search-row"
          @click="closeSearch"
        >
          <span class="ex-header__search-row__pair">{{ p.label }}</span>
          <span class="ex-header__search-row__price">${{ formatSearchPrice(p.price) }}</span>
          <span
            class="ex-header__search-row__chg"
            :class="
              p.chgPct >= 0 ? 'ex-header__search-row__chg--up' : 'ex-header__search-row__chg--down'
            "
          >
            {{ p.chgPct >= 0 ? '+' : '' }}{{ p.chgPct.toFixed(2) }}%
          </span>
        </RouterLink>
      </div>
      <div class="ex-header__search-pop__section">
        <div class="ex-header__search-pop__title">{{ t('layout.earn') }}</div>
        <div class="ex-header__search-earn">
          <button
            v-for="c in HEADER_EARN_CARDS"
            :key="c.asset"
            type="button"
            class="ex-header__earn-card"
            @click="
              app.pushToast('info', t('layout.earnDetailSoon'));
              closeSearch()
            "
          >
            <span class="ex-header__earn-card__asset">{{ c.asset }}</span>
            <span class="ex-header__earn-card__lbl">{{ t('layout.maxApy') }}</span>
            <span class="ex-header__earn-card__apy">{{ c.apy }}%</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ex-header {
  display: flex;
  align-items: center;
  height: $header-height;
  padding: 0 var(--ex-gutter-x, #{$space-4});
  background: var(--ex-bg-header);
  border-bottom: 1px solid var(--ex-border);
  position: sticky;
  top: 0;
  z-index: var(--ex-z-sticky-header, 1000);
  box-shadow: var(--ex-header-sticky-shadow, none);
}

.ex-header__search-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.ex-header__search-pop {
  position: fixed;
  z-index: var(--ex-z-header-panel, 1200);
  top: calc(#{$header-height} + 6px);
  right: max(#{$space-4}, calc((100vw - 440px) / 2));
  width: min(440px, calc(100vw - #{$space-4} * 2));
  padding: $space-3;
  background: var(--ex-bg-nav-float);
  border: 1px solid var(--ex-nav-float-border);
  border-radius: var(--ex-nav-float-radius);
  box-shadow: var(--ex-nav-float-shadow);
}

.ex-header__search-pop__field {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: 2px 2px 2px $space-2;
  margin-bottom: $space-3;
  border-radius: $radius-md;
  border: 1px solid color-mix(in srgb, var(--ex-brand) 55%, var(--ex-border));
  background: var(--ex-nav-float-inset);
}

.ex-header__search-pop__mag {
  display: flex;
  color: var(--ex-text-tertiary);
  font-size: 18px;
  flex-shrink: 0;
}

.ex-header__search-input {
  flex: 1;
  min-width: 0;
  padding: $space-2 0;
  font-size: $font-size-sm;
  color: var(--ex-text-primary);
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
}

.ex-header__search-cancel {
  flex-shrink: 0;
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-brand);
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.ex-header__search-pop__section {
  margin-bottom: $space-3;
}

.ex-header__search-pop__section:last-child {
  margin-bottom: 0;
}

.ex-header__search-pop__title {
  margin-bottom: $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-tertiary);
  letter-spacing: 0.02em;
}

.ex-header__search-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-2;
  margin-bottom: 2px;
  border-radius: $radius-sm;
  text-decoration: none;
  color: var(--ex-text-primary);
  font-size: $font-size-sm;
  transition: background $duration-fast $ease-standard;
}

.ex-header__search-row:hover {
  background: var(--ex-nav-float-hover);
}

.ex-header__search-row__pair {
  font-weight: $font-weight-medium;
}

.ex-header__search-row__price {
  font-variant-numeric: tabular-nums;
  color: var(--ex-text-secondary);
}

.ex-header__search-row__chg {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
  min-width: 4.2em;
  text-align: right;
}

.ex-header__search-row__chg--up {
  color: var(--ex-rise);
}

.ex-header__search-row__chg--down {
  color: var(--ex-fall);
}

.ex-header__search-earn {
  display: flex;
  gap: $space-2;
  overflow-x: auto;
  padding-bottom: 2px;
}

.ex-header__earn-card {
  flex: 0 0 auto;
  min-width: 92px;
  padding: $space-3 $space-2;
  text-align: center;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border);
  background: var(--ex-fill-ghost);
  cursor: pointer;
  font-family: inherit;
  transition: border-color $duration-fast $ease-standard;
}

.ex-header__earn-card:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 40%, transparent);
}

.ex-header__earn-card__asset {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary);
}

.ex-header__earn-card__lbl {
  display: block;
  margin-top: $space-1;
  font-size: 10px;
  color: var(--ex-text-tertiary);
}

.ex-header__earn-card__apy {
  display: block;
  margin-top: 4px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--ex-rise);
}

.ex-header__brand {
  flex-shrink: 0;
  margin-right: $space-8;
}

.ex-header__logo {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  font-weight: $font-weight-bold;
  font-size: $font-size-lg;
  letter-spacing: 0.06em;
  color: var(--ex-text-primary);
}

.ex-header__logo:hover {
  color: var(--ex-brand);
}

.ex-header__logo-mark {
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  flex-shrink: 0;
  object-fit: contain;
  display: block;
}

.ex-header__nav {
  display: flex;
  align-items: center;
  gap: $space-1;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}

.ex-nav-dd {
  position: relative;
  flex-shrink: 0;
}

.ex-nav-dd--right {
  flex-shrink: 0;
}

.ex-header__link {
  display: inline-flex;
  align-items: center;
  padding: $space-2 $space-3;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  color: var(--ex-text-secondary);
  border-radius: $radius-sm;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

.ex-header__link--trigger {
  gap: 6px;
  align-items: center;
}

.ex-header__link:hover {
  color: var(--ex-text-primary);
  background: var(--ex-nav-float-hover);
}

.ex-header__link--active {
  color: var(--ex-brand);
  background: var(--ex-brand-muted);
}

.ex-nav-dd__chev {
  display: block;
  flex-shrink: 0;
  margin-top: 1px;
  color: currentColor;
  opacity: 0.72;
  transition: transform $duration-fast $ease-standard;
}

.ex-nav-dd__chev--open {
  transform: rotate(180deg);
}

.ex-nav-dd__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 288px;
  padding: $space-2;
  background: var(--ex-bg-nav-float);
  border: 1px solid var(--ex-nav-float-border);
  border-radius: var(--ex-nav-float-radius);
  box-shadow: var(--ex-nav-float-shadow);
  z-index: var(--ex-z-header-panel, 1200);
}

/* 主导航 / 更多：mega 与标准下拉同一白底体系，靠留白与图标区分层级 */
.ex-nav-dd__panel--mega {
  min-width: 300px;
  padding: 10px;
  border-radius: var(--ex-nav-float-radius);
  background: var(--ex-bg-nav-float);
  border: 1px solid var(--ex-nav-float-border);
  box-shadow: var(--ex-nav-float-shadow);
}

.ex-nav-dd__panel--right.ex-nav-dd__panel--mega {
  min-width: 268px;
}

.ex-nav-dd__panel--mega .ex-nav-dd__row {
  padding: 10px 10px;
  gap: $space-3;
}

.ex-nav-dd__panel--mega .ex-nav-dd__label {
  font-weight: $font-weight-semibold;
  letter-spacing: -0.01em;
}

.ex-nav-dd__icon-wrap--mega {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--ex-menu-icon-tile-bg);
  border: 1px solid color-mix(in srgb, var(--ex-text-primary) 6%, transparent);
  color: var(--ex-menu-icon-color);
  font-size: calc(var(--ex-icon-size-md) + 1px);
  transition:
    color var(--ex-transition-fast),
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast);
}

.ex-nav-dd__row:hover .ex-nav-dd__icon-wrap--mega {
  border-color: color-mix(in srgb, var(--ex-brand) 32%, transparent);
  background: color-mix(in srgb, var(--ex-brand) 8%, var(--ex-bg-nav-float));
  color: var(--ex-menu-icon-hover);
}

.ex-nav-dd__panel--mega .ex-nav-dd__row.router-link-active {
  background: color-mix(in srgb, var(--ex-brand) 9%, transparent);
}

.ex-nav-dd__panel--mega .ex-nav-dd__row.router-link-active .ex-nav-dd__label {
  color: var(--ex-brand);
}

.ex-nav-dd__panel--mega .ex-nav-dd__row.router-link-active .ex-nav-dd__icon-wrap--mega {
  border-color: color-mix(in srgb, var(--ex-brand) 42%, transparent);
  background: color-mix(in srgb, var(--ex-brand) 12%, var(--ex-bg-nav-float));
  color: var(--ex-menu-icon-active);
}

.ex-nav-dd__panel--right {
  left: auto;
  right: 0;
}

.ex-nav-dd__panel--wallet {
  min-width: 220px;
  max-width: min(300px, calc(100vw - #{$space-4} * 2));
}

.ex-nav-dd__panel--wallet .ex-nav-dd__row.router-link-active .ex-nav-dd__icon-wrap--sm {
  color: var(--ex-menu-icon-active);
}

.ex-nav-dd__panel--wallet .ex-nav-dd__row.router-link-active .ex-nav-dd__label {
  color: var(--ex-brand);
}

.ex-nav-dd__panel--user {
  display: flex;
  flex-direction: column;
  min-width: 288px;
  max-width: min(340px, calc(100vw - #{$space-4} * 2));
  padding: 0 0 $space-2;
}

/* 个人中心：轻量辅助图标，与钱包下拉共用菜单图标 token */
.ex-nav-dd__panel--user .ex-nav-dd__icon-wrap--sm {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  font-size: var(--ex-icon-size-sm);
  color: var(--ex-menu-icon-color);
  background: transparent;
  border: none;
  border-radius: $radius-sm;
}

.ex-nav-dd__panel--user .ex-nav-dd__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-text-primary);
}

.ex-nav-dd__panel--user .ex-user-dd__logout .ex-nav-dd__icon-wrap--sm {
  color: var(--ex-menu-icon-muted);
}

.ex-nav-dd__panel--user .ex-user-dd__logout:hover .ex-nav-dd__icon-wrap--sm {
  color: var(--ex-menu-icon-hover);
}

.ex-nav-dd__panel--user .ex-user-dd__logout span:last-child {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.ex-nav-dd__panel--lang {
  min-width: 200px;
  max-height: min(360px, 72vh);
  overflow-x: hidden;
  overflow-y: auto;
  padding: $space-2 0;
}

.ex-lang-dd__btn {
  display: block;
  width: 100%;
  padding: $space-2 $space-3;
  border: none;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-text-primary);
  cursor: pointer;
}

.ex-lang-dd__btn:hover {
  background: var(--ex-nav-float-hover);
}

.ex-lang-dd__btn--active {
  color: var(--ex-brand);
  font-weight: $font-weight-semibold;
  background: var(--ex-brand-muted);
}

.ex-header__locale-dd {
  position: relative;
  flex-shrink: 0;
}

.ex-header__locale-dd--mobile .ex-nav-dd__panel--lang-mobile {
  position: fixed;
  top: calc(#{$header-height} + 6px);
  right: $space-3;
  left: auto;
  z-index: 135;
  width: min(260px, calc(100vw - #{$space-4} * 2));
}

/* —— APP 下载：悬停/点击浮层（与语言切换同一交互模型） —— */
.ex-header__app-dd {
  position: relative;
  flex-shrink: 0;
}

.ex-header__app-panel {
  min-width: 300px;
  max-width: min(340px, calc(100vw - #{$space-4} * 2));
  padding: $space-4 $space-4 $space-3;
  animation: ex-app-panel-enter 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: 100% 0;
}

@keyframes ex-app-panel-enter {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ex-header__app-panel {
    animation: none;
  }
}

.ex-header__app-panel-inner {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.ex-header__app-panel-kicker {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ex-text-tertiary);
}

.ex-header__app-panel-title {
  margin: 0 0 6px;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: var(--ex-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.ex-header__app-panel-sub {
  margin: 0;
  font-size: $font-size-xs;
  line-height: 1.55;
  color: var(--ex-text-secondary);
}

.ex-header__app-panel-body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: $space-4;
  align-items: start;
}

.ex-header__app-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.ex-header__app-qr-frame {
  position: relative;
  width: 112px;
  height: 112px;
  border-radius: 12px;
  padding: 8px;
  background: var(--ex-surface-inset, var(--ex-bg-muted));
  border: 1px solid var(--ex-border-subtle);
  box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 8%, transparent);
}

.ex-header__app-qr-mosaic {
  position: absolute;
  inset: 8px;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--ex-text-primary) 8%, var(--ex-bg-nav-float));
  background-image:
    linear-gradient(90deg, color-mix(in srgb, var(--ex-text-primary) 22%, transparent) 50%, transparent 50%),
    linear-gradient(180deg, color-mix(in srgb, var(--ex-text-primary) 22%, transparent) 50%, transparent 50%);
  background-size: 7px 7px;
}

.ex-header__app-qr-logo {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.ex-header__app-qr-logo img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.28),
    0 0 0 1px color-mix(in srgb, #ffffff 18%, transparent);
}

.ex-header__app-qr-cap {
  font-size: 11px;
  font-weight: $font-weight-medium;
  color: var(--ex-text-tertiary);
  text-align: center;
  max-width: 120px;
  line-height: 1.4;
}

.ex-header__app-stores {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-width: 0;
}

.ex-header__app-store {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  border: 1px solid var(--ex-border-subtle);
  background: color-mix(in srgb, var(--ex-text-primary) 3.5%, var(--ex-bg-nav-float));
  color: var(--ex-text-primary);
  transition:
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast),
    box-shadow var(--ex-transition-fast),
    transform var(--ex-transition-fast);
}

.ex-header__app-store:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 38%, var(--ex-border));
  background: color-mix(in srgb, var(--ex-brand) 8%, var(--ex-bg-nav-float));
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
  transform: translateY(-1px);
}

.ex-header__app-store:active {
  transform: translateY(0);
}

.ex-header__app-store:focus-visible {
  outline: 2px solid var(--ex-border-focus);
  outline-offset: 2px;
}

.ex-header__app-store-glyph {
  flex-shrink: 0;
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--ex-text-primary) 6%, transparent);
}

.ex-header__app-store--android .ex-header__app-store-glyph {
  color: #3ddc84;
  background: color-mix(in srgb, #3ddc84 16%, transparent);
}

.ex-header__app-store--ios .ex-header__app-store-glyph {
  color: var(--ex-text-primary);
}

.ex-header__app-store-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ex-header__app-store-line {
  font-size: 10px;
  line-height: 1.2;
  color: var(--ex-text-tertiary);
  font-weight: $font-weight-medium;
}

.ex-header__app-store-line--emph {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--ex-text-primary);
}

.ex-header__app-store-chev {
  flex-shrink: 0;
  opacity: 0.38;
  margin-left: 2px;
  color: var(--ex-text-tertiary);
}

.ex-header__app-store:hover .ex-header__app-store-chev {
  opacity: 0.62;
  color: var(--ex-text-secondary);
}

.ex-header__app-panel-foot {
  padding-top: $space-2;
  margin: 0 (-$space-1);
  border-top: 1px solid var(--ex-border-subtle);
  text-align: center;
}

.ex-header__app-panel-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $space-2 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  text-decoration: none;
  border-radius: $radius-sm;
}

.ex-header__app-panel-more:hover {
  background: var(--ex-brand-muted);
}

.ex-header__app-panel-more:focus-visible {
  outline: 2px solid var(--ex-border-focus);
  outline-offset: 2px;
}

.ex-header__app-dd--mobile .ex-header__app-panel--mobile {
  position: fixed;
  top: calc(#{$header-height} + 6px);
  right: $space-3;
  left: auto;
  z-index: 135;
  width: min(320px, calc(100vw - #{$space-4} * 2));
  min-width: 0;
}

@include mq.media-down(sm) {
  .ex-header__app-panel-body {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .ex-header__app-qr-cap {
    max-width: 100%;
  }

  .ex-header__app-stores {
    width: 100%;
  }
}

.ex-nav-dd__icon-wrap--sm {
  width: 28px;
  height: 28px;
  font-size: var(--ex-icon-size-sm);
  background: transparent;
  border: none;
  color: var(--ex-menu-icon-color);
  border-radius: 8px;
}

.ex-nav-dd__row--compact:hover .ex-nav-dd__icon-wrap--sm,
.ex-nav-dd__row--compact:focus-visible .ex-nav-dd__icon-wrap--sm {
  color: var(--ex-menu-icon-hover);
}

.ex-nav-dd__row--compact {
  padding: $space-2 $space-3;
  margin: 0 $space-2;
  border-radius: $radius-md;
}

.ex-nav-dd__panel--user .ex-nav-dd__row--compact {
  padding: 10px $space-3;
  margin: 0 $space-2;
  align-items: center;
}

.ex-user-dd__head {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4 $space-3 $space-3;
  border-bottom: 1px solid var(--ex-border);
}

/* 用户下拉占位头像：纯色品牌底，与全站主按钮语义一致 */
.ex-user-dd__avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: 1;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #000000 8%, transparent);
}

.ex-user-dd__avatar--photo {
  display: block;
  object-fit: cover;
  padding: 0;
  background: var(--ex-nav-float-inset);
}

.ex-user-dd__meta {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  padding-top: 2px;
}

.ex-user-dd__name {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: var(--ex-text-primary);
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.ex-user-dd__uid {
  margin-top: 6px;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: var(--ex-text-tertiary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.ex-user-dd__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: $space-2;
}

.ex-user-dd__pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border-radius: 999px;
  line-height: 1.4;
}

.ex-user-dd__pill--vip {
  color: var(--ex-brand);
  border: 1px solid color-mix(in srgb, var(--ex-brand) 45%, transparent);
  background: var(--ex-brand-muted);
}

.ex-user-dd__pill--muted {
  color: var(--ex-text-secondary);
  background: var(--ex-fill-ghost);
  border: 1px solid var(--ex-border);
}

.ex-user-dd__pill--warn {
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border: 1px solid transparent;
}

.ex-user-dd__pill--ok {
  color: var(--ex-rise);
  background: var(--ex-rise-bg);
  border: 1px solid color-mix(in srgb, var(--ex-rise) 25%, transparent);
}

/* 订单中心入口：与子路由 /orders/* 高亮一致（链接指向 ledger，其它子页用手动 class） */
.ex-nav-dd__panel--user .ex-nav-dd__row--compact.ex-nav-dd__row--orders-on {
  background: var(--ex-brand-muted);
}

.ex-nav-dd__panel--user .ex-nav-dd__row--compact.ex-nav-dd__row--orders-on .ex-nav-dd__label {
  color: var(--ex-brand);
}

.ex-nav-dd__panel--user .ex-nav-dd__row--compact.ex-nav-dd__row--orders-on .ex-nav-dd__icon-wrap--sm {
  color: var(--ex-brand);
}

.ex-user-dd__sep {
  height: 1px;
  margin: $space-2 $space-3;
  background: var(--ex-border);
}

.ex-user-dd__logout {
  display: flex;
  align-items: center;
  gap: $space-2;
  width: calc(100% - #{$space-4});
  margin: 0 $space-2;
  padding: $space-2 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--ex-text-primary);
  background: transparent;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.ex-user-dd__logout:hover {
  background: var(--ex-nav-float-hover);
}

.ex-header__user-trigger {
  padding: 0;
  overflow: hidden;
}

.ex-header__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
}

.ex-header__user-avatar--photo {
  display: block;
  object-fit: cover;
  padding: 0;
  background: var(--ex-nav-float-inset);
}

.ex-nav-dd__row {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-2;
  border-radius: $radius-md;
  text-decoration: none;
  color: var(--ex-text-primary);
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  transition:
    background $duration-fast $ease-standard,
    color $duration-fast $ease-standard;
}

.ex-nav-dd__row:hover {
  background: var(--ex-nav-float-hover);
}

/* 下拉图标容器基类（与 --mega / --sm 组合使用）：弱化「线框方盒」 */
.ex-nav-dd__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--ex-menu-icon-color);
  font-size: var(--ex-icon-size-md);
  transition:
    color var(--ex-transition-fast),
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast);
}

.ex-nav-dd__label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
}

.ex-header__actions {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-left: auto;
  flex-wrap: wrap;
  flex-shrink: 0;
  min-width: 0;
}

.ex-header__actions--desktop {
  flex-wrap: nowrap;
  gap: 6px;
  padding-right: max(0px, env(safe-area-inset-right, 0px));
}

.ex-header__actions--desktop .ex-header__icon-btn {
  width: var(--ex-icon-btn-size);
  height: var(--ex-icon-btn-size);
}

.ex-header__actions--desktop .ex-header__app-nav {
  width: var(--ex-icon-btn-size);
  min-width: var(--ex-icon-btn-size);
  padding: 0;
  gap: 0;
}

.ex-header__actions--desktop .ex-header__app-nav--on {
  width: auto;
  min-width: 0;
  padding: 0 10px 0 7px;
  gap: 6px;
}

.ex-header__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ex-icon-btn-size);
  height: var(--ex-icon-btn-size);
  padding: 0;
  flex-shrink: 0;
  color: var(--ex-icon-secondary);
  background: var(--ex-icon-btn-bg);
  border: 1px solid var(--ex-icon-btn-border);
  border-radius: var(--ex-icon-btn-radius);
  box-shadow: none;
  cursor: pointer;
  text-decoration: none;
  transition:
    color var(--ex-transition-fast),
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast),
    box-shadow var(--ex-transition-fast);
}

.ex-header__icon-btn:hover {
  color: var(--ex-icon-primary);
  background: var(--ex-icon-btn-hover-bg);
  border-color: var(--ex-icon-btn-border-hover);
  box-shadow: var(--ex-icon-btn-shadow-hover);
}

.ex-header__icon-btn:focus-visible {
  outline: 2px solid var(--ex-border-focus);
  outline-offset: 2px;
}

.ex-header__icon-btn--active {
  color: var(--ex-icon-active);
  border-color: var(--ex-icon-btn-active-border);
  background: var(--ex-icon-btn-active-bg);
  box-shadow: none;
}

.ex-header__app-nav {
  flex-direction: row;
}

.ex-header__app-nav-label {
  font-size: 11px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1;
  color: inherit;
}

.ex-header__app-nav--on .ex-header__app-nav-label {
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ex-header__icon-btn--mobile.ex-header__app-nav {
  width: calc(var(--ex-icon-btn-size) + 4px);
  min-width: calc(var(--ex-icon-btn-size) + 4px);
  padding: 0;
}

.ex-header__icon-btn--mobile.ex-header__app-nav--on {
  width: auto;
  min-width: 0;
  padding: 0 10px 0 8px;
  gap: 5px;
}

.ex-header__icon-btn--chat {
  position: relative;
}

.ex-header__chat-ping {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ex-icon-active);
  box-shadow: 0 0 0 2px var(--ex-bg-header);
}

.ex-header__icon-svg {
  display: block;
  flex-shrink: 0;
  width: var(--ex-icon-size-md);
  height: var(--ex-icon-size-md);
  color: currentColor;
}

.ex-header__icon-el {
  font-size: var(--ex-icon-size-md);
  line-height: 1;
  color: currentColor;
}

.ex-header__icon-btn--mobile {
  width: calc(var(--ex-icon-btn-size) + 4px);
  height: calc(var(--ex-icon-btn-size) + 4px);
}

.ex-header__mobile-tools {
  display: none;
  align-items: center;
  gap: $space-2;
  margin-left: auto;
  flex-shrink: 0;
  min-width: 0;
}

.ex-header__mobile-cluster {
  display: flex;
  align-items: center;
  gap: $space-1;
  flex-shrink: 0;
}

.ex-header__account-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: $control-height-lg;
  padding: 0 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  background: var(--ex-brand-muted);
  border: 1px solid color-mix(in srgb, var(--ex-brand) 32%, transparent);
  border-radius: $radius-md;
  text-decoration: none;
}

.ex-header__account-pill:hover {
  background: color-mix(in srgb, var(--ex-brand) 22%, transparent);
}

.ex-header__login-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: $control-height-lg;
  padding: 0 $space-3;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary);
  background: var(--ex-nav-float-inset);
  border: 1px solid var(--ex-nav-float-border);
  border-radius: $radius-md;
  text-decoration: none;
}

.ex-header__login-pill:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
  color: var(--ex-brand);
}

.ex-header__burger {
  display: none;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  padding: 0;
  background: var(--ex-icon-btn-bg);
  border: 1px solid var(--ex-icon-btn-border);
  border-radius: var(--ex-icon-btn-radius);
  cursor: pointer;
  color: var(--ex-icon-primary);
  transition:
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast);
}

.ex-header__burger:hover {
  background: var(--ex-icon-btn-hover-bg);
  border-color: var(--ex-icon-btn-border-hover);
}

.ex-header__burger-line {
  display: block;
  width: 18px;
  height: 2px;
  margin: 0 auto;
  background: currentColor;
  border-radius: 1px;
}

@include mq.media-down(lg) {
  .ex-header__nav--desktop,
  .ex-header__actions--desktop {
    display: none;
  }

  .ex-header__mobile-tools {
    display: flex;
  }

  .ex-header__burger {
    display: inline-flex;
  }

  .ex-header__brand {
    margin-right: $space-2;
    min-width: 0;
    flex: 1 1 auto;
  }

  .ex-header__logo {
    min-width: 0;
    max-width: 100%;
  }

  .ex-header__logo-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  @media (max-width: 560px) {
    .ex-header {
      padding-left: max(#{$space-2}, env(safe-area-inset-left, 0px));
      padding-right: max(#{$space-2}, env(safe-area-inset-right, 0px));
    }

    .ex-header__mobile-cluster {
      display: none;
    }

    .ex-header__mobile-tools {
      gap: $space-1;
    }

    .ex-header__icon-btn--mobile {
      width: 36px;
      height: 36px;
    }

    .ex-header__icon-btn--mobile .ex-header__icon-el {
      font-size: 18px;
    }

    .ex-header__icon-btn--mobile.ex-header__app-nav {
      width: 36px;
      min-width: 36px;
    }

    .ex-header__chat-ping {
      top: 6px;
      right: 6px;
    }

    .ex-header__account-pill,
    .ex-header__login-pill {
      padding: 0 $space-2;
      font-size: $font-size-xs;
      min-height: 36px;
    }

    .ex-header__burger {
      width: 40px;
      height: 40px;
    }
  }
}

.ex-header__backdrop {
  position: fixed;
  inset: 0;
  z-index: $z-modal-backdrop;
  background: var(--ex-overlay-backdrop);
}

.ex-header__drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: $z-modal;
  display: flex;
  flex-direction: column;
  width: min(360px, 92vw);
  background: var(--ex-bg-header);
  border-left: 1px solid var(--ex-border);
  box-shadow: -12px 0 40px color-mix(in srgb, #000000 45%, transparent);
  transform: translateX(100%);
  transition: transform $duration-normal $ease-standard;
  @include mq.safe-area-padding(all);
}

.ex-header__drawer--open {
  transform: translateX(0);
}

.ex-header__drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--ex-border);
}

.ex-header__drawer-title {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary);
}

.ex-header__drawer-close {
  width: 40px;
  height: 40px;
  font-size: 24px;
  line-height: 1;
  color: var(--ex-text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.ex-header__drawer-close:hover {
  color: var(--ex-text-primary);
}

.ex-header__drawer-nav {
  display: flex;
  flex-direction: column;
  padding: $space-2 0;
  overflow-y: auto;
}

.ex-drawer-dd__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $space-3 $space-4;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: var(--ex-text-primary);
  background: none;
  border: none;
  border-bottom: 1px solid var(--ex-border-subtle);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.ex-drawer-dd__chev {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--ex-text-tertiary);
  border-bottom: 2px solid var(--ex-text-tertiary);
  transform: rotate(45deg);
  transition: transform $duration-fast $ease-standard;
}

.ex-drawer-dd__trigger--open .ex-drawer-dd__chev {
  transform: rotate(-135deg);
  margin-top: 4px;
}

.ex-drawer-dd__panel {
  padding: $space-2 $space-3 $space-3;
  background: var(--ex-bg-nav-float);
  border-bottom: 1px solid var(--ex-nav-float-border);
}

.ex-drawer-dd__link {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-3;
  margin-bottom: $space-1;
  border-radius: $radius-md;
  text-decoration: none;
  color: var(--ex-text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  border: 1px solid transparent;
  transition: background $duration-fast $ease-standard;
}

.ex-drawer-dd__link:last-child {
  margin-bottom: 0;
}

.ex-drawer-dd__link:hover {
  background: var(--ex-nav-float-hover);
}

.ex-drawer-dd__link--active {
  border-color: color-mix(in srgb, var(--ex-brand) 35%, transparent);
  background: var(--ex-brand-muted);
  color: var(--ex-brand);
}

.ex-drawer-dd__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: $radius-md;
  background: var(--ex-bg-nav-float);
  border: 1px solid var(--ex-nav-float-border);
  color: var(--ex-brand);
  font-size: 18px;
  flex-shrink: 0;
}

.ex-drawer-dd__icon--mega {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 21px;
  color: color-mix(in srgb, var(--ex-text-primary) 88%, #ffffff);
  background: color-mix(in srgb, var(--ex-text-primary) 5%, var(--ex-bg-nav-float));
  border: 1px solid color-mix(in srgb, var(--ex-text-primary) 8%, var(--ex-nav-float-border));
}

.ex-drawer-dd__link:hover .ex-drawer-dd__icon--mega {
  border-color: color-mix(in srgb, var(--ex-brand) 28%, var(--ex-nav-float-border));
  background: color-mix(in srgb, var(--ex-brand) 7%, var(--ex-bg-nav-float));
  color: var(--ex-text-primary);
}

.ex-drawer-dd__link--active .ex-drawer-dd__icon--mega {
  border-color: color-mix(in srgb, var(--ex-brand) 38%, var(--ex-nav-float-border));
  background: color-mix(in srgb, var(--ex-brand) 10%, var(--ex-bg-nav-float));
  color: color-mix(in srgb, var(--ex-text-primary) 90%, #ffffff);
}

.ex-drawer-dd__text {
  flex: 1;
  min-width: 0;
}

.ex-header__drawer-link {
  padding: $space-3 $space-4;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  color: var(--ex-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.ex-header__drawer-link:hover,
.ex-header__drawer-link.router-link-active {
  color: var(--ex-text-primary);
  background: var(--ex-nav-float-hover);
}

.ex-header__drawer-link--active {
  color: var(--ex-brand);
  background: var(--ex-brand-muted);
}

.ex-header__drawer-tools {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  border-top: 1px solid var(--ex-border);
}

.ex-header__drawer-tools-title {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ex-text-tertiary);
}

.ex-header__drawer-lang {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.ex-header__drawer-lang-btn {
  padding: $space-1 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: var(--ex-text-secondary);
  background: var(--ex-bg-nav-float);
  border: 1px solid var(--ex-nav-float-border);
  border-radius: $radius-sm;
  cursor: pointer;
  font-family: inherit;
}

.ex-header__drawer-lang-btn:hover {
  border-color: color-mix(in srgb, var(--ex-brand) 35%, var(--ex-border));
  color: var(--ex-text-primary);
}

.ex-header__drawer-lang-btn--active {
  border-color: color-mix(in srgb, var(--ex-brand) 45%, var(--ex-border));
  background: var(--ex-brand-muted);
  color: var(--ex-brand);
}

.ex-header__drawer-tool {
  min-height: $control-height-lg;
  padding: 0 $space-3;
  font-size: $font-size-sm;
  text-align: left;
  color: var(--ex-icon-secondary);
  background: var(--ex-icon-btn-bg);
  border: 1px solid var(--ex-icon-btn-border);
  border-radius: var(--ex-icon-btn-radius);
  cursor: pointer;
  font-family: inherit;
  transition:
    color var(--ex-transition-fast),
    background var(--ex-transition-fast),
    border-color var(--ex-transition-fast);
}

.ex-header__drawer-tool--link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  text-decoration: none;
  box-sizing: border-box;
}

.ex-header__drawer-tool--link:hover {
  color: var(--ex-icon-primary);
  border-color: var(--ex-icon-btn-border-hover);
  background: var(--ex-icon-btn-hover-bg);
}

.ex-header__drawer-auth {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  border-top: 1px solid var(--ex-border);
}

.ex-header__drawer-ghost {
  padding: $space-2;
  font-size: $font-size-sm;
  color: var(--ex-brand);
  text-align: center;
  background: none;
  border: none;
  cursor: pointer;
}
</style>
