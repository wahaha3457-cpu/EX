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
const budget = ref('500')
const deadline = ref('7 天内')
const needEscrow = ref(true)
const files = ref<string[]>([])

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) {
    files.value = [f.name]
    app.pushToast('info', `已选择文件（演示）：${f.name}`)
  }
}

async function submit() {
  if (!title.value.trim()) {
    app.pushToast('warning', '请填写任务标题')
    return
  }
  const b = parseFloat(budget.value)
  if (Number.isNaN(b) || b <= 0) {
    app.pushToast('warning', '预算无效')
    return
  }
  const ok = await ui.openConfirm({
    title: '确认发布',
    message: needEscrow.value
      ? `将锁定 ${b} USDT 作为托管赏金（演示）。`
      : '不锁定托管赏金（演示无资金冻结）。',
    confirmText: '发布',
  })
  if (!ok) return
  const t = demo.publishTask({
    title: title.value.trim(),
    category: category.value,
    description: description.value.trim() || '（无说明）',
    rewardUsdt: b,
    deadline: deadline.value,
    needEscrow: needEscrow.value,
    attachmentNames: [...files.value],
  })
  if (t) {
    router.replace({ name: RouteNames.MobileTaskDetail, params: { id: t.id } })
  }
}
</script>

<template>
  <div class="page">
    <MpBackBar title="发布任务" />
    <label class="lab">任务标题</label>
    <input v-model="title" class="inp" placeholder="简要描述要做什么" />
    <label class="lab">类别</label>
    <select v-model="category" class="inp">
      <option>设计</option>
      <option>开发</option>
      <option>翻译</option>
      <option>咨询</option>
      <option>其他</option>
    </select>
    <label class="lab">说明</label>
    <textarea v-model="description" class="area" rows="4" placeholder="验收标准、交付物等" />
    <label class="lab">预算 USDT</label>
    <input v-model="budget" class="inp" inputmode="decimal" />
    <label class="lab">截止</label>
    <input v-model="deadline" class="inp" />
    <label class="row">
      <span>需要托管赏金</span>
      <input v-model="needEscrow" type="checkbox" />
    </label>
    <label class="lab">附件（模拟）</label>
    <label class="file">
      <input type="file" accept="*/*" @change="onFile" />
      选择文件
    </label>
    <button type="button" class="cta" @click="submit">确认发布</button>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 100px;
}

.lab {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin: 14px 0 8px;
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

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 18px 0;
  font-size: 14px;
  font-weight: 600;
}

.file {
  display: block;
  padding: 20px;
  text-align: center;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  color: #4dc4ff;
  font-weight: 600;
  cursor: pointer;

  input {
    display: none;
  }
}

.cta {
  margin-top: 24px;
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
