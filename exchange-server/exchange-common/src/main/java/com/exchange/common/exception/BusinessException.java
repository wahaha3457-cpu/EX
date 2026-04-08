package com.exchange.common.exception;

import lombok.Getter;

/**
 * 可预期的业务异常，由全局处理器转换为 {@link com.exchange.common.api.Result}。
 */
@Getter
public class BusinessException extends RuntimeException {

  private final ErrorCode errorCode;
  private final String detail;

  public BusinessException(ErrorCode errorCode) {
    super(errorCode.getDefaultMessage());
    this.errorCode = errorCode;
    this.detail = null;
  }

  public BusinessException(ErrorCode errorCode, String message) {
    super(message != null ? message : errorCode.getDefaultMessage());
    this.errorCode = errorCode;
    this.detail = message;
  }

  public BusinessException(ErrorCode errorCode, String message, Throwable cause) {
    super(message != null ? message : errorCode.getDefaultMessage(), cause);
    this.errorCode = errorCode;
    this.detail = message;
  }
}
