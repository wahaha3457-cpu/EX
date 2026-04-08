package com.exchange.modules.marketdata.domain;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UnifiedKline {
  /** 开始时间（ms） */
  long time;
  BigDecimal open;
  BigDecimal high;
  BigDecimal low;
  BigDecimal close;
  BigDecimal volume;
  /** 计价成交额（源支持则填） */
  BigDecimal turnover;
}

