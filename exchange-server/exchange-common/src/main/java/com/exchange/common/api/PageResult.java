package com.exchange.common.api;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PageResult<T> implements Serializable {

  private final List<T> list;
  private final long page;
  private final long pageSize;
  private final long total;
  private final boolean hasMore;

  public static <T> PageResult<T> empty(long page, long pageSize) {
    return new PageResult<>(Collections.emptyList(), page, pageSize, 0, false);
  }
}
