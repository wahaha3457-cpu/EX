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

type WalletRow = {
  id: string
  asset: string
  chain: string
  label: string
  address: string
  walletType: 'HOT' | 'COLD'
  enabled: boolean
  balance: string
  updatedAt: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  enabled: '' as '' | 'Y' | 'N',
  walletType: '' as '' | 'HOT' | 'COLD',
})

const allRows = ref<WalletRow[]>([
  { id: 'A-001', asset: 'USDT', chain: 'TRC20', label: '热钱包-TRC-主', address: 'TQmA8x…P1f3', walletType: 'HOT', enabled: true, balance: '1,204,800 U', updatedAt: '2026-04-02 10:20' },
  { id: 'A-002', asset: 'USDT', chain: 'ERC20', label: '热钱包-ERC', address: '0x83a1…9aB2', walletType: 'HOT', enabled: true, balance: '820,400 U', updatedAt: '2026-04-01 18:10' },
  { id: 'A-003', asset: 'BTC', chain: 'BTC', label: '冷钱包-多签', address: 'bc1qxy…kp5s', walletType: 'COLD', enabled: true, balance: '42.15 BTC', updatedAt: '2026-03-29 12:00' },
  { id: 'A-004', asset: 'ETH', chain: 'ERC20', label: '热钱包-ETH', address: '0x71a2…4c8e', walletType: 'HOT', enabled: false, balance: '—', updatedAt: '2026-03-18 09:10' },
  { id: 'A-005', asset: 'USDC', chain: 'Arbitrum', label: '热-Arb', address: '0x55d3…01fa', walletType: 'HOT', enabled: true, balance: '310,000 U', updatedAt: '2026-04-02 08:44' },
  { id: 'A-006', asset: 'USDT', chain: 'BEP20', label: '热-BSC', address: '0xbb01…90aa', walletType: 'HOT', enabled: true, balance: '88,200 U', updatedAt: '2026-03-30 16:22' },
  { id: 'A-007', asset: 'SOL', chain: 'Solana', label: '热-SOL', address: '5VER…8xYz', walletType: 'HOT', enabled: true, balance: '12,400 SOL', updatedAt: '2026-03-28 11:05' },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const editing = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const form = ref({
  asset: 'USDT',
  chain: 'TRC20',
  label: '',
  address: '',
  walletType: 'HOT' as 'HOT' | 'COLD',
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
        r.label.toLowerCase().includes(kw) ||
        r.address.toLowerCase().includes(kw),
    )
  }
  if (q.value.asset) list = list.filter((r) => r.asset === q.value.asset)
  if (q.value.chain) list = list.filter((r) => r.chain === q.value.chain)
  if (q.value.walletType) list = list.filter((r) => r.walletType === q.value.walletType)
  if (q.value.enabled === 'Y') list = list.filter((r) => r.enabled)
  if (q.value.enabled === 'N') list = list.filter((r) => !r.enabled)
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const kpiHot = computed(() => allRows.value.filter((r) => r.walletType === 'HOT' && r.enabled).length)
const kpiCold = computed(() => allRows.value.filter((r) => r.walletType === 'COLD').length)
const kpiOff = computed(() => allRows.value.filter((r) => !r.enabled).length)

function reset() {
  q.value = { keyword: '', asset: '', chain: '', enabled: '', walletType: '' }
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
    asset: 'USDT',
    chain: 'TRC20',
    label: '',
    address: '',
    walletType: 'HOT',
    enabled: true,
    remark: '',
  }
  drawerOpen.value = true
}

function openEdit(row: WalletRow) {
  editing.value = 'edit'
  editingId.value = row.id
  form.value = {
    asset: row.asset,
    chain: row.chain,
    label: row.label,
    address: row.address.replace(/…/g, ''),
    walletType: row.walletType,
    enabled: row.enabled,
    remark: '',
  }
  drawerOpen.value = true
}

function saveDrawer() {
  const ts = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  if (editing.value === 'create') {
    const id = `A-${String(allRows.value.length + 1).padStart(3, '0')}`
    allRows.value.unshift({
      id,
      asset: form.value.asset,
      chain: form.value.chain,
      label: form.value.label || '未命名',
      address: form.value.address.length > 16 ? `${form.value.address.slice(0, 6)}…${form.value.address.slice(-4)}` : form.value.address,
      walletType: form.value.walletType,
      enabled: form.value.enabled,
      balance: '—',
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
        label: form.value.label,
        address: form.value.address.length > 16 ? `${form.value.address.slice(0, 6)}…${form.value.address.slice(-4)}` : form.value.address,
        walletType: form.value.walletType,
        enabled: form.value.enabled,
        updatedAt: ts,
      }
    }
    toastSuccess('已保存（演示）')
  }
  drawerOpen.value = false
}

async function removeRow(row: WalletRow) {
  const ok = await adminConfirm(`确定删除地址 ${row.id}？（演示）`)
  if (!ok) return
  allRows.value = allRows.value.filter((r) => r.id !== row.id)
  toastSuccess('已删除（演示）')
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__hero">
      <div class="adm-fin__hero-text">
        <h1 class="adm-fin__title">区块链提现地址维护</h1>
        <p class="adm-fin__desc">
          维护平台出币地址（热/冷钱包），供提现批次路由与风控白名单校验；变更需审计与多签登记。
          对接示例：GET/PUT /v1/admin/finance/chain/withdraw-addresses。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-fin__stats">
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--ok">
          <p class="adm-fin-stat__lbl">启用热钱包</p>
          <p class="adm-fin-stat__val">{{ kpiHot }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat">
          <p class="adm-fin-stat__lbl">冷钱包条目</p>
          <p class="adm-fin-stat__val">{{ kpiCold }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--warn">
          <p class="adm-fin-stat__lbl">停用</p>
          <p class="adm-fin-stat__val">{{ kpiOff }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--muted">
          <p class="adm-fin-stat__lbl">地址总数</p>
          <p class="adm-fin-stat__val">{{ allRows.length }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="ID / 标签 / 地址" clearable style="width: 220px" :prefix-icon="Search" />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 130px">
          <el-option label="USDT" value="USDT" />
          <el-option label="USDC" value="USDC" />
          <el-option label="BTC" value="BTC" />
          <el-option label="ETH" value="ETH" />
          <el-option label="SOL" value="SOL" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 130px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
          <el-option label="Arbitrum" value="Arbitrum" />
          <el-option label="BEP20" value="BEP20" />
          <el-option label="Solana" value="Solana" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="q.walletType" placeholder="全部" clearable style="width: 120px">
          <el-option label="热钱包" value="HOT" />
          <el-option label="冷钱包" value="COLD" />
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

    <AdmTableToolbar title="提现地址列表">
      <template #right>
        <el-button type="primary" @click="openCreate">新增地址</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="ID" width="88" />
      <el-table-column label="类型" width="88" align="center">
        <template #default="{ row }">
          <el-tag :type="row.walletType === 'HOT' ? 'warning' : 'info'" size="small" effect="dark">
            {{ row.walletType === 'HOT' ? '热' : '冷' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="asset" label="资产" width="80" />
      <el-table-column prop="chain" label="链" width="96" />
      <el-table-column prop="label" label="标签" min-width="130" />
      <el-table-column label="地址" min-width="200">
        <template #default="{ row }">
          <span class="adm-fin__mono">{{ row.address }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额(演示)" min-width="120" />
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

    <AdmDetailDrawer v-model="drawerOpen" :title="editing === 'create' ? '新增提现地址' : '编辑提现地址'">
      <el-form label-width="120px" label-position="left">
        <el-form-item label="钱包类型">
          <el-radio-group v-model="form.walletType">
            <el-radio-button value="HOT">热钱包</el-radio-button>
            <el-radio-button value="COLD">冷钱包</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="资产">
          <el-select v-model="form.asset" style="width: 220px">
            <el-option label="USDT" value="USDT" />
            <el-option label="USDC" value="USDC" />
            <el-option label="BTC" value="BTC" />
            <el-option label="ETH" value="ETH" />
            <el-option label="SOL" value="SOL" />
          </el-select>
        </el-form-item>
        <el-form-item label="链">
          <el-select v-model="form.chain" style="width: 220px">
            <el-option label="TRC20" value="TRC20" />
            <el-option label="ERC20" value="ERC20" />
            <el-option label="BTC" value="BTC" />
            <el-option label="Arbitrum" value="Arbitrum" />
            <el-option label="BEP20" value="BEP20" />
            <el-option label="Solana" value="Solana" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.label" placeholder="例如：热钱包-TRC-主" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" placeholder="完整链上地址" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="多签编号 / 托管方 / 变更工单" />
        </el-form-item>
      </el-form>
      <p class="adm-fin__drawer-hint">生产环境保存前可强制校验地址格式、链 ID 与重复库。</p>
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
