package com.exchange.modules.spot.dto;

import com.exchange.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SpotFillQuery extends PageQuery {

  private String pairCode;
}
