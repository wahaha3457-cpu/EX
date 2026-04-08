<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { DEMO_USER } from '@/mocks/mobile/seed'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()
const { services } = storeToRefs(demo)

const svc = computed(() => services.value.find((x) => x.id === route.params.id as string))
const isMine = computed(() => svc.value?.sellerId === DEMO_USER)

async function onInterest() {
  if (!svc.value) return
  const ok = await ui.openConfirm({
    title: '表达购买意向',
    message: `向 ${svc.value.sellerName} 发起意向沟通（演示，无真实 IM）？`,
    confirmText: '发送',
  })
  if (ok) demo.expressServiceInterest(svc.value.id)
}
</script>

<template>
  <div class="page">
    <MpBackBar title="服务详情" />
    <template v-if="svc">
      <div class="card">
        <span v-if="isMine" class="own">我的上架</span>
        <span class="cat">{{ svc.category }}</span>
        <h2>{{ svc.title }}</h2>
        <p class="price">{{ svc.priceUsdt }} <small>USDT</small></p>
        <p class="seller">卖家 {{ svc.sellerName }}</p>
        <p class="des">{{ svc.description }}</p>
        <p class="meta">{{ new Date(svc.createdAt).toLocaleString('zh-CN') }} · ID {{ svc.id.slice(0, 12) }}…</p>
      </div>

      <button v-if="!isMine" type="button" class="cta" @click="onInterest">意向购买 / 沟通</button>
      <button v-else type="button" class="cta ghost" @click="router.push({ name: RouteNames.MobileMeServices })">
        在我的服务中查看 →
      </button>
    </template>
    <p v-else class="err">服务不存在</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 28px;
}

.card {
  padding: 20px;
  border-radius: 22px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;
  position: relative;
}

.own {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(201, 169, 98, 0.2);
  color: #c9a962;
}

.cat {
  font-size: 10px;
  font-weight: 700;
  color: #4dc4ff;
  letter-spacing: 0.06em;
}

h2 {
  font-size: 20px;
  line-height: 1.35;
  margin: 10px 0 12px;
}

.price {
  font-size: 28px;
  font-weight: 700;
  color: #c9a962;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;

  small {
    font-size: 14px;
    color: #8b95a8;
    font-weight: 600;
  }
}

.seller {
  font-size: 13px;
  color: #8b95a8;
  margin-bottom: 14px;
}

.des {
  font-size: 15px;
  line-height: 1.55;
  color: #cbd5e1;
}

.meta {
  margin-top: 16px;
  font-size: 11px;
  color: #6b7280;
  word-break: break-all;
}

.cta {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #c9a962 0%, #8a7038 100%);
  color: #0a0c10;

  &.ghost {
    background: rgba(77, 196, 255, 0.12);
    color: #4dc4ff;
    border: 1px solid rgba(77, 196, 255, 0.25);
  }
}

.err {
  text-align: center;
  padding: 40px;
  color: #e89898;
}
</style>
