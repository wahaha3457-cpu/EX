package com.exchange.modules.notice.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnnouncementStatus {

  DRAFT(0),
  PUBLISHED(1),
  ;

  @EnumValue private final int code;
}
