<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowDown,
  EditPen,
  Expand,
  Fold,
  HomeFilled,
  SwitchButton,
  User,
  Wallet,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useAdminLayoutStore } from '@/stores/adminLayout'
import { RouteNames } from '@/constants/routeNames'
import { adminPath } from '@/utils/adminPublicPath'
import { isAppLocaleCode, type AppLocaleCode } from '@/locales/supportedLanguages'
import AdminBreadcrumb from './AdminBreadcrumb.vue'
import AdminThemeToggle from '@/components/admin/theme/AdminThemeToggle.vue'

/** 运营后台语言切换仅提供中英 */
const ADMIN_LOCALES: { code: AppLocaleCode; nativeName: string }[] = [
  { code: 'zh-CN', nativeName: '简体中文' },
  { code: 'en', nativeName: 'English' },
]

const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const app = useAppStore()
const layout = useAdminLayoutStore()
const { sidebarCollapsed } = storeToRefs(layout)
const { locale: appLocale } = storeToRefs(app)

const displayName = computed(
  () => auth.user?.nickname || auth.user?.userCode || 'root',
)

const currentLangLabel = computed(() => {
  if (appLocale.value === 'en') return 'English'
  return '简体中文'
})

const adminStandalone = import.meta.env.VITE_ADMIN_STANDALONE === 'true'
const exchangePublicUrl = (import.meta.env.VITE_EXCHANGE_PUBLIC_URL as string | undefined)?.trim()

function goExchangeHome() {
  if (adminStandalone && exchangePublicUrl) {
    window.open(exchangePublicUrl, '_blank', 'noopener,noreferrer')
    return
  }
  void router.push({ name: RouteNames.Home })
}

function onLocaleCommand(cmd: string) {
  if (cmd !== 'zh-CN' && cmd !== 'en') return
  if (isAppLocaleCode(cmd)) app.setLocale(cmd)
}

function onUserCommand(cmd: string) {
  if (cmd === 'login-pwd') {
    void router.push({ name: RouteNames.AdminAccountLoginPassword })
    return
  }
  if (cmd === 'fund-pwd') {
    void router.push({ name: RouteNames.AdminAccountFundPassword })
    return
  }
  if (cmd === 'logout') {
    logout()
  }
}

function logout() {
  auth.logout()
  app.openWelcomeModal(
    {
      illustration: 'shield',
      title: t('admin.header.userMenu.logout'),
      subtitle: t('admin.header.logoutSub'),
    },
    2200,
  )
  const loginName =
    adminStandalone ? RouteNames.AdminPortalLogin : RouteNames.Login
  void router.push({
    name: loginName,
    query: { redirect: adminPath('/dashboard') },
  })
}
</script>

<template>
  <header class="admin-header">
    <div class="admin-header__left">
      <el-button
        class="admin-header__fold"
        text
        :icon="sidebarCollapsed ? Expand : Fold"
        @click="layout.toggleSidebar()"
      />
      <AdminBreadcrumb />
    </div>
    <div class="admin-header__right">
      <el-tooltip :content="t('admin.header.backToExchange')" placement="bottom">
        <el-button type="primary" link :icon="HomeFilled" @click="goExchangeHome">
          {{ t('admin.header.backToExchange') }}
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical" />

      <AdminThemeToggle />
      <el-divider direction="vertical" />

      <el-dropdown
        trigger="click"
        popper-class="admin-header-dd admin-header-dd--locale"
        @command="onLocaleCommand"
      >
        <button
          type="button"
          class="admin-header__locale-trigger"
          :aria-label="t('admin.header.localeAria')"
        >
          <span class="admin-header__globe" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18" />
            </svg>
          </span>
          <span class="admin-header__locale-text">{{ currentLangLabel }}</span>
          <el-icon class="admin-header__caret"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="lang in ADMIN_LOCALES"
              :key="lang.code"
              :command="lang.code"
              :class="{ 'is-active': lang.code === 'en' ? appLocale === 'en' : appLocale !== 'en' }"
            >
              {{ lang.nativeName }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-divider direction="vertical" />

      <el-dropdown
        trigger="click"
        popper-class="admin-header-dd admin-header-dd--user"
        @command="onUserCommand"
      >
        <button
          type="button"
          class="admin-header__user-trigger"
          :aria-label="t('admin.header.userAria')"
        >
          <span class="admin-header__avatar" aria-hidden="true">
            <el-icon><User /></el-icon>
          </span>
          <span class="admin-header__name">{{ displayName }}</span>
          <el-icon class="admin-header__caret"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="login-pwd">
              <span class="admin-header__dd-item">
                <el-icon><EditPen /></el-icon>
                {{ t('admin.header.userMenu.loginPassword') }}
              </span>
            </el-dropdown-item>
            <el-dropdown-item command="fund-pwd">
              <span class="admin-header__dd-item">
                <el-icon><Wallet /></el-icon>
                {{ t('admin.header.userMenu.fundPassword') }}
              </span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <span class="admin-header__dd-item admin-header__dd-item--danger">
                <el-icon><SwitchButton /></el-icon>
                {{ t('admin.header.userMenu.logout') }}
              </span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px 0 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.042) 0%, $adm-bg-header 32%, $adm-bg-header 100%);
  border-bottom: 1px solid $adm-border-subtle;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 10px 28px rgba(0, 0, 0, 0.28);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.admin-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.admin-header__fold {
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

.admin-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}

.admin-header__locale-trigger,
.admin-header__user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  max-width: 280px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}

.admin-header__globe {
  display: flex;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.admin-header__locale-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
}

.admin-header__caret {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.admin-header__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: $adm-bg-header;
  flex-shrink: 0;

  .el-icon {
    font-size: 16px;
  }
}

.admin-header__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
}

.admin-header__dd-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;

  .el-icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }

  &--danger .el-icon {
    color: var(--el-color-danger);
  }
}
</style>

<style lang="scss">
/* teleported popper：白底卡片 + 顶角 */
.admin-header-dd.el-popper {
  border-radius: 12px !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.06) !important;
  padding: 6px 0 !important;
}

.admin-header-dd .el-dropdown-menu__item {
  padding: 10px 16px;
  line-height: 1.35;
}

.admin-header-dd .el-dropdown-menu__item.is-active {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
