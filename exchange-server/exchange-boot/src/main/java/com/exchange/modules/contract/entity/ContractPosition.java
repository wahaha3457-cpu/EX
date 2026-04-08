package com.exchange.modules.contract.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.exchange.modules.contract.enums.ContractMarginMode;
import com.exchange.modules.contract.enums.ContractPositionSide;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("contract_position")
public class ContractPosition {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long userId;
  private String symbolCode;
  private ContractPositionSide positionSide;

  private BigDecimal contracts;
  private BigDecimal entryPrice;
  private Integer leverage;
  private ContractMarginMode marginMode;

  private BigDecimal isolatedMargin;
  private BigDecimal unrealizedPnl;
  private BigDecimal liquidationPrice;
  /** 风险率/保证金率：维持保证金权益比等，由风控任务回写 */
  private BigDecimal riskRate;

  @Version private Integer version;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
