<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'
import {
  adminConfirm,
  mockDelay,
  toastInfo,
  toastSuccess,
  useAdminListUi,
} from '@/composables/admin/useAdminListUi'

type Scope = 'DEFAULT' | 'VIP' | 'RISK'

type LimitRow = {
  id: string
  scope: Scope
  asset: string
  chain: string
  dailyLimit: number
  perOrderLimit: number
  minAmount: number
  enabled: boolean
  updatedAt: string
  hitUsers: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  scope: '' as '' | Scope,
})

const allRows = ref<LimitRow[]>([
  { id: 'L-001', scope: 'DEFAULT', asset: 'USDT', chain: 'TRC20', dailyLimit: 50000, perOrderLimit: 20000, minAmount: 10, enabled: true, updatedAt: '2026-03-30 12:00', hitUsers: '—' },
  { id: 'L-002', scope: 'RISK', asset: 'USDT', chain: 'ERC20', dailyLimit: 5000, perOrderLimit: 2000, minAmount: 20, enabled: true, updatedAt: '2026-03-28 08:40', hitUsers: '128' },
  { id: 'L-003', scope: 'VIP', asset: 'USDT', chain: 'TRC20', dailyLimit: 500000, perOrderLimit: 200000, minAmount: 10, enabled: true, updatedAt: '2026-03-25 10:11', hitUsers: '42' },
  { id: 'L-004', scope: 'DEFAULT', asset: 'BTC', chain: 'BTC', dailyLimit: 5, perOrderLimit: 2, minAmount: 0.001, enabled: true, updatedAt: '2026-03-20 09:00', hitUsers: '—' },
  { id: 'L-005', scope: 'DEFAULT', asset: 'ETH', chain: 'ERC20', dailyLimit: 80, perOrderLimit: 30, minAmount: 0.01, enabled: true, updatedAt: '2026-03-18 14:22', hitUsers: '—' },
  { id: 'L-006', scope: 'RISK', asset: 'ETH', chain: 'ERC20', dailyLimit: 2, perOrderLimit: 1, minAmount: 0.05, enabled: false, updatedAt: '2026-03-10 16:30', hitUsers: '0' },
  { id: 'L-007', scope: 'VIP', asset: 'BTC', chain: 'BTC', dailyLimit: 20, perOrderLimit: 10, minAmount: 0.001, enabled: true, updatedAt: '2026-02-28 11:05', hitUsers: '9' },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const editing = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

const form = ref({
  scope: 'DEFAULT' as Scope,
  asset: 'USDT',
  chain: 'TRC20',
  dailyLimit: 5000,
  perOrderLimit: 2000,
  minAmount: 10,
  enabled: true,
  remark: '',
})

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter((r) => r.id.toLowerCase().includes(kw) || `${r.asset} ${r.chain}`.toLowerCase().includes(kw))
  }
  if (q.value.asset) list = list.filter((r) => r.asset === q.value.asset)
  if (q.value.chain) list = list.filter((r) => r.chain === q.value.chain)
  if (q.value.scope) list = list.filter((r) => r.scope === q.value.scope)
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const kpiEnabled = computed(() => allRows.value.filter((r) => r.enabled).length)
const kpiRisk = computed(() => allRows.value.filter((r) => r.scope === 'RISK').length)

function scopeLabel(s: Scope) {
  if (s === 'VIP') return 'VIP'
  if (s === 'RISK') return '风控限额'
  return '默认'
}

function scopeTagType(s: Scope) {
  if (s === 'RISK') return 'warning'
  if (s === 'VIP') return 'success'
  return 'info'
}

function reset() {
  q.value = { keyword: '', asset: '', chain: '', scope: '' }
  page.value = 1
  toastInfo('已重置筛选条件')
}

async function handleQuery() {
  await withLoading(async () => {
    await mockDelay()
    page.value = 1
    toastSuccess('查询完成')
  })
}

async function handleRefresh() {
  await withLoading(async () => {
    await mockDelay()
    toastSuccess('列表已刷新')
  })
}

function openCreate() {
  editing.value = 'create'
  editingId.value = null
  form.value = {
    scope: 'DEFAULT',
    asset: 'USDT',
    chain: 'TRC20',
    dailyLimit: 5000,
    perOrderLimit: 2000,
    minAmount: 10,
    enabled: true,
    remark: '',
  }
  drawerOpen.value = true
}

function openEdit(row: LimitRow) {
  editing.value = 'edit'
  editingId.value = row.id
  form.value = {
    scope: row.scope,
    asset: row.asset,
    chain: row.chain,
    dailyLimit: row.dailyLimit,
    perOrderLimit: row.perOrderLimit,
    minAmount: row.minAmount,
    enabled: row.enabled,
    remark: '',
  }
  drawerOpen.value = true
}

function saveDrawer() {
  const ts = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  if (editing.value === 'create') {
    const id = `L-${String(allRows.value.length + 1).padStart(3, '0')}`
    allRows.value.unshift({
      id,
      scope: form.value.scope,
      asset: form.value.asset,
      chain: form.value.chain,
      dailyLimit: form.value.dailyLimit,
      perOrderLimit: form.value.perOrderLimit,
      minAmount: form.value.minAmount,
      enabled: form.value.enabled,
      updatedAt: ts,
      hitUsers: '—',
    })
    toastSuccess('已新增规则（演示）')
  } else if (editingId.value) {
    const ix = allRows.value.findIndex((r) => r.id === editingId.value)
    if (ix !== -1) {
      allRows.value[ix] = {
        ...allRows.value[ix],
        scope: form.value.scope,
        asset: form.value.asset,
        chain: form.value.chain,
        dailyLimit: form.value.dailyLimit,
        perOrderLimit: form.value.perOrderLimit,
        minAmount: form.value.minAmount,
        enabled: form.value.enabled,
        updatedAt: ts,
      }
    }
    toastSuccess('已保存（演示）')
  }
  drawerOpen.value = false
}

async function copyRule(row: LimitRow) {
  const ts = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  const id = `L-${String(allRows.value.length + 1).padStart(3, '0')}`
  allRows.value.unshift({
    ...row,
    id,
    enabled: false,
    updatedAt: ts,
    hitUsers: '—',
  })
  toastSuccess(`已复制为新规则 ${id}（演示，默认停用）`)
}

async function toggleDisable(row: LimitRow) {
  const next = !row.enabled
  const ok = await adminConfirm(next ? `启用规则 ${row.id}？` : `停用规则 ${row.id}？（演示）`)
  if (!ok) return
  const ix = allRows.value.findIndex((r) => r.id === row.id)
  if (ix !== -1) {
    allRows.value[ix] = { ...allRows.value[ix], enabled: next }
  }
  toastSuccess(next ? '已启用' : '已停用')
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__hero">
      <div class="adm-fin__hero-text">
        <h1 class="adm-fin__title">提现限额管理</h1>
        <p class="adm-fin__desc">
          按「资产 + 链 + 规则范围（默认 / VIP / 风控）」配置最小提现、单笔与日累计上限；可与 KYC 等级、用户标签叠加。
          对接示例：GET/PUT /v1/admin/finance/withdraw-limits。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-fin__stats">
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--ok">
          <p class="adm-fin-stat__lbl">启用规则</p>
          <p class="adm-fin-stat__val">{{ kpiEnabled }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--warn">
          <p class="adm-fin-stat__lbl">风控类</p>
          <p class="adm-fin-stat__val">{{ kpiRisk }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat">
          <p class="adm-fin-stat__lbl">规则总数</p>
          <p class="adm-fin-stat__val">{{ allRows.length }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--muted">
          <p class="adm-fin-stat__lbl">停用</p>
          <p class="adm-fin-stat__val">{{ allRows.filter((r) => !r.enabled).length }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="规则 ID / 资产链" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 130px">
          <el-option label="USDT" value="USDT" />
          <el-option label="BTC" value="BTC" />
          <el-option label="ETH" value="ETH" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 130px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则范围">
        <el-select v-model="q.scope" placeholder="全部" clearable style="width: 140px">
          <el-option label="默认" value="DEFAULT" />
          <el-option label="VIP" value="VIP" />
          <el-option label="风控限额" value="RISK" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="限额规则列表">
      <template #right>
        <el-button type="primary" @click="openCreate">新增规则</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="ID" width="88" />
      <el-table-column label="规则范围" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="scopeTagType(row.scope)" effect="dark" size="small">{{ scopeLabel(row.scope) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="asset" label="资产" width="80" />
      <el-table-column prop="chain" label="链" width="88" />
      <el-table-column prop="minAmount" label="最小提现" min-width="100" />
      <el-table-column prop="perOrderLimit" label="单笔上限" min-width="100" />
      <el-table-column prop="dailyLimit" label="日累计上限" min-width="110" />
      <el-table-column prop="hitUsers" label="命中用户(估)" width="120" />
      <el-table-column label="状态" width="88" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" effect="dark" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="150" />
      <el-table-column label="操作" width="220" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="copyRule(row)">复制</el-button>
            <el-button type="danger" link @click="toggleDisable(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="editing === 'create' ? '新增限额规则' : '编辑限额规则'">
      <el-form label-width="120px" label-position="left">
        <el-form-item label="规则范围">
          <el-select v-model="form.scope" style="width: 220px">
            <el-option label="默认" value="DEFAULT" />
            <el-option label="VIP" value="VIP" />
            <el-option label="风控限额" value="RISK" />
          </el-select>
        </el-form-item>
        <el-form-item label="资产">
          <el-select v-model="form.asset" style="width: 220px">
            <el-option label="USDT" value="USDT" />
            <el-option label="BTC" value="BTC" />
            <el-option label="ETH" value="ETH" />
          </el-select>
        </el-form-item>
        <el-form-item label="链">
          <el-select v-model="form.chain" style="width: 220px">
            <el-option label="TRC20" value="TRC20" />
            <el-option label="ERC20" value="ERC20" />
            <el-option label="BTC" value="BTC" />
          </el-select>
        </el-form-item>
        <el-form-item label="最小提现">
          <el-input-number v-model="form.minAmount" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="单笔上限">
          <el-input-number v-model="form.perOrderLimit" :min="0" :step="10" />
        </el-form-item>
        <el-form-item label="日累计上限">
          <el-input-number v-model="form.dailyLimit" :min="0" :step="100" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="生效条件 / 灰度 / 关联风控策略 ID" />
        </el-form-item>
      </el-form>
      <p class="adm-fin__drawer-hint">保存后建议触发规则版本号递增，并通知撮合与提现服务热更新缓存。</p>
      <template #footer>
        <el-button @click="drawerOpen = false">取消</el-button>
        <el-button type="primary" @click="saveDrawer">保存</el-button>
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

.adm-fin__drawer-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
