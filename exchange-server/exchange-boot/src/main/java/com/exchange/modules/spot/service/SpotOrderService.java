package com.exchange.modules.spot.service;

import com.exchange.common.api.PageResult;
import com.exchange.modules.spot.dto.SpotCancelOrderDto;
import com.exchange.modules.spot.dto.SpotFillQuery;
import com.exchange.modules.spot.dto.SpotOrderHistoryQuery;
import com.exchange.modules.spot.dto.SpotOrderOpenQuery;
import com.exchange.modules.spot.dto.SpotPlaceOrderDto;
import com.exchange.modules.spot.vo.SpotFillVo;
import com.exchange.modules.spot.vo.SpotOrderVo;

public interface SpotOrderService {

  SpotOrderVo placeOrder(long userId, SpotPlaceOrderDto dto);

  SpotOrderVo cancelOrder(long userId, SpotCancelOrderDto dto);

  PageResult<SpotOrderVo> pageOpenOrders(long userId, SpotOrderOpenQuery query);

  PageResult<SpotOrderVo> pageHistoryOrders(long userId, SpotOrderHistoryQuery query);

  PageResult<SpotFillVo> pageFills(long userId, SpotFillQuery query);
}
