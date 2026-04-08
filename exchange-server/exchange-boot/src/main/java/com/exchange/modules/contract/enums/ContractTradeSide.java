package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 撮合侧买卖方向：开多=BUY+LONG，开空=SELL+SHORT，平多=SELL+LONG，平空=BUY+SHORT */
@Getter
@RequiredArgsConstructor
public enum ContractTradeSide {

  BUY(1),
  SELL(2),
  ;

  @EnumValue private final int code;

  public static ContractTradeSide fromCode(int code) {
    for (ContractTradeSide v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractTradeSide: " + code);
  }
}
