<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'

const page = ref(1)
const pageSize = ref(10)
const total = ref(120)
const q = ref({ agentId: '', dateRange: [] as [Date, Date] | [] })

const rows = computed(() => [
  { agentId: 'AG1001', agentName: '华东 A 组', depositUsdt: '820,000', withdrawUsdt: '610,000', netUsdt: '210,000' },
  { agentId: 'AG1002', agentName: '海外 B 组', depositUsdt: '1,020,000', withdrawUsdt: '900,200', netUsdt: '119,800' },
])
</script>

<template>
  <div class="adm-rep">
    <header class="adm-rep__head">
      <h1 class="adm-rep__title">代理商充提报表</h1>
      <p class="adm-rep__desc">按代理商维度统计充值与提现（演示数据）。</p>
    </header>

    <AdmFilterBar>
      <el-form-item label="代理商">
        <el-input v-model="q.agentId" placeholder="ID / 名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="统计周期">
        <el-date-picker
          v-model="q.dateRange"
          type="daterange"
          unlink-panels
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 260px"
        />
      </el-form-item>
      <template #actions>
        <el-button type="primary">查询</el-button>
        <el-button>重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="代理商明细">
      <template #right>
        <el-button type="primary" plain>导出</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="rows" border stripe size="small" class="adm-rep__table">
      <el-table-column prop="agentId" label="代理商ID" width="120" />
      <el-table-column prop="agentName" label="名称" min-width="160" />
      <el-table-column prop="depositUsdt" label="充值(USDT)" min-width="130" />
      <el-table-column prop="withdrawUsdt" label="提现(USDT)" min-width="130" />
      <el-table-column prop="netUsdt" label="净额(USDT)" min-width="120" />
    </el-table>

    <AdmPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
  </div>
</template>

<style scoped lang="scss">
.adm-rep__head {
  margin-bottom: 14px;
}

.adm-rep__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.adm-rep__desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.adm-rep__table {
  border-radius: 8px;
}
</style>
