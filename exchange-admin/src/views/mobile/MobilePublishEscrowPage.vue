<script setup lang="ts">
import { ref } from 'vue'
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

const title = ref('')
const counterparty = ref('UF-8K2M-91Q')
const description = ref('')
const amount = ref('800')
const deliveryMethod = ref('一次性交割')
const proofs = ref<string[]>([])

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) {
    proofs.value = [f.name]
    app.pushToast('info', `凭证：${f.name}`)
  }
}

async function submit() {
  const a = parseFloat(amount.value)
  if (!title.value.trim() || Number.isNaN(a) || a <= 0) {
    app.pushToast('warning', '请完善标题与金额')
    return
  }
  const ok = await ui.openConfirm({
    title: '创建托管',
    message: `锁定 ${a} USDT 用于「${title.value.slice(0, 20)}」`,
    confirmText: '确认',
  })
  if (!ok) return
  const e = demo.createEscrow({
    title: title.value.trim(),
    counterparty: counterparty.value,
    description: description.value.trim() || '—',
    amountUsdt: a,
    deliveryMethod: deliveryMethod.value,
    proofNames: [...proofs.value],
  })
  if (e) router.replace({ name: RouteNames.MobileEscrowDetail, params: { id: e.id } })
}
</script>

<template>
  <div class="page">
    <MpBackBar title="创建托管" />
    <p class="tip">托管保护双方，请勿站外转账。</p>
    <label class="lab">交易标题</label>
    <input v-model="title" class="inp" />
    <label class="lab">对手 UID</label>
    <input v-model="counterparty" class="inp" />
    <label class="lab">说明</label>
    <textarea v-model="description" class="area" rows="3" />
    <label class="lab">托管金额 USDT</label>
    <input v-model="amount" class="inp" inputmode="decimal" />
    <label class="lab">交割方式</label>
    <select v-model="deliveryMethod" class="inp">
      <option>一次性交割</option>
      <option>分阶段释放</option>
      <option>自定义</option>
    </select>
    <label class="lab">凭证</label>
    <label class="file"><input type="file" @change="onFile" />上传（模拟）</label>
    <button type="button" class="cta" @click="submit">确认托管</button>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 100px;
}

.tip {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(201, 169, 98, 0.08);
  border: 1px solid rgba(201, 169, 98, 0.22);
  font-size: 12px;
  color: #c9a962;
  margin-bottom: 16px;
}

.lab {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin: 12px 0 8px;
}

.inp,
.area {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.28);
  color: #eef2f7;
  font-size: 15px;
}

.file {
  display: block;
  padding: 18px;
  text-align: center;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  color: #4dc4ff;
  cursor: pointer;

  input {
    display: none;
  }
}

.cta {
  margin-top: 22px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;
}
</style>
