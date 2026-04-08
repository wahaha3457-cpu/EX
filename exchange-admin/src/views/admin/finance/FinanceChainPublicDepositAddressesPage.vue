<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
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

type PublicRow = {
  id: string
  asset: string
  chain: string
  address: string
  memo: string
  pool: string
  enabled: boolean
  inflow24h: string
  updatedAt: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  enabled: '' as '' | 'Y' | 'N',
})

const allRows = ref<PublicRow[]>([
  { id: 'P-001', asset: 'USDT', chain: 'TRC20', address: 'TQmA8x…P1f3', memo: '', pool: '主归集池', enabled: true, inflow24h: '820 万 U', updatedAt: '2026-04-02 16:08' },
  { id: 'P-002', asset: 'XRP', chain: 'XRP', address: 'rHb9C4…tQX2', memo: '289102', pool: 'XRP 标签池', enabled: true, inflow24h: '120 万 XRP', updatedAt: '2026-04-01 09:22' },
  { id: 'P-003', asset: 'USDT', chain: 'ERC20', address: '0x83a1…9aB2', memo: '', pool: 'ERC 归集', enabled: true, inflow24h: '410 万 U', updatedAt: '2026-04-02 08:10' },
  { id: 'P-004', asset: 'XLM', chain: 'XLM', address: 'GABC…ZZZZ', memo: '100001', pool: 'XLM Memo 池', enabled: false, inflow24h: '—', updatedAt: '2026-03-11 14:00' },
  { id: 'P-005', asset: 'BTC', chain: 'BTC', address: 'bc1qxy…kp5s', memo: '', pool: 'BTC 冷归集', enabled: true, inflow24h: '38 BTC', updatedAt: '2026-03-30 19:33' },
  { id: 'P-006', asset: 'ETH', chain: 'ERC20', address: '0x71a2…4c8e', memo: '', pool: 'ETH 热归集', enabled: true, inflow24h: '1,200 ETH', updatedAt: '2026-04-02 11:05' },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const editing = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const form = ref({
  asset: 'USDT',
  chain: 'TRC20',
  address: '',
  memo: '',
  pool: '主归集池',
  enabled: true,
  remark: '',
})

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.id.toLowerCase().includes(kw) ||
        r.address.toLowerCase().includes(kw) ||
        r.memo.toLowerCase().includes(kw) ||
        r.pool.toLowerCase().includes(kw),
    )
  }
  if (q.value.asset) list = list.filter((r) => r.asset === q.value.asset)
  if (q.value.chain) list = list.filter((r) => r.chain === q.value.chain)
  if (q.value.enabled === 'Y') list = list.filter((r) => r.enabled)
  if (q.value.enabled === 'N') list = list.filter((r) => !r.enabled)
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const kpiOn = computed(() => allRows.value.filter((r) => r.enabled).length)
const kpiMemo = computed(() => allRows.value.filter((r) => r.memo).length)

function reset() {
  q.value = { keyword: '', asset: '', chain: '', enabled: '' }
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
  form.value = { asset: 'USDT', chain: 'TRC20', address: '', memo: '', pool: '主归集池', enabled: true, remark: '' }
  drawerOpen.value = true
}

function openEdit(row: PublicRow) {
  editing.value = 'edit'
  editingId.value = row.id
  form.value = {
    asset: row.asset,
    chain: row.chain,
    address: row.address.replace(/…/g, ''),
    memo: row.memo,
    pool: row.pool,
    enabled: row.enabled,
    remark: '',
  }
  drawerOpen.value = true
}

function saveDrawer() {
  const ts = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  const shortAddr =
    form.value.address.length > 14
      ? `${form.value.address.slice(0, 6)}…${form.value.address.slice(-4)}`
      : form.value.address

  if (editing.value === 'create') {
    const id = `P-${String(allRows.value.length + 1).padStart(3, '0')}`
    allRows.value.unshift({
      id,
      asset: form.value.asset,
      chain: form.value.chain,
      address: shortAddr,
      memo: form.value.memo,
      pool: form.value.pool,
      enabled: form.value.enabled,
      inflow24h: '—',
      updatedAt: ts,
    })
    toastSuccess('已新增（演示）')
  } else if (editingId.value) {
    const ix = allRows.value.findIndex((r) => r.id === editingId.value)
    if (ix !== -1) {
      allRows.value[ix] = {
        ...allRows.value[ix],
        asset: form.value.asset,
        chain: form.value.chain,
        address: shortAddr,
        memo: form.value.memo,
        pool: form.value.pool,
        enabled: form.value.enabled,
        updatedAt: ts,
      }
    }
    toastSuccess('已保存（演示）')
  }
  drawerOpen.value = false
}

async function removeRow(row: PublicRow) {
  const ok = await adminConfirm(`删除公共地址 ${row.id}？（演示）`)
  if (!ok) return
  allRows.value = allRows.value.filter((r) => r.id !== row.id)
  toastSuccess('已删除（演示）')
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__hero">
      <div class="adm-fin__hero-text">
        <h1 class="adm-fin__title">区块链公共充值地址维护</h1>
        <p class="adm-fin__desc">
          维护共享归集地址与 Memo/Tag 映射，供扫块入账与对账；与资金池、冷热拆分策略绑定。
          对接示例：GET/PUT /v1/admin/finance/chain/public-deposit-addresses。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-fin__stats">
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--ok">
          <p class="adm-fin-stat__lbl">启用池地址</p>
          <p class="adm-fin-stat__val">{{ kpiOn }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat">
          <p class="adm-fin-stat__lbl">含 Memo/Tag</p>
          <p class="adm-fin-stat__val">{{ kpiMemo }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--muted">
          <p class="adm-fin-stat__lbl">地址条目</p>
          <p class="adm-fin-stat__val">{{ allRows.length }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--warn">
          <p class="adm-fin-stat__lbl">停用</p>
          <p class="adm-fin-stat__val">{{ allRows.filter((r) => !r.enabled).length }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="ID / 地址 / Memo / 池" clearable style="width: 220px" :prefix-icon="Search" />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 130px">
          <el-option label="USDT" value="USDT" />
          <el-option label="BTC" value="BTC" />
          <el-option label="ETH" value="ETH" />
          <el-option label="XRP" value="XRP" />
          <el-option label="XLM" value="XLM" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 130px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
          <el-option label="XRP" value="XRP" />
          <el-option label="XLM" value="XLM" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用">
        <el-select v-model="q.enabled" placeholder="全部" clearable style="width: 110px">
          <el-option label="启用" value="Y" />
          <el-option label="停用" value="N" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="公共充值地址池">
      <template #right>
        <el-button type="primary" @click="openCreate">新增地址</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="pool" label="资金池" min-width="120" />
      <el-table-column prop="asset" label="资产" width="80" />
      <el-table-column prop="chain" label="链" width="88" />
      <el-table-column label="地址" min-width="200">
        <template #default="{ row }">
          <span class="adm-fin__mono">{{ row.address }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="memo" label="Memo/Tag" min-width="100" />
      <el-table-column prop="inflow24h" label="24h 入金(演示)" min-width="120" />
      <el-table-column label="状态" width="88" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" effect="dark" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="150" />
      <el-table-column label="操作" width="150" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="removeRow(row)">删除</el-button>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="editing === 'create' ? '新增公共充值地址' : '编辑公共充值地址'">
      <el-form label-width="120px" label-position="left">
        <el-form-item label="归集池">
          <el-input v-model="form.pool" placeholder="池名称 / 业务线" />
        </el-form-item>
        <el-form-item label="资产">
          <el-select v-model="form.asset" style="width: 220px">
            <el-option label="USDT" value="USDT" />
            <el-option label="XRP" value="XRP" />
            <el-option label="XLM" value="XLM" />
            <el-option label="BTC" value="BTC" />
            <el-option label="ETH" value="ETH" />
          </el-select>
        </el-form-item>
        <el-form-item label="链">
          <el-select v-model="form.chain" style="width: 220px">
            <el-option label="TRC20" value="TRC20" />
            <el-option label="ERC20" value="ERC20" />
            <el-option label="BTC" value="BTC" />
            <el-option label="XRP" value="XRP" />
            <el-option label="XLM" value="XLM" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" placeholder="完整链上地址" />
        </el-form-item>
        <el-form-item label="Memo/Tag">
          <el-input v-model="form.memo" placeholder="无则留空" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="归集规则 / 负责人 / 工单号" />
        </el-form-item>
      </el-form>
      <p class="adm-fin__drawer-hint">保存前建议校验 Memo 唯一性与链上合约是否为官方白名单合约。</p>
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

.adm-fin__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

.adm-fin__drawer-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
