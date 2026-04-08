package com.exchange.common.api;

import com.exchange.common.exception.ErrorCode;
import java.io.Serializable;
import lombok.Getter;

/**
 * 统一 API 响应（与前端 ApiResult 契约对齐）。
 */
@Getter
public class Result<T> implements Serializable {

  private final boolean success;
  private final String code;
  private final String message;
  private final T data;
  private final String traceId;
  private final long timestamp;

  private Result(boolean success, String code, String message, T data, String traceId) {
    this.success = success;
    this.code = code;
    this.message = message;
    this.data = data;
    this.traceId = traceId;
    this.timestamp = System.currentTimeMillis();
  }

  public static <T> Result<T> ok(T data) {
    return new Result<>(true, ErrorCode.OK.getCode(), ErrorCode.OK.getDefaultMessage(), data, null);
  }

  public static <T> Result<T> ok() {
    return ok(null);
  }

  public static <T> Result<T> fail(ErrorCode errorCode, String message) {
    String msg = message != null && !message.isBlank() ? message : errorCode.getDefaultMessage();
    return new Result<>(false, errorCode.getCode(), msg, null, null);
  }

  public static <T> Result<T> fail(ErrorCode errorCode) {
    return fail(errorCode, null);
  }

  public Result<T> withTraceId(String traceId) {
    return new Result<>(this.success, this.code, this.message, this.data, traceId);
  }
}
