package com.exchange.modules.notice.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.modules.notice.entity.Announcement;
import com.exchange.modules.notice.enums.AnnouncementStatus;
import com.exchange.modules.notice.mapper.AnnouncementMapper;
import com.exchange.modules.notice.vo.AnnouncementListItemVo;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NoticeQueryService {

  private final AnnouncementMapper announcementMapper;

  public List<AnnouncementListItemVo> listPublished() {
    List<Announcement> rows =
        announcementMapper.selectList(
            Wrappers.<Announcement>lambdaQuery()
                .eq(Announcement::getStatus, AnnouncementStatus.PUBLISHED)
                .orderByDesc(Announcement::getPublishAt)
                .last("LIMIT 50"));
    return rows.stream()
        .map(
            a ->
                AnnouncementListItemVo.builder()
                    .id(a.getId())
                    .title(a.getTitle())
                    .summary(a.getSummary())
                    .publishAt(a.getPublishAt())
                    .build())
        .toList();
  }
}
