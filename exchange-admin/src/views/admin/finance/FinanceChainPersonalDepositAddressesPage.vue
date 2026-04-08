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

type PersonalRow = {
  uid: string
  kyc: string
  asset: string
  chain: string
  address: string
  memo: string
  assignType: 'HD' | 'STATIC'
  status: 'ACTIVE' | 'ROTATING'
  createdAt: string
}

const page = ref(1)
const pageSize = ref(10)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  assignType: '' as '' | 'HD' | 'STATIC',
})

const allRows = ref<PersonalRow[]>([
  { uid: '1000231', kyc: 'L2', asset: 'USDT', chain: 'TRC20', address: 'TQmA8x…P1f3', memo: '—', assignType: 'HD', status: 'ACTIVE', createdAt: '2026-03-21 14:12' },
  { uid: '1000129', kyc: 'L1', asset: 'XRP', chain: 'XRP', address: 'rHb9C4…tQX2', memo: '102931', assignType: 'STATIC', status: 'ACTIVE', createdAt: '2026-03-10 09:03' },
  { uid: '1000402', kyc: 'L2', asset: 'USDT', chain: 'ERC20', address: '0x71a2…4c8e', memo: '—', assignType: 'HD', status: 'ROTATING', createdAt: '2026-04-01 11:20' },
  { uid: '1000555', kyc: 'L2', asset: 'XLM', chain: 'XLM', address: 'GABC…ZZZZ', memo: '880012', assignType: 'STATIC', status: 'ACTIVE', createdAt: '2026-03-28 08:15' },
  { uid: '1000881', kyc: 'L1', asset: 'BTC', chain: 'BTC', address: 'bc1q…kp5s', memo: '—', assignType: 'HD', status: 'ACTIVE', createdAt: '2026-03-15 19:40' },
  { uid: '1000999', kyc: 'L2', asset: 'ETH', chain: 'ERC20', address: '0xdead…beef', memo: '—', assignType: 'HD', status: 'ACTIVE', createdAt: '2026-02-10 10:00' },
])

const { loading, withLoading } = useAdminListUi()

const drawerOpen = ref(false)
const currentRow = ref<PersonalRow | null>(null)

const filteredRows = computed(() => {
  let list = allRows.value
  const kw = q.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (r) =>
        r.uid.includes(kw) ||
        r.address.toLowerCase().includes(kw) ||
        r.memo.toLowerCase().includes(kw),
    )
  }
  if (q.value.asset) list = list.filter((r) => r.asset === q.value.asset)
  if (q.value.chain) list = list.filter((r) => r.chain === q.value.chain)
  if (q.value.assignType) list = list.filter((r) => r.assignType === q.value.assignType)
  return list
})

const total = computed(() => filteredRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const kpiHd = computed(() => allRows.value.filter((r) => r.assignType === 'HD').length)
const kpiStatic = computed(() => allRows.value.filter((r) => r.assignType === 'STATIC').length)
const kpiRotate = computed(() => allRows.value.filter((r) => r.status === 'ROTATING').length)

function reset() {
  q.value = { keyword: '', asset: '', chain: '', assignType: '' }
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

async function copyAddress(row: PersonalRow) {
  try {
    await navigator.clipboard.writeText(row.address + (row.memo && row.memo !== '—' ? ` ${row.memo}` : ''))
    toastSuccess('已复制地址与 Memo')
  } catch {
    toastInfo(row.address)
  }
}

function openDetail(row: PersonalRow) {
  currentRow.value = row
  drawerOpen.value = true
}

async function runReset(row: PersonalRow, closeDrawer: boolean) {
  const ok = await adminConfirm(
    `确认重置 UID ${row.uid} 的 ${row.asset}/${row.chain} 充值地址？旧地址将停止入账。（演示）`,
  )
  if (!ok) return
  if (closeDrawer) drawerOpen.value = false
  toastSuccess('已提交重置（演示）')
}

async function promptReset(row: PersonalRow) {
  currentRow.value = row
  await runReset(row, false)
}

async function resetAddress() {
  const row = currentRow.value
  if (!row) return
  await runReset(row, true)
}

async function batchResetDemo() {
  const ok = await adminConfirm('批量重置将生成工单（演示），是否继续？')
  if (!ok) return
  toastSuccess('已创建批量任务（演示）')
}
</script>

<template>
  <div class="adm-fin" v-loading="loading">
    <header class="adm-fin__hero">
      <div class="adm-fin__hero-text">
        <h1 class="adm-fin__title">区块链个人充值地址维护</h1>
        <p class="adm-fin__desc">
          查看与重置用户专属充值地址（含 Memo/Tag 链）；HD 派生与静态分配策略可分区展示。
          对接示例：GET /v1/admin/finance/chain/personal-deposit-addresses。
        </p>
      </div>
    </header>

    <el-row :gutter="12" class="adm-fin__stats">
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--ok">
          <p class="adm-fin-stat__lbl">HD 派生</p>
          <p class="adm-fin-stat__val">{{ kpiHd }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat">
          <p class="adm-fin-stat__lbl">静态分配</p>
          <p class="adm-fin-stat__val">{{ kpiStatic }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--warn">
          <p class="adm-fin-stat__lbl">轮换中</p>
          <p class="adm-fin-stat__val">{{ kpiRotate }}</p>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8" :md="6">
        <div class="adm-fin-stat adm-fin-stat--muted">
          <p class="adm-fin-stat__lbl">记录总数</p>
          <p class="adm-fin-stat__val">{{ allRows.length }}</p>
        </div>
      </el-col>
    </el-row>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="UID / 地址 / Memo" clearable style="width: 220px" :prefix-icon="Search" />
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
      <el-form-item label="分配">
        <el-select v-model="q.assignType" placeholder="全部" clearable style="width: 120px">
          <el-option label="HD 派生" value="HD" />
          <el-option label="静态" value="STATIC" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="个人充值地址列表">
      <template #right>
        <el-button type="warning" plain @click="batchResetDemo">批量重置（演示）</el-button>
        <el-button @click="handleRefresh">刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="pagedRows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="uid" label="UID" width="112" />
      <el-table-column prop="kyc" label="KYC" width="72" />
      <el-table-column label="分配" width="96" align="center">
        <template #default="{ row }">
          <el-tag :type="row.assignType === 'HD' ? 'success' : 'info'" size="small" effect="dark">
            {{ row.assignType === 'HD' ? 'HD' : '静态' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="asset" label="资产" width="80" />
      <el-table-column prop="chain" label="链" width="88" />
      <el-table-column label="地址" min-width="200">
        <template #default="{ row }">
          <span class="adm-fin__mono">{{ row.address }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="memo" label="Memo/Tag" min-width="110" />
      <el-table-column label="状态" width="96" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ROTATING' ? 'warning' : 'success'" size="small" effect="dark">
            {{ row.status === 'ROTATING' ? '轮换中' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="150" />
      <el-table-column label="操作" width="200" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button type="info" link @click="copyAddress(row)">复制</el-button>
            <el-button type="warning" link @click="promptReset(row)">重置</el-button>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="currentRow ? `充值地址 · UID ${currentRow.uid}` : '详情'">
      <div v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="UID">{{ currentRow.uid }}</el-descriptions-item>
          <el-descriptions-item label="KYC">{{ currentRow.kyc }}</el-descriptions-item>
          <el-descriptions-item label="资产 / 链">{{ currentRow.asset }} · {{ currentRow.chain }}</el-descriptions-item>
          <el-descriptions-item label="分配策略">{{ currentRow.assignType === 'HD' ? 'HD 派生' : '静态' }}</el-descriptions-item>
          <el-descriptions-item label="地址">
            <span class="adm-fin__mono">{{ currentRow.address }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Memo/Tag">{{ currentRow.memo }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentRow.createdAt }}</el-descriptions-item>
        </el-descriptions>
        <p class="adm-fin__drawer-hint">
          重置后可在此查看新地址生效时间、历史入账扫块任务与客服通知模板发送记录。
        </p>
      </div>
      <template #footer>
        <el-button @click="drawerOpen = false">关闭</el-button>
        <el-button type="warning" @click="resetAddress">确认重置</el-button>
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
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>
