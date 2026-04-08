package com.exchange.common.constant;

/**
 * 幂等请求头（与网关/前端约定一致，核心写接口后续统一消费）。
 */
public final class IdempotencyHeader {

  public static final String IDEMPOTENCY_KEY = "Idempotency-Key";

  private IdempotencyHeader() {}
}
