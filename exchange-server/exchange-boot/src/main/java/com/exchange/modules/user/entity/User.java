package com.exchange.modules.user.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.exchange.modules.user.enums.UserStatus;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("sys_user")
public class User {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String userCode;
  private String email;
  private String passwordHash;
  private UserStatus status;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
