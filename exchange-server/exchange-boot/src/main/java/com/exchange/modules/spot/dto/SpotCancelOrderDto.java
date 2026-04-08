package com.exchange.modules.spot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** 撤单请求（可与 DELETE /{orderId} 并存，便于批量撤单扩展） */
@Data
public class SpotCancelOrderDto {

  @NotNull(message = "orderId 不能为空")
  private Long orderId;
}
