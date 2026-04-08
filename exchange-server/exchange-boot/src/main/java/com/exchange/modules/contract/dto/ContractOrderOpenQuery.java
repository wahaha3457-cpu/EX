package com.exchange.modules.contract.dto;

import com.exchange.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ContractOrderOpenQuery extends PageQuery {

  private String symbolCode;
}
