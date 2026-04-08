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
const category = ref('设计')
const description = ref('')
const price = ref('199')

async function submit() {
  if (!title.value.trim()) {
    app.pushToast('warning', '请填写服务标题')
    return
  }
  const p = parseFloat(price.value)
  if (Number.isNaN(p) || p <= 0) {
    app.pushToast('warning', '标价无效')
    return
  }
  const ok = await ui.openConfirm({
    title: '确认上架',
    message: `标价 ${p} USDT，上架后将在「市场 · 服务」展示（演示）。`,
    confirmText: '上架',
  })
  if (!ok) return
  const s = demo.publishService({
    title: title.value.trim(),
    category: category.value,
    description: description.value.trim() || '（详见沟通）',
    priceUsdt: p,
  })
  if (s) router.replace({ name: RouteNames.MobileServiceDetail, params: { id: s.id } })
}
</script>

<template>
  <div class="page">
    <MpBackBar title="上架服务" />
    <p class="hint">数字模板、咨询课时、设计交付等可定价展示；成交走平台规则（演示）。</p>
    <label class="lab">服务标题</label>
    <input v-model="title" class="inp" placeholder="例如：品牌视觉规范 Lite 包" />
    <label class="lab">类别</label>
    <select v-model="category" class="inp">
      <option>设计</option>
      <option>开发</option>
      <option>翻译</option>
      <option>咨询</option>
      <option>其他</option>
    </select>
    <label class="lab">服务说明</label>
    <textarea v-model="description" class="area" rows="4" placeholder="交付物、交付周期、修订次数等" />
    <label class="lab">标价 USDT</label>
    <input v-model="price" class="inp" inputmode="decimal" />
    <button type="button" class="cta" @click="submit">确认上架</button>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 100px;
}

.hint {
  font-size: 12px;
  color: #8b95a8;
  line-height: 1.5;
  margin-bottom: 18px;
}

.lab {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #8b95a8;
  margin-bottom: 8px;
  letter-spacing: 0.04em;
}

.inp,
.area {
  width: 100%;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.35);
  color: #eef2f7;
  font-size: 15px;
}

.area {
  resize: vertical;
  min-height: 100px;
}

.cta {
  width: 100%;
  margin-top: 8px;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #c9a962 0%, #8a7038 100%);
  color: #0a0c10;
}
</style>
