<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const app = useAppStore()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()

const address = ref('TXYZdemoWithdrawAddr')
const amount = ref('100')
const fee = 1

async function submit() {
  const a = parseFloat(amount.value)
  if (!address.value.trim()) {
    app.pushToast('warning', '请填写地址')
    return
  }
  if (Number.isNaN(a) || a <= 0) {
    app.pushToast('warning', '金额无效')
    return
  }
  if (a + fee > demo.availableUsdt) {
    app.pushToast('error', '余额不足（含手续费）')
    return
  }
  const ok = await ui.openConfirm({
    title: '确认提现',
    message: `提出 ${a} USDT，网络费约 ${fee} USDT（演示）。`,
    confirmText: '提交',
  })
  if (!ok) return
  demo.withdrawApply(address.value.trim(), a + fee)
  router.back()
}
</script>

<template>
  <div class="page">
    <MpBackBar title="提现" />
    <label class="lab">链上地址</label>
    <input v-model="address" class="inp" />
    <label class="lab">金额 USDT</label>
    <input v-model="amount" class="inp" inputmode="decimal" />
    <p class="fee">预计网络费 {{ fee }} USDT（演示固定值）</p>
    <button type="button" class="cta" @click="submit">提交申请</button>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.lab {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin: 12px 0 8px;
}

.inp {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.28);
  color: #eef2f7;
  font-size: 15px;
}

.fee {
  font-size: 12px;
  color: #8b95a8;
  margin: 12px 0 20px;
}

.cta {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;
}
</style>
