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
  channel: string
  riskFlag: 'NORMAL' | 'WATCH' | 'HOLD'
}

const STATUS_MAP = {
  PENDING: { label: '待确认', type: 'warning' as const },
  ACTIVE: { label: '已入账', type: 'success' as const },
  REJECTED: { label: '异常/拒绝', type: 'danger' as const },
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
    id: 'D20260402-0001',
    uid: '1000231',
    asset: 'USDT',
    chain: 'TRC20',
    amount: '1,250.00',
    txid: 'b3f1c8a2…8a2c',
    status: 'PENDING',
    createdAt: '2026-04-02 10:12:33',
    confirmations: '8 / 20',
    channel: '链上',
    riskFlag: 'NORMAL',
  },
  {
    id: 'D20260402-0002',
    uid: '1000188',
    asset: 'BTC',
    chain: 'BTC',
    amount: '0.0312',
    txid: '9c11d2e0…2d90',
    status: 'ACTIVE',
    createdAt: '2026-04-02 09:44:10',
    confirmations: '6 / 6',
    channel: '链上',
    riskFlag: 'NORMAL',
  },
  {
    id: 'D20260402-0003',
    uid: '1000402',
    asset: 'ETH',
    chain: 'ERC20',
    amount: '12.50',
    txid: '0x71a2…4c8e',
    status: 'PENDING',
    createdAt: '2026-04-02 08:20:01',
    confirmations: '2 / 12',
    channel: '链上',
    riskFlag: 'WATCH',
  },
  {
    id: 'D20260401-0091',
    uid: '1000555',
    asset: 'USDT',
    chain: 'ERC20',
    amount: '88,000.00',
    txid: '0xdead…beef',
    status: 'REJECTED',
    createdAt: '2026-04-01 22:01:00',
    confirmations: '0 / 12',
    channel: '链上',
    riskFlag: 'HOLD',
  },
  {
    id: 'D20260401-0088',
    uid: '1000302',
    asset: 'USDC',
    chain: 'Arbitrum',
    amount: '5,200.00',
    txid: '0x55d3…01fa',
    status: 'ACTIVE',
    createdAt: '2026-04-01 18:33:21',
    confirmations: '30 / 30',
    channel: '链上',
    riskFlag: 'NORMAL',
  },
  {
    id: 'D20260401-0070',
    uid: '1000129',
    asset: 'SOL',
    chain: 'Solana',
    amount: '420.00',
    txid: '5VER…8xYz',
    status: 'ACTIVE',
    createdAt: '2026-04-01 14:08:55',
    confirmations: '32 / 32',
    channel: '链上',
    riskFlag: 'NORMAL',
  },
  {
    id: 'D20260331-0501',
    uid: '1000881',
    asset: 'USDT',
    chain: 'TRC20',
    amount: '300.00',
    txid: '7aa1…3310',
    status: 'ACTIVE',
    createdAt: '2026-03-31 11:45:00',
    confirmations: '20 / 20',
    channel: '内部调账',
    riskFlag: 'NORMAL',
  },
  {
    id: 'D20260330-0402',
    uid: '1000999',
    asset: 'BTC',
    chain: 'BTC',
    amount: '0.5000',
    txid: 'bc1q…kp5s',
    status: 'PENDING',
    createdAt: '2026-03-30 16:20:11',
    confirmations: '1 / 6',
    channel: '链上',
    riskFlag: 'WATCH',
  },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const reviewOpen = ref(false)
const currentRow = ref<DepositRow | null>(null)
const reviewRemark = ref('')

function rowTime(row: DepositRow) {
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
        r.txid.toLowerCase().includes(kw) ||
        r.channel.toLowerCase().includes(kw),
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
const kpiToday = computed(() => '482,110')
const kpiRejected = computed(() => allRows.value.filter((r) => r.status === 'REJECTED').length)
const kpiWatch = computed(() => allRows.value.filter((r) => r.riskFlag !== 'NORMAL').length)

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

async function copyTxid(row: DepositRow) {
  try {
    await navigator.clipboard.writeText(row.txid)
    toastSuccess('已复制 TxID')
  } catch {
    toastInfo(row.txid)
  }
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

async function markProcessed() {
  const ok = await adminConfirm('确认标记该笔充值为已处理？（演示）')
  if (!ok || !currentRow.value) return
  drawerOpen.value = false
  toastSuccess('已标记（演示）')
}

function riskLabel(f: DepositRow['riskFlag']) {
  if (f === 'WATCH') return '观察'
  if (f === 'HOLD') return '暂缓'
  return '正常'
}

const DEPOSIT_CSV_SPEC = [
  { header: '订单号', key: 'id' as const },
  { header: 'UID', key: 'uid' as const },
  { header: '渠道', key: 'channel' as const },
  { header: '资产', key: 'asset' as const },
  { header: '链', key: 'chain' as const },
  { header: '金额', key: 'amount' as const },
  { header: 'TxID', key: 'txid' as const },
  { header: '确认数', key: 'confirmations' as const },
  {
    header: '状态',
    key: 'status' as const,
    format: (v: unknown) => STATUS_MAP[v as DepositStatus]?.label ?? String(v ?? ''),
  },
  {
    header: '风控',
    key: 'riskFlag' as const,
    format: (v: unknown) => riskLabel(v as DepositRow['riskFlag']),
  },
  { header: '创建时间', key: 'createdAt' as const },
] satisfies Parameters<typeof buildCsvFromKeyedRows<DepositRow>>[1]

async function handleExport() {
  const rows = filteredRows.value
  if (rows.length === 0) {
    toastWarning('当前无数据可导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildCsvFromKeyedRows(rows, DEPOSIT_CSV_SPEC)
    triggerUtf8BomCsvDownload(csv, `${sanitizeFilenameBase('充值订单')}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}

function riskType(f: DepositRow['riskFlag']) {
  if (f === 'HOLD') return 'danger'
  if (f === 'WATCH') return 'warning'
  return 'info'
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__hero">
      <div class="adm-fin__hero-text">
        <h1 class="adm-fin__title">充值订单</h1>
        <p class="adm-fin__desc">
          财务侧链上充值入账与确认数监控；支持按资产/链/状态/时间窗检索，与业务线「充值订单」对账。
          对接示例：GET /v1/admin/finance/deposits。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-fin__stats">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat adm-fin-stat--warn">
          <p class="adm-fin-stat__lbl">待入账确认</p>
          <p class="adm-fin-stat__val">{{ kpiPending }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat adm-fin-stat--ok">
          <p class="adm-fin-stat__lbl">今日充值额 (USDT 估)</p>
          <p class="adm-fin-stat__val">{{ kpiToday }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat">
          <p class="adm-fin-stat__lbl">异常/拒绝</p>
          <p class="adm-fin-stat__val">{{ kpiRejected }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-fin-stat adm-fin-stat--muted">
          <p class="adm-fin-stat__lbl">风控关注</p>
          <p class="adm-fin-stat__val">{{ kpiWatch }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input
          v-model="q.keyword"
          placeholder="订单号 / UID / TxID / 渠道"
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
          <el-option label="BTC" value="BTC" />
          <el-option label="ETH" value="ETH" />
          <el-option label="SOL" value="SOL" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 140px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
          <el-option label="Arbitrum" value="Arbitrum" />
          <el-option label="Solana" value="Solana" />
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

    <AdmTableToolbar title="充值订单 · 财务列表">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出 CSV</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="订单号" min-width="168" />
      <el-table-column prop="uid" label="UID" width="112" />
      <el-table-column prop="channel" label="渠道" width="100" />
      <el-table-column prop="asset" label="资产" width="88" />
      <el-table-column prop="chain" label="链" width="100" />
      <el-table-column prop="amount" label="金额" min-width="110" />
      <el-table-column label="TxID" min-width="140">
        <template #default="{ row }">
          <span class="adm-fin__mono">{{ row.txid }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="confirmations" label="确认数" width="100" />
      <el-table-column label="风控" width="88" align="center">
        <template #default="{ row }">
          <el-tag :type="riskType(row.riskFlag)" size="small" effect="dark">{{ riskLabel(row.riskFlag) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="112" align="center">
        <template #default="{ row }">
          <AdmStatusTag :status="row.status" :map="STATUS_MAP" />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="158" />
      <el-table-column label="操作" width="200" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button type="info" link @click="copyTxid(row)">复制 Tx</el-button>
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
            <AdmStatusTag :status="currentRow.status" :map="STATUS_MAP" />
          </el-descriptions-item>
          <el-descriptions-item label="UID">{{ currentRow.uid }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentRow.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ currentRow.channel }}</el-descriptions-item>
          <el-descriptions-item label="风控">
            <el-tag :type="riskType(currentRow.riskFlag)" size="small" effect="dark">{{ riskLabel(currentRow.riskFlag) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产">{{ currentRow.asset }}</el-descriptions-item>
          <el-descriptions-item label="链">{{ currentRow.chain }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ currentRow.amount }}</el-descriptions-item>
          <el-descriptions-item label="确认数">{{ currentRow.confirmations }}</el-descriptions-item>
          <el-descriptions-item label="TxID" :span="2">
            <span class="adm-fin__mono">{{ currentRow.txid }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <p class="adm-fin__drawer-hint">
          生产环境可挂载：链上浏览器跳转、补单/冲正、AML 命中标签、财务凭证号与双人复核流水。
        </p>
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

.adm-fin__review-meta {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
