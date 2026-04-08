package com.exchange.modules.notice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.exchange.modules.notice.enums.AnnouncementStatus;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("announcement")
public class Announcement {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String title;
  private String summary;
  private String content;
  private AnnouncementStatus status;
  private LocalDateTime publishAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
