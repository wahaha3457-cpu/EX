<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'

type Scope = 'DEFAULT' | 'VIP' | 'RISK'

const page = ref(1)
const pageSize = ref(10)
const total = ref(24)

const q = ref({
  asset: '',
  chain: '',
  scope: '' as '' | Scope,
})

const drawerOpen = ref(false)
const editing = ref<'create' | 'edit'>('create')

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

const rows = computed(() => [
  {
    id: 'L-001',
    scope: 'DEFAULT' as const,
    asset: 'USDT',
    chain: 'TRC20',
    dailyLimit: 5000,
    perOrderLimit: 2000,
    minAmount: 10,
    enabled: true,
    updatedAt: '2026-03-30 12:00',
  },
  {
    id: 'L-002',
    scope: 'RISK' as const,
    asset: 'USDT',
    chain: 'ERC20',
    dailyLimit: 1000,
    perOrderLimit: 500,
    minAmount: 20,
    enabled: true,
    updatedAt: '2026-03-28 08:40',
  },
])

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
  q.value = { asset: '', chain: '', scope: '' }
}

function openCreate() {
  editing.value = 'create'
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

function openEdit(row: (typeof rows.value)[number]) {
  editing.value = 'edit'
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
</script>

<template>
  <div class="adm-fin">
    <header class="adm-fin__head">
      <h1 class="adm-fin__title">提现限额管理</h1>
      <p class="adm-fin__desc">
        以「资产 + 链 + 规则范围」维度配置提现限额。后续可扩展：KYC 等级、用户标签、黑白名单、IP/设备风险等。
      </p>
    </header>

    <AdmFilterBar>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 140px">
          <el-option label="USDT" value="USDT" />
          <el-option label="BTC" value="BTC" />
          <el-option label="ETH" value="ETH" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 140px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="BTC" value="BTC" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则范围">
        <el-select v-model="q.scope" placeholder="全部" clearable style="width: 160px">
          <el-option label="默认" value="DEFAULT" />
          <el-option label="VIP" value="VIP" />
          <el-option label="风控限额" value="RISK" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="限额规则列表">
      <template #right>
        <el-button type="primary" @click="openCreate">新增规则</el-button>
        <el-button>刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="rows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column label="规则范围" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="scopeTagType(row.scope)" effect="dark">{{ scopeLabel(row.scope) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="asset" label="资产" width="90" />
      <el-table-column prop="chain" label="链" width="90" />
      <el-table-column prop="minAmount" label="最小提现" min-width="120" />
      <el-table-column prop="perOrderLimit" label="单笔上限" min-width="120" />
      <el-table-column prop="dailyLimit" label="日累计上限" min-width="130" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" effect="dark">{{ row.enabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
      <el-table-column label="操作" width="170" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="warning" link>复制</el-button>
            <el-button type="danger" link>停用</el-button>
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
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填：生效范围/风控说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerOpen = false">取消</el-button>
        <el-button type="primary">保存</el-button>
      </template>
    </AdmDetailDrawer>
  </div>
</template>

<style scoped lang="scss">
.adm-fin__head {
  margin-bottom: 14px;
}

.adm-fin__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-fin__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.adm-fin__table {
  border-radius: 8px;
}
</style>

