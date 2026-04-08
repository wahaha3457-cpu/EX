<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MobileSkeletonList from '@/components/mobile/MobileSkeletonList.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const {
  totalUsdt,
  availableUsdt,
  frozenUsdt,
  escrowTaskUsdt,
  escrowDealUsdt,
  marketTasks,
  user,
  openOrders,
  escrows,
} = storeToRefs(demo)
const unreadInbox = computed(() => demo.unreadInboxCount)
const activeEscrowCount = computed(
  () =>
    escrows.value.filter((e) => e.status !== 'completed' && e.status !== 'cancelled').length,
)
const showTodo = computed(
  () =>
    openOrders.value.length > 0 ||
    unreadInbox.value > 0 ||
    activeEscrowCount.value > 0,
)

onMounted(() => {
  void demo.simulateListLoad()
})

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const previewTasks = computed(() => marketTasks.value.slice(0, 3))

function goMarketOtc(side: 'buy' | 'sell') {
  router.push({ name: RouteNames.MobileMarket, query: { tab: 'otc', side } })
}

function goMarketTasks() {
  router.push({ name: RouteNames.MobileMarket, query: { tab: 'tasks' } })
}

function goMarketServices() {
  router.push({ name: RouteNames.MobileMarket, query: { tab: 'services' } })
}

function goPublishTask() {
  router.push({ name: RouteNames.MobilePublishTask })
}

function goPublishEscrow() {
  router.push({ name: RouteNames.MobilePublishEscrow })
}

function openTask(id: string) {
  router.push({ name: RouteNames.MobileTaskDetail, params: { id } })
}

function goInbox() {
  router.push({ name: RouteNames.MobileInbox })
}
</script>

<template>
  <div class="mh">
    <div class="mh__status">9:41 · 首页 · LTE</div>
    <header class="mh__head">
      <div class="mh__avatar">◇</div>
      <div>
        <p class="mh__hi">你好，{{ user.nickname }}</p>
        <p class="mh__uid">{{ user.uid }}</p>
      </div>
      <div class="mh__actions">
        <button type="button" class="mh__icon mh__icon--bell" aria-label="消息" @click="goInbox">
          🔔
          <i v-if="unreadInbox > 0" class="mh__badge">{{ unreadInbox > 9 ? '9+' : unreadInbox }}</i>
        </button>
        <button
          type="button"
          class="mh__icon"
          aria-label="我的"
          @click="router.push({ name: RouteNames.MobileProfile })"
        >
          ◎
        </button>
      </div>
    </header>

    <section class="mh__hero">
      <div class="mh__hero-top">
        <span>总余额 · USDT</span>
        <span class="mh__badge">已保护</span>
      </div>
      <p class="mh__total"><em>{{ fmt(totalUsdt) }}</em> USDT</p>
      <p class="mh__fiat">可用 {{ fmt(availableUsdt) }} · 冻结 {{ fmt(frozenUsdt) }}</p>
      <div class="mh__stats">
        <div><small>托管(任务)</small><b>{{ fmt(escrowTaskUsdt) }}</b></div>
        <div><small>托管(担保)</small><b>{{ fmt(escrowDealUsdt) }}</b></div>
      </div>
      <button type="button" class="mh__link" @click="router.push({ name: RouteNames.MobileAssets })">
        查看资产与流水 →
      </button>
    </section>

    <div v-if="showTodo" class="mh__todo">
      <button
        v-if="openOrders.length"
        type="button"
        class="mh__todo-cell"
        @click="router.push({ name: RouteNames.MobileMeOrders })"
      >
        <span>进行中订单</span><b>{{ openOrders.length }}</b>
      </button>
      <button
        v-if="unreadInbox > 0"
        type="button"
        class="mh__todo-cell"
        @click="goInbox"
      >
        <span>未读消息</span><b>{{ unreadInbox > 9 ? '9+' : unreadInbox }}</b>
      </button>
      <button
        v-if="activeEscrowCount > 0"
        type="button"
        class="mh__todo-cell"
        @click="router.push({ name: RouteNames.MobileMeEscrows })"
      >
        <span>活跃托管</span><b>{{ activeEscrowCount }}</b>
      </button>
    </div>

    <h2 class="mh__sec">快捷入口</h2>
    <div class="mh__grid">
      <button type="button" class="mh__q" @click="goMarketOtc('buy')">
        <span class="ic">₮</span><small>买入 USDT</small>
      </button>
      <button type="button" class="mh__q" @click="goMarketOtc('sell')">
        <span class="ic">¤</span><small>卖出 USDT</small>
      </button>
      <button type="button" class="mh__q" @click="goPublishTask">
        <span class="ic">✦</span><small>发布任务</small>
      </button>
      <button type="button" class="mh__q" @click="goMarketTasks">
        <span class="ic">✓</span><small>接取任务</small>
      </button>
      <button type="button" class="mh__q" @click="goPublishEscrow">
        <span class="ic">⛨</span><small>担保托管</small>
      </button>
      <button type="button" class="mh__q mh__q--gold" @click="goMarketServices">
        <span class="ic">◇</span><small>服务市场</small>
      </button>
    </div>

    <div class="mh__row">
      <h2 class="mh__sec">推荐任务</h2>
      <button type="button" class="mh__more" @click="goMarketTasks">全部</button>
    </div>
    <MobileSkeletonList v-if="demo.listLoading" :rows="3" compact />
    <template v-else-if="previewTasks.length">
      <button
        v-for="t in previewTasks"
        :key="t.id"
        type="button"
        class="mh__task"
        @click="openTask(t.id)"
      >
        <div class="mh__task-top">
          <span class="cat">{{ t.category }}</span>
          <span class="reward">{{ t.rewardUsdt }} USDT</span>
        </div>
        <p class="mh__task-title">{{ t.title }}</p>
        <p class="mh__task-sub">{{ t.deadline }} · 点进详情接单</p>
      </button>
    </template>
    <div v-else class="mh__empty">
      <p>暂无推荐任务</p>
      <button type="button" @click="goPublishTask">去发布</button>
    </div>

    <p class="mh__foot">可交互演示 · 数据持久化在本地 · 侧边栏「重置」见资产页</p>
  </div>
</template>

<style scoped lang="scss">
.mh {
  padding: 12px 18px 24px;
}

.mh__status {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8b95a8;
  margin-bottom: 14px;
}

.mh__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.mh__avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(46, 230, 200, 0.25), rgba(77, 196, 255, 0.15));
  border: 1px solid rgba(46, 230, 200, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.mh__hi {
  font-size: 18px;
  font-weight: 700;
}

.mh__uid {
  font-size: 11px;
  color: #8b95a8;
  margin-top: 4px;
}

.mh__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mh__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #4dc4ff;
  font-size: 18px;
  cursor: pointer;
  position: relative;
}

.mh__icon--bell {
  font-size: 16px;
}

.mh__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #e85d5d;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  font-style: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.mh__hero {
  position: relative;
  border-radius: 22px;
  padding: 20px;
  background: linear-gradient(168deg, rgba(46, 230, 200, 0.12) 0%, rgba(14, 17, 22, 0.94) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 22px;
}

.mh__hero-top {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8b95a8;
  margin-bottom: 8px;
}

.mh__badge {
  color: #5ed69a;
  border: 1px solid rgba(94, 214, 154, 0.25);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
}

.mh__total {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 6px;

  em {
    font-style: normal;
    color: #2ee6c8;
  }
}

.mh__fiat {
  font-size: 12px;
  color: #8b95a8;
  margin-bottom: 12px;
}

.mh__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 13px;

  small {
    display: block;
    color: #8b95a8;
    font-size: 10px;
    margin-bottom: 4px;
  }

  b {
    color: #4dc4ff;
    font-variant-numeric: tabular-nums;
  }
}

.mh__link {
  margin-top: 14px;
  width: 100%;
  border: none;
  background: transparent;
  color: #4dc4ff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.mh__todo {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.mh__todo-cell {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(46, 230, 200, 0.2);
  background: rgba(46, 230, 200, 0.06);
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 11px;
    color: #8b95a8;
    font-weight: 600;
  }

  b {
    font-size: 18px;
    color: #2ee6c8;
    font-variant-numeric: tabular-nums;
  }
}

.mh__sec {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #8b95a8;
  margin-bottom: 12px;
}

.mh__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.mh__q {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(22, 28, 38, 0.82);
  padding: 12px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: inherit;
  font: inherit;

  .ic {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: rgba(46, 230, 200, 0.1);
    border: 1px solid rgba(46, 230, 200, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  small {
    font-size: 9px;
    font-weight: 600;
    color: #8b95a8;
    text-align: center;
    line-height: 1.2;
  }

  &--gold .ic {
    background: rgba(201, 169, 98, 0.12);
    border-color: rgba(201, 169, 98, 0.28);
  }
}

.mh__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mh__more {
  border: none;
  background: none;
  color: #4dc4ff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.mh__task {
  width: 100%;
  text-align: left;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.mh__task-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;

  .cat {
    font-size: 10px;
    font-weight: 700;
    color: #4dc4ff;
    letter-spacing: 0.06em;
  }

  .reward {
    font-weight: 700;
    color: #2ee6c8;
    font-variant-numeric: tabular-nums;
  }
}

.mh__task-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 6px;
}

.mh__task-sub {
  font-size: 12px;
  color: #8b95a8;
}

.mh__empty {
  text-align: center;
  padding: 28px 12px;
  border-radius: 20px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  color: #8b95a8;
  font-size: 14px;

  button {
    margin-top: 12px;
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    background: rgba(46, 230, 200, 0.15);
    color: #2ee6c8;
    font-weight: 700;
    cursor: pointer;
  }
}

.mh__foot {
  margin-top: 24px;
  font-size: 10px;
  color: #8b95a8;
  text-align: center;
  opacity: 0.75;
  line-height: 1.45;
}
</style>
