package com.exchange.modules.spot.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.exchange.modules.spot.enums.SpotOrderSide;
import com.exchange.modules.spot.enums.SpotOrderStatus;
import com.exchange.modules.spot.enums.SpotOrderType;
import com.exchange.modules.spot.enums.SpotTimeInForce;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("spot_order")
public class SpotOrder {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long userId;
  private String pairCode;
  /** 客户端幂等键，与 user_id 唯一；可为空 */
  private String clientOrderId;

  private SpotOrderSide side;
  private SpotOrderType orderType;

  private BigDecimal price;
  private BigDecimal quantity;
  /** 市价买单：按报价币金额下单 */
  private BigDecimal quoteQty;

  private BigDecimal filledQty;
  private BigDecimal avgFillPrice;

  private BigDecimal frozenBase;
  private BigDecimal frozenQuote;

  private SpotOrderStatus status;
  private SpotTimeInForce timeInForce;

  private String rejectReason;

  @Version private Integer version;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
