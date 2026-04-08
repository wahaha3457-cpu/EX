import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installElementPlus } from '@/plugins/element-plus'
import { i18n } from '@/i18n'
import { useThemeStore } from '@/stores/theme'
import { usePreferencesStore } from '@/stores/preferences'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/main.scss'
import '@/styles/admin/index.scss'

if (import.meta.env.VITE_USE_MOCK === 'true') {
  void import('@/mocks/authMockService').then((m) => {
    m.mockSeedPortalAdminUser()
    m.mockSeedAdminUser()
    m.mockSeedDemoUser()
  })
}

const app = createApp(App)
const pinia = createPinia()
installElementPlus(app)
app.use(i18n)
app.use(pinia)
useThemeStore().initTheme()
usePreferencesStore().init()
app.use(router)
app.mount('#app')
