<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import { useAppStore } from '@/stores/app'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const app = useAppStore()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()

async function reset() {
  if (
    await ui.openConfirm({
      title: '重置演示数据',
      message: '恢复初始种子数据。',
      confirmText: '重置',
      dangerous: true,
    })
  ) {
    demo.resetSeed()
    router.push({ name: RouteNames.MobileHome })
  }
}
</script>

<template>
  <div class="page">
    <MpBackBar title="设置" />
    <button type="button" class="row" @click="app.pushToast('info', '语言：简体中文')">
      语言与地区 →
    </button>
    <button type="button" class="row" @click="app.pushToast('info', '通知设置（演示）')">
      通知 →
    </button>
    <button type="button" class="row danger" @click="reset">重置演示数据</button>
    <p class="tip">重置后首页、资产、订单等将恢复初始状态。</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.row {
  width: 100%;
  padding: 16px 18px;
  margin-bottom: 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  color: #eef2f7;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  &.danger {
    color: #e89898;
    border-color: rgba(232, 152, 152, 0.25);
  }
}

.tip {
  font-size: 12px;
  color: #8b95a8;
  margin-top: 16px;
  line-height: 1.45;
}
</style>
