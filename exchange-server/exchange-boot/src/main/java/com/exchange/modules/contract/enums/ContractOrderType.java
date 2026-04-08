package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractOrderType {

  LIMIT(1),
  MARKET(2),
  CONDITIONAL(3),
  ;

  @EnumValue private final int code;

  public static ContractOrderType fromCode(int code) {
    for (ContractOrderType v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractOrderType: " + code);
  }
}
