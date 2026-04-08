package com.exchange.modules.notice.controller;

import com.exchange.common.api.Result;
import com.exchange.modules.notice.service.NoticeQueryService;
import com.exchange.modules.notice.vo.AnnouncementListItemVo;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class NoticeController {

  private final NoticeQueryService noticeQueryService;

  @GetMapping
  public Result<List<AnnouncementListItemVo>> list() {
    return Result.ok(noticeQueryService.listPublished());
  }
}
