package com.exchange.web.exception;

import com.exchange.common.api.Result;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.web.filter.TraceIdFilter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BusinessException.class)
  @ResponseStatus(HttpStatus.OK)
  public Result<Void> handleBusiness(BusinessException ex) {
    return trace(Result.fail(ex.getErrorCode(), ex.getMessage()));
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
  @ResponseStatus(HttpStatus.OK)
  public Result<Void> handleValidation(Exception ex) {
    String msg = ErrorCode.SYS_PARAM_INVALID.getDefaultMessage();
    if (ex instanceof MethodArgumentNotValidException m) {
      var field = m.getBindingResult().getFieldError();
      if (field != null) {
        msg = field.getDefaultMessage() != null ? field.getDefaultMessage() : msg;
      }
    }
    return trace(Result.fail(ErrorCode.SYS_PARAM_INVALID, msg));
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.OK)
  public Result<Void> handleOthers(Exception ex) {
    log.error("Unhandled error", ex);
    return trace(Result.fail(ErrorCode.SYS_INTERNAL_ERROR));
  }

  private static Result<Void> trace(Result<Void> r) {
    String tid = MDC.get(TraceIdFilter.MDC_TRACE_ID);
    return r.withTraceId(tid);
  }
}
