package com.exchange.modules.contract.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.exchange.modules.contract.enums.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("contract_order")
public class ContractOrder {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long userId;
  private String symbolCode;
  private String clientOrderId;

  private ContractPositionSide positionSide;
  private ContractPositionEffect positionEffect;
  private ContractTradeSide tradeSide;

  private ContractOrderType orderType;
  private BigDecimal price;
  private BigDecimal quantity;
  private BigDecimal quoteQty;

  private BigDecimal filledQty;
  private BigDecimal avgFillPrice;

  private Integer reduceOnly;
  private BigDecimal frozenMargin;
  private Integer leverageSnapshot;
  private ContractMarginMode marginModeSnapshot;

  private BigDecimal takeProfitPrice;
  private BigDecimal stopLossPrice;
  private BigDecimal conditionalTriggerPrice;

  private ContractOrderStatus status;
  private ContractTimeInForce timeInForce;
  private String rejectReason;

  @Version private Integer version;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
