<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/constants/routeNames'
import C2COrdersListPanel from '@/components/business/c2c/C2COrdersListPanel.vue'
</script>

<template>
  <div class="ocv">
    <section class="ocv__intro" aria-label="说明">
      <p class="ocv__intro-p">
        C2C 订单为法币与数字资产的场外撮合记录（演示）。请在倒计时内完成付款并保留凭证；卖方确认收款后放币。正式环境需完成身份认证与支付方式绑定。
      </p>
      <ul class="ocv__intro-ul">
        <li>切勿在转账备注中填写敏感词；单笔金额需在广告限额内。</li>
        <li>争议与申诉以平台客服与合规流程为准。</li>
      </ul>
    </section>

    <div class="ocv__panel">
      <div class="ocv__panel-hd">
        <h2 class="ocv__h2">C2C 订单</h2>
        <RouterLink class="ocv__link" :to="{ name: RouteNames.C2C }"> C2C 市场 </RouterLink>
      </div>
      <div class="ocv__panel-body">
        <C2COrdersListPanel />
      </div>
    </div>

    <section class="ocv__rules" aria-label="规则">
      <h3 class="ocv__rules-h">交易规则（演示）</h3>
      <ol class="ocv__rules-ol">
        <li>下单后请在倒计时内完成线下法币划转，并点击「我已付款」；卖方确认收款后放币。</li>
        <li>若对方超时未放币，可发起申诉（演示）；生产环境需对接客服与支付凭证核验。</li>
      </ol>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ocv__intro {
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__intro-p {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.ocv__intro-ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}

.ocv__panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: var(--ex-card-surface);
  overflow: hidden;
}

.ocv__panel-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__h2 {
  margin: 0;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ocv__link {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-brand);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ocv__panel-body {
  padding: $space-3;
}

.ocv__rules {
  margin-top: $space-5;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ocv__rules-h {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ocv__rules-ol {
  margin: 0;
  padding-left: 1.25rem;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.6;
}
</style>
