<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminTodaySparkline from '@/components/admin/dashboard/AdminTodaySparkline.vue'
import { buildTodaySparkline } from '@/utils/adminSparkline'
import { useRouter } from 'vue-router'
import {
  Coin,
  Cpu,
  Download,
  Money,
  Search,
  Star,
  StarFilled,
  Upload,
  UserFilled,
  Warning,
} from '@element-plus/icons-vue'
import AdminQuickQueryModal from '@/components/admin/quick/AdminQuickQueryModal.vue'
import DashboardBeijingClock from '@/components/admin/dashboard/DashboardBeijingClock.vue'
import { fetchAdminDashboard } from '@/api/admin/dashboard'
import type { AdminDashboardPayload } from '@/types/admin'
import { RouteNames } from '@/constants/routeNames'

const router = useRouter()
const loading = ref(true)
const data = ref<AdminDashboardPayload | null>(null)
const quickQueryModalOpen = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await fetchAdminDashboard()
  } finally {
    loading.value = false
  }
})

const pendingTotal = computed(() => {
  const p = data.value?.pendingReminders
  if (!p) return 0
  return p.depositOrders + p.withdrawOrders + p.kycBasic + p.kycAdvanced
})

/** 与今日快照绑定种子的装饰性趋势折线（接口无序列时由数值确定性生成） */
const todaySparks = computed(() => {
  if (!data.value) return null
  const t = data.value.todayStats
  return {
    balance: buildTodaySparkline('usdtAccountBalance', t.usdtAccountBalance),
    deposit: buildTodaySparkline('depositAmountToday', t.depositAmountToday),
    withdraw: buildTodaySparkline('withdrawAmountToday', t.withdrawAmountToday),
    earn: buildTodaySparkline('earningsToday', t.earningsToday),
    users: buildTodaySparkline(
      'usersActivity',
      t.newUsersToday * 1_000_000 + t.depositUsersToday * 10_000 + t.totalUsers * 0.01,
    ),
  }
})

function formatVol(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`
  if (n >= 1e4) return `${(n / 1e4).toFixed(2)} 万`
  return n.toLocaleString('zh-CN')
}

/** 大数字：余额保留足够小数，其它千分位 */
function formatBalance(n: number) {
  const s = n.toLocaleString('zh-CN', { maximumFractionDigits: 10 })
  return s
}

function formatSigned(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function goAnnouncements() {
  void router.push({ name: RouteNames.AdminAnnouncements })
}

function goAssets() {
  void router.push({ name: RouteNames.AdminAssets })
}

function goDeposits() {
  void router.push({ name: RouteNames.AdminFinanceDeposits })
}

function goWithdrawals() {
  void router.push({ name: RouteNames.AdminFinanceWithdrawals })
}

function goKycBasic() {
  void router.push({ name: RouteNames.AdminUserKycBasic })
}

function goKycAdvanced() {
  void router.push({ name: RouteNames.AdminUserKycAdvanced })
}
</script>

<template>
  <div class="adm-dash adm-dash--ai" v-loading="loading">
    <div class="adm-dash__hero adm-dash__hero--ai">
      <div class="adm-dash__hero-bg" aria-hidden="true">
        <div class="adm-dash__hero-glow" />
        <div class="adm-dash__hero-mesh" />
        <div class="adm-dash__hero-scan" />
      </div>
      <div class="adm-dash__hero-inner adm-dash__hero-layout">
        <div class="adm-dash__hero-main">
          <div class="adm-dash__ai-badge">
            <span class="adm-dash__ai-badge-ic"><el-icon><Cpu /></el-icon></span>
            <span class="adm-dash__ai-badge-txt">智能运营中枢</span>
            <span class="adm-dash__ai-pulse" />
          </div>
          <p class="adm-dash__eyebrow">运营概览</p>
          <h1 class="adm-dash__h1 adm-dash__h1--gradient">仪表盘</h1>
          <div class="adm-dash__segline adm-dash__segline--hero" aria-hidden="true">
            <span v-for="i in 5" :key="i" class="adm-dash__seg" :style="{ animationDelay: `${i * 0.1}s` }" />
          </div>
          <p class="adm-dash__sub">
            <span class="adm-dash__sub-main">数据快照与待办聚合 · AI 风格可视化</span>
            <code class="adm-dash__code">GET /v1/admin/dashboard/summary</code>
          </p>
        </div>
        <aside class="adm-dash__hero-aside">
          <button
            type="button"
            class="adm-dash__hud-search"
            aria-label="打开综合查询"
            title="综合查询"
            @click="quickQueryModalOpen = true"
          >
            <span class="adm-dash__hud-search-ring" aria-hidden="true" />
            <el-icon class="adm-dash__hud-search-ic"><Search /></el-icon>
          </button>
          <DashboardBeijingClock class="adm-dash__clock" />
        </aside>
      </div>
    </div>

    <AdminQuickQueryModal v-model="quickQueryModalOpen" />

    <template v-if="data">
      <!-- 今日数据统计 -->
      <section class="adm-dash__section">
        <div class="adm-dash__section-head">
          <div class="adm-dash__section-head-text">
            <h2 class="adm-dash__section-title">今日数据统计</h2>
            <div class="adm-dash__segline" aria-hidden="true">
              <span v-for="i in 5" :key="i" class="adm-dash__seg" :style="{ animationDelay: `${i * 0.08}s` }" />
            </div>
          </div>
          <span class="adm-dash__section-hint">00:00 – 24:00</span>
        </div>
        <el-row :gutter="14" class="adm-dash__today-row">
          <el-col :xs="24" :sm="12" :lg="8">
            <div class="adm-today-card adm-today-card--ai adm-today-card--balance">
              <div class="adm-today-card__head">
                <div class="adm-today-card__head-left">
                  <span class="adm-today-card__coin">₮</span>
                  <span class="adm-today-card__label">USDT账户余额</span>
                </div>
                <span class="adm-today-card__today">今日</span>
              </div>
              <p class="adm-today-card__value">
                {{ formatBalance(data.todayStats.usdtAccountBalance) }}
              </p>
              <div v-if="todaySparks" class="adm-today-card__spark">
                <AdminTodaySparkline :points="todaySparks.balance" tone="balance" />
              </div>
              <div class="adm-today-card__foot">
                <span>总账户金额:</span>
                <span>{{ formatBalance(data.todayStats.totalAccountAmount) }}</span>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="8">
            <div class="adm-today-card adm-today-card--ai adm-today-card--deposit">
              <div class="adm-today-card__head">
                <div class="adm-today-card__head-left">
                  <el-icon class="adm-today-card__ic"><Money /></el-icon>
                  <span class="adm-today-card__label">充值金额</span>
                </div>
                <span class="adm-today-card__today">今日</span>
              </div>
              <p class="adm-today-card__value">
                {{ data.todayStats.depositAmountToday.toLocaleString('zh-CN') }}
              </p>
              <div v-if="todaySparks" class="adm-today-card__spark">
                <AdminTodaySparkline :points="todaySparks.deposit" tone="deposit" />
              </div>
              <div class="adm-today-card__foot adm-today-card__foot--empty" />
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="8">
            <div class="adm-today-card adm-today-card--ai adm-today-card--withdraw">
              <div class="adm-today-card__head">
                <div class="adm-today-card__head-left">
                  <el-icon class="adm-today-card__ic"><Money /></el-icon>
                  <span class="adm-today-card__label">提现金额</span>
                </div>
                <span class="adm-today-card__today">今日</span>
              </div>
              <p class="adm-today-card__value">
                {{ data.todayStats.withdrawAmountToday.toLocaleString('zh-CN') }}
              </p>
              <div v-if="todaySparks" class="adm-today-card__spark">
                <AdminTodaySparkline :points="todaySparks.withdraw" tone="withdraw" />
              </div>
              <div class="adm-today-card__foot adm-today-card__foot--empty" />
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="14" class="adm-dash__today-row adm-dash__today-row--2">
          <el-col :xs="24" :sm="12" :lg="12">
            <div class="adm-today-card adm-today-card--ai adm-today-card--earn">
              <div class="adm-today-card__head">
                <div class="adm-today-card__head-left">
                  <el-icon class="adm-today-card__ic"><Coin /></el-icon>
                  <span class="adm-today-card__label">收益</span>
                </div>
                <span class="adm-today-card__today">今日</span>
              </div>
              <p
                class="adm-today-card__value"
                :class="{ 'adm-today-card__value--neg': data.todayStats.earningsToday < 0 }"
              >
                {{ formatSigned(data.todayStats.earningsToday) }}
              </p>
              <div v-if="todaySparks" class="adm-today-card__spark">
                <AdminTodaySparkline :points="todaySparks.earn" tone="earn" />
              </div>
              <div class="adm-today-card__foot adm-today-card__foot--empty" />
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="12">
            <div class="adm-today-card adm-today-card--ai adm-today-card--users">
              <div class="adm-today-card__head adm-today-card__head--split">
                <div class="adm-today-card__split-item">
                  <el-icon class="adm-today-card__ic"><UserFilled /></el-icon>
                  <span class="adm-today-card__label">新增用户</span>
                </div>
                <div class="adm-today-card__split-item">
                  <el-icon class="adm-today-card__ic"><UserFilled /></el-icon>
                  <span class="adm-today-card__label">今日充值人数</span>
                </div>
              </div>
              <div class="adm-today-card__dual">
                <span>{{ data.todayStats.newUsersToday.toLocaleString('zh-CN') }}</span>
                <span>{{ data.todayStats.depositUsersToday.toLocaleString('zh-CN') }}</span>
              </div>
              <div v-if="todaySparks" class="adm-today-card__spark">
                <AdminTodaySparkline :points="todaySparks.users" tone="users" />
              </div>
              <div class="adm-today-card__foot">
                <span>总用户数:</span>
                <span>{{ data.todayStats.totalUsers.toLocaleString('zh-CN') }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </section>

      <!-- 待处理提醒 -->
      <section class="adm-pending adm-pending--ai">
        <div class="adm-pending__bg" aria-hidden="true">
          <div class="adm-pending__glow" />
          <div class="adm-pending__mesh" />
        </div>
        <div class="adm-pending__head">
          <div class="adm-pending__head-left">
            <h2 class="adm-pending__title">待处理提醒</h2>
            <div class="adm-dash__segline adm-dash__segline--compact" aria-hidden="true">
              <span v-for="i in 5" :key="i" class="adm-dash__seg" />
            </div>
          </div>
          <span class="adm-pending__badge">{{ pendingTotal }}</span>
        </div>
        <div class="adm-pending__divider" />
        <div class="adm-pending__grid">
          <button type="button" class="adm-pending__item" @click="goDeposits">
            <div class="adm-pending__icon-wrap">
              <el-icon class="adm-pending__icon"><Download /></el-icon>
            </div>
            <span class="adm-pending__txt">充值订单</span>
            <span class="adm-pending__num">{{ data.pendingReminders.depositOrders }}</span>
          </button>
          <button type="button" class="adm-pending__item" @click="goWithdrawals">
            <div class="adm-pending__icon-wrap">
              <el-icon class="adm-pending__icon"><Upload /></el-icon>
            </div>
            <span class="adm-pending__txt">提现订单</span>
            <span class="adm-pending__num">{{ data.pendingReminders.withdrawOrders }}</span>
          </button>
          <button type="button" class="adm-pending__item" @click="goKycBasic">
            <div class="adm-pending__icon-wrap">
              <el-icon class="adm-pending__icon"><Star /></el-icon>
            </div>
            <span class="adm-pending__txt">用户基础认证</span>
            <span class="adm-pending__num">{{ data.pendingReminders.kycBasic }}</span>
          </button>
          <button type="button" class="adm-pending__item" @click="goKycAdvanced">
            <div class="adm-pending__icon-wrap">
              <el-icon class="adm-pending__icon"><StarFilled /></el-icon>
            </div>
            <span class="adm-pending__txt">用户高级认证</span>
            <span class="adm-pending__num">{{ data.pendingReminders.kycAdvanced }}</span>
          </button>
        </div>
      </section>

      <!-- 其它 -->
      <el-row :gutter="14" class="adm-dash__row2">
        <el-col :xs="24" :lg="14">
          <el-card shadow="never" class="adm-card adm-card--ai">
            <template #header>
              <div class="adm-card__head">
                <span>平台公告</span>
                <el-button type="primary" link @click="goAnnouncements">管理公告</el-button>
              </div>
            </template>
            <el-table :data="data.announcements" size="small" stripe>
              <el-table-column prop="title" label="标题" min-width="200" />
              <el-table-column prop="updatedAt" label="更新时间" width="180">
                <template #default="{ row }">
                  {{ new Date(row.updatedAt).toLocaleString('zh-CN') }}
                </template>
              </el-table-column>
              <el-table-column label="置顶" width="80" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.pinned" type="warning" size="small" effect="dark">置顶</el-tag>
                  <span v-else>—</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="10">
          <el-card shadow="never" class="adm-card adm-card--ai adm-card--risk">
            <template #header>
              <div class="adm-card__head">
                <el-icon class="adm-card__icon"><Warning /></el-icon>
                <span>其它指标</span>
              </div>
            </template>
            <ul class="adm-mini-stats">
              <li>
                <span class="adm-mini-stats__k">用户总数</span>
                <span class="adm-mini-stats__v">{{ data.stats.totalUsers.toLocaleString('zh-CN') }}</span>
              </li>
              <li>
                <span class="adm-mini-stats__k">活跃交易对</span>
                <span class="adm-mini-stats__v">{{ data.stats.activeSymbols }}</span>
              </li>
              <li>
                <span class="adm-mini-stats__k">今日订单量</span>
                <span class="adm-mini-stats__v">{{ data.stats.ordersToday.toLocaleString('zh-CN') }}</span>
              </li>
              <li>
                <span class="adm-mini-stats__k">今日成交额 (USDT)</span>
                <span class="adm-mini-stats__v">{{ formatVol(data.stats.quoteVolumeTodayUsdt) }}</span>
              </li>
              <li class="adm-mini-stats__li--click" @click="goAssets">
                <span class="adm-mini-stats__k">待审核提现</span>
                <span class="adm-mini-stats__v adm-mini-stats__v--warn">{{ data.stats.pendingWithdrawals }}</span>
              </li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

/* ---------- AI 壳层 ---------- */
.adm-dash--ai {
  position: relative;
}

/* ---------- 页头 · 智能提醒同源：玻璃 / 网格 / 扫描 ---------- */
.adm-dash__hero {
  margin-bottom: 28px;
}

.adm-dash__hero--ai {
  position: relative;
  padding: 22px 22px 24px;
  margin: -4px -8px 28px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #a78bfa 35%, rgba(255, 255, 255, 0.08));
  background: linear-gradient(
    145deg,
    rgba(22, 27, 38, 0.88) 0%,
    rgba(26, 22, 42, 0.82) 45%,
    rgba(16, 30, 46, 0.9) 100%
  );
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 20px 56px rgba(0, 0, 0, 0.42),
    0 0 80px color-mix(in srgb, #7c3aed 14%, transparent);
  backdrop-filter: blur(16px);
}

.adm-dash__hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.adm-dash__hero-glow {
  position: absolute;
  inset: -45% -15% auto -25%;
  height: 130%;
  background: radial-gradient(
    ellipse 70% 55% at 28% 18%,
    color-mix(in srgb, #a78bfa 38%, transparent),
    transparent 58%
  );
  opacity: 0.9;
}

.adm-dash__hero-mesh {
  position: absolute;
  inset: 0;
  opacity: 0.11;
  background-image:
    linear-gradient(90deg, rgba(167, 139, 250, 0.45) 1px, transparent 1px),
    linear-gradient(rgba(167, 139, 250, 0.28) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 85% 65% at 50% 25%, black 15%, transparent 72%);
}

.adm-dash__hero-scan {
  position: absolute;
  left: 0;
  right: 0;
  top: -80%;
  height: 55%;
  background: linear-gradient(
    180deg,
    transparent,
    color-mix(in srgb, #22d3ee 14%, transparent),
    transparent
  );
  animation: adm-dash-scan 4s ease-in-out infinite;
  opacity: 0.5;
}

@keyframes adm-dash-scan {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.15;
  }
  50% {
    transform: translateY(190%);
    opacity: 0.42;
  }
}

.adm-dash__hero-inner {
  position: relative;
  z-index: 1;
}

.adm-dash__hero-layout {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px 24px;
  flex-wrap: wrap;
}

.adm-dash__hero-main {
  flex: 1 1 280px;
  min-width: 0;
}

.adm-dash__hero-aside {
  flex: 0 1 300px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  width: 100%;
  max-width: 320px;
}

@media (max-width: 900px) {
  .adm-dash__hero-aside {
    flex: 1 1 100%;
    max-width: none;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .adm-dash__hud-search {
    margin-left: auto;
  }

  .adm-dash__clock {
    flex: 1 1 240px;
    min-width: min(100%, 260px);
  }
}

/* HUD 可视化查找：放大镜 + 旋转能量环 */
.adm-dash__hud-search {
  position: relative;
  align-self: flex-end;
  width: 52px;
  height: 52px;
  margin: 0 0 0 auto;
  padding: 0;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  color: #e0e7ff;
  background: transparent;
  overflow: visible;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;

  &:hover {
    transform: scale(1.06);
    filter: brightness(1.08);
    box-shadow:
      0 12px 36px rgba(0, 0, 0, 0.45),
      0 0 48px color-mix(in srgb, #22d3ee 22%, transparent);
  }

  &:active {
    transform: scale(0.98);
  }
}

.adm-dash__hud-search-ring {
  position: absolute;
  inset: -3px;
  border-radius: 17px;
  background: conic-gradient(from 0deg, #a78bfa, #22d3ee, #6366f1, #a78bfa);
  opacity: 0.7;
  animation: adm-dash-hud-spin 6s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.adm-dash__hud-search::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 11px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, #312e81 75%, rgba(0, 0, 0, 0.5)),
    color-mix(in srgb, #0f172a 90%, rgba(0, 0, 0, 0.6))
  );
  border: 1px solid color-mix(in srgb, #a78bfa 25%, transparent);
  z-index: 1;
  pointer-events: none;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset;
}

@keyframes adm-dash-hud-spin {
  to {
    transform: rotate(360deg);
  }
}

.adm-dash__hud-search-ic {
  position: relative;
  z-index: 2;
  font-size: 24px;
  filter: drop-shadow(0 0 8px color-mix(in srgb, #fff 40%, transparent));
}

.adm-dash__clock {
  width: 100%;
}

.adm-dash__ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 5px 12px 5px 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e9d5ff;
  border: 1px solid color-mix(in srgb, #c4b5fd 42%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #7c3aed 52%, transparent),
    color-mix(in srgb, #0891b2 38%, transparent)
  );
  box-shadow: 0 0 24px color-mix(in srgb, #7c3aed 22%, transparent);
}

.adm-dash__ai-badge-ic {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.22);
  color: #f5f3ff;

  .el-icon {
    font-size: 15px;
  }
}

.adm-dash__ai-badge-txt {
  background: linear-gradient(92deg, #f5f3ff, #a5f3fc 50%, #e9d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.adm-dash__ai-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 12px #34d399;
  animation: adm-dash-pulse 1.8s ease-in-out infinite;
}

@keyframes adm-dash-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.78;
  }
}

.adm-dash__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, $adm-text-muted 88%, #a78bfa);
}

.adm-dash__h1 {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #f8fafc;
}

.adm-dash__h1--gradient {
  background: linear-gradient(110deg, #f8fafc 0%, #e9d5ff 35%, #a5f3fc 70%, #c4b5fd 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 40px color-mix(in srgb, #7c3aed 25%, transparent);
}

.adm-dash__segline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  max-width: 280px;
}

.adm-dash__segline--hero {
  margin-bottom: 16px;
  max-width: 320px;
}

.adm-dash__segline--compact {
  margin: 8px 0 0;
  max-width: 200px;
}

.adm-dash__seg {
  flex: 1;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4, #a78bfa);
  opacity: 0.4;
  animation: adm-dash-seg 2.4s ease-in-out infinite;
}

@keyframes adm-dash-seg {
  0%,
  100% {
    opacity: 0.28;
    filter: brightness(0.95);
  }
  50% {
    opacity: 0.88;
    filter: brightness(1.12);
  }
}

.adm-dash__sub {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  font-size: 13px;
  line-height: 1.55;
  color: $adm-text-muted;
}

.adm-dash__sub-main {
  color: color-mix(in srgb, #e2e8f0 55%, $adm-text-muted);
}

.adm-dash__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid color-mix(in srgb, #22d3ee 25%, rgba(255, 255, 255, 0.1));
  color: color-mix(in srgb, $adm-text-muted 70%, #a5f3fc);
  box-shadow: 0 0 20px color-mix(in srgb, #0891b2 12%, transparent);
}

.adm-dash__section {
  margin-bottom: 28px;
}

.adm-dash__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 18px;
}

.adm-dash__section-head-text {
  min-width: 0;
}

.adm-dash__section-title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f1f5f9;
  text-shadow: 0 0 24px color-mix(in srgb, #7c3aed 18%, transparent);
}

.adm-dash__section-hint {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, $adm-text-muted 90%, #a5f3fc);
  padding: 4px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, #7c3aed 12%, rgba(0, 0, 0, 0.2));
  border: 1px solid color-mix(in srgb, #a78bfa 28%, rgba(255, 255, 255, 0.06));
  box-shadow: 0 0 20px color-mix(in srgb, #7c3aed 10%, transparent);
}

.adm-dash__today-row {
  margin-bottom: 0;
}

.adm-dash__today-row--2 {
  margin-top: 16px;
}

/* ---------- 今日数据卡片：AI 玻璃 + 网格 + 左侧能量条 ---------- */
.adm-today-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 0;
  min-height: 172px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 45%,
    rgba(0, 0, 0, 0.12) 100%
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 18px 44px rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(12px);
}

.adm-today-card--ai {
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, #a78bfa 30%, rgba(255, 255, 255, 0.09));
  background: linear-gradient(
    155deg,
    rgba(32, 38, 52, 0.92) 0%,
    rgba(24, 28, 40, 0.88) 40%,
    rgba(18, 22, 34, 0.95) 100%
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 20px 50px rgba(0, 0, 0, 0.45),
    0 0 48px color-mix(in srgb, #7c3aed 12%, transparent);
  backdrop-filter: blur(14px);
  cursor: default;
  transition:
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.24s ease,
    border-color 0.24s ease,
    filter 0.22s ease;

  &:hover {
    transform: translateY(-4px) scale(1.012);
    border-color: color-mix(in srgb, #a78bfa 52%, rgba(255, 255, 255, 0.12));
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.08) inset,
      0 26px 58px rgba(0, 0, 0, 0.5),
      0 0 56px color-mix(in srgb, #7c3aed 28%, transparent),
      0 0 90px color-mix(in srgb, #22d3ee 10%, transparent);
    filter: brightness(1.05);
  }

  &:hover :deep(.adm-today-spark) {
    opacity: 0.9;
  }
}

.adm-today-card--ai::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  opacity: 0.09;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, rgba(167, 139, 250, 0.4) 1px, transparent 1px),
    linear-gradient(rgba(167, 139, 250, 0.25) 1px, transparent 1px);
  background-size: 18px 18px;
  mask-image: radial-gradient(ellipse 95% 80% at 50% 0%, black 8%, transparent 75%);
}

.adm-today-card--ai > * {
  position: relative;
  z-index: 2;
}

.adm-today-card::before {
  content: '';
  position: absolute;
  z-index: 1;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: 0 4px 4px 0;
  opacity: 0.95;
  pointer-events: none;
}

.adm-today-card--balance::before {
  background: linear-gradient(180deg, #fbcfe8, #e879a9);
}

.adm-today-card--deposit::before {
  background: linear-gradient(180deg, #93c5fd, #3b82f6);
}

.adm-today-card--withdraw::before {
  background: linear-gradient(180deg, #c4b5fd, #8b5cf6);
}

.adm-today-card--earn::before {
  background: linear-gradient(180deg, #5eead4, #14b8a6);
}

.adm-today-card--users::before {
  background: linear-gradient(180deg, #fcd34d, #f59e0b);
}

.adm-today-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
  padding-left: 20px;
  flex-shrink: 0;
}

.adm-today-card__head--split {
  justify-content: stretch;
  gap: 12px;
}

.adm-today-card__head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.adm-today-card__split-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.adm-today-card__coin {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  flex-shrink: 0;
}

.adm-today-card__ic {
  font-size: 18px;
  color: color-mix(in srgb, #cbd5e1 75%, #94a3b8);
}

.adm-today-card__label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.adm-today-card__today {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #64748b;
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.adm-today-card__value {
  flex: 1;
  margin: 0;
  padding: 6px 16px 14px;
  padding-left: 20px;
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  line-height: 1.3;
  color: #f8fafc;
  letter-spacing: -0.025em;
  word-break: break-all;
}

.adm-today-card__value--neg {
  color: #fda4af;
}

.adm-today-card__spark {
  flex-shrink: 0;
  margin: 2px 10px 0;
  padding: 0 6px;
  pointer-events: none;
  mask-image: linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%);
}

.adm-today-card__dual {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 12px;
  padding: 6px 16px 14px;
  padding-left: 20px;
  font-size: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  color: #f8fafc;
  letter-spacing: -0.025em;
}

.adm-today-card__dual > span {
  position: relative;
  flex: 1;
  text-align: center;
}

.adm-today-card__dual > span:first-child::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 60%;
  background: rgba(255, 255, 255, 0.1);
}

.adm-today-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding: 10px 16px;
  padding-left: 20px;
  font-size: 12px;
  font-weight: 600;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.14);
  color: rgba(255, 255, 255, 0.88);
}

.adm-today-card__foot--empty {
  min-height: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: transparent;
}

.adm-today-card--users .adm-today-card__label {
  font-size: 12px;
}

/* ---------- 待处理提醒 · AI 面板 ---------- */
.adm-pending {
  margin-bottom: 20px;
  padding: 14px 16px 16px;
  border-radius: 12px;
  border: 1px solid $adm-border;
  background: color-mix(in srgb, $adm-bg-card 70%, $adm-bg-well);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset;
}

.adm-pending--ai {
  position: relative;
  padding: 18px 18px 20px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #a78bfa 32%, rgba(255, 255, 255, 0.08));
  background: linear-gradient(
    160deg,
    rgba(26, 32, 44, 0.95) 0%,
    rgba(22, 26, 38, 0.92) 50%,
    rgba(18, 24, 36, 0.96) 100%
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 0 60px color-mix(in srgb, #7c3aed 10%, transparent);
  backdrop-filter: blur(12px);
}

.adm-pending__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.adm-pending__glow {
  position: absolute;
  inset: -30% 20% auto -20%;
  height: 90%;
  background: radial-gradient(
    ellipse 60% 50% at 70% 0%,
    color-mix(in srgb, #6366f1 22%, transparent),
    transparent 65%
  );
  opacity: 0.85;
}

.adm-pending__mesh {
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image:
    linear-gradient(90deg, rgba(167, 139, 250, 0.35) 1px, transparent 1px),
    linear-gradient(rgba(167, 139, 250, 0.2) 1px, transparent 1px);
  background-size: 20px 20px;
}

.adm-pending--ai > :not(.adm-pending__bg) {
  position: relative;
  z-index: 1;
}

.adm-pending__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.adm-pending__head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.adm-pending__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f8fafc;
  text-shadow: 0 0 20px color-mix(in srgb, #a78bfa 22%, transparent);
}

.adm-pending__badge {
  min-width: 30px;
  height: 26px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: var(--adm-count-badge-gradient);
  box-shadow: var(--adm-count-badge-shadow);
  flex-shrink: 0;
}

.adm-pending__divider {
  height: 1px;
  margin: 14px 0 16px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, #a78bfa 45%, transparent),
    color-mix(in srgb, #22d3ee 35%, transparent),
    transparent
  );
  opacity: 0.65;
}

.adm-pending__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .adm-pending__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .adm-pending__grid {
    grid-template-columns: 1fr;
  }
}

.adm-pending__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px 12px;
  margin: 0;
  border: 1px solid color-mix(in srgb, #6366f1 22%, #{$adm-border-subtle});
  border-radius: 14px;
  background: color-mix(in srgb, rgba(15, 23, 42, 0.65) 55%, $adm-bg-well);
  cursor: pointer;
  color: inherit;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.14s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, #a78bfa 55%, #{$adm-border});
    background: color-mix(in srgb, #7c3aed 14%, rgba(15, 23, 42, 0.75));
    box-shadow:
      0 0 0 1px color-mix(in srgb, #22d3ee 15%, transparent),
      0 12px 28px rgba(0, 0, 0, 0.35);
    transform: translateY(-2px);
  }
}

.adm-pending__icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, #7c3aed 35%, transparent),
    color-mix(in srgb, #0891b2 22%, transparent)
  );
  border: 1px solid color-mix(in srgb, #a78bfa 25%, transparent);
  box-shadow: 0 0 24px color-mix(in srgb, #7c3aed 15%, transparent);
}

.adm-pending__icon {
  font-size: 22px;
  color: #e0e7ff;
}

.adm-pending__txt {
  font-size: 13px;
  font-weight: 600;
  color: $adm-text;
  text-align: center;
}

.adm-pending__num {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 22px;
  min-height: 22px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background: var(--adm-count-badge-gradient);
  box-shadow: var(--adm-count-badge-shadow);
}

.adm-dash__row2 {
  margin-top: 4px;
}

.adm-card {
  border-radius: 10px;
  border: 1px solid $adm-border;
}

.adm-card--ai {
  border-radius: 18px !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #a78bfa 22%, #{$adm-border}) !important;
  background: linear-gradient(
    165deg,
    color-mix(in srgb, $adm-bg-card 88%, #1e1b2e) 0%,
    color-mix(in srgb, $adm-bg-well 90%, #0f172a) 100%
  ) !important;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 14px 40px rgba(0, 0, 0, 0.35),
    0 0 40px color-mix(in srgb, #7c3aed 8%, transparent) !important;
  backdrop-filter: blur(10px);
}

.adm-card--ai :deep(.el-card__header) {
  border-bottom: 1px solid color-mix(in srgb, #6366f1 18%, #{$adm-border-subtle}) !important;
  background: color-mix(in srgb, #7c3aed 6%, transparent);
  font-weight: 700;
  color: #f1f5f9;
}

.adm-card--ai :deep(.el-card__body) {
  background: transparent;
}

.adm-card--ai :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: color-mix(in srgb, #1e293b 80%, transparent);
}

.adm-card--ai :deep(.el-table th.el-table__cell) {
  background: color-mix(in srgb, #1e293b 75%, transparent) !important;
  color: color-mix(in srgb, $adm-text-muted 95%, #a5f3fc);
  font-weight: 600;
}

.adm-card--ai :deep(.el-table td.el-table__cell) {
  border-color: color-mix(in srgb, $adm-border-subtle 90%, #4c1d95);
}

.adm-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
}

.adm-card__icon {
  margin-right: 6px;
  vertical-align: middle;
  color: $adm-risk;
}

.adm-mini-stats {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.adm-mini-stats li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.adm-mini-stats__k {
  color: $adm-text-muted;
}

.adm-mini-stats__v {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  color: #e2e8f0;
}

.adm-mini-stats__v--warn {
  color: color-mix(in srgb, $adm-risk 90%, #fb923c);
}

.adm-mini-stats__li--click {
  cursor: pointer;
  padding: 6px 8px;
  margin: 0 -8px;
  border-radius: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

[data-theme='monochrome'] .adm-dash__section {
  padding: 18px 18px 20px;
  border: 1px solid #ced9e4;
  border-radius: 24px;
  background:
    linear-gradient(180deg, #f8fbfe 0%, #edf3f8 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.96) inset,
    0 18px 38px rgba(15, 23, 42, 0.06),
    0 4px 8px rgba(15, 23, 42, 0.02);
}

[data-theme='monochrome'] .adm-dash__today-row + .adm-dash__today-row {
  margin-top: 16px;
}

[data-theme='monochrome'] .adm-today-card {
  border: 1px solid #cad6e2;
  background:
    linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 18px 32px rgba(15, 23, 42, 0.075),
    0 5px 12px rgba(15, 23, 42, 0.035);
  backdrop-filter: none;
}

[data-theme='monochrome'] .adm-today-card--ai {
  border: 1px solid #cad6e2 !important;
  background:
    radial-gradient(circle at right top, rgba(37, 99, 235, 0.08), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f6faff 100%) !important;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 20px 36px rgba(15, 23, 42, 0.08),
    0 6px 14px rgba(15, 23, 42, 0.04) !important;
  filter: none !important;
}

[data-theme='monochrome'] .adm-today-card--ai:hover {
  transform: translateY(-3px) scale(1.008);
  border-color: #b8c9da !important;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 18px 34px rgba(15, 23, 42, 0.075),
    0 6px 12px rgba(37, 99, 235, 0.06) !important;
}

[data-theme='monochrome'] .adm-today-card--ai::after {
  opacity: 0.12;
  background-image:
    linear-gradient(90deg, rgba(148, 163, 184, 0.14) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.28), transparent 78%);
}

[data-theme='monochrome'] .adm-today-card__coin {
  border-color: #d7e1eb;
  background: linear-gradient(180deg, #ffffff 0%, #f3f7fb 100%);
  color: #334155;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 4px 10px rgba(15, 23, 42, 0.04);
}

[data-theme='monochrome'] .adm-today-card__ic {
  color: #64748b;
}

[data-theme='monochrome'] .adm-today-card__label {
  color: #64748b;
}

[data-theme='monochrome'] .adm-today-card__today {
  color: #334155;
  background: linear-gradient(180deg, #ffffff 0%, #f3f7fb 100%);
  border-color: #d7e1eb;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.98) inset;
}

[data-theme='monochrome'] .adm-today-card__value,
[data-theme='monochrome'] .adm-today-card__dual {
  color: #0f172a;
}

[data-theme='monochrome'] .adm-today-card__value--neg {
  color: #dc2626;
}

[data-theme='monochrome'] .adm-today-card__dual > span:first-child::after {
  background: #d9e2ec;
}

[data-theme='monochrome'] .adm-today-card__foot {
  border-top: 1px solid #e1e9f1;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.78), rgba(248, 250, 252, 0.96));
  color: #475569;
}

[data-theme='monochrome'] .adm-today-card__foot--empty {
  border-top-color: #e1e9f1;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.55), rgba(255, 255, 255, 0.9));
}

[data-theme='monochrome'] .adm-pending {
  border: 1px solid #ced9e4;
  background: linear-gradient(180deg, #f8fbfe 0%, #edf3f8 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 18px 36px rgba(15, 23, 42, 0.06),
    0 4px 8px rgba(15, 23, 42, 0.02);
}

[data-theme='monochrome'] .adm-pending--ai {
  border: 1px solid #ced9e4;
  background:
    radial-gradient(circle at right top, rgba(37, 99, 235, 0.08), transparent 30%),
    linear-gradient(180deg, #fbfdff 0%, #edf4fb 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 20px 38px rgba(15, 23, 42, 0.07),
    0 6px 12px rgba(15, 23, 42, 0.03);
  backdrop-filter: none;
}

[data-theme='monochrome'] .adm-pending__glow {
  background: radial-gradient(ellipse 60% 50% at 70% 0%, rgba(37, 99, 235, 0.08), transparent 65%);
}

[data-theme='monochrome'] .adm-pending__mesh {
  opacity: 0.06;
  background-image:
    linear-gradient(90deg, rgba(148, 163, 184, 0.24) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px);
}

[data-theme='monochrome'] .adm-pending__title {
  color: #0f172a;
  text-shadow: none;
}

[data-theme='monochrome'] .adm-pending__divider {
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.4), rgba(59, 130, 246, 0.22), transparent);
}

[data-theme='monochrome'] .adm-pending__item {
  border: 1px solid #cad6e2;
  border-radius: 18px;
  background:
    linear-gradient(180deg, #ffffff 0%, #f5f9fd 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 16px 28px rgba(15, 23, 42, 0.06),
    0 4px 8px rgba(15, 23, 42, 0.03);
}

[data-theme='monochrome'] .adm-pending__item:hover {
  border-color: #bfd0e1;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.05), transparent 36%),
    linear-gradient(180deg, #ffffff 0%, #f5f9fd 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 16px 30px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(37, 99, 235, 0.06);
}

[data-theme='monochrome'] .adm-pending__icon-wrap {
  background: linear-gradient(180deg, #ffffff 0%, #edf4fb 100%);
  border-color: #d6e0ea;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 8px 16px rgba(15, 23, 42, 0.05);
}

[data-theme='monochrome'] .adm-pending__icon {
  color: #2563eb;
}

[data-theme='monochrome'] .adm-pending__txt {
  color: #1e293b;
}

[data-theme='monochrome'] .adm-card {
  border: 1px solid #cad6e2;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f9fd 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 20px 38px rgba(15, 23, 42, 0.07),
    0 5px 10px rgba(15, 23, 42, 0.03);
}

[data-theme='monochrome'] .adm-card--ai {
  border: 1px solid #cad6e2 !important;
  background:
    radial-gradient(circle at right top, rgba(37, 99, 235, 0.08), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f2f7fc 100%) !important;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.98) inset,
    0 22px 40px rgba(15, 23, 42, 0.075),
    0 6px 12px rgba(15, 23, 42, 0.03) !important;
  backdrop-filter: none;
}

[data-theme='monochrome'] .adm-card--ai :deep(.el-card__header) {
  border-bottom: 1px solid #e1e9f1 !important;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%);
  color: #0f172a;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.98) inset;
}

[data-theme='monochrome'] .adm-card--ai :deep(.el-card__body) {
  background: transparent;
}

[data-theme='monochrome'] .adm-card--ai :deep(.el-table) {
  --el-table-bg-color: rgba(255, 255, 255, 0.78);
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.78);
  --el-table-header-bg-color: #eef4f9;
}

[data-theme='monochrome'] .adm-card--ai :deep(.el-table th.el-table__cell) {
  background: #eef4f9 !important;
  color: #52657d;
  font-weight: 700;
}

[data-theme='monochrome'] .adm-card--ai :deep(.el-table td.el-table__cell) {
  border-color: #dde6ef;
}

[data-theme='monochrome'] .adm-mini-stats__k {
  color: #64748b;
}

[data-theme='monochrome'] .adm-mini-stats__v {
  color: #0f172a;
}

[data-theme='monochrome'] .adm-mini-stats__li--click:hover {
  background: rgba(37, 99, 235, 0.08);
}
</style>
