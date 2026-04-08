<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const { myPublishedServices } = storeToRefs(demo)
</script>

<template>
  <div class="page">
    <MpBackBar title="我的服务" />
    <button
      v-for="s in myPublishedServices"
      :key="s.id"
      type="button"
      class="row"
      @click="router.push({ name: RouteNames.MobileServiceDetail, params: { id: s.id } })"
    >
      <div>
        <strong>{{ s.title }}</strong>
        <small>{{ s.priceUsdt }} USDT · {{ s.category }}</small>
      </div>
      <span>→</span>
    </button>
    <div v-if="!myPublishedServices.length" class="empty">
      <p>暂无上架服务</p>
      <button type="button" @click="router.push({ name: RouteNames.MobilePublishService })">
        去上架
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 16px;
  margin-bottom: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
  }

  small {
    font-size: 12px;
    color: #8b95a8;
  }

  span {
    color: #c9a962;
  }
}

.empty {
  text-align: center;
  padding: 48px 16px;
  color: #8b95a8;

  button {
    margin-top: 14px;
    padding: 12px 22px;
    border-radius: 12px;
    border: none;
    background: rgba(201, 169, 98, 0.18);
    color: #c9a962;
    font-weight: 700;
    cursor: pointer;
  }
}
</style>
