<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'
import {
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

type AgentDwRow = {
  agentId: string
  agentName: string
  tier: string
  userEst: string
  depositUsdt: string
  withdrawUsdt: string
  netUsdt: string
  txIn: number
  txOut: number
  updatedAt: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  tier: '' as '' | 'L1' | 'L2' | 'L3',
  dateRange: null as [Date, Date] | null,
})

const allRows = ref<AgentDwRow[]>([
  { agentId: 'AG-1001', agentName: '华东运营中心', tier: 'L1', userEst: '12.8 万', depositUsdt: '4,200,000', withdrawUsdt: '3,100,000', netUsdt: '1,100,000', txIn: 4200, txOut: 3100, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-2044', agentName: '星辰渠道', tier: 'L2', userEst: '5.6 万', depositUsdt: '1,020,000', withdrawUsdt: '900,200', netUsdt: '119,800', txIn: 2100, txOut: 1980, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-3102', agentName: '海外机构 A', tier: 'L1', userEst: '8.9 万', depositUsdt: '3,800,000', withdrawUsdt: '3,200,000', netUsdt: '600,000', txIn: 3800, txOut: 2900, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-0891', agentName: '社区 KOL 联盟', tier: 'L3', userEst: '1.3 万', depositUsdt: '420,000', withdrawUsdt: '380,000', netUsdt: '40,000', txIn: 890, txOut: 820, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-4450', agentName: '华北企服', tier: 'L2', userEst: '3.3 万', depositUsdt: '910,000', withdrawUsdt: '820,000', netUsdt: '90,000', txIn: 1800, txOut: 1650, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-5011', agentName: '量化团队渠道', tier: 'L2', userEst: '0.8 万', depositUsdt: '280,000', withdrawUsdt: '260,000', netUsdt: '20,000', txIn: 520, txOut: 480, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-2208', agentName: '西南商户拓展', tier: 'L3', userEst: '2.1 万', depositUsdt: '550,000', withdrawUsdt: '500,000', netUsdt: '50,000', txIn: 1100, txOut: 1020, updatedAt: '2026-04-02 08:00' },
  { agentId: 'AG-9901', agentName: '机构直销（内渠）', tier: 'L1', userEst: '20.1 万', depositUsdt: '6,200,000', withdrawUsdt: '5,400,000', netUsdt: '800,000', txIn: 6200, txOut: 5100, updatedAt: '2026-04-02 08:00' },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const currentRow = ref<AgentDwRow | null>(null)

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.agentId.toLowerCase().includes(kw) ||
        r.agentName.toLowerCase().includes(kw),
    )
  }
  if (q.value.tier) list = list.filter((r) => r.tier === q.value.tier)
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function parseMoney(s: string) {
  return Number(String(s).replace(/,/g, '')) || 0
}

const kpiAgents = computed(() => filteredRows.value.length)
const kpiDeposit = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.depositUsdt), 0)
  return sum >= 1e4 ? `${Math.round(sum / 1e4)} 万` : String(Math.round(sum))
})
const kpiWithdraw = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.withdrawUsdt), 0)
  return sum >= 1e4 ? `${Math.round(sum / 1e4)} 万` : String(Math.round(sum))
})
const kpiNet = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.netUsdt), 0)
  return sum >= 1e4 ? `${Math.round(sum / 1e4)} 万` : String(Math.round(sum))
})

watch([() => q.value.keyword, () => q.value.tier], () => {
  page.value = 1
})

async function handleQuery() {
  await withLoading(async () => {
    await mockDelay()
    page.value = 1
    toastSuccess('查询完成')
  })
}

function handleReset() {
  q.value = { keyword: '', tier: '', dateRange: null }
  page.value = 1
  toastInfo('已重置筛选条件')
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess('数据已刷新（演示）')
  })
}

const AGENT_DW_CSV_SPEC = [
  { header: '代理商ID', key: 'agentId' as const },
  { header: '名称', key: 'agentName' as const },
  { header: '等级', key: 'tier' as const },
  { header: '用户规模(估)', key: 'userEst' as const },
  { header: '充值(USDT估)', key: 'depositUsdt' as const },
  { header: '提现(USDT估)', key: 'withdrawUsdt' as const },
  { header: '净额(USDT估)', key: 'netUsdt' as const },
  { header: '充值笔数', key: 'txIn' as const },
  { header: '提现笔数', key: 'txOut' as const },
  { header: '更新时间', key: 'updatedAt' as const },
] satisfies Parameters<typeof buildCsvFromKeyedRows<AgentDwRow>>[1]

async function handleExport() {
  const rows = filteredRows.value
  if (rows.length === 0) {
    toastWarning('当前无数据可导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildCsvFromKeyedRows(rows, AGENT_DW_CSV_SPEC)
    triggerUtf8BomCsvDownload(csv, `${sanitizeFilenameBase('代理商充提报表')}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}

function openDetail(row: AgentDwRow) {
  currentRow.value = row
  drawerOpen.value = true
}

function tierTagType(t: string) {
  if (t === 'L1') return 'warning'
  if (t === 'L2') return 'info'
  return 'success'
}
</script>

<template>
  <div class="adm-rep" v-loading="loading">
    <header class="adm-rep__hero">
      <div class="adm-rep__hero-text">
        <h1 class="adm-rep__title">代理商充提报表</h1>
        <p class="adm-rep__desc">
          按代理商维度汇总周期内充值、提现与净额；统计周期筛选对接后由服务端计算，当前为前端演示。
          对接示例：GET /v1/admin/reports/agent-deposit-withdraw。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-rep__stats">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat">
          <p class="adm-rep-stat__lbl">当前结果代理商数</p>
          <p class="adm-rep-stat__val">{{ kpiAgents }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--ok">
          <p class="adm-rep-stat__lbl">充值合计 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiDeposit }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--warn">
          <p class="adm-rep-stat__lbl">提现合计 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiWithdraw }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--muted">
          <p class="adm-rep-stat__lbl">净额合计 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiNet }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="代理商">
        <el-input
          v-model="q.keyword"
          placeholder="ID / 名称"
          clearable
          style="width: 220px"
          :prefix-icon="Search"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="等级">
        <el-select v-model="q.tier" placeholder="全部" clearable style="width: 120px">
          <el-option label="一级" value="L1" />
          <el-option label="二级" value="L2" />
          <el-option label="三级" value="L3" />
        </el-select>
      </el-form-item>
      <el-form-item label="统计周期">
        <el-date-picker
          v-model="q.dateRange"
          type="daterange"
          unlink-panels
          range-separator="—"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 280px"
        />
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="代理商充提明细">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-rep__table">
      <el-table-column prop="agentId" label="代理商 ID" width="120" fixed="left" />
      <el-table-column prop="agentName" label="名称" min-width="150" />
      <el-table-column label="等级" width="88" align="center">
        <template #default="{ row }">
          <el-tag :type="tierTagType(row.tier)" size="small" effect="dark">{{ row.tier }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="userEst" label="下级用户(估)" width="120" />
      <el-table-column prop="depositUsdt" label="充值 (USDT)" min-width="128" />
      <el-table-column prop="withdrawUsdt" label="提现 (USDT)" min-width="128" />
      <el-table-column prop="netUsdt" label="净额 (USDT)" min-width="118" />
      <el-table-column prop="txIn" label="充值笔数" width="100" align="right" />
      <el-table-column prop="txOut" label="提现笔数" width="100" align="right" />
      <el-table-column prop="updatedAt" label="数据截止" min-width="150" />
      <el-table-column label="操作" width="88" fixed="right" align="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">下钻</el-button>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="currentRow ? `代理商 · ${currentRow.agentId}` : '详情'">
      <div v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="代理商 ID">{{ currentRow.agentId }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ currentRow.agentName }}</el-descriptions-item>
          <el-descriptions-item label="等级">{{ currentRow.tier }}</el-descriptions-item>
          <el-descriptions-item label="下级用户(估)">{{ currentRow.userEst }}</el-descriptions-item>
          <el-descriptions-item label="充值 (USDT)">{{ currentRow.depositUsdt }}</el-descriptions-item>
          <el-descriptions-item label="提现 (USDT)">{{ currentRow.withdrawUsdt }}</el-descriptions-item>
          <el-descriptions-item label="净额 (USDT)">{{ currentRow.netUsdt }}</el-descriptions-item>
          <el-descriptions-item label="笔数">{{ currentRow.txIn }} / {{ currentRow.txOut }}</el-descriptions-item>
        </el-descriptions>
        <p class="adm-rep__foot-hint">
          生产环境可跳转「用户列表-代理商筛选」「分润结算单」与「对账差异」子报表。
        </p>
      </div>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
      </template>
    </AdmDetailDrawer>
  </div>
</template>

<style scoped lang="scss">
.adm-rep__hero {
  margin-bottom: 14px;
}

.adm-rep__hero-text {
  max-width: 860px;
}

.adm-rep__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-rep__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
}

.adm-rep__stats {
  margin-bottom: 14px;
}

.adm-rep-stat {
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

.adm-rep-stat__lbl {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary);
}

.adm-rep-stat__val {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.adm-rep-stat--ok .adm-rep-stat__val {
  color: var(--el-color-success);
}

.adm-rep-stat--warn .adm-rep-stat__val {
  color: var(--el-color-warning);
}

.adm-rep-stat--muted .adm-rep-stat__val {
  color: var(--el-text-color-secondary);
}

.adm-rep__table {
  border-radius: 10px;
}

.adm-rep__foot-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
