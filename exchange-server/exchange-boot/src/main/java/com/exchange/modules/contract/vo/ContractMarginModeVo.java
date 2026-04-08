package com.exchange.modules.contract.vo;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ContractMarginModeVo {

  String symbolCode;
  String marginMode;
}
