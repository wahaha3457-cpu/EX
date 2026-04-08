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

type WithdrawalStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'

type WithdrawalRow = {
  id: string
  uid: string
  asset: string
  chain: string
  amount: string
  address: string
  fee: string
  status: WithdrawalStatus
  createdAt: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  status: '' as '' | WithdrawalStatus,
})

const allRows = ref<WithdrawalRow[]>([
  {
    id: 'W20260401-0007',
    uid: '1000302',
    asset: 'USDT',
    chain: 'TRC20',
    amount: '520.00',
    address: 'TQmA…P1f3',
    fee: '1.00',
    status: 'PENDING',
    createdAt: '2026-04-01 11:04:02',
  },
  {
    id: 'W20260401-0006',
    uid: '1000129',
    asset: 'ETH',
    chain: 'ERC20',
    amount: '0.80',
    address: '0x83…9aB2',
    fee: '0.002',
    status: 'ACTIVE',
    createdAt: '2026-04-01 10:31:21',
  },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const currentRow = ref<WithdrawalRow | null>(null)

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.id.toLowerCase().includes(kw) ||
        r.uid.includes(kw) ||
        r.address.toLowerCase().includes(kw),
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

function openDetail(row: WithdrawalRow) {
  currentRow.value = row
  drawerOpen.value = true
}

async function handleQuery() {
  await withLoading(async () => {
    await mockDelay()
    page.value = 1
    toastSuccess('查询完成')
  })
}

function reset() {
  q.value = { keyword: '', asset: '', chain: '', status: '' }
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

async function approveWithdrawal(row?: WithdrawalRow) {
  const target = row ?? currentRow.value
  if (!target || target.status !== 'PENDING') {
    toastInfo('仅待审核订单可操作')
    return
  }
  const ok = await adminConfirm(`确认通过提现 ${target.id} 并放行链上广播？（演示）`)
  if (!ok) return
  const ix = allRows.value.findIndex((r) => r.id === target.id)
  if (ix !== -1) {
    allRows.value[ix] = { ...allRows.value[ix], status: 'ACTIVE' }
  }
  if (currentRow.value?.id === target.id) {
    currentRow.value = { ...currentRow.value, status: 'ACTIVE' }
  }
  drawerOpen.value = false
  toastSuccess('已通过（演示）')
}

async function rejectWithdrawal(row?: WithdrawalRow) {
  const target = row ?? currentRow.value
  if (!target || target.status !== 'PENDING') {
    toastInfo('仅待审核订单可操作')
    return
  }
  const ok = await adminConfirm(`确认拒绝提现 ${target.id}？资金将退回用户账户。（演示）`)
  if (!ok) return
  const ix = allRows.value.findIndex((r) => r.id === target.id)
  if (ix !== -1) {
    allRows.value[ix] = { ...allRows.value[ix], status: 'REJECTED' }
  }
  if (currentRow.value?.id === target.id) {
    currentRow.value = { ...currentRow.value, status: 'REJECTED' }
  }
  drawerOpen.value = false
  toastSuccess('已拒绝（演示）')
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__head">
      <div>
        <h1 class="adm-fin__title">提现订单</h1>
        <p class="adm-fin__desc">用于审核与处理链上提现，支持按地址/UID/订单号快速定位。</p>
      </div>
      <div class="adm-fin__kpis">
        <div class="adm-kpi adm-kpi--warn">
          <p class="adm-kpi__lbl">待审核</p>
          <p class="adm-kpi__val">7</p>
        </div>
        <div class="adm-kpi">
          <p class="adm-kpi__lbl">今日提现笔数</p>
          <p class="adm-kpi__val">39</p>
        </div>
      </div>
    </header>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input
          v-model="q.keyword"
          placeholder="订单号 / UID / 地址"
          clearable
          style="width: 220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 140px">
          <el-option label="USDT" value="USDT" />
          <el-option label="ETH" value="ETH" />
          <el-option label="BTC" value="BTC" />
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
          <el-option label="待审核" value="PENDING" />
          <el-option label="已完成" value="ACTIVE" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="提现订单列表">
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
      <el-table-column prop="amount" label="金额" min-width="110" />
      <el-table-column prop="fee" label="手续费" min-width="100" />
      <el-table-column prop="address" label="地址" min-width="160" />
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <AdmStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="200" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <template v-if="row.status === 'PENDING'">
              <el-button type="warning" link @click="approveWithdrawal(row)">审核</el-button>
              <el-button type="danger" link @click="rejectWithdrawal(row)">拒绝</el-button>
            </template>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer
      v-model="drawerOpen"
      :title="`提现订单 · ${currentRow?.id ?? '—'}`"
    >
      <div v-if="currentRow" class="adm-fin__drawer">
        <el-alert type="warning" show-icon :closable="false" title="风控校验（预留）">
          提现审核将接入：KYC、黑名单地址、限额、设备风险、资金来源等规则。
        </el-alert>
        <div style="height: 12px" />
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
          <el-descriptions-item label="手续费">{{ currentRow.fee }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ currentRow.address }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
        <template v-if="currentRow?.status === 'PENDING'">
          <el-button type="danger" @click="rejectWithdrawal()">拒绝</el-button>
          <el-button type="primary" @click="approveWithdrawal()">通过并放行</el-button>
        </template>
      </template>
    </AdmDetailDrawer>
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

.adm-kpi--warn {
  border-color: color-mix(in srgb, var(--el-color-warning) 42%, var(--el-border-color-light));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05),
    0 0 0 1px color-mix(in srgb, var(--el-color-warning) 22%, transparent);
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
</style>
