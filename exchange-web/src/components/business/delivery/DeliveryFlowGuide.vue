<script setup lang="ts">
/**
 * 交割流程正文（列表 + Mock 声明），供 {@link TradeFlowInfoModal} 或独立容器使用。
 */
</script>

<template>
  <div class="dfg-body" aria-label="交割流程说明">
    <ol class="dfg__list">
      <li>选择交易对与交割时间，设置杠杆与保证金模式，查看标记价与指数价。</li>
      <li>交割期：展示最近 10 档可下单交割刻度，横向滑动选择；仅选中档显示倒计时。</li>
      <li>限价 / 市价；数量按计价币输入，折算张数后报单。简约计算说明见下单区上方。</li>
      <li>全仓/逐仓含义见模式弹窗；按名义÷杠杆估算初始保证金，演示撮合与结算以实际规则为准。</li>
      <li>下单成功后直接进入持仓；列表展示交割倒计时，到期后演示结算并从持仓移除（成交记录可回看）。</li>
    </ol>
    <p class="dfg__mock">
      Mock：交割结算目前为提示与展示，占位真实结算逻辑待后端接入。可参考
      <a
        class="dfg__link"
        href="https://www.binance.com/zh-CN/futures/BTCUSDT"
        target="_blank"
        rel="noopener noreferrer"
      >
        币安合约
      </a>
      类产品结构。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.dfg-body {
  margin: 0;
}

.dfg__list {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  line-height: 1.6;
  color: $color-text-secondary;
}

.dfg__list li + li {
  margin-top: $space-2;
}

.dfg__mock {
  margin: $space-4 0 0;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px dashed rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.06);
  font-size: 11px;
  line-height: 1.55;
  color: rgba(240, 185, 11, 0.92);
}

.dfg__link {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.dfg__link:hover {
  text-decoration: underline;
}
</style>
