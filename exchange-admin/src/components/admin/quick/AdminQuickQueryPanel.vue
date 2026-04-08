<script setup lang="ts">
/**
 * 综合查询核心面板：与 QuickGeneralQueryPage 共用，便于页面 / 弹窗两种布局。
 */
import { computed, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
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

export type QRow = { id: string; type: string; uid: string; summary: string; time: string }

const kw = ref('')
const scope = ref('all')
const bizLine = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const demoRows = ref<QRow[]>([])
const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const currentRow = ref<QRow | null>(null)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return demoRows.value.slice(start, start + pageSize.value)
})

async function runQuery() {
  await withLoading(async () => {
    await mockDelay()
    const now = new Date().toLocaleString('zh-CN')
    total.value = 3
    demoRows.value = [
      {
        id: 'Q001',
        type: scope.value === 'order' ? '订单' : '用户',
        uid: '1000231',
        summary: '资料 / 资产 / 订单聚合（演示）',
        time: now,
      },
      {
        id: 'Q002',
        type: scope.value === 'all' ? '订单' : scope.value === 'ledger' ? '账变' : '订单',
        uid: '—',
        summary: '按单号或交易对检索（演示）',
        time: now,
      },
      {
        id: 'Q003',
        type: '流水',
        uid: '—',
        summary: bizLine.value ? `业务线：${bizLine.value}（演示）` : '链上 / 站内账变（演示）',
        time: dateRange.value ? '筛选时段内' : '—',
      },
    ]
    page.value = 1
    toastSuccess('查询完成')
  })
}

function resetFilters() {
  kw.value = ''
  scope.value = 'all'
  bizLine.value = ''
  dateRange.value = null
  page.value = 1
  toastInfo('已重置筛选条件')
}

const QUICK_QUERY_CSV_SPEC = [
  { header: '编号', key: 'id' as const },
  { header: '类型', key: 'type' as const },
  { header: 'UID', key: 'uid' as const },
  { header: '摘要', key: 'summary' as const },
  { header: '时间', key: 'time' as const },
] satisfies Parameters<typeof buildCsvFromKeyedRows<QRow>>[1]

async function handleExport() {
  const rows = demoRows.value
  if (rows.length === 0) {
    toastWarning('请先搜索后再导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildCsvFromKeyedRows(rows, QUICK_QUERY_CSV_SPEC)
    triggerUtf8BomCsvDownload(csv, `${sanitizeFilenameBase('综合查询结果')}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}

function openDetail(row: QRow) {
  currentRow.value = row
  drawerOpen.value = true
}

</script>

<template>
  <div class="adm-quick-panel" v-loading="loading">
    <div class="adm-quick-query__search-card">
      <el-input
        v-model="kw"
        size="large"
        clearable
        placeholder="输入 UID、手机号、邮箱、订单号、TxID…"
        class="adm-quick-query__mega"
        @keyup.enter="runQuery"
      >
        <template #prefix>
          <el-icon class="adm-quick-query__mega-ic"><Search /></el-icon>
        </template>
        <template #append>
          <el-button type="primary" :icon="Search" @click="runQuery">搜索</el-button>
        </template>
      </el-input>
      <div class="adm-quick-query__chips">
        <span class="adm-quick-query__chip-hint">范围</span>
        <el-radio-group v-model="scope" size="small">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="user">用户</el-radio-button>
          <el-radio-button value="order">订单</el-radio-button>
          <el-radio-button value="ledger">账变</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <AdmFilterBar>
      <el-form-item label="时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="~"
          style="width: 100%; max-width: 320px"
        />
      </el-form-item>
      <el-form-item label="业务线">
        <el-select v-model="bizLine" placeholder="不限" clearable style="width: 140px">
          <el-option label="现货" value="spot" />
          <el-option label="合约" value="contract" />
          <el-option label="财务" value="finance" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="runQuery">应用筛选</el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="检索结果">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出</el-button>
      </template>
    </AdmTableToolbar>

    <el-table
      :data="pagedRows"
      border
      stripe
      size="small"
      class="adm-quick-query__table"
      empty-text="输入条件后点击搜索"
    >
      <el-table-column prop="id" label="编号" width="100" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="uid" label="UID" width="120" />
      <el-table-column prop="summary" label="摘要" min-width="200" />
      <el-table-column prop="time" label="时间" width="160" />
      <el-table-column label="操作" width="88" fixed="right" align="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="`检索结果 · ${currentRow?.id ?? ''}`">
      <template v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentRow.type }}</el-descriptions-item>
          <el-descriptions-item label="UID">{{ currentRow.uid }}</el-descriptions-item>
          <el-descriptions-item label="摘要">{{ currentRow.summary }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ currentRow.time }}</el-descriptions-item>
        </el-descriptions>
        <p class="adm-quick-query__drawer-hint">对接后可展示原始单据、关联订单与审计链路。</p>
      </template>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
      </template>
    </AdmDetailDrawer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

.adm-quick-panel {
  min-height: 0;
}

.adm-quick-query__search-card {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid $adm-border-subtle;
  background: color-mix(in srgb, $adm-bg-card 55%, transparent);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset;
}

.adm-quick-query__mega {
  width: 100%;
}

.adm-quick-query__mega :deep(.el-input__wrapper) {
  border-radius: 10px 0 0 10px;
  box-shadow: none;
  padding-left: 12px;
}

.adm-quick-query__mega :deep(.el-input-group__append) {
  padding: 0;
  background: transparent;
  border: none;
}

.adm-quick-query__mega :deep(.el-input-group__append .el-button) {
  border-radius: 0 10px 10px 0;
  margin: 0;
  padding: 0 18px;
  height: 100%;
}

.adm-quick-query__mega-ic {
  font-size: 18px;
  color: $adm-text-muted;
}

.adm-quick-query__chips {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.adm-quick-query__chip-hint {
  font-size: 12px;
  color: $adm-text-muted;
  font-weight: 600;
}

.adm-quick-query__table {
  border-radius: 8px;
}

.adm-quick-query__drawer-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: $adm-text-muted;
  line-height: 1.6;
}
</style>
