package com.exchange.modules.contract.service;

import com.exchange.common.api.PageResult;
import com.exchange.modules.contract.dto.*;
import com.exchange.modules.contract.vo.*;

public interface ContractTradeService {

  ContractOrderVo openPosition(long userId, ContractOpenOrderDto dto);

  ContractOrderVo closePosition(long userId, ContractCloseOrderDto dto);

  ContractLeverageVo adjustLeverage(long userId, ContractLeverageDto dto);

  ContractMarginModeVo switchMarginMode(long userId, ContractMarginModeDto dto);

  PageResult<ContractPositionVo> pagePositions(long userId, ContractPositionQuery query);

  PageResult<ContractOrderVo> pageOpenOrders(long userId, ContractOrderOpenQuery query);

  PageResult<ContractOrderVo> pageHistoryOrders(long userId, ContractOrderHistoryQuery query);
}
