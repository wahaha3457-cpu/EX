package com.exchange.modules.spot.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SpotOrderSide {

  BUY(1),
  SELL(2),
  ;

  @EnumValue private final int code;

  /**
   * REST 反序列化：兼容大小写、数字 1/2、以及常见别名，避免前端或网关改写后落到错误方向。
   */
  @JsonCreator
  public static SpotOrderSide fromApi(Object raw) {
    if (raw == null) {
      return null;
    }
    if (raw instanceof Number) {
      return fromCode(((Number) raw).intValue());
    }
    String s = raw.toString().trim();
    if (s.isEmpty()) {
      return null;
    }
    if ("1".equals(s)) {
      return BUY;
    }
    if ("2".equals(s)) {
      return SELL;
    }
    String u = s.toUpperCase(Locale.ROOT);
    if ("ASK".equals(u) || "S".equals(u)) {
      return SELL;
    }
    if ("BID".equals(u) || "B".equals(u)) {
      return BUY;
    }
    try {
      return SpotOrderSide.valueOf(u);
    } catch (IllegalArgumentException ignored) {
      for (SpotOrderSide v : values()) {
        if (v.name().equalsIgnoreCase(s)) {
          return v;
        }
      }
    }
    throw new IllegalArgumentException("Unknown SpotOrderSide: " + raw);
  }

  public static SpotOrderSide fromCode(int code) {
    for (SpotOrderSide v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown SpotOrderSide: " + code);
  }
}
