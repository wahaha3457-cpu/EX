<script setup lang="ts">
/**
 * 全局 default ↔ monochrome 切换，与前台顶栏行为一致（同一 store + 同一存储键）。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

const { t } = useI18n()
const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

const isDefault = computed(() => theme.value === 'default')

const ariaLabel = computed(() =>
  isDefault.value ? t('layout.themeSwitchToMonochrome') : t('layout.themeSwitchToDefault'),
)

function onClick() {
  themeStore.toggleTheme()
}
</script>

<template>
  <el-tooltip :content="ariaLabel" placement="bottom">
    <button
      type="button"
      class="admin-theme-toggle"
      :aria-label="ariaLabel"
      :title="ariaLabel"
      @click="onClick"
    >
      <el-icon v-if="isDefault" class="admin-theme-toggle__ic"><Moon /></el-icon>
      <el-icon v-else class="admin-theme-toggle__ic"><Sunny /></el-icon>
    </button>
  </el-tooltip>
</template>

<style scoped lang="scss">
.admin-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  &:active {
    transform: scale(0.96);
  }
}

.admin-theme-toggle__ic {
  font-size: 20px;
}

/* 黑白模式下顶栏为浅底：按钮浅灰底 + 太阳/月亮图标强制纯黑，避免继承成浅色看不见 */
:global([data-theme='monochrome']) .admin-theme-toggle {
  color: #000000;
  border: 1px solid #cbd5e1;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  &:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
    color: #000000;
  }
}

:global([data-theme='monochrome']) .admin-theme-toggle__ic {
  font-size: 24px;
  color: #000000 !important;
  opacity: 1 !important;
}

:global([data-theme='monochrome']) .admin-theme-toggle__ic svg {
  fill: #000000 !important;
  color: #000000 !important;
}

/* 线型图标略增对比，避免浅灰细线贴在浅底上 */
:global([data-theme='monochrome']) .admin-theme-toggle__ic {
  filter: contrast(1.35);
}
</style>
