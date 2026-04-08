<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'
import AdmDetailDrawer from '@/components/admin/common/AdmDetailDrawer.vue'

const page = ref(1)
const pageSize = ref(10)
const total = ref(36)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
  enabled: '' as '' | 'Y' | 'N',
})

const drawerOpen = ref(false)
const editing = ref<'create' | 'edit'>('create')
const form = ref({
  asset: 'USDT',
  chain: 'TRC20',
  address: '',
  memo: '',
  enabled: true,
  remark: '',
})

const rows = computed(() => [
  {
    id: 'P-001',
    asset: 'USDT',
    chain: 'TRC20',
    address: 'TQmA…P1f3',
    memo: '',
    enabled: true,
    updatedAt: '2026-03-26 16:08',
  },
  {
    id: 'P-002',
    asset: 'XRP',
    chain: 'XRP',
    address: 'rHb9…tQX2',
    memo: '289102',
    enabled: true,
    updatedAt: '2026-03-11 09:22',
  },
])

function reset() {
  q.value = { keyword: '', asset: '', chain: '', enabled: '' }
}

function openCreate() {
  editing.value = 'create'
  form.value = { asset: 'USDT', chain: 'TRC20', address: '', memo: '', enabled: true, remark: '' }
  drawerOpen.value = true
}

function openEdit(row: (typeof rows.value)[number]) {
  editing.value = 'edit'
  form.value = {
    asset: row.asset,
    chain: row.chain,
    address: row.address,
    memo: row.memo,
    enabled: row.enabled,
    remark: '',
  }
  drawerOpen.value = true
}
</script>

<template>
  <div class="adm-fin">
    <header class="adm-fin__head">
      <h1 class="adm-fin__title">区块链公共充值地址维护</h1>
      <p class="adm-fin__desc">维护「公共归集地址」池（如共享地址 + memo/tag），用于入账归集与对账。</p>
    </header>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="地址 / Memo / 备注" clearable style="width: 220px" />
      </el-form-item>
      <el-form-item label="资产">
        <el-select v-model="q.asset" placeholder="全部" clearable style="width: 140px">
          <el-option label="USDT" value="USDT" />
          <el-option label="XRP" value="XRP" />
          <el-option label="XLM" value="XLM" />
        </el-select>
      </el-form-item>
      <el-form-item label="链">
        <el-select v-model="q.chain" placeholder="全部" clearable style="width: 140px">
          <el-option label="TRC20" value="TRC20" />
          <el-option label="ERC20" value="ERC20" />
          <el-option label="XRP" value="XRP" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用">
        <el-select v-model="q.enabled" placeholder="全部" clearable style="width: 140px">
          <el-option label="启用" value="Y" />
          <el-option label="停用" value="N" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="primary">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="公共充值地址池">
      <template #right>
        <el-button type="primary" @click="openCreate">新增地址</el-button>
        <el-button>刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="rows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="asset" label="资产" width="90" />
      <el-table-column prop="chain" label="链" width="90" />
      <el-table-column prop="address" label="地址" min-width="220" />
      <el-table-column prop="memo" label="Memo/Tag" min-width="120" />
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" effect="dark">{{ row.enabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
      <el-table-column label="操作" width="140" fixed="right" align="right">
        <template #default="{ row }">
          <AdmActionGroup>
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link>删除</el-button>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />

    <AdmDetailDrawer v-model="drawerOpen" :title="editing === 'create' ? '新增公共充值地址' : '编辑公共充值地址'">
      <el-form label-width="120px" label-position="left">
        <el-form-item label="资产">
          <el-select v-model="form.asset" style="width: 220px">
            <el-option label="USDT" value="USDT" />
            <el-option label="XRP" value="XRP" />
            <el-option label="XLM" value="XLM" />
          </el-select>
        </el-form-item>
        <el-form-item label="链">
          <el-select v-model="form.chain" style="width: 220px">
            <el-option label="TRC20" value="TRC20" />
            <el-option label="ERC20" value="ERC20" />
            <el-option label="XRP" value="XRP" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="输入链上地址" />
        </el-form-item>
        <el-form-item label="Memo/Tag">
          <el-input v-model="form.memo" placeholder="无则留空" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填：归集规则/用途/负责人" />
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

