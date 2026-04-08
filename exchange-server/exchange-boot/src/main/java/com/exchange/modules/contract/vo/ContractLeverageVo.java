package com.exchange.modules.contract.vo;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ContractLeverageVo {

  String symbolCode;
  int leverage;
  int maxLeverage;
}
