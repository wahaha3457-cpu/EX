<script setup lang="ts">
/**
 * U 本位永续流程说明正文，与交割侧 {@link DeliveryFlowGuide} 结构对齐。
 */
</script>

<template>
  <div class="pfg-body" aria-label="永续合约流程说明">
    <ol class="pfg__list">
      <li>选择 U 本位永续交易对，设置杠杆与全仓 / 逐仓模式，关注标记价与指数价。</li>
      <li>限价或市价下单；名义金额以计价币（如 USDT）输入，系统按合约面值与委托价/标记价折算张数后提交，并冻结初始保证金。</li>
      <li>撮合成交后形成持仓；支持止盈止损、只减仓等。永续无固定交割日，可长期持有（规则以产品说明为准）。</li>
      <li>资金费率按周期（常见每 8 小时）在多空之间划转；页面上倒计时与费率为演示 Mock。</li>
    </ol>
    <p class="pfg__mock">
      Mock：资金费率、强平与 ADL 等风控链路为演示展示，真实规则与接口待后端接入。结构可参考
      <a
        class="pfg__link"
        href="https://www.binance.com/zh-CN/futures/BTCUSDT"
        target="_blank"
        rel="noopener noreferrer"
      >
        U 本位永续
      </a>
      类产品。
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

$pfg-mute: rgba(48, 132, 252, 0.88);

.pfg-body {
  margin: 0;
}

.pfg__list {
  margin: 0;
  padding-left: 1.2rem;
  font-size: $font-size-xs;
  line-height: 1.6;
  color: $color-text-secondary;
}

.pfg__list li + li {
  margin-top: $space-2;
}

.pfg__mock {
  margin: $space-4 0 0;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px dashed color-mix(in srgb, var(--ex-info) 45%, transparent);
  background: rgba(48, 132, 252, 0.08);
  font-size: 11px;
  line-height: 1.55;
  color: $pfg-mute;
}

.pfg__link {
  color: #8ab4ff;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.pfg__link:hover {
  text-decoration: underline;
}
</style>
