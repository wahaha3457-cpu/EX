<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()
const { merchants } = storeToRefs(demo)

const side = computed(() => (route.query.side === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell')
const m = computed(() => merchants.value.find((x) => x.id === route.params.id as string))

const amount = ref('500')

const totalCny = computed(() => {
  const a = parseFloat(amount.value)
  if (!m.value || Number.isNaN(a)) return '0.00'
  return (a * m.value.priceCny).toFixed(2)
})

async function submitOrder() {
  const a = parseFloat(amount.value)
  if (!m.value || Number.isNaN(a) || a <= 0) return
  const ok = await ui.openConfirm({
    title: side.value === 'buy' ? '确认买入' : '确认卖出',
    message:
      side.value === 'buy'
        ? `向 ${m.value.name} 买入约 ${a} USDT，应付约 ¥${totalCny.value}（演示）`
        : `向 ${m.value.name} 卖出 ${a} USDT，预计到账约 ¥${totalCny.value}（演示）`,
    confirmText: '确认下单',
  })
  if (!ok) return
  const order =
    side.value === 'buy'
      ? demo.createBuyOrder(m.value.id, a)
      : demo.createSellOrder(m.value.id, a)
  if (order) {
    router.replace({ name: RouteNames.MobileOtcOrder, params: { id: order.id } })
  }
}
</script>

<template>
  <div class="page">
    <MpBackBar :title="side === 'buy' ? '买入 USDT' : '卖出 USDT'" />
    <template v-if="m">
      <div class="card">
        <h2>{{ m.name }}</h2>
        <p class="p">单价 <b>{{ m.priceCny }}</b> CNY / USDT</p>
        <p class="sub">限额 {{ m.limitMin }} – {{ m.limitMax }} USDT</p>
        <p class="sub">{{ m.responseNote }}</p>
      </div>
      <label class="lab">数量（USDT）</label>
      <input v-model="amount" type="text" inputmode="decimal" class="inp" />
      <p class="sum">预计法币：¥ {{ totalCny }}</p>
      <button type="button" class="cta" @click="submitOrder">
        {{ side === 'buy' ? '确认买入' : '确认卖出' }}
      </button>
    </template>
    <p v-else class="err">商家不存在</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.card {
  padding: 18px;
  border-radius: 20px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    margin-bottom: 8px;
  }

  .p b {
    color: #2ee6c8;
    font-size: 22px;
    font-variant-numeric: tabular-nums;
  }

  .sub {
    font-size: 12px;
    color: #8b95a8;
    margin-top: 6px;
  }
}

.lab {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.inp {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.28);
  color: #eef2f7;
  font-size: 16px;
  margin-bottom: 12px;
}

.sum {
  font-size: 14px;
  color: #c9a962;
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

.err {
  color: #e89898;
  text-align: center;
  padding: 40px;
}
</style>
