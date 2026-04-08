package com.exchange.common.util;

import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;

/** 轻量断言，避免冗长 if/throw。 */
public final class ExchangeAsserts {

  private ExchangeAsserts() {}

  public static void notNull(Object obj, ErrorCode code) {
    if (obj == null) {
      throw new BusinessException(code);
    }
  }

  public static void isTrue(boolean condition, ErrorCode code) {
    if (!condition) {
      throw new BusinessException(code);
    }
  }

  public static void isTrue(boolean condition, ErrorCode code, String message) {
    if (!condition) {
      throw new BusinessException(code, message);
    }
  }
}
