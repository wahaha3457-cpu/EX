package com.exchange.modules.spot.dto;

import com.exchange.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SpotOrderOpenQuery extends PageQuery {

  /** 可选：筛选交易对 */
  private String pairCode;
}
