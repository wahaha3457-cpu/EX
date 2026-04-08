<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
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

type TotalDwRow = {
  day: string
  depositUsdt: string
  withdrawUsdt: string
  netUsdt: string
  txIn: number
  txOut: number
  chainShare: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  asset: 'USDT',
  dateRange: null as [Date, Date] | null,
  keyword: '',
})

const allRows = ref<TotalDwRow[]>([
  { day: '2026-04-02', depositUsdt: '13,102,400', withdrawUsdt: '9,880,200', netUsdt: '3,222,200', txIn: 19201, txOut: 14820, chainShare: 'TRC 62%' },
  { day: '2026-04-01', depositUsdt: '12,840,200', withdrawUsdt: '9,102,330', netUsdt: '3,737,870', txIn: 18203, txOut: 14091, chainShare: 'TRC 61%' },
  { day: '2026-03-31', depositUsdt: '11,200,100', withdrawUsdt: '8,900,050', netUsdt: '2,300,050', txIn: 17002, txOut: 13200, chainShare: 'TRC 59%' },
  { day: '2026-03-30', depositUsdt: '10,550,000', withdrawUsdt: '8,200,000', netUsdt: '2,350,000', txIn: 16540, txOut: 12800, chainShare: 'TRC 60%' },
  { day: '2026-03-29', depositUsdt: '9,920,800', withdrawUsdt: '7,640,100', netUsdt: '2,280,700', txIn: 15888, txOut: 12100, chainShare: 'TRC 58%' },
  { day: '2026-03-28', depositUsdt: '10,100,000', withdrawUsdt: '8,400,000', netUsdt: '1,700,000', txIn: 16002, txOut: 13050, chainShare: 'ERC 28%' },
  { day: '2026-03-27', depositUsdt: '8,800,500', withdrawUsdt: '7,100,200', netUsdt: '1,700,300', txIn: 14900, txOut: 11800, chainShare: 'TRC 63%' },
  { day: '2026-03-26', depositUsdt: '9,200,000', withdrawUsdt: '7,500,000', netUsdt: '1,700,000', txIn: 15200, txOut: 11950, chainShare: 'TRC 61%' },
  { day: '2026-03-25', depositUsdt: '8,400,000', withdrawUsdt: '6,900,000', netUsdt: '1,500,000', txIn: 14100, txOut: 11200, chainShare: 'TRC 64%' },
  { day: '2026-03-24', depositUsdt: '8,100,000', withdrawUsdt: '6,800,000', netUsdt: '1,300,000', txIn: 13800, txOut: 11000, chainShare: 'TRC 62%' },
  { day: '2026-03-23', depositUsdt: '7,900,000', withdrawUsdt: '6,500,000', netUsdt: '1,400,000', txIn: 13500, txOut: 10800, chainShare: 'TRC 65%' },
  { day: '2026-03-22', depositUsdt: '7,600,000', withdrawUsdt: '6,200,000', netUsdt: '1,400,000', txIn: 13200, txOut: 10500, chainShare: 'TRC 63%' },
])

const { loading, withLoading } = useAdminListUi()

function parseDay(s: string) {
  const t = Date.parse(`${s}T12:00:00`)
  return Number.isNaN(t) ? null : t
}

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) list = list.filter((r) => r.day.includes(kw) || r.chainShare.toLowerCase().includes(kw))
  if (q.value.dateRange?.length === 2) {
    const [a, b] = q.value.dateRange
    const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
    const end = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59).getTime()
    list = list.filter((r) => {
      const t = parseDay(r.day)
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

/** 演示：从字符串取近似数值用于汇总展示 */
function parseMoney(s: string) {
  return Number(String(s).replace(/,/g, '')) || 0
}

const kpiDeposit = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.depositUsdt), 0)
  return sum >= 1e8 ? `${(sum / 1e8).toFixed(2)} 亿` : sum >= 1e4 ? `${Math.round(sum / 1e4)} 万` : String(Math.round(sum))
})

const kpiWithdraw = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.withdrawUsdt), 0)
  return sum >= 1e8 ? `${(sum / 1e8).toFixed(2)} 亿` : sum >= 1e4 ? `${Math.round(sum / 1e4)} 万` : String(Math.round(sum))
})

const kpiNet = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.netUsdt), 0)
  const sign = sum >= 0 ? '' : '-'
  const v = Math.abs(sum)
  const s = v >= 1e8 ? `${(v / 1e8).toFixed(2)} 亿` : v >= 1e4 ? `${Math.round(v / 1e4)} 万` : String(Math.round(v))
  return `${sign}${s}`
})

const kpiTx = computed(() => {
  const a = filteredRows.value.reduce((x, r) => x + r.txIn + r.txOut, 0)
  return a.toLocaleString('zh-CN')
})

watch([() => q.value.dateRange, () => q.value.keyword], () => {
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
  q.value = { asset: 'USDT', dateRange: null, keyword: '' }
  page.value = 1
  toastInfo('已重置筛选条件')
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess('数据已刷新（演示）')
  })
}

const TOTAL_DW_CSV_SPEC = [
  { header: '日期', key: 'day' as const },
  { header: '充值(USDT估)', key: 'depositUsdt' as const },
  { header: '提现(USDT估)', key: 'withdrawUsdt' as const },
  { header: '净额(USDT估)', key: 'netUsdt' as const },
  { header: '充值笔数', key: 'txIn' as const },
  { header: '提现笔数', key: 'txOut' as const },
  { header: '链上占比', key: 'chainShare' as const },
] satisfies Parameters<typeof buildCsvFromKeyedRows<TotalDwRow>>[1]

async function handleExport() {
  const rows = filteredRows.value
  if (rows.length === 0) {
    toastWarning('当前无数据可导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildCsvFromKeyedRows(rows, TOTAL_DW_CSV_SPEC)
    triggerUtf8BomCsvDownload(csv, `${sanitizeFilenameBase('总充提报表')}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}
</script>

<template>
  <div class="adm-rep" v-loading="loading">
    <header class="adm-rep__hero">
      <div class="adm-rep__hero-text">
        <h1 class="adm-rep__title">总充提报表</h1>
        <p class="adm-rep__desc">
          按日汇总全平台充值、提现规模与笔数，支持按统计周期筛选；链上渠道占比为演示字段。
          对接示例：GET /v1/admin/reports/total-deposit-withdraw?asset=&from=&to=。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-rep__stats">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--ok">
          <p class="adm-rep-stat__lbl">区间充值 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiDeposit }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--warn">
          <p class="adm-rep-stat__lbl">区间提现 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiWithdraw }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat">
          <p class="adm-rep-stat__lbl">净入金 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiNet }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--muted">
          <p class="adm-rep-stat__lbl">区间总笔数</p>
          <p class="adm-rep-stat__val">{{ kpiTx }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
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
      <el-form-item label="资产">
        <el-select v-model="q.asset" style="width: 140px">
          <el-option label="USDT" value="USDT" />
          <el-option label="BTC（预留）" value="BTC" disabled />
          <el-option label="ETH（预留）" value="ETH" disabled />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="日期 / 链占比关键词" clearable style="width: 200px" :prefix-icon="Search" />
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="按日汇总明细">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-rep__table">
      <el-table-column prop="day" label="日期" width="118" fixed="left" />
      <el-table-column prop="depositUsdt" label="充值 (USDT)" min-width="138" />
      <el-table-column prop="withdrawUsdt" label="提现 (USDT)" min-width="138" />
      <el-table-column prop="netUsdt" label="净额 (USDT)" min-width="128" />
      <el-table-column prop="txIn" label="充值笔数" width="102" align="right" />
      <el-table-column prop="txOut" label="提现笔数" width="102" align="right" />
      <el-table-column prop="chainShare" label="主链占比(演示)" min-width="130" />
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <p class="adm-rep__foot-hint">
      生产环境可追加：法币通道、内部调账剔除、对账差异列、同比/环比 sparkline 与下钻至明细订单。
    </p>
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
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
