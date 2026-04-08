<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'

const router = useRouter()
const demo = useMobileDemoStore()
const { user, otcOrders, myPublishedTasks, myAcceptedTasks, escrows } = storeToRefs(demo)

const income30 = 1240
const pendingConfirm = computed(
  () => myPublishedTasks.value.filter((t) => t.status === 'delivered').length,
)
const openOrdersCount = computed(
  () => otcOrders.value.filter((o) => o.status !== 'completed').length,
)
const activeEscrow = computed(
  () => escrows.value.filter((e) => e.status !== 'completed').length,
)
const unreadInbox = computed(() => demo.unreadInboxCount)
</script>

<template>
  <div class="pf">
    <div class="pf__status">9:41 · 我的</div>
    <header class="pf__top">
      <h1>我的</h1>
      <button type="button" class="gear" @click="router.push({ name: RouteNames.MobileSettings })">
        ⚙
      </button>
    </header>

    <section class="id">
      <div class="av">◇</div>
      <div>
        <h2>{{ user.nickname }}</h2>
        <p class="uid">{{ user.uid }}</p>
        <div class="badges">
          <span v-for="b in user.badges" :key="b">{{ b }}</span>
        </div>
      </div>
      <div class="score">
        <b>{{ user.creditScore }}</b>
        <small>信用</small>
      </div>
    </section>

    <section class="sum">
      <h3>近期动态</h3>
      <div class="cells">
        <div><small>近30日净收益</small><b class="up">+{{ income30 }} USDT</b></div>
        <div><small>进行中订单</small><b>{{ openOrdersCount }}</b></div>
        <div><small>待您确认</small><b class="w">{{ pendingConfirm }}</b></div>
        <div><small>进行中的托管</small><b>{{ activeEscrow }}</b></div>
      </div>
    </section>

    <h3 class="sec">交易中心</h3>
    <div class="menu">
      <button type="button" @click="router.push({ name: RouteNames.MobileInbox })">
        <span>🔔</span>
        <span class="menu__grow">消息中心</span>
        <small v-if="unreadInbox > 0" class="unread">{{ unreadInbox > 9 ? '9+' : unreadInbox }}</small>
        <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMeOrders })">
        <span>◎</span> 我的订单 <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMeTasks })">
        <span>✦</span> 我发布的任务 <small>{{ myPublishedTasks.length }}</small> <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMeAccepts })">
        <span>✓</span> 我的接单 <small>{{ myAcceptedTasks.length }}</small> <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMeEscrows })">
        <span>⛨</span> 我的托管 <small>{{ escrows.length }}</small> <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMeServices })">
        <span>◇</span> 我的服务 <small>{{ demo.myPublishedServices.length }}</small> <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileAssets })">
        <span>≡</span> 资金记录 <em>→</em>
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileSecurity })">
        <span>◈</span> 安全中心 <em>→</em>
      </button>
    </div>

    <h3 class="sec">服务</h3>
    <div class="menu light">
      <button type="button" @click="router.push({ name: RouteNames.MobileSettings })">设置 →</button>
      <button type="button" @click="router.push({ name: RouteNames.MobileHelp })">帮助中心 →</button>
      <button type="button" @click="router.push({ name: RouteNames.MobileHelp })">风险指南 →</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pf {
  padding: 12px 18px 24px;
}

.pf__status {
  font-size: 12px;
  color: #8b95a8;
  margin-bottom: 10px;
}

.pf__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;

  h1 {
    font-size: 26px;
    font-weight: 700;
  }

  .gear {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    cursor: pointer;
    font-size: 18px;
  }
}

.id {
  display: flex;
  gap: 14px;
  padding: 20px;
  border-radius: 22px;
  background: linear-gradient(165deg, rgba(201, 169, 98, 0.12) 0%, rgba(14, 17, 22, 0.94) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16px;

  .av {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: rgba(46, 230, 200, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .uid {
    font-size: 11px;
    color: #8b95a8;
    margin-bottom: 8px;
  }

  .badges span {
    display: inline-block;
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    margin-right: 6px;
    color: #c9a962;
  }

  .score {
    margin-left: auto;
    text-align: center;

    b {
      display: block;
      font-size: 22px;
      color: #c9a962;
    }

    small {
      font-size: 10px;
      color: #8b95a8;
    }
  }
}

.sum {
  padding: 16px;
  border-radius: 20px;
  background: rgba(46, 230, 200, 0.06);
  border: 1px solid rgba(46, 230, 200, 0.14);
  margin-bottom: 20px;

  h3 {
    font-size: 13px;
    margin-bottom: 12px;
  }

  .cells {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    small {
      display: block;
      font-size: 11px;
      color: #8b95a8;
      margin-bottom: 4px;
    }

    b {
      font-size: 16px;
      font-variant-numeric: tabular-nums;

      &.up {
        color: #5ed69a;
      }

      &.w {
        color: #e8b86d;
      }
    }
  }
}

.sec {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #8b95a8;
  margin: 18px 0 10px;
}

.menu {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-bottom: 8px;

  .menu__grow {
    flex: 1;
    min-width: 0;
    text-align: left;
    font-weight: 600;
  }

  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(22, 28, 38, 0.72);
    color: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;

    &:last-child {
      border-bottom: none;
    }

    span:first-child {
      width: 32px;
      text-align: center;
      color: #4dc4ff;
    }

    small {
      margin-left: auto;
      color: #8b95a8;
      font-weight: 500;

      &.unread {
        margin-left: auto;
        margin-right: 0;
        padding: 2px 8px;
        border-radius: 8px;
        background: rgba(232, 93, 93, 0.2);
        color: #ff9b9b;
        font-weight: 800;
        font-size: 11px;
      }
    }

    em {
      font-style: normal;
      color: #8b95a8;
    }
  }

  &.light button {
    background: rgba(22, 28, 38, 0.5);
    font-weight: 500;
  }
}
</style>
