<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Close, Right, Cpu } from '@element-plus/icons-vue'
import { useAdminReviewAlertStore } from '@/stores/adminReviewAlert'
import { RouteNames } from '@/constants/routeNames'

const { t } = useI18n()
const router = useRouter()
const store = useAdminReviewAlertStore()
const { visible, payload } = storeToRefs(store)

const DEFAULT_ROUTE = RouteNames.AdminFinanceWithdrawals

function titleText() {
  return payload.value?.title ?? (t('admin.reviewAlert.title') as string)
}

function subtitleText() {
  return payload.value?.subtitle ?? (t('admin.reviewAlert.subtitleDefault') as string)
}

function goReview() {
  const name = payload.value?.routeName ?? DEFAULT_ROUTE
  const q = payload.value?.query
  store.dismiss()
  void router.push(q ? { name, query: q } : { name })
}

let demoTimer: number | undefined

onMounted(() => {
  // 开发环境首次进入后台时演示一次（可对接 WebSocket 后删除或改为仅 DEV）
  if (import.meta.env.DEV) {
    const key = 'adm-review-alert-demo-once'
    if (!sessionStorage.getItem(key)) {
      demoTimer = window.setTimeout(() => {
        sessionStorage.setItem(key, '1')
        store.show({
          subtitle: t('admin.reviewAlert.demoSubtitle') as string,
          routeName: DEFAULT_ROUTE,
        })
      }, 14000)
    }
  }
})

onUnmounted(() => {
  if (demoTimer != null) window.clearTimeout(demoTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="adm-review-pop">
      <div
        v-show="visible && payload"
        class="adm-review-alert"
        role="status"
        aria-live="polite"
      >
        <div class="adm-review-alert__glow" aria-hidden="true" />
        <div class="adm-review-alert__mesh" aria-hidden="true" />
        <div class="adm-review-alert__scan" aria-hidden="true" />

        <header class="adm-review-alert__head">
          <div class="adm-review-alert__badge">
            <span class="adm-review-alert__badge-ic" aria-hidden="true">
              <el-icon><Cpu /></el-icon>
            </span>
            <span class="adm-review-alert__badge-txt">{{ t('admin.reviewAlert.badge') }}</span>
            <span class="adm-review-alert__pulse" />
          </div>
          <button
            type="button"
            class="adm-review-alert__close"
            :aria-label="t('admin.reviewAlert.dismiss')"
            @click="store.dismiss()"
          >
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <h3 class="adm-review-alert__title">{{ titleText() }}</h3>
        <p class="adm-review-alert__sub">{{ subtitleText() }}</p>

        <div class="adm-review-alert__nodes" aria-hidden="true">
          <span v-for="n in 5" :key="n" class="adm-review-alert__node" :style="{ animationDelay: `${n * 0.12}s` }" />
        </div>

        <footer class="adm-review-alert__foot">
          <el-button class="adm-review-alert__cta" type="primary" @click="goReview">
            {{ t('admin.reviewAlert.cta') }}
            <el-icon class="el-icon--right"><Right /></el-icon>
          </el-button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/admin/_tokens.scss' as *;

.adm-review-alert {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 5100;
  width: min(380px, calc(100vw - 32px));
  padding: 16px 16px 14px;
  border-radius: 16px;
  color: $adm-text;
  background: linear-gradient(
    145deg,
    rgba(22, 27, 38, 0.96) 0%,
    rgba(28, 24, 42, 0.94) 48%,
    rgba(18, 32, 48, 0.96) 100%
  );
  border: 1px solid color-mix(in srgb, #a78bfa 42%, transparent);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 12px 40px rgba(0, 0, 0, 0.45),
    0 0 60px color-mix(in srgb, #7c3aed 18%, transparent),
    0 0 100px color-mix(in srgb, #06b6d4 10%, transparent);
  overflow: hidden;
  backdrop-filter: blur(14px);
}

.adm-review-alert__glow {
  position: absolute;
  inset: -40% -20% auto -30%;
  height: 120%;
  background: radial-gradient(
    ellipse at 30% 20%,
    color-mix(in srgb, #a78bfa 35%, transparent),
    transparent 55%
  );
  pointer-events: none;
  opacity: 0.85;
}

.adm-review-alert__mesh {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image:
    linear-gradient(90deg, rgba(167, 139, 250, 0.5) 1px, transparent 1px),
    linear-gradient(rgba(167, 139, 250, 0.35) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 75%);
}

.adm-review-alert__scan {
  position: absolute;
  left: 0;
  right: 0;
  top: -100%;
  height: 40%;
  background: linear-gradient(
    180deg,
    transparent,
    color-mix(in srgb, #22d3ee 12%, transparent),
    transparent
  );
  animation: adm-review-scan 3.2s ease-in-out infinite;
  pointer-events: none;
  opacity: 0.55;
}

@keyframes adm-review-scan {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.2;
  }
  50% {
    transform: translateY(220%);
    opacity: 0.45;
  }
}

.adm-review-alert__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.adm-review-alert__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #e9d5ff;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #7c3aed 55%, transparent),
    color-mix(in srgb, #0891b2 40%, transparent)
  );
  border: 1px solid color-mix(in srgb, #c4b5fd 45%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, #7c3aed 25%, transparent);
}

.adm-review-alert__badge-ic {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  color: #f5f3ff;

  .el-icon {
    font-size: 14px;
  }
}

.adm-review-alert__badge-txt {
  background: linear-gradient(90deg, #f5f3ff, #a5f3fc 55%, #e9d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.adm-review-alert__pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px #34d399;
  animation: adm-review-pulse 1.6s ease-in-out infinite;
}

@keyframes adm-review-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.75;
  }
}

.adm-review-alert__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: $adm-text-muted;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $adm-text;
  }
}

.adm-review-alert__title {
  position: relative;
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.35;
  text-shadow: 0 1px 12px rgba(124, 58, 237, 0.35);
}

.adm-review-alert__sub {
  position: relative;
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
  color: $adm-text-muted;
}

.adm-review-alert__nodes {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 0 4px;
}

.adm-review-alert__node {
  flex: 1;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c3aed, #06b6d4, #a78bfa);
  opacity: 0.35;
  animation: adm-review-node 2s ease-in-out infinite;
}

@keyframes adm-review-node {
  0%,
  100% {
    opacity: 0.25;
    filter: brightness(0.9);
  }
  50% {
    opacity: 0.85;
    filter: brightness(1.15);
  }
}

.adm-review-alert__foot {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.adm-review-alert__cta {
  border-radius: 10px !important;
  font-weight: 700 !important;
  padding: 10px 18px !important;
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 55%, #0891b2 100%) !important;
  border: none !important;
  box-shadow:
    0 2px 12px color-mix(in srgb, #7c3aed 45%, transparent),
    0 1px 0 rgba(255, 255, 255, 0.12) inset !important;
}

.adm-review-pop-enter-active,
.adm-review-pop-leave-active {
  transition:
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.35s ease;
}

.adm-review-pop-enter-from,
.adm-review-pop-leave-to {
  opacity: 0;
  transform: translate(12px, 16px) scale(0.96);
}
</style>
