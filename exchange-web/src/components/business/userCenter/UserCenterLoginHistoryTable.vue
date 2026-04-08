<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserCenterStore } from '@/stores/userCenter'

const store = useUserCenterStore()
const { loginRecords } = storeToRefs(store)

function timeCell(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="uc-login">
    <header class="uc-login__head">
      <h2 class="uc-login__title">登录记录</h2>
      <p class="uc-login__lead">最近账户登录活动。地点信息依赖 GeoIP 服务（预留）。</p>
    </header>

    <div class="uc-login__wrap">
      <table class="uc-login__table">
        <thead>
          <tr>
            <th>时间</th>
            <th>IP 地址</th>
            <th>设备</th>
            <th>地点</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loginRecords.length">
            <tr v-for="r in loginRecords" :key="r.id">
              <td class="uc-login__muted">{{ timeCell(r.time) }}</td>
              <td class="uc-login__mono">{{ r.ip }}</td>
              <td>{{ r.device }}</td>
              <td class="uc-login__loc">{{ r.location ?? '—（预留）' }}</td>
              <td>
                <span :class="r.success ? 'uc-login__ok' : 'uc-login__fail'">
                  {{ r.success ? '成功' : '失败' }}
                </span>
              </td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="5" class="uc-login__empty">暂无记录 · GET /v1/users/login-logs</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.uc-login__head {
  margin-bottom: $space-4;
}

.uc-login__title {
  margin: 0 0 $space-1;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.uc-login__lead {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.uc-login__wrap {
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-bg-elevated;
}

.uc-login__table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.uc-login__table th {
  position: sticky;
  top: 0;
  padding: $space-3 $space-4;
  text-align: left;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: $color-bg-surface;
  border-bottom: 1px solid $color-border;
  white-space: nowrap;
}

.uc-login__table td {
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--ex-border-subtle);
  vertical-align: middle;
}

.uc-login__table tbody tr:hover td {
  background: var(--ex-fill-ghost);
}

.uc-login__muted {
  color: $color-text-tertiary;
  white-space: nowrap;
}

.uc-login__mono {
  font-family: $font-family-mono;
  font-size: 11px;
}

.uc-login__loc {
  font-size: 11px;
  color: $color-text-secondary;
}

.uc-login__ok {
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.uc-login__fail {
  color: $color-fall;
  font-weight: $font-weight-semibold;
}

.uc-login__empty {
  text-align: center;
  padding: $space-6 !important;
  color: $color-text-tertiary;
}
</style>
