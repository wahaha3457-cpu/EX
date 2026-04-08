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

type EarningsRow = {
  uid: string
  inviteCode: string
  spotRebate: string
  contractRebate: string
  c2cRebate: string
  earnRebate: string
  referralBonus: string
  total: string
  rank: number
  tier: 'NORMAL' | 'VIP' | 'AGENT'
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  uid: '',
  tier: '' as '' | 'NORMAL' | 'VIP' | 'AGENT',
  minTotal: '' as '' | '100' | '500' | '1000',
  dateRange: null as [Date, Date] | null,
})

const allRows = ref<EarningsRow[]>([
  { uid: '1000231', inviteCode: 'INV-A91', spotRebate: '120.50', contractRebate: '880.20', c2cRebate: '12.00', earnRebate: '45.00', referralBonus: '200.00', total: '1,257.70', rank: 1, tier: 'AGENT' },
  { uid: '1000188', inviteCode: 'INV-B02', spotRebate: '40.00', contractRebate: '0.00', c2cRebate: '6.30', earnRebate: '12.10', referralBonus: '0.00', total: '58.40', rank: 8, tier: 'NORMAL' },
  { uid: '1000402', inviteCode: '—', spotRebate: '210.00', contractRebate: '1,020.50', c2cRebate: '0.00', earnRebate: '88.00', referralBonus: '50.00', total: '1,368.50', rank: 2, tier: 'VIP' },
  { uid: '1000555', inviteCode: 'INV-C88', spotRebate: '15.20', contractRebate: '320.00', c2cRebate: '44.00', earnRebate: '6.00', referralBonus: '10.00', total: '395.20', rank: 5, tier: 'NORMAL' },
  { uid: '1000881', inviteCode: 'INV-D11', spotRebate: '0.00', contractRebate: '2,400.00', c2cRebate: '0.00', earnRebate: '0.00', referralBonus: '120.00', total: '2,520.00', rank: 3, tier: 'VIP' },
  { uid: '1000999', inviteCode: 'INV-E77', spotRebate: '88.00', contractRebate: '12.00', c2cRebate: '200.00', earnRebate: '30.00', referralBonus: '5.00', total: '335.00', rank: 6, tier: 'NORMAL' },
  { uid: '1000707', inviteCode: '—', spotRebate: '1,020.00', contractRebate: '400.00', c2cRebate: '0.00', earnRebate: '200.00', referralBonus: '300.00', total: '1,920.00', rank: 4, tier: 'AGENT' },
  { uid: '1000606', inviteCode: 'INV-F33', spotRebate: '22.00', contractRebate: '18.00', c2cRebate: '9.00', earnRebate: '4.00', referralBonus: '0.00', total: '53.00', rank: 9, tier: 'NORMAL' },
  { uid: '1000505', inviteCode: 'INV-G55', spotRebate: '300.00', contractRebate: '150.00', c2cRebate: '80.00', earnRebate: '60.00', referralBonus: '40.00', total: '630.00', rank: 7, tier: 'VIP' },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const currentRow = ref<EarningsRow | null>(null)

function parseMoney(s: string) {
  return Number(String(s).replace(/,/g, '')) || 0
}

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.uid.trim()
  if (kw) list = list.filter((r) => r.uid.includes(kw) || r.inviteCode.toLowerCase().includes(kw.toLowerCase()))
  if (q.value.tier) list = list.filter((r) => r.tier === q.value.tier)
  if (q.value.minTotal === '100') list = list.filter((r) => parseMoney(r.total) >= 100)
  if (q.value.minTotal === '500') list = list.filter((r) => parseMoney(r.total) >= 500)
  if (q.value.minTotal === '1000') list = list.filter((r) => parseMoney(r.total) >= 1000)
  return [...list].sort((a, b) => a.rank - b.rank)
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const kpiPayout = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.total), 0)
  return `${Math.round(sum * 100) / 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
})

const kpiUsers = computed(() => filteredRows.value.length)
const kpiTop = computed(() => {
  const t = filteredRows.value[0]?.total ?? '0'
  return t
})
const kpiContractShare = computed(() => {
  const sum = filteredRows.value.reduce((a, r) => a + parseMoney(r.contractRebate), 0)
  const tot = filteredRows.value.reduce((a, r) => a + parseMoney(r.total), 0) || 1
  return `${Math.round((sum / tot) * 100)}%`
})

watch([() => q.value.uid, () => q.value.tier, () => q.value.minTotal], () => {
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
  q.value = { uid: '', tier: '', minTotal: '', dateRange: null }
  page.value = 1
  toastInfo('已重置筛选条件')
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess('数据已刷新（演示）')
  })
}

function openDetail(row: EarningsRow) {
  currentRow.value = row
  drawerOpen.value = true
}

function tierLabel(t: EarningsRow['tier']) {
  if (t === 'VIP') return 'VIP'
  if (t === 'AGENT') return '代理体系'
  return '普通'
}

const EARNINGS_CSV_SPEC = [
  { header: '排名', key: 'rank' as const, format: (v: unknown) => String(v ?? '') },
  { header: 'UID', key: 'uid' as const },
  { header: '邀请码', key: 'inviteCode' as const },
  { header: '现货返佣', key: 'spotRebate' as const },
  { header: '合约返佣', key: 'contractRebate' as const },
  { header: 'C2C返佣', key: 'c2cRebate' as const },
  { header: '理财返佣', key: 'earnRebate' as const },
  { header: '推荐奖励', key: 'referralBonus' as const },
  { header: '合计', key: 'total' as const },
  {
    header: '用户类型',
    key: 'tier' as const,
    format: (v: unknown) => tierLabel(v as EarningsRow['tier']),
  },
] satisfies Parameters<typeof buildCsvFromKeyedRows<EarningsRow>>[1]

async function handleExport() {
  const rows = filteredRows.value
  if (rows.length === 0) {
    toastWarning('当前无数据可导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildCsvFromKeyedRows(rows, EARNINGS_CSV_SPEC)
    triggerUtf8BomCsvDownload(csv, `${sanitizeFilenameBase('用户收益报表')}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}

function tierType(t: EarningsRow['tier']) {
  if (t === 'AGENT') return 'warning'
  if (t === 'VIP') return 'success'
  return 'info'
}
</script>

<template>
  <div class="adm-rep" v-loading="loading">
    <header class="adm-rep__hero">
      <div class="adm-rep__hero-text">
        <h1 class="adm-rep__title">用户收益报表</h1>
        <p class="adm-rep__desc">
          汇总用户返佣、理财/活动奖励与邀请奖励等（演示列可随业务裁剪）；支持按 UID、身份档位与收益门槛筛选。
          对接示例：GET /v1/admin/reports/user-earnings。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-rep__stats">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--ok">
          <p class="adm-rep-stat__lbl">区间收益合计 (USDT 估)</p>
          <p class="adm-rep-stat__val">{{ kpiPayout }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat">
          <p class="adm-rep-stat__lbl">结果内用户数</p>
          <p class="adm-rep-stat__val">{{ kpiUsers }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--muted">
          <p class="adm-rep-stat__lbl">榜首位合计</p>
          <p class="adm-rep-stat__val">{{ kpiTop }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="adm-rep-stat adm-rep-stat--warn">
          <p class="adm-rep-stat__lbl">合约类占比(估)</p>
          <p class="adm-rep-stat__val">{{ kpiContractShare }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="UID / 邀请码">
        <el-input
          v-model="q.uid"
          placeholder="用户 UID 或邀请码"
          clearable
          style="width: 220px"
          :prefix-icon="Search"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="身份档位">
        <el-select v-model="q.tier" placeholder="全部" clearable style="width: 130px">
          <el-option label="普通" value="NORMAL" />
          <el-option label="VIP" value="VIP" />
          <el-option label="代理体系" value="AGENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="合计 ≥">
        <el-select v-model="q.minTotal" placeholder="不限" clearable style="width: 120px">
          <el-option label="100 U" value="100" />
          <el-option label="500 U" value="500" />
          <el-option label="1000 U" value="1000" />
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

    <AdmTableToolbar title="用户收益明细">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-rep__table">
      <el-table-column prop="rank" label="排名" width="72" align="center" sortable />
      <el-table-column prop="uid" label="UID" width="112" fixed="left" />
      <el-table-column prop="inviteCode" label="邀请码" width="110" />
      <el-table-column label="档位" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="tierType(row.tier)" size="small" effect="dark">{{ tierLabel(row.tier) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="spotRebate" label="现货返佣" min-width="110" />
      <el-table-column prop="contractRebate" label="合约返佣" min-width="110" />
      <el-table-column prop="c2cRebate" label="C2C 返佣" min-width="100" />
      <el-table-column prop="earnRebate" label="理财/活动" min-width="100" />
      <el-table-column prop="referralBonus" label="邀请奖励" min-width="100" />
      <el-table-column prop="total" label="合计 (USDT)" min-width="120" />
      <el-table-column label="操作" width="88" fixed="right" align="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="currentRow ? `收益构成 · ${currentRow.uid}` : '详情'">
      <div v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="UID">{{ currentRow.uid }}</el-descriptions-item>
          <el-descriptions-item label="邀请码">{{ currentRow.inviteCode }}</el-descriptions-item>
          <el-descriptions-item label="档位">{{ tierLabel(currentRow.tier) }}</el-descriptions-item>
          <el-descriptions-item label="现货返佣">{{ currentRow.spotRebate }}</el-descriptions-item>
          <el-descriptions-item label="合约返佣">{{ currentRow.contractRebate }}</el-descriptions-item>
          <el-descriptions-item label="C2C 返佣">{{ currentRow.c2cRebate }}</el-descriptions-item>
          <el-descriptions-item label="理财/活动">{{ currentRow.earnRebate }}</el-descriptions-item>
          <el-descriptions-item label="邀请奖励">{{ currentRow.referralBonus }}</el-descriptions-item>
          <el-descriptions-item label="合计 (USDT)">{{ currentRow.total }}</el-descriptions-item>
        </el-descriptions>
        <p class="adm-rep__foot-hint">
          生产环境可下钻：分笔返佣流水、结算批次号、税务代扣与冻结状态。
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
