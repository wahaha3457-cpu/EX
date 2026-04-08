package com.exchange.modules.notice.vo;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AnnouncementListItemVo {

  Long id;
  String title;
  String summary;
  LocalDateTime publishAt;
}
