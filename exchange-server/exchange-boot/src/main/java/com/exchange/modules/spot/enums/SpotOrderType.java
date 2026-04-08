package com.exchange.modules.spot.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SpotOrderType {

  LIMIT(1),
  MARKET(2),
  ;

  @EnumValue private final int code;

  @JsonCreator
  public static SpotOrderType fromApi(Object raw) {
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
      return LIMIT;
    }
    if ("2".equals(s)) {
      return MARKET;
    }
    String u = s.toUpperCase(Locale.ROOT);
    try {
      return SpotOrderType.valueOf(u);
    } catch (IllegalArgumentException ignored) {
      for (SpotOrderType v : values()) {
        if (v.name().equalsIgnoreCase(s)) {
          return v;
        }
      }
    }
    throw new IllegalArgumentException("Unknown SpotOrderType: " + raw);
  }

  public static SpotOrderType fromCode(int code) {
    for (SpotOrderType v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown SpotOrderType: " + code);
  }
}
