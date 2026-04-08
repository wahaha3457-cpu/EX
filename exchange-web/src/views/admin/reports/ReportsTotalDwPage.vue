<script setup lang="ts">
import { computed, ref } from 'vue'
import AdmFilterBar from '@/components/admin/common/AdmFilterBar.vue'
import AdmTableToolbar from '@/components/admin/common/AdmTableToolbar.vue'
import AdmPagination from '@/components/admin/common/AdmPagination.vue'

const page = ref(1)
const pageSize = ref(10)
const total = ref(48)
const dateRange = ref<[Date, Date] | []>([])

const rows = computed(() => [
  { day: '2026-03-31', depositUsdt: '12,840,200', withdrawUsdt: '9,102,330', netUsdt: '3,737,870', txIn: 18203, txOut: 14091 },
  { day: '2026-03-30', depositUsdt: '11,200,100', withdrawUsdt: '8,900,050', netUsdt: '2,300,050', txIn: 17002, txOut: 13200 },
])
</script>

<template>
  <div class="adm-rep">
    <header class="adm-rep__head">
      <h1 class="adm-rep__title">总充提报表</h1>
      <p class="adm-rep__desc">按日汇总全平台充值与提现规模（演示数据，对接后走报表 API）。</p>
    </header>

    <AdmFilterBar>
      <el-form-item label="统计周期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          unlink-panels
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item label="资产">
        <el-select placeholder="USDT（默认）" style="width: 140px" disabled />
      </el-form-item>
      <template #actions>
        <el-button type="primary">查询</el-button>
        <el-button>重置</el-button>
      </template>
    </AdmFilterBar>

    <AdmTableToolbar title="汇总明细">
      <template #right>
        <el-button type="primary" plain>导出</el-button>
      </template>
    </AdmTableToolbar>

    <el-table :data="rows" border stripe size="small" class="adm-rep__table">
      <el-table-column prop="day" label="日期" width="120" />
      <el-table-column prop="depositUsdt" label="充值(USDT)" min-width="140" />
      <el-table-column prop="withdrawUsdt" label="提现(USDT)" min-width="140" />
      <el-table-column prop="netUsdt" label="净额(USDT)" min-width="130" />
      <el-table-column prop="txIn" label="充值笔数" width="110" align="right" />
      <el-table-column prop="txOut" label="提现笔数" width="110" align="right" />
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
