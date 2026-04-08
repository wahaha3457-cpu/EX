package com.exchange.modules.spot.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SpotTimeInForce {

  GTC(1),
  IOC(2),
  FOK(3),
  ;

  @EnumValue private final int code;

  public static SpotTimeInForce fromCode(int code) {
    for (SpotTimeInForce v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown SpotTimeInForce: " + code);
  }
}
