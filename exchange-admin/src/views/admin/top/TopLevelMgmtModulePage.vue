<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import {
  ADMIN_TOP_LEVEL_MODULE_REGISTRY,
  type TopLevelModuleKey,
  type TopLevelModuleColumn,
} from '@/config/adminTopLevelModules'
import {
  adminConfirm,
  mockDelay,
  toastInfo,
  toastSuccess,
  toastWarning,
  useAdminListUi,
} from '@/composables/admin/useAdminListUi'
import {
  buildAdminModuleListCsv,
  sanitizeFilenameBase,
  timestampForFilename,
  triggerUtf8BomCsvDownload,
} from '@/utils/adminCsvExport'
import {
  isAdminColumnSortable,
  useAdminTableSelection,
  useAdminTableSort,
} from '@/composables/admin/useAdminDataTable'

const route = useRoute()
const { loading, withLoading } = useAdminListUi()

const moduleKey = computed(() => {
  const k = route.meta.topModule as TopLevelModuleKey | undefined
  return k && ADMIN_TOP_LEVEL_MODULE_REGISTRY[k] ? k : 'currencies'
})

const def = computed(() => ADMIN_TOP_LEVEL_MODULE_REGISTRY[moduleKey.value])

const keyword = ref('')
const filterStatus = ref<'' | 'PENDING' | 'DONE'>('')
const dateRange = ref<[Date, Date] | null>(null)

const rawRows = ref<Record<string, unknown>[]>([])

function rowId(row: Record<string, unknown>): string {
  const first = def.value.columns[0]?.prop
  if (first && row[first] != null) return String(row[first])
  return JSON.stringify(row).slice(0, 32)
}

const { tableRef, selectedRows, onSelectionChange, removeRowsFromSource } =
  useAdminTableSelection(rowId)

function statusKey(row: Record<string, unknown>): string | undefined {
  const v =
    row.status ?? row.publishStatus ?? row.orderStatus ?? row.result ?? row.level ?? row.severity
  return v != null ? String(v) : undefined
}

const moduleHasStatus = computed(() => rawRows.value.some((r) => statusKey(r) != null))

const PENDING_KEYS = new Set([
  'DRAFT',
  'REVIEW',
  'PENDING',
  'SCHEDULED',
  'OFF',
  'HALT',
  'FAIL',
  'LOCKED',
  'DISABLED',
  'ERROR',
  'WARN',
  'UPCOMING',
  'PREP',
  'CRITICAL',
])

function parseRowDate(row: Record<string, unknown>): number | null {
  for (const col of def.value.columns) {
    if (col.display !== 'date') continue
    const v = row[col.prop]
    if (v == null) continue
    const t = Date.parse(String(v))
    if (!Number.isNaN(t)) return t
  }
  return null
}

const filteredRows = computed(() => {
  let list = rawRows.value
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(kw)),
    )
  }
  if (moduleHasStatus.value && filterStatus.value) {
    list = list.filter((row) => {
      const k = statusKey(row)
      if (!k) return false
      if (filterStatus.value === 'PENDING') return PENDING_KEYS.has(k)
      return !PENDING_KEYS.has(k)
    })
  }
  if (dateRange.value) {
    const [a, b] = dateRange.value
    const start = a.getTime()
    const end = b.getTime()
    list = list.filter((row) => {
      const t = parseRowDate(row)
      if (t == null) return true
      return t >= start && t <= end
    })
  }
  return list
})

const { onSortChange, orderedFilteredRows, resetSort } = useAdminTableSort(def, filteredRows)

watch(
  moduleKey,
  async () => {
    keyword.value = ''
    filterStatus.value = ''
    dateRange.value = null
    resetSort()
    rawRows.value = JSON.parse(JSON.stringify(def.value.rows)) as Record<string, unknown>[]
    await nextTick()
    tableRef.value?.clearSelection()
    selectedRows.value = []
  },
  { immediate: true },
)

const page = ref(1)
const pageSize = ref(10)

const total = computed(() => orderedFilteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return orderedFilteredRows.value.slice(start, start + pageSize.value)
})

watch([keyword, filterStatus, dateRange], () => {
  page.value = 1
})

function cellDisplay(col: TopLevelModuleColumn, row: Record<string, unknown>): string {
  const v = row[col.prop]
  if (v == null) return '—'
  return String(v)
}

function tagFor(col: TopLevelModuleColumn, row: Record<string, unknown>) {
  if (col.display !== 'tag' || !col.tagMap) return null
  const k = String(row[col.prop] ?? '')
  return col.tagMap[k] ?? { type: 'info' as const, label: k || '—' }
}

const statToneClass = (tone: string | undefined) => {
  if (tone === 'warn') return 'adm-tl-stat--warn'
  if (tone === 'ok') return 'adm-tl-stat--ok'
  if (tone === 'muted') return 'adm-tl-stat--muted'
  return ''
}

const drawerOpen = ref(false)
const editOpen = ref(false)
const currentRow = ref<Record<string, unknown> | null>(null)
const editNote = ref('')

function openDetail(row: Record<string, unknown>) {
  currentRow.value = row
  drawerOpen.value = true
}

function openEdit(row: Record<string, unknown>) {
  currentRow.value = row
  editNote.value = ''
  editOpen.value = true
}

function saveEdit() {
  editOpen.value = false
  toastSuccess('已保存（演示）')
}

async function handleDelete(row: Record<string, unknown>) {
  const ok = await adminConfirm('确定删除该条记录？（演示）')
  if (!ok) return
  const id = rowId(row)
  rawRows.value = rawRows.value.filter((r) => rowId(r) !== id)
  selectedRows.value = selectedRows.value.filter((r) => rowId(r) !== id)
  if (currentRow.value && rowId(currentRow.value) === id) {
    drawerOpen.value = false
    currentRow.value = null
  }
  const maxPage = Math.max(1, Math.ceil(orderedFilteredRows.value.length / pageSize.value) || 1)
  if (page.value > maxPage) page.value = maxPage
  toastSuccess('已删除（演示）')
}

async function handleBatchDelete() {
  const n = selectedRows.value.length
  if (n === 0) return
  const ok = await adminConfirm(`确定删除选中的 ${n} 条记录？（演示）`)
  if (!ok) return
  const ids = new Set(selectedRows.value.map((r) => rowId(r)))
  await removeRowsFromSource(rawRows, ids)
  if (currentRow.value && ids.has(rowId(currentRow.value))) {
    drawerOpen.value = false
    currentRow.value = null
  }
  const maxPage = Math.max(1, Math.ceil(orderedFilteredRows.value.length / pageSize.value) || 1)
  if (page.value > maxPage) page.value = maxPage
  toastSuccess(`已删除 ${n} 条（演示）`)
}

async function copyRowRef(row: Record<string, unknown>) {
  const text = rowId(row)
  try {
    await navigator.clipboard.writeText(text)
    toastSuccess('已复制到剪贴板')
  } catch {
    toastInfo(text)
  }
}

async function handleQuery() {
  await withLoading(async () => {
    await mockDelay()
    page.value = 1
    toastSuccess('查询完成')
  })
}

function handleReset() {
  keyword.value = ''
  filterStatus.value = ''
  dateRange.value = null
  page.value = 1
  toastInfo('已重置筛选条件')
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess('列表已刷新')
  })
}

async function handleExport() {
  const rows = orderedFilteredRows.value
  if (rows.length === 0) {
    toastWarning('当前无数据可导出')
    return
  }
  await withLoading(async () => {
    await mockDelay(100)
    const csv = buildAdminModuleListCsv(def.value.columns, rows)
    const base = sanitizeFilenameBase(def.value.title)
    triggerUtf8BomCsvDownload(csv, `${base}_${timestampForFilename()}.csv`)
    toastSuccess(`已导出 ${rows.length} 条（UTF-8 CSV）`)
  })
}

function confirmDrawer() {
  drawerOpen.value = false
  toastSuccess('已确认（演示）')
}
</script>

<template>
  <div class="adm-tl" v-loading="loading">
    <header class="adm-tl__hero">
      <div class="adm-tl__titles">
        <h1 class="adm-tl__h1">{{ def.title }}</h1>
        <p class="adm-tl__sub">{{ def.subtitle }}</p>
      </div>
      <span v-if="def.hint" class="adm-tl__hint">{{ def.hint }}</span>
    </header>

    <el-row v-if="def.stats?.length" :gutter="12" class="adm-tl__stats">
      <el-col v-for="(s, i) in def.stats" :key="i" :xs="24" :sm="12" :md="6" :lg="6">
        <div class="adm-tl-stat" :class="statToneClass(s.tone)">
          <p class="adm-tl-stat__lbl">{{ s.label }}</p>
          <p class="adm-tl-stat__val">{{ s.value }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item :label="def.filterKeywordLabel ?? '关键词'">
        <el-input
          v-model="keyword"
          :placeholder="def.keywordPlaceholder ?? '关键字'"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item v-if="moduleHasStatus" label="状态">
        <el-select v-model="filterStatus" placeholder="全部" clearable style="width: 140px">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="PENDING" />
          <el-option label="已完成" value="DONE" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="—"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 260px"
        />
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar :title="def.listCaption ?? `${def.title} · 列表`">
      <template #right>
        <el-button
          type="danger"
          plain
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          删除选中<span v-if="selectedRows.length"> ({{ selectedRows.length }})</span>
        </el-button>
        <el-button type="primary" plain @click="handleExport">导出</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table
      ref="tableRef"
      :data="pagedRows"
      :row-key="rowId"
      border
      stripe
      size="small"
      class="adm-tl__table"
      @selection-change="onSelectionChange"
      @sort-change="onSortChange"
    >
      <el-table-column type="selection" width="48" fixed="left" reserve-selection />
      <el-table-column
        v-for="col in def.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :sortable="isAdminColumnSortable(col) ? 'custom' : false"
      >
        <template #default="{ row }">
          <template v-if="col.display === 'tag' && tagFor(col, row)">
            <el-tag :type="tagFor(col, row)!.type" size="small" effect="dark">
              {{ tagFor(col, row)!.label }}
            </el-tag>
          </template>
          <span v-else class="adm-tl__cell" :class="{ 'adm-tl__cell--mono': col.mono }">{{ cellDisplay(col, row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="right" fixed="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
            <el-dropdown
              trigger="click"
              @command="
                (cmd: string) =>
                  cmd === 'edit'
                    ? openEdit(row)
                    : cmd === 'del'
                      ? handleDelete(row)
                      : copyRowRef(row)
              "
            >
              <el-button type="primary" link size="small" class="adm-tl__more">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="copy">复制首列</el-dropdown-item>
                  <el-dropdown-item command="del" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="`${def.title} · 详情`">
      <template v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item
            v-for="col in def.columns"
            :key="col.prop"
            :label="col.label"
          >
            <template v-if="col.display === 'tag' && tagFor(col, currentRow)">
              <el-tag :type="tagFor(col, currentRow)!.type" size="small" effect="dark">
                {{ tagFor(col, currentRow)!.label }}
              </el-tag>
            </template>
            <span v-else :class="{ 'adm-tl__cell--mono': col.mono }">{{ cellDisplay(col, currentRow) }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <p class="adm-tl__drawer-hint">
          {{
            def.drawerNote ??
            '生产环境可对接真实接口、审批流与字段级权限。'
          }}
        </p>
      </template>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
        <el-button type="primary" @click="confirmDrawer">确认</el-button>
      </template>
    </AdmDetailDrawer>

    <el-dialog v-model="editOpen" title="编辑（演示）" width="440px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="备注">
          <el-input v-model="editNote" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">关闭</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.adm-tl__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.adm-tl__h1 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--el-text-color-primary);
}

.adm-tl__sub {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
  max-width: 780px;
}

.adm-tl__hint {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-primary);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color-light));
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.adm-tl__stats {
  margin-bottom: 14px;
}

.adm-tl-stat {
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

.adm-tl-stat__lbl {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.adm-tl-stat__val {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.adm-tl-stat--warn .adm-tl-stat__val {
  color: var(--el-color-warning);
}

.adm-tl-stat--ok .adm-tl-stat__val {
  color: var(--el-color-success);
}

.adm-tl-stat--muted .adm-tl-stat__val {
  color: var(--el-text-color-secondary);
}

.adm-tl__table {
  border-radius: 10px;
}

.adm-tl__cell {
  font-variant-numeric: tabular-nums;
}

.adm-tl__cell--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: -0.02em;
}

.adm-tl__drawer-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.adm-tl__more {
  margin-left: 2px;
}
</style>
