package com.exchange.modules.spot.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.exchange.modules.spot.enums.SpotOrderSide;
import com.exchange.modules.spot.enums.SpotOrderType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("spot_fill")
public class SpotFill {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long orderId;
  private Long userId;
  private String pairCode;
  private SpotOrderSide side;
  /** 原委托类型（限价/市价） */
  private SpotOrderType orderType;

  private BigDecimal price;
  private BigDecimal quantity;
  private BigDecimal quoteAmount;
  private BigDecimal fee;
  private String feeAsset;
  private Integer isMaker;

  private LocalDateTime createdAt;
}
