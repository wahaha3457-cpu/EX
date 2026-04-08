<script setup lang="ts">
/* 已由 /account/* 账户工作台替代；保留文件便于对照，路由不再挂载本页 */
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUserCenterStore } from '@/stores/userCenter'
import { kycStepToOverviewStatus, readKycState } from '@/api/kyc/kycMock'
import type { UserCenterNavTab } from '@/types/userCenter'
import {
  UserCenterAccountCard,
  UserCenterNav,
  UserCenterOverviewPanel,
  UserCenterSecurityPanel,
  UserCenterLoginHistoryTable,
  UserCenterPlaceholderPanel,
} from '@/components/business/userCenter'
import { UserCenterKycPanel } from '@/components/business/kyc'
import { UserCenterPreferencesPanel } from '@/components/business/preferences'
import ExPageState from '@/components/common/ExPageState.vue'

const VALID_TABS: UserCenterNavTab[] = [
  'overview',
  'security',
  'kyc',
  'api',
  'login',
  'preferences',
]

const route = useRoute()
const router = useRouter()
const store = useUserCenterStore()
const auth = useAuthStore()
const { activeTab, loading, loadError, payload } = storeToRefs(store)

onMounted(async () => {
  await store.bootstrap()
  const q = route.query.tab
  if (typeof q === 'string' && VALID_TABS.includes(q as UserCenterNavTab)) {
    store.setTab(q as UserCenterNavTab)
  }
})

watch(activeTab, (t) => {
  if (route.query.tab === t) return
  void router.replace({ query: { ...route.query, tab: t } })
})

watch(
  () => route.query.tab,
  (q) => {
    if (typeof q !== 'string' || !VALID_TABS.includes(q as UserCenterNavTab)) return
    if (q === activeTab.value) return
    store.setTab(q as UserCenterNavTab)
  },
)

/** 离开身份认证 Tab 时刷新 KYC 快照（演示 localStorage 与总览/顶栏一致） */
watch(activeTab, (t, prev) => {
  if (prev !== 'kyc' || t === 'kyc') return
  const uc = auth.user?.userCode
  if (!uc) return
  const snap = kycStepToOverviewStatus(readKycState(uc))
  store.applyKycSnapshot(snap.kycStatus, snap.tier)
  auth.patchUser({ kycLevel: snap.tier })
})
</script>

<template>
  <div class="uc-page">
    <header class="uc-page__hero">
      <h1 class="uc-page__title">用户中心</h1>
      <p class="uc-page__subtitle">账户信息、安全设置与登录活动</p>
    </header>

    <ExPageState
      :loading="loading && !payload"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载用户数据…"
      @retry="store.bootstrap()"
    >
      <div class="uc-page__stack">
        <UserCenterAccountCard />

        <div class="uc-page__body">
          <UserCenterNav />

          <main class="uc-page__main">
            <section v-show="activeTab === 'overview'" class="uc-page__panel">
              <UserCenterOverviewPanel />
            </section>

            <section v-show="activeTab === 'security'" class="uc-page__panel uc-page__panel--security">
              <UserCenterSecurityPanel />
            </section>

            <section v-show="activeTab === 'kyc'" class="uc-page__panel">
              <UserCenterKycPanel />
            </section>

            <section v-show="activeTab === 'api'" class="uc-page__panel">
              <UserCenterPlaceholderPanel kind="api" />
            </section>

            <section v-show="activeTab === 'login'" class="uc-page__panel">
              <UserCenterLoginHistoryTable />
            </section>

            <section v-show="activeTab === 'preferences'" class="uc-page__panel">
              <UserCenterPreferencesPanel />
            </section>
          </main>
        </div>
      </div>
    </ExPageState>

    <p class="uc-page__foot">
      用户数据以服务端为准；安全操作需通过 POST /v1/users/security/* 与二次验证流程。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.uc-page {
  width: 100%;
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding-bottom: $space-8;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.uc-page__hero {
  margin-bottom: 0;
}

.uc-page__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
}

.uc-page__stack {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  min-width: 0;
}

@include mq.media-down(md) {
  .uc-page__stack {
    gap: $space-4;
  }

  .uc-page__title {
    font-size: $font-size-xl;
  }
}

.uc-page__subtitle {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.uc-page__body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: $space-5;
  align-items: start;
}

@include mq.media-between(md, lg) {
  .uc-page__body {
    grid-template-columns: 200px minmax(0, 1fr);
    gap: $space-3;
  }
}

@include mq.media-down(lg) {
  .uc-page__body {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}

.uc-page__main {
  min-width: 0;
}

.uc-page__panel {
  padding: $space-4 $space-5;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-bg-elevated;
  min-height: 200px;
}

@include mq.media-down(md) {
  .uc-page__panel {
    padding: $space-3 $space-4;
    border-radius: $radius-md;
  }
}

.uc-page__panel--security {
  border-color: rgba(48, 132, 252, 0.22);
  background: linear-gradient(180deg, rgba(48, 132, 252, 0.06) 0%, $color-bg-elevated 120px);
}

.uc-page__foot {
  margin: 0;
  padding-top: $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}
</style>
