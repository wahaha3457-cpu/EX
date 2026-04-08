<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useAppStore } from '@/stores/app'
import MobileSkeletonList from '@/components/mobile/MobileSkeletonList.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const app = useAppStore()
const { merchants, marketTasks, marketServices, listLoading } = storeToRefs(demo)

const mainTab = ref<'otc' | 'tasks' | 'services'>('otc')
const side = ref<'buy' | 'sell'>('buy')
const priceSort = ref<'best' | 'rate' | 'limit'>('best')
const taskFilter = ref('全部')
const toolPanel = ref<'none' | 'search' | 'filter'>('none')
const searchQuery = ref('')
const otcTier = ref<'all' | 'large' | 'small'>('all')

watch(
  () => route.query,
  (q) => {
    if (q.tab === 'tasks') mainTab.value = 'tasks'
    else if (q.tab === 'services') mainTab.value = 'services'
    else mainTab.value = 'otc'
    if (q.side === 'sell') side.value = 'sell'
    if (q.side === 'buy') side.value = 'buy'
  },
  { immediate: true },
)

watch(mainTab, () => {
  toolPanel.value = 'none'
})

function toggleSearch() {
  toolPanel.value = toolPanel.value === 'search' ? 'none' : 'search'
  if (toolPanel.value === 'none') searchQuery.value = ''
}

function toggleFilter() {
  toolPanel.value = toolPanel.value === 'filter' ? 'none' : 'filter'
}

function setOtcTier(t: 'all' | 'large' | 'small') {
  if (otcTier.value === t) return
  otcTier.value = t
  app.pushToast('success', '筛选已更新')
}

function setMainTab(t: 'otc' | 'tasks' | 'services') {
  mainTab.value = t
  if (t === 'otc') {
    router.replace({ query: { tab: 'otc', side: side.value } })
  } else {
    router.replace({ query: { tab: t } })
  }
}

function setSide(s: 'buy' | 'sell') {
  side.value = s
  router.replace({ query: { ...route.query, tab: 'otc', side: s } })
}

const sortedMerchants = computed(() => {
  const list = [...merchants.value]
  if (priceSort.value === 'best') list.sort((a, b) => a.priceCny - b.priceCny)
  if (priceSort.value === 'rate') list.sort((a, b) => b.completionRate - a.completionRate)
  return list
})

const displayedMerchants = computed(() => {
  let list = sortedMerchants.value
  const q = searchQuery.value.trim().toLowerCase()
  if (q) list = list.filter((m) => m.name.toLowerCase().includes(q))
  if (otcTier.value === 'large') list = list.filter((m) => m.limitMax >= 50000)
  if (otcTier.value === 'small') list = list.filter((m) => m.limitMax <= 20000)
  return list
})

const filteredTasks = computed(() => {
  if (taskFilter.value === '全部') return marketTasks.value
  return marketTasks.value.filter((t) => t.category === taskFilter.value)
})

const serviceFilter = ref('全部')
const filteredServices = computed(() => {
  if (serviceFilter.value === '全部') return marketServices.value
  return marketServices.value.filter((s) => s.category === serviceFilter.value)
})

const cats = ['全部', '设计', '翻译', '咨询', '开发', '其他']

function openMerchant(id: string) {
  router.push({
    name: RouteNames.MobileOtcMerchant,
    params: { id },
    query: { side: side.value },
  })
}

function openTask(id: string) {
  router.push({ name: RouteNames.MobileTaskDetail, params: { id } })
}

function openService(id: string) {
  router.push({ name: RouteNames.MobileServiceDetail, params: { id } })
}
</script>

<template>
  <div class="mm">
    <div class="mm__top">
      <h1 class="mm__title">市场</h1>
      <div v-if="mainTab === 'otc'" class="mm__icons">
        <button
          type="button"
          class="ic"
          :class="{ 'ic--on': toolPanel === 'search' }"
          aria-label="搜索"
          @click="toggleSearch"
        >
          ⌕
        </button>
        <button
          type="button"
          class="ic"
          :class="{ 'ic--on': toolPanel === 'filter' }"
          aria-label="筛选"
          @click="toggleFilter"
        >
          ☷
        </button>
      </div>
      <div v-else class="mm__icons mm__icons--ph" aria-hidden="true" />
    </div>

    <div class="mm__pulse">
      <span class="dot" />
      <span class="txt">OTC 深度良好 · 任务实时更新（演示）</span>
      <span class="chg">+0.02%</span>
    </div>

    <div class="mm__main-tab mm__main-tab--3">
      <button type="button" :class="{ on: mainTab === 'otc' }" @click="setMainTab('otc')">
        买卖 U
      </button>
      <button type="button" :class="{ on: mainTab === 'tasks' }" @click="setMainTab('tasks')">
        任务
      </button>
      <button type="button" :class="{ on: mainTab === 'services' }" @click="setMainTab('services')">
        服务
      </button>
    </div>

    <div v-if="mainTab === 'otc' && toolPanel === 'search'" class="mm__tool">
      <input
        v-model="searchQuery"
        type="search"
        class="mm__search"
        placeholder="按商家名称筛选"
        enterkeyhint="search"
      />
      <button type="button" class="mm__tool-done" @click="toolPanel = 'none'">完成</button>
    </div>
    <div v-if="mainTab === 'otc' && toolPanel === 'filter'" class="mm__tool mm__tool--filter">
      <span class="mm__tool-label">单笔限额</span>
      <div class="mm__tier">
        <button type="button" :class="{ on: otcTier === 'all' }" @click="setOtcTier('all')">全部</button>
        <button type="button" :class="{ on: otcTier === 'large' }" @click="setOtcTier('large')">
          大额
        </button>
        <button type="button" :class="{ on: otcTier === 'small' }" @click="setOtcTier('small')">
          小额
        </button>
      </div>
      <button type="button" class="mm__tool-done" @click="toolPanel = 'none'">完成</button>
    </div>

    <template v-if="mainTab === 'otc'">
      <div class="mm__price">
        <p><small>参考价 CNY/USDT</small><b>7.238</b></p>
        <span class="up">24h −0.04%</span>
      </div>
      <div class="mm__side">
        <button type="button" :class="{ on: side === 'buy' }" @click="setSide('buy')">买入 USDT</button>
        <button type="button" :class="{ on: side === 'sell' }" @click="setSide('sell')">卖出 USDT</button>
      </div>
      <div class="mm__chips">
        <button
          v-for="x in [
            { k: 'best', l: '最优价' },
            { k: 'rate', l: '完成率' },
            { k: 'limit', l: '限额' },
          ]"
          :key="x.k"
          type="button"
          class="chip"
          :class="{ on: priceSort === x.k }"
          @click="priceSort = x.k as typeof priceSort"
        >
          {{ x.l }}
        </button>
      </div>
      <MobileSkeletonList v-if="listLoading" :rows="4" />
      <template v-else>
        <template v-if="displayedMerchants.length">
          <button
            v-for="m in displayedMerchants"
            :key="m.id"
            type="button"
            class="mm__merch"
            @click="openMerchant(m.id)"
          >
            <div class="row">
              <strong>{{ m.name }}</strong>
              <em>{{ m.priceCny }} <small>CNY</small></em>
            </div>
            <p class="sub">限额 {{ m.limitMin }} – {{ m.limitMax }} · 成交率 {{ m.completionRate }}%</p>
            <p class="pay">
              <span v-for="p in m.payMethods" :key="p">{{ p }}</span>
            </p>
            <span class="cta">{{ side === 'buy' ? '买入' : '卖出' }} →</span>
          </button>
        </template>
        <div v-else class="mm__empty">
          <p>无匹配商家</p>
          <button
            type="button"
            @click="
              searchQuery = '';
              otcTier = 'all';
              toolPanel = 'none';
              app.pushToast('info', '已清空筛选')
            "
          >
            清空条件
          </button>
        </div>
      </template>
    </template>

    <template v-else-if="mainTab === 'tasks'">
      <div class="mm__chips scroll">
        <button
          v-for="c in cats"
          :key="c"
          type="button"
          class="chip"
          :class="{ on: taskFilter === c }"
          @click="taskFilter = c"
        >
          {{ c }}
        </button>
      </div>
      <MobileSkeletonList v-if="listLoading" :rows="4" />
      <template v-else-if="filteredTasks.length">
        <button
          v-for="t in filteredTasks"
          :key="t.id"
          type="button"
          class="mm__task"
          @click="openTask(t.id)"
        >
          <div class="row">
            <span class="cat">{{ t.category }}</span>
            <b>{{ t.rewardUsdt }} USDT</b>
          </div>
          <p class="tit">{{ t.title }}</p>
          <p class="des">{{ t.description.slice(0, 48) }}…</p>
        </button>
      </template>
      <div v-else class="mm__empty">
        <p>暂无任务</p>
        <button type="button" @click="router.push({ name: RouteNames.MobilePublishTask })">
          立即发布
        </button>
      </div>
    </template>

    <template v-else>
      <p class="mm__svc-hint">定价服务 · 意向沟通 · 平台规则保护（演示）</p>
      <div class="mm__chips scroll">
        <button
          v-for="c in cats"
          :key="c"
          type="button"
          class="chip"
          :class="{ on: serviceFilter === c }"
          @click="serviceFilter = c"
        >
          {{ c }}
        </button>
      </div>
      <MobileSkeletonList v-if="listLoading" :rows="3" />
      <template v-else-if="filteredServices.length">
        <button
          v-for="s in filteredServices"
          :key="s.id"
          type="button"
          class="mm__svc"
          @click="openService(s.id)"
        >
          <div class="row">
            <span class="cat">{{ s.category }}</span>
            <b>{{ s.priceUsdt }} USDT</b>
          </div>
          <p class="tit">{{ s.title }}</p>
          <p class="sub">卖家 {{ s.sellerName }}</p>
          <p class="des">
            {{ (s.description || '').slice(0, 52) }}{{ (s.description || '').length > 52 ? '…' : '' }}
          </p>
        </button>
      </template>
      <div v-else class="mm__empty">
        <p>暂无服务</p>
        <button type="button" @click="router.push({ name: RouteNames.MobilePublishService })">
          上架服务
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.mm {
  padding: 12px 18px 24px;
}

.mm__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mm__title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.mm__icons {
  display: flex;
  gap: 8px;

  &--ph {
    width: 96px;
    flex-shrink: 0;
  }
}

.mm__main-tab--3 button {
  font-size: 12px;
  padding: 10px 6px;
}

.mm__svc-hint {
  font-size: 12px;
  color: #8b95a8;
  line-height: 1.45;
  margin-bottom: 12px;
  padding: 0 4px;
}

.mm__icons .ic {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #4dc4ff;
  cursor: pointer;

  &.ic--on {
    border-color: rgba(46, 230, 200, 0.4);
    background: rgba(46, 230, 200, 0.12);
    color: #2ee6c8;
  }
}

.mm__tool {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.72);

  &--filter {
    flex-wrap: wrap;
  }
}

.mm__search {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.35);
  color: #eef2f7;
  font-size: 14px;
}

.mm__tool-label {
  width: 100%;
  font-size: 11px;
  font-weight: 600;
  color: #8b95a8;
  letter-spacing: 0.06em;
}

.mm__tier {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;

  button {
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: #8b95a8;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &.on {
      border-color: rgba(46, 230, 200, 0.35);
      background: rgba(46, 230, 200, 0.12);
      color: #2ee6c8;
    }
  }
}

.mm__tool-done {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: rgba(77, 196, 255, 0.15);
  color: #4dc4ff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.mm__pulse {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(77, 196, 255, 0.06);
  border: 1px solid rgba(77, 196, 255, 0.12);
  margin-bottom: 16px;
  font-size: 12px;
  color: #8b95a8;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #5ed69a;
    flex-shrink: 0;
  }

  .txt {
    flex: 1;
    min-width: 0;
  }

  .chg {
    color: #2ee6c8;
    font-weight: 700;
    flex-shrink: 0;
  }
}

.mm__main-tab {
  display: flex;
  padding: 4px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16px;

  button {
    flex: 1;
    border: none;
    padding: 12px;
    border-radius: 12px;
    background: transparent;
    color: #8b95a8;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &.on {
      color: #eef2f7;
      background: linear-gradient(180deg, rgba(46, 230, 200, 0.2) 0%, rgba(22, 28, 38, 0.95) 100%);
    }
  }
}

.mm__price {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px;
  border-radius: 20px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;

  small {
    display: block;
    font-size: 10px;
    color: #8b95a8;
    margin-bottom: 4px;
  }

  b {
    font-size: 26px;
    color: #2ee6c8;
    font-variant-numeric: tabular-nums;
  }

  .up {
    font-size: 12px;
    color: #5ed69a;
    font-weight: 600;
  }
}

.mm__side {
  display: flex;
  padding: 3px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.4);
  margin-bottom: 12px;

  button {
    flex: 1;
    border: none;
    padding: 11px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    background: transparent;
    color: #8b95a8;

    &.on {
      background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
      color: #061210;
    }

    &.on:last-child {
      background: linear-gradient(180deg, rgba(77, 196, 255, 0.4) 0%, rgba(77, 196, 255, 0.12) 100%);
      color: #eef2f7;
      border: 1px solid rgba(77, 196, 255, 0.35);
    }
  }
}

.mm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;

  &.scroll {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}

.chip {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #8b95a8;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &.on {
    border-color: rgba(46, 230, 200, 0.35);
    background: rgba(46, 230, 200, 0.12);
    color: #2ee6c8;
  }
}

.mm__merch {
  width: 100%;
  text-align: left;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  color: inherit;
  position: relative;
  font: inherit;

  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;

    strong {
      font-size: 16px;
    }

    em {
      font-style: normal;
      font-size: 18px;
      font-weight: 700;
      color: #2ee6c8;

      small {
        font-size: 11px;
        color: #8b95a8;
      }
    }
  }

  .sub {
    font-size: 12px;
    color: #8b95a8;
    margin-bottom: 8px;
  }

  .pay span {
    display: inline-block;
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    margin-right: 6px;
  }

  .cta {
    position: absolute;
    right: 16px;
    bottom: 16px;
    font-size: 14px;
    color: #2ee6c8;
    font-weight: 700;
  }
}

.mm__task,
.mm__svc {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: rgba(22, 28, 38, 0.82);
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  color: inherit;
  font: inherit;

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    .cat {
      font-size: 10px;
      font-weight: 700;
      color: #4dc4ff;
    }

    b {
      color: #2ee6c8;
    }
  }

  .tit {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .des {
    font-size: 12px;
    color: #8b95a8;
    line-height: 1.4;
  }
}

.mm__svc {
  border-color: rgba(201, 169, 98, 0.15);
  background: linear-gradient(165deg, rgba(201, 169, 98, 0.08) 0%, rgba(22, 28, 38, 0.92) 55%);

  .row b {
    color: #c9a962;
  }

  .sub {
    font-size: 12px;
    color: #8b95a8;
    margin-bottom: 6px;
  }
}

.mm__sk {
  text-align: center;
  padding: 32px;
  color: #8b95a8;
}

.mm__empty {
  text-align: center;
  padding: 36px 16px;
  border-radius: 20px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  color: #8b95a8;

  button {
    margin-top: 14px;
    padding: 12px 22px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
    color: #061210;
    font-weight: 700;
    cursor: pointer;
  }
}
</style>
