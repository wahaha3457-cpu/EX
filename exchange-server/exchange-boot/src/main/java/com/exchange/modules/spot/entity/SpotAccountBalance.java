package com.exchange.modules.spot.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("spot_account_balance")
public class SpotAccountBalance {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long userId;
  private String asset;
  private BigDecimal available;
  private BigDecimal frozen;

  @Version private Integer version;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
