package com.exchange.modules.spot.vo;

import java.math.BigDecimal;

/** 现货钱包余额行（用于交易页展示可用/冻结） */
public record SpotBalanceRowVo(String asset, BigDecimal available, BigDecimal frozen) {}
