package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractMarginMode {

  CROSS(1),
  ISOLATED(2),
  ;

  @EnumValue private final int code;

  public static ContractMarginMode fromCode(int code) {
    for (ContractMarginMode v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractMarginMode: " + code);
  }
}
