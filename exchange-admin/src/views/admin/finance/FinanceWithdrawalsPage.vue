<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
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
  toastWarning,
  useAdminListUi,
} from '@/composables/admin/useAdminListUi'
import {
  buildCsvFromKeyedRows,
  sanitizeFilenameBase,
  timestampForFilename,
  triggerUtf8BomCsvDownload,
} from '@/utils/adminCsvExport'

type WithdrawalStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'

type WithdrawalRow = {
  id: string
  uid: string
  asset: string
  chain: string
  amount: string
  netAmount: string
  address: string
  fee: string
  status: WithdrawalStatus
  createdAt: string
  batchId: string
  txHash: string
  riskTier: 'LOW' | 'MID' | 'HIGH'
}

const STATUS_MAP = {
  PENDING: { label: '待审核', type: 'warning' as const },
  ACTIVE: { label: '已完成', type: 'success' as const },
  REJECTED: { label: '已拒绝', type: 'danger' as const },
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  status: '' as '' | WithdrawalStatus,
  timeRange: null as [Date, Date] | null,
})

const allRows = ref<WithdrawalRow[]>([
  {
    id: 'W20260402-0012',
    uid: '1000302',
    asset: 'USDT',
    chain: 'TRC20',
    amount: '520.00',
    netAmount: '519.00',
    address: 'TQmA…P1f3',
    fee: '1.00',
    status: 'PENDING',
    createdAt: '2026-04-02 11:04:02',
    batchId: 'B-20260402-A',
    txHash: '—',
    riskTier: 'LOW',
  },
  {
    id: 'W20260402-0011',
    uid: '1000129',
    asset: 'ETH',
    chain: 'ERC20',
    amount: '0.80',
    netAmount: '0.798',
    address: '0x83…9aB2',
    fee: '0.002',
    status: 'ACTIVE',
    createdAt: '2026-04-02 10:31:21',
    batchId: 'B-20260402-A',
    txHash: '0x9a1…22ff',
    riskTier: 'LOW',
  },
  {
    id: 'W20260402-0008',
    uid: '1000555',
    asset: 'USDT',
    chain: 'TRC20',
    amount: '50,000.00',
    netAmount: '49,900.00',
    address: 'TXYZ…9a2f',
    fee: '100.00',
    status: 'PENDING',
    createdAt: '2026-04-02 09:12:00',
    batchId: '—',
    txHash: '—',
    riskTier: 'HIGH',
  },
  {
    id: 'W20260401-0099',
    uid: '1000402',
    asset: 'BTC',
    chain: 'BTC',
    amount: '0.15',
    netAmount: '0.1495',
    address: 'bc1q…kp5s',
    fee: '0.0005',
    status: 'ACTIVE',
    createdAt: '2026-04-01 20:00:11',
    batchId: 'B-20260401-C',
    txHash: '9f2c…bba1',
    riskTier: 'MID',
  },
  {
    id: 'W20260401-0088',
    uid: '1000881',
    asset: 'USDC',
    chain: 'Polygon',
    amount: '12,000.00',
    netAmount: '11,988.00',
    address: '0x55…01fa',
    fee: '12.00',
    status: 'REJECTED',
    createdAt: '2026-04-01 15:22:33',
    batchId: '—',
    txHash: '—',
    riskTier: 'HIGH',
  },
  {
    id: 'W20260401-0077',
    uid: '1000231',
    asset: 'USDT',
    chain: 'ERC20',
    amount: '3,200.00',
    netAmount: '3,196.80',
    address: '0x71…4c8e',
    fee: '3.20',
    status: 'ACTIVE',
    createdAt: '2026-04-01 12:08:44',
    batchId: 'B-20260401-B',
    txHash: '0xcc1…90ab',
    riskTier: 'LOW',
  },
  {
    id: 'W20260331-0601',
    uid: '1000999',
    asset: 'SOL',
    chain: 'Solana',
    amount: '800.00',
    netAmount: '799.20',
    address: '5VER…8xYz',
    fee: '0.80',
    status: 'PENDING',
    createdAt: '2026-03-31 18:40:00',
    batchId: '—',
    txHash: '—',
    riskTier: 'MID',
  },
  {
    id: 'W20260330-0502',
    uid: '1000707',
    asset: 'ETH',
    chain: 'Arbitrum',
    amount: '5.00',
    netAmount: '4.995',
    address: '0xaa…77ee',
    fee: '0.005',
    status: 'ACTIVE',
    createdAt: '2026-03-30 09:15:22',
    batchId: 'B-20260330-A',
    txHash: '0x11…ddcc',
    riskTier: 'LOW',
  },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const currentRow = ref<WithdrawalRow | null>(null)

function rowTime(row: WithdrawalRow) {
  const t = Date.parse(row.createdAt.replace(/-/g, '/'))
  return Number.isNaN(t) ? null : t
}

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.id.toLowerCase().includes(kw) ||
        r.uid.includes(kw) ||
        r.address.toLowerCase().includes(kw) ||
        r.batchId.toLowerCase().includes(kw) ||
        r.txHash.toLowerCase().includes(kw),
    )
  }
  if (q.value.asset) list = list.filter((r) => r.asset === q.value.asset)
  if (q.value.chain) list = list.filter((r) => r.chain === q.value.chain)
  if (q.value.status) list = list.filter((r) => r.status === q.value.status)
  if (q.value.timeRange?.length === 2) {
    const [a, b] = q.value.timeRange
    const start = a.getTime()
    const end = b.getTime()
    list = list.filter((r) => {
      const t = rowTime(r)
      if (t == null) return true
      return t >= start && t <= end
    })
  }
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const kpiPending = computed(() => allRows.value.filter((r) => r.status === 'PENDING').length)
const kpiBroadcast = computed(() => allRows.value.filter((r) => r.status === 'ACTIVE' && r.txHash !== '—').length)
const kpiRejected = computed(() => allRows.value.filter((r) => r.status === 'REJECTED').length)
const kpiHighRisk = computed(() => allRows.value.filter((r) => r.riskTier === 'HIGH').length)

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
    allRows.value[ix] = {
      ...allRows.value[ix],
      status: 'ACTIVE',
      txHash: '0xpend…demo',
      batchId: allRows.value[ix].batchId === '—' ? 'B-NEW-001' : allRows.value[ix].batchId,
    }
  }
  if (currentRow.value?.id === target.id) {
    currentRow.value = allRows.value.find((r) => r.id === target.id) ?? null
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

function tierLabel(t: WithdrawalRow['riskTier']) {
  if (t === 'HIGH') return '高'
  if (t === 'MID') return '中'
  return '低'
}

const WITHDRAWAL_CSV_SPEC = [
  { header: '订单号', key: 'id' as const },
  { header: 'UID', key: 'uid' as const },
  {
    header: '风险等级',
    key: 'riskTier' as const,
    format: (v: unknown) => tierLabel(v as WithdrawalRow['riskTier']),
  },
  { header: '资产', key: 'asset' as const },
  { header: '链', key: 'chain' as const },
  { header: '申请金额', key: 'amount' as const },
  { header: '实发', key: 'netAmount' as const },
  { header: '手续费', key: 'fee' as const },
  { header: '批次', key: 'batchId' as const },
  { header: '目标地址', key: 'address' as const },
  {
    header: '状态',
    key: 'status' as const,
    format: (v: unknown) => STATUS_MAP[v as WithdrawalStatus]?.label ?? String(v ?? ''),
  },
  { header: '创建时间', key: 'createdAt' as const },
  { header: 'TxHash', key: 'txHash' as const },
] satisfies Parameters<typeof buildCsvFromKeyedRows<WithdrawalRow>>[1]

async function handleExport() {
  const rows = filteredRows.value
  if (rows.length === 0) {
    toastWarning('当前无数据可导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildCsvFromKeyedRows(rows, WITHDRAWAL_CSV_SPEC)
    triggerUtf8BomCsvDownload(csv, `${sanitizeFilenameBase('提现订单')}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}

function tierType(t: WithdrawalRow['riskTier']) {
  if (t === 'HIGH') return 'danger'
  if (t === 'MID') return 'warning'
  return 'success'
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__hero">
      <div class="adm-fin__hero-text">
        <h1 class="adm-fin__title">提现订单</h1>
        <p class="adm-fin__desc">
          财务审核、热钱包批次与链上广播回写；与限额、黑名单、KYC 等级联动。
          对接示例：GET /v1/admin/finance/withdrawals。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-fin__stats">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat adm-fin-stat--warn">
          <p class="adm-fin-stat__lbl">待审核</p>
          <p class="adm-fin-stat__val">{{ kpiPending }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat adm-fin-stat--ok">
          <p class="adm-fin-stat__lbl">已广播/完成</p>
          <p class="adm-fin-stat__val">{{ kpiBroadcast }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat">
          <p class="adm-fin-stat__lbl">已拒绝</p>
          <p class="adm-fin-stat__val">{{ kpiRejected }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat adm-fin-stat--muted">
          <p class="adm-fin-stat__lbl">高风险待审</p>
          <p class="adm-fin-stat__val">{{ kpiHighRisk }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input
          v-model="q.keyword"
          placeholder="订单号 / UID / 地址 / 批次 / Tx"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 140px">
          <el-option label="USDT" value="USDT" />
          <el-option label="USDC" value="USDC" />
          <el-option label="ETH" value="ETH" />
          <el-option label="BTC" value="BTC" />
          <el-option label="SOL" value="SOL" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 140px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
          <el-option label="Polygon" value="Polygon" />
          <el-option label="Arbitrum" value="Arbitrum" />
          <el-option label="Solana" value="Solana" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="q.status" placeholder="全部" clearable style="width: 140px">
          <el-option label="待审核" value="PENDING" />
          <el-option label="已完成" value="ACTIVE" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="q.timeRange"
          type="daterange"
          unlink-panels
          range-separator="—"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 260px"
        />
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="提现订单 · 财务列表">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出 CSV</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="订单号" min-width="168" />
      <el-table-column prop="uid" label="UID" width="112" />
      <el-table-column label="风险" width="72" align="center">
        <template #default="{ row }">
          <el-tag :type="tierType(row.riskTier)" size="small" effect="dark">{{ tierLabel(row.riskTier) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="asset" label="资产" width="88" />
      <el-table-column prop="chain" label="链" width="100" />
      <el-table-column prop="amount" label="申请金额" min-width="108" />
      <el-table-column prop="netAmount" label="实发" min-width="100" />
      <el-table-column prop="fee" label="手续费" width="88" />
      <el-table-column prop="batchId" label="批次" width="120" />
      <el-table-column label="目标地址" min-width="140">
        <template #default="{ row }">
          <span class="adm-fin__mono">{{ row.address }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <AdmStatusTag :status="row.status" :map="STATUS_MAP" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="158" />
      <el-table-column label="操作" width="220" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <template v-if="row.status === 'PENDING'">
              <el-button type="warning" link @click="approveWithdrawal(row)">通过</el-button>
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
          将接入：KYC、地址黑名单、单笔/日限额、设备与登录地、资金来源评分、大额双人复核等。
        </el-alert>
        <div style="height: 12px" />
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <AdmStatusTag :status="currentRow.status" :map="STATUS_MAP" />
          </el-descriptions-item>
          <el-descriptions-item label="UID">{{ currentRow.uid }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="tierType(currentRow.riskTier)" size="small" effect="dark">{{ tierLabel(currentRow.riskTier) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentRow.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentRow.batchId }}</el-descriptions-item>
          <el-descriptions-item label="资产">{{ currentRow.asset }}</el-descriptions-item>
          <el-descriptions-item label="链">{{ currentRow.chain }}</el-descriptions-item>
          <el-descriptions-item label="申请金额">{{ currentRow.amount }}</el-descriptions-item>
          <el-descriptions-item label="实发">{{ currentRow.netAmount }}</el-descriptions-item>
          <el-descriptions-item label="手续费">{{ currentRow.fee }}</el-descriptions-item>
          <el-descriptions-item label="TxHash">{{ currentRow.txHash }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">
            <span class="adm-fin__mono">{{ currentRow.address }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <p class="adm-fin__drawer-hint">
          生产环境可挂载：签名机流水、nonce、Gas 实付、失败重试队列与会计凭证分录。
        </p>
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
.adm-fin__hero {
  margin-bottom: 14px;
}

.adm-fin__hero-text {
  max-width: 820px;
}

.adm-fin__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-fin__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
}

.adm-fin__stats {
  margin-bottom: 14px;
}

.adm-fin-stat {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-light))
  );
  margin-bottom: 10px;
}

.adm-fin-stat__lbl {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.adm-fin-stat__val {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.adm-fin-stat--warn .adm-fin-stat__val {
  color: var(--el-color-warning);
}

.adm-fin-stat--ok .adm-fin-stat__val {
  color: var(--el-color-success);
}

.adm-fin-stat--muted .adm-fin-stat__val {
  color: var(--el-text-color-secondary);
}

.adm-fin__table {
  border-radius: 10px;
}

.adm-fin__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

.adm-fin__drawer-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
