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

const amt = ref('500')

async function go() {
  const a = parseFloat(amt.value)
  if (Number.isNaN(a) || a <= 0) {
    app.pushToast('warning', '请输入有效金额')
    return
  }
  if (await ui.openConfirm({ title: '模拟充值', message: `入账 ${a} USDT（演示）`, confirmText: '确认' })) {
    demo.simulateDeposit(a)
    router.back()
  }
}
</script>

<template>
  <div class="page">
    <MpBackBar title="充值" />
    <p class="hint">演示：向链上地址转账流程省略，直接模拟到账。</p>
    <div class="addr">TRC20 地址（示例）<br />TXYZdemo…8a2f</div>
    <label class="lab">模拟到账金额 USDT</label>
    <input v-model="amt" class="inp" inputmode="decimal" />
    <button type="button" class="cta" @click="go">我已转账 · 模拟到账</button>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.hint {
  font-size: 13px;
  color: #8b95a8;
  line-height: 1.5;
  margin-bottom: 16px;
}

.addr {
  padding: 16px;
  border-radius: 16px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 20px;
  word-break: break-all;
}

.lab {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.inp {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.28);
  color: #eef2f7;
  font-size: 16px;
  margin-bottom: 20px;
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
