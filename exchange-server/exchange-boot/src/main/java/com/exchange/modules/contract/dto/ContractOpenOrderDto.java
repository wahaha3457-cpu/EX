package com.exchange.modules.contract.dto;

import com.exchange.modules.contract.enums.ContractMarginMode;
import com.exchange.modules.contract.enums.ContractOrderType;
import com.exchange.modules.contract.enums.ContractPositionSide;
import com.exchange.modules.contract.enums.ContractTimeInForce;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

/** 开仓（开多/开空） */
@Data
public class ContractOpenOrderDto {

  @NotBlank private String symbolCode;

  /** 开多=LONG，开空=SHORT */
  @NotNull private ContractPositionSide openSide;

  @NotNull private ContractOrderType orderType;

  private BigDecimal price;
  /** 张数 */
  @NotNull private BigDecimal quantity;

  /** 覆盖默认杠杆；为空则用用户-合约偏好 */
  private Integer leverage;

  private ContractMarginMode marginMode;

  @Size(max = 64)
  private String clientOrderId;

  private ContractTimeInForce timeInForce = ContractTimeInForce.GTC;

  /** 止盈止损委托扩展（主干仅存字段，撮合/策略接入） */
  private BigDecimal takeProfitPrice;

  private BigDecimal stopLossPrice;
}
