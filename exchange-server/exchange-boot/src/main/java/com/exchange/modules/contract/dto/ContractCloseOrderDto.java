package com.exchange.modules.contract.dto;

import com.exchange.modules.contract.enums.ContractOrderType;
import com.exchange.modules.contract.enums.ContractPositionSide;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

/** 平仓（平多/平空） */
@Data
public class ContractCloseOrderDto {

  @NotBlank private String symbolCode;

  /** 平多=LONG，平空=SHORT */
  @NotNull private ContractPositionSide positionSide;

  @NotNull private ContractOrderType orderType;

  private BigDecimal price;
  /** 平仓张数 */
  @NotNull private BigDecimal quantity;

  @Size(max = 64)
  private String clientOrderId;
}
