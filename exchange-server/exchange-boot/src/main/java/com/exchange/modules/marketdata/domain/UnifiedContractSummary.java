package com.exchange.modules.marketdata.domain;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UnifiedContractSummary {
  String symbol;
  BigDecimal markPrice;
  BigDecimal indexPrice;
  BigDecimal fundingRate;
  Long nextFundingTime;
  BigDecimal openInterest;
  String provider;
  Long ts;
}

