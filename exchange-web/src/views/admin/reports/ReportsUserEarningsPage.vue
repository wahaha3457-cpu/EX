<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'

const page = ref(1)
const pageSize = ref(10)
const total = ref(500)
const q = ref({ uid: '', dateRange: [] as [Date, Date] | [] })

const rows = computed(() => [
  { uid: '1000231', spotRebate: '120.50', contractRebate: '88.20', c2cRebate: '12.00', total: '220.70' },
  { uid: '1000188', spotRebate: '40.00', contractRebate: '0.00', c2cRebate: '6.30', total: '46.30' },
])
</script>

<template>
  <div class="adm-rep">
    <header class="adm-rep__head">
      <h1 class="adm-rep__title">用户收益报表</h1>
      <p class="adm-rep__desc">汇总用户返佣/收益类数据（演示数据，可按业务拆列）。</p>
    </header>

    <AdmFilterBar>
      <el-form-item label="UID">
        <el-input v-model="q.uid" placeholder="用户 UID" clearable style="width: 180px" />
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

    <AdmTableToolbar title="用户收益明细">
      <template #right>
        <el-button type="primary" plain>导出</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="rows" border stripe size="small" class="adm-rep__table">
      <el-table-column prop="uid" label="UID" width="120" />
      <el-table-column prop="spotRebate" label="现货返佣(USDT)" min-width="130" />
      <el-table-column prop="contractRebate" label="合约返佣(USDT)" min-width="140" />
      <el-table-column prop="c2cRebate" label="C2C返佣(USDT)" min-width="130" />
      <el-table-column prop="total" label="合计(USDT)" min-width="120" />
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
