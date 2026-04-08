<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'
import AdmActionGroup from '@/components/admin/common/AdmActionGroup.vue'

const page = ref(1)
const pageSize = ref(10)
const total = ref(1024)

const q = ref({
  keyword: '',
  asset: '',
  chain: '',
})

const rows = computed(() => [
  {
    uid: '1000231',
    asset: 'USDT',
    chain: 'TRC20',
    address: 'TQmA…P1f3',
    memo: '—',
    createdAt: '2026-03-21 14:12',
  },
  {
    uid: '1000129',
    asset: 'XRP',
    chain: 'XRP',
    address: 'rHb9…tQX2',
    memo: '102931',
    createdAt: '2026-03-10 09:03',
  },
])

function reset() {
  q.value = { keyword: '', asset: '', chain: '' }
}
</script>

<template>
  <div class="adm-fin">
    <header class="adm-fin__head">
      <h1 class="adm-fin__title">区块链个人充值地址维护</h1>
      <p class="adm-fin__desc">用于查看/重置用户的链上充值地址（含 Memo/Tag 类链）。</p>
    </header>

    <AdmFilterBar>
      <el-form-item label="关键字">
        <el-input v-model="q.keyword" placeholder="UID / 地址 / Memo" clearable style="width: 220px" />
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
      <template #actions>
        <el-button type="primary">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="个人充值地址列表">
      <template #right>
        <el-button type="warning" plain>批量重置（预留）</el-button>
        <el-button>刷新</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="rows" border stripe size="small" class="adm-fin__table">
      <el-table-column prop="uid" label="UID" width="120" />
      <el-table-column prop="asset" label="资产" width="90" />
      <el-table-column prop="chain" label="链" width="90" />
      <el-table-column prop="address" label="地址" min-width="220" />
      <el-table-column prop="memo" label="Memo/Tag" min-width="120" />
      <el-table-column prop="createdAt" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="170" fixed="right" align="right">
        <template #default>
          <AdmActionGroup>
            <el-button type="primary" link>复制</el-button>
            <el-button type="warning" link>重置</el-button>
          </AdmActionGroup>
        </template>
      </el-table-column>
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
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

