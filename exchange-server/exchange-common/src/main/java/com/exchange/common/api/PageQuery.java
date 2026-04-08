package com.exchange.common.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 通用分页查询参数（后续可扩展 sort、cursor）。
 */
@Data
public class PageQuery {

  @Min(1)
  private int page = 1;

  @Min(1)
  @Max(100)
  private int pageSize = 20;

  /** 预留：排序字段，如 createdAt,desc */
  private String sort;
}
