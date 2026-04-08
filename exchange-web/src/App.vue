<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElConfigProvider } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getElementPlusLocale } from '@/i18n/elementLocale'
import type { AppLocaleCode } from '@/locales/supportedLanguages'
import AppToast from '@/components/common/AppToast.vue'
import GlobalSupportFab from '@/components/common/GlobalSupportFab.vue'
import SupportChatWindow from '@/components/support/SupportChatWindow.vue'
import WelcomeModal from '@/components/common/WelcomeModal.vue'

const auth = useAuthStore()
const appStore = useAppStore()
const { locale } = storeToRefs(appStore)

const epLocale = computed(() => getElementPlusLocale(locale.value as AppLocaleCode))

onMounted(() => {
  if (auth.isAuthenticated) {
    void auth.loadProfile()
  }
})
</script>

<template>
  <el-config-provider :locale="epLocale">
    <RouterView />
    <AppToast />
    <WelcomeModal />
    <GlobalSupportFab />
    <SupportChatWindow />
  </el-config-provider>
</template>
