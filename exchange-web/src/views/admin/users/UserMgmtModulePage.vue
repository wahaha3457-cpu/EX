<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import {
  ADMIN_USER_MODULE_REGISTRY,
  type UserModuleKey,
  type UserModuleColumn,
} from '@/config/adminUserModules'
import {
  adminConfirm,
  mockDelay,
  toastInfo,
  toastSuccess,
  useAdminListUi,
} from '@/composables/admin/useAdminListUi'

const route = useRoute()
const { loading, withLoading } = useAdminListUi()

const moduleKey = computed(() => {
  const k = route.meta.userModule as UserModuleKey | undefined
  return k && ADMIN_USER_MODULE_REGISTRY[k] ? k : 'list'
})

const def = computed(() => ADMIN_USER_MODULE_REGISTRY[moduleKey.value])

const keyword = ref('')
const filterStatus = ref<'' | 'PENDING' | 'DONE'>('')
const dateRange = ref<[Date, Date] | null>(null)

const rawRows = ref<Record<string, unknown>[]>([])

watch(
  moduleKey,
  () => {
    keyword.value = ''
    filterStatus.value = ''
    dateRange.value = null
    rawRows.value = JSON.parse(JSON.stringify(def.value.rows)) as Record<string, unknown>[]
  },
  { immediate: true },
)

function statusKey(row: Record<string, unknown>): string | undefined {
  const v = row.status ?? row.rebateStatus
  return v != null ? String(v) : undefined
}

const moduleHasStatus = computed(() => rawRows.value.some((r) => statusKey(r) != null))

const PENDING_KEYS = new Set(['PENDING', 'REVIEW', 'OPEN'])

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

const page = ref(1)
const pageSize = ref(10)

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch([keyword, filterStatus, dateRange], () => {
  page.value = 1
})

function cellDisplay(col: UserModuleColumn, row: Record<string, unknown>): string {
  const v = row[col.prop]
  if (v == null) return '—'
  return String(v)
}

function tagFor(col: UserModuleColumn, row: Record<string, unknown>) {
  if (col.display !== 'tag' || !col.tagMap) return null
  const k = String(row[col.prop] ?? '')
  return col.tagMap[k] ?? { type: 'info' as const, label: k || '—' }
}

const statToneClass = (tone: string | undefined) => {
  if (tone === 'warn') return 'adm-um-stat--warn'
  if (tone === 'ok') return 'adm-um-stat--ok'
  if (tone === 'muted') return 'adm-um-stat--muted'
  return ''
}

const drawerOpen = ref(false)
const reviewOpen = ref(false)
const editOpen = ref(false)
const currentRow = ref<Record<string, unknown> | null>(null)
const reviewRemark = ref('')
const editNote = ref('')

const showReviewBtn = computed(
  () => moduleKey.value.startsWith('kyc') || moduleKey.value === 'manualReset',
)

function rowId(row: Record<string, unknown>): string {
  const first = def.value.columns[0]?.prop
  if (first && row[first] != null) return String(row[first])
  return JSON.stringify(row).slice(0, 32)
}

function openDetail(row: Record<string, unknown>) {
  currentRow.value = row
  drawerOpen.value = true
}

function openReview(row: Record<string, unknown>) {
  currentRow.value = row
  reviewRemark.value = ''
  reviewOpen.value = true
}

function submitReview() {
  reviewOpen.value = false
  toastSuccess(`审核已提交：${rowId(currentRow.value!)}`)
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
  if (currentRow.value && rowId(currentRow.value) === id) {
    drawerOpen.value = false
    currentRow.value = null
  }
  toastSuccess('已删除（演示）')
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

function handleExport() {
  toastInfo('已创建导出任务（演示）')
}

function confirmDrawer() {
  drawerOpen.value = false
  toastSuccess('已确认（演示）')
}
</script>

<template>
  <div class="adm-um" v-loading="loading">
    <header class="adm-um__hero">
      <div class="adm-um__titles">
        <h1 class="adm-um__h1">{{ def.title }}</h1>
        <p class="adm-um__sub">{{ def.subtitle }}</p>
      </div>
      <span v-if="def.hint" class="adm-um__hint">{{ def.hint }}</span>
    </header>

    <el-row v-if="def.stats?.length" :gutter="12" class="adm-um__stats">
      <el-col v-for="(s, i) in def.stats" :key="i" :xs="24" :sm="8" :md="6">
        <div class="adm-um-stat" :class="statToneClass(s.tone)">
          <p class="adm-um-stat__lbl">{{ s.label }}</p>
          <p class="adm-um-stat__val">{{ s.value }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键词">
        <el-input
          v-model="keyword"
          placeholder="UID / 邮箱 / 手机号"
          clearable
          style="width: 220px"
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

    <AdmTableToolbar :title="`${def.title} · 列表`">
      <template #right>
        <el-button type="primary" plain @click="handleExport">导出</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-um__table">
      <el-table-column
        v-for="col in def.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
      >
        <template #default="{ row }">
          <template v-if="col.display === 'tag' && tagFor(col, row)">
            <el-tag :type="tagFor(col, row)!.type" size="small" effect="dark">
              {{ tagFor(col, row)!.label }}
            </el-tag>
          </template>
          <span v-else class="adm-um__cell">{{ cellDisplay(col, row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" align="right" fixed="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="showReviewBtn"
              type="warning"
              link
              size="small"
              @click="openReview(row)"
            >
              审核
            </el-button>
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
              <el-button type="primary" link size="small" class="adm-um__more">
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
            <span v-else>{{ cellDisplay(col, currentRow) }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <p class="adm-um__drawer-hint">生产环境可在此挂载审核轨迹、附件与只读风控标签。</p>
      </template>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
        <el-button type="primary" @click="confirmDrawer">确认</el-button>
      </template>
    </AdmDetailDrawer>

    <el-dialog v-model="reviewOpen" title="审核" width="480px" destroy-on-close>
      <el-input v-model="reviewRemark" type="textarea" :rows="4" placeholder="审核意见" />
      <template #footer>
        <el-button @click="reviewOpen = false">关闭</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>

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
.adm-um__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background:
    radial-gradient(circle at right top, color-mix(in srgb, var(--el-color-primary) 10%, transparent), transparent 32%),
    linear-gradient(180deg, #fbfdff 0%, #f4f8fc 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.95) inset,
    0 10px 22px rgba(15, 23, 42, 0.04);
}

.adm-um__h1 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--el-text-color-primary);
}

.adm-um__sub {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
  max-width: 720px;
}

.adm-um__hint {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-primary);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color-light));
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.adm-um__stats {
  margin-bottom: 16px;
}

.adm-um-stat {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-light);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-light))
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.92) inset,
    0 10px 20px rgba(15, 23, 42, 0.04);
  margin-bottom: 10px;
}

.adm-um-stat__lbl {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.adm-um-stat__val {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.adm-um-stat--warn .adm-um-stat__val {
  color: var(--el-color-warning);
}

.adm-um-stat--ok .adm-um-stat__val {
  color: var(--el-color-success);
}

.adm-um-stat--muted .adm-um-stat__val {
  color: var(--el-text-color-secondary);
}

.adm-um__table {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.96) inset,
    0 12px 24px rgba(15, 23, 42, 0.045);
}

.adm-um__cell {
  font-variant-numeric: tabular-nums;
}

.adm-um__drawer-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.adm-um__more {
  margin-left: 2px;
}
</style>
