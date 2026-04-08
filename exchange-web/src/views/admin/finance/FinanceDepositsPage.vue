<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmStatusTag from '@/components/admin/common/AdmStatusTag.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'
import {
  adminConfirm,
  mockDelay,
  toastInfo,
  toastSuccess,
  useAdminListUi,
} from '@/composables/admin/useAdminListUi'

type DepositStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'

type DepositRow = {
  id: string
  uid: string
  asset: string
  chain: string
  amount: string
  txid: string
  status: DepositStatus
  createdAt: string
  confirmations: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  status: '' as '' | DepositStatus,
  timeRange: null as [Date, Date] | null,
})

const allRows = ref<DepositRow[]>([
  {
    id: 'D20260401-0001',
    uid: '1000231',
    asset: 'USDT',
    chain: 'TRC20',
    amount: '1,250.00',
    txid: 'b3f1…8a2c',
    status: 'PENDING',
    createdAt: '2026-04-01 10:12:33',
    confirmations: '1 / 20',
  },
  {
    id: 'D20260401-0002',
    uid: '1000188',
    asset: 'BTC',
    chain: 'BTC',
    amount: '0.0312',
    txid: '9c11…2d90',
    status: 'ACTIVE',
    createdAt: '2026-04-01 09:44:10',
    confirmations: '6 / 6',
  },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const reviewOpen = ref(false)
const currentRow = ref<DepositRow | null>(null)
const reviewRemark = ref('')

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.id.toLowerCase().includes(kw) ||
        r.uid.includes(kw) ||
        r.txid.toLowerCase().includes(kw),
    )
  }
  if (q.value.asset) list = list.filter((r) => r.asset === q.value.asset)
  if (q.value.chain) list = list.filter((r) => r.chain === q.value.chain)
  if (q.value.status) list = list.filter((r) => r.status === q.value.status)
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function openDetail(row: DepositRow) {
  currentRow.value = row
  drawerOpen.value = true
}

function openReview(row: DepositRow) {
  currentRow.value = row
  reviewRemark.value = ''
  reviewOpen.value = true
}

async function submitReview() {
  reviewOpen.value = false
  if (currentRow.value && currentRow.value.status === 'PENDING') {
    const ix = allRows.value.findIndex((r) => r.id === currentRow.value!.id)
    if (ix !== -1) {
      allRows.value[ix] = { ...allRows.value[ix], status: 'ACTIVE' }
    }
  }
  toastSuccess('复核已通过（演示）')
}

async function handleQuery() {
  await withLoading(async () => {
    await mockDelay()
    page.value = 1
    toastSuccess('查询完成')
  })
}

function reset() {
  q.value = { keyword: '', asset: '', chain: '', status: '', timeRange: null }
  page.value = 1
  toastInfo('已重置筛选条件')
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess('列表已刷新')
  })
}

function handleExport() {
  toastInfo('已创建导出任务（演示）')
}

async function markProcessed() {
  const ok = await adminConfirm('确认标记该笔充值为已处理？（演示）')
  if (!ok || !currentRow.value) return
  drawerOpen.value = false
  toastSuccess('已标记（演示）')
}

</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__head">
      <div>
        <h1 class="adm-fin__title">充值订单</h1>
        <p class="adm-fin__desc">按用户 / 资产 / 链 / 状态检索，支持导出与查看链上 TxID。</p>
      </div>
      <div class="adm-fin__kpis">
        <div class="adm-kpi">
          <p class="adm-kpi__lbl">待入账</p>
          <p class="adm-kpi__val">12</p>
        </div>
        <div class="adm-kpi">
          <p class="adm-kpi__lbl">今日充值额 (USDT)</p>
          <p class="adm-kpi__val">428,910</p>
        </div>
      </div>
    </header>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input
          v-model="q.keyword"
          placeholder="订单号 / UID / TxID"
          clearable
          style="width: 220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 140px">
          <el-option label="USDT" value="USDT" />
          <el-option label="BTC" value="BTC" />
          <el-option label="ETH" value="ETH" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 140px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="q.status" placeholder="全部" clearable style="width: 140px">
          <el-option label="待确认" value="PENDING" />
          <el-option label="已入账" value="ACTIVE" />
          <el-option label="异常/拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="q.timeRange"
          type="daterange"
          unlink-panels
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 240px"
        />
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="充值订单列表">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出 CSV</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="订单号" min-width="170" />
      <el-table-column prop="uid" label="UID" width="120" />
      <el-table-column prop="asset" label="资产" width="90" />
      <el-table-column prop="chain" label="链" width="90" />
      <el-table-column prop="amount" label="金额" min-width="120" />
      <el-table-column prop="txid" label="TxID" min-width="140" />
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <AdmStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="160" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'PENDING'"
              type="warning"
              link
              @click="openReview(row)"
            >
              复核
            </el-button>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer
      v-model="drawerOpen"
      :title="`充值订单 · ${currentRow?.id ?? '—'}`"
    >
      <div v-if="currentRow" class="adm-fin__drawer">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <AdmStatusTag :status="currentRow.status" />
          </el-descriptions-item>
          <el-descriptions-item label="UID">{{ currentRow.uid }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentRow.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="资产">{{ currentRow.asset }}</el-descriptions-item>
          <el-descriptions-item label="链">{{ currentRow.chain }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ currentRow.amount }}</el-descriptions-item>
          <el-descriptions-item label="确认数">{{ currentRow.confirmations }}</el-descriptions-item>
          <el-descriptions-item label="TxID" :span="2">{{ currentRow.txid }}</el-descriptions-item>
        </el-descriptions>
        <p class="adm-fin__drawer-hint">提示：这里预留链上查询、补单与异常处理入口。</p>
      </div>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
        <el-button type="primary" @click="markProcessed">标记已处理</el-button>
      </template>
    </AdmDetailDrawer>

    <el-dialog v-model="reviewOpen" title="充值复核" width="480px" destroy-on-close>
      <p v-if="currentRow" class="adm-fin__review-meta">订单 {{ currentRow.id }} · {{ currentRow.amount }} {{ currentRow.asset }}</p>
      <el-input v-model="reviewRemark" type="textarea" :rows="4" placeholder="复核备注（可选）" />
      <template #footer>
        <el-button @click="reviewOpen = false">取消</el-button>
        <el-button type="primary" @click="submitReview">确认入账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.adm-fin__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.adm-fin__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-fin__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.adm-fin__kpis {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.adm-kpi {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)),
    var(--el-fill-color-light)
  );
  min-width: 150px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.adm-kpi__lbl {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.adm-kpi__val {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--el-text-color-primary);
}

.adm-fin__table {
  border-radius: 8px;
}

.adm-fin__drawer-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.adm-fin__review-meta {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
