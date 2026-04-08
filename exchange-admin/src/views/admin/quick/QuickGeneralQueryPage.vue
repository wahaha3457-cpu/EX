<script setup lang="ts">
/**
 * 综合查询（独立页面）：顶部营销 Hero + 与弹窗共用的 AdminQuickQueryPanel。
 */
import AdminQuickQueryPanel from '@/components/admin/quick/AdminQuickQueryPanel.vue'
</script>

<template>
  <div class="adm-quick-query">
    <header class="adm-quick-query__hero">
      <div class="adm-quick-query__hero-inner">
        <div class="adm-quick-query__badge">常用 · 快捷</div>
        <h1 class="adm-quick-query__h1">综合查询</h1>
        <p class="adm-quick-query__sub">
          一站式检索用户、订单与资金流水；对接后可接统一检索服务
          <code class="adm-quick-query__code">POST /v1/admin/search</code>
        </p>
      </div>
      <div class="adm-quick-query__glow" aria-hidden="true" />
    </header>

    <AdminQuickQueryPanel />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/admin/tokens' as *;

.adm-quick-query__hero {
  position: relative;
  margin: -8px -12px 18px;
  padding: 22px 20px 20px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, #a78bfa 38%, #{$adm-border});
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #7c3aed 22%, #{$adm-bg-well}) 0%,
    color-mix(in srgb, #2563eb 12%, #{$adm-bg-well}) 45%,
    $adm-bg-well 100%
  );
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 18px 40px rgba(0, 0, 0, 0.35);
}

.adm-quick-query__glow {
  position: absolute;
  inset: -40% -20% auto auto;
  width: 60%;
  height: 120%;
  background: radial-gradient(circle, color-mix(in srgb, #a78bfa 35%, transparent), transparent 65%);
  pointer-events: none;
  opacity: 0.55;
}

.adm-quick-query__hero-inner {
  position: relative;
  z-index: 1;
}

.adm-quick-query__badge {
  display: inline-block;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #e9d5ff;
  background: color-mix(in srgb, #7c3aed 45%, transparent);
  border: 1px solid color-mix(in srgb, #c4b5fd 40%, transparent);
}

.adm-quick-query__h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.adm-quick-query__sub {
  margin: 0;
  font-size: 13px;
  color: $adm-text-muted;
  line-height: 1.55;
  max-width: 720px;
}

.adm-quick-query__code {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 6px;
  background: color-mix(in srgb, #fff 6%, transparent);
  color: #c4b5fd;
}
</style>
