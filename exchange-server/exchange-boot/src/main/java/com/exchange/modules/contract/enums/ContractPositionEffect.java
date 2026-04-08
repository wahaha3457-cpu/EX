package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** OPEN=开仓委托，CLOSE=平仓委托（平仓单 reduce-only） */
@Getter
@RequiredArgsConstructor
public enum ContractPositionEffect {

  OPEN(1),
  CLOSE(2),
  ;

  @EnumValue private final int code;

  public static ContractPositionEffect fromCode(int code) {
    for (ContractPositionEffect v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractPositionEffect: " + code);
  }
}
