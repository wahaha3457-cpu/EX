<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()
const app = useAppStore()
const { totalUsdt, availableUsdt, frozenUsdt, escrowTaskUsdt, escrowDealUsdt, ledger } =
  storeToRefs(demo)

const filter = ref<'all' | 'in' | 'out'>('all')

function setFilter(f: 'all' | 'in' | 'out') {
  if (filter.value === f) return
  filter.value = f
  const msg = f === 'all' ? '显示全部流水' : f === 'in' ? '仅展示收入' : '仅展示支出'
  app.pushToast('info', msg)
}

const list = computed(() => {
  if (filter.value === 'all') return ledger.value
  if (filter.value === 'in') return ledger.value.filter((x) => x.amountUsdt > 0)
  return ledger.value.filter((x) => x.amountUsdt < 0)
})

const fmt = (n: number) =>
  (n >= 0 ? '+' : '') +
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function reset() {
  if (
    await ui.openConfirm({
      title: '重置演示数据',
      message: '清空本地持久化并恢复种子数据。',
      confirmText: '重置',
      dangerous: true,
    })
  )
    demo.resetSeed()
}
</script>

<template>
  <div class="ma">
    <div class="ma__status">9:41 · 资产</div>
    <header class="ma__head">
      <div>
        <p class="k">钱包</p>
        <p class="s">资金与流水演示</p>
      </div>
      <button type="button" class="ic" @click="reset" title="重置演示">↺</button>
    </header>

    <section class="hero">
      <div class="row">
        <span>总余额 · USDT</span>
        <span class="bd">已保护</span>
      </div>
      <p class="big">{{ totalUsdt.toFixed(2) }}</p>
      <p class="sub">可用 {{ availableUsdt.toFixed(2) }} · 冻结 {{ frozenUsdt.toFixed(2) }}</p>
      <div class="grid">
        <div><small>任务托管</small><b>{{ escrowTaskUsdt.toFixed(2) }}</b></div>
        <div><small>担保托管</small><b>{{ escrowDealUsdt.toFixed(2) }}</b></div>
      </div>
    </section>

    <h3 class="sec">快捷操作</h3>
    <div class="acts">
      <button type="button" @click="router.push({ name: RouteNames.MobileAssetsDeposit })">
        充值
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileAssetsWithdraw })">
        提现
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMarket, query: { tab: 'otc', side: 'buy' } })">
        买入 U
      </button>
      <button type="button" @click="router.push({ name: RouteNames.MobileMarket, query: { tab: 'otc', side: 'sell' } })">
        卖出 U
      </button>
    </div>

    <div class="row2">
      <h3 class="sec">资金流水</h3>
      <div class="filters">
        <button :class="{ on: filter === 'all' }" type="button" @click="setFilter('all')">全部</button>
        <button :class="{ on: filter === 'in' }" type="button" @click="setFilter('in')">收入</button>
        <button :class="{ on: filter === 'out' }" type="button" @click="setFilter('out')">支出</button>
      </div>
    </div>

    <button
      v-for="row in list"
      :key="row.id"
      type="button"
      class="tx"
      @click="router.push({ name: RouteNames.MobileLedgerDetail, params: { id: row.id } })"
    >
      <div>
        <strong>{{ row.title }}</strong>
        <small>{{ new Date(row.at).toLocaleString() }} · {{ row.status }}</small>
      </div>
      <em :class="{ up: row.amountUsdt > 0, down: row.amountUsdt < 0 }">{{ fmt(row.amountUsdt) }}</em>
    </button>
    <div v-if="!list.length" class="empty">
      <p>暂无流水</p>
      <button type="button" @click="router.push({ name: RouteNames.MobileMarket })">去市场</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ma {
  padding: 12px 18px 24px;
}

.ma__status {
  font-size: 12px;
  color: #8b95a8;
  margin-bottom: 12px;
}

.ma__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;

  .k {
    font-size: 11px;
    letter-spacing: 0.12em;
    color: #8b95a8;
    font-weight: 600;
  }

  .s {
    font-size: 12px;
    color: #8b95a8;
    margin-top: 4px;
  }

  .ic {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: #e8b86d;
    font-size: 20px;
    cursor: pointer;
  }
}

.hero {
  padding: 22px;
  border-radius: 22px;
  background: linear-gradient(168deg, rgba(46, 230, 200, 0.12) 0%, rgba(14, 17, 22, 0.94) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 22px;

  .row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #8b95a8;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }

  .bd {
    color: #5ed69a;
    border: 1px solid rgba(94, 214, 154, 0.25);
    padding: 3px 8px;
    border-radius: 999px;
  }

  .big {
    font-size: 34px;
    font-weight: 700;
    color: #2ee6c8;
    font-variant-numeric: tabular-nums;
    margin-bottom: 6px;
  }

  .sub {
    font-size: 13px;
    color: #8b95a8;
    margin-bottom: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-size: 14px;

    small {
      display: block;
      font-size: 10px;
      color: #8b95a8;
      margin-bottom: 4px;
    }

    b {
      color: #4dc4ff;
      font-variant-numeric: tabular-nums;
    }
  }
}

.sec {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #8b95a8;
  margin-bottom: 10px;
}

.acts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 22px;

  button {
    padding: 12px 6px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(22, 28, 38, 0.82);
    color: #eef2f7;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
}

.row2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.filters {
  display: flex;
  gap: 6px;

  button {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    color: #8b95a8;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;

    &.on {
      border-color: rgba(46, 230, 200, 0.35);
      color: #2ee6c8;
      background: rgba(46, 230, 200, 0.1);
    }
  }
}

.tx {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  border-top: none;
  border-left: none;
  border-right: none;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;

  strong {
    display: block;
    font-size: 14px;
    margin-bottom: 4px;
  }

  small {
    font-size: 11px;
    color: #8b95a8;
  }

  em {
    font-style: normal;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    font-size: 15px;

    &.up {
      color: #5ed69a;
    }

    &.down {
      color: #e89898;
    }
  }
}

.empty {
  text-align: center;
  padding: 36px 12px;
  color: #8b95a8;

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
</style>
