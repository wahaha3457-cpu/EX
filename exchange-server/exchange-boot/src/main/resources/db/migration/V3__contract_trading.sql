-- U 本位合约主干：合约标的、钱包、用户偏好、持仓、订单（MySQL 5.7）

CREATE TABLE IF NOT EXISTS contract_symbol (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  symbol_code VARCHAR(32) NOT NULL COMMENT '如 BTCUSDT',
  base_coin VARCHAR(32) NOT NULL,
  quote_coin VARCHAR(32) NOT NULL,
  contract_size DECIMAL(36,18) NOT NULL COMMENT '每张合约基础币数量',
  max_leverage INT NOT NULL,
  maintenance_margin_rate DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '维持保证金率(风险率分母用; 主干占位)',
  price_tick DECIMAL(36,18) NOT NULL,
  qty_step DECIMAL(36,18) NOT NULL,
  min_order_qty DECIMAL(36,18) NOT NULL,
  min_notional DECIMAL(36,18) NOT NULL,
  mark_price DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '标记价格(行情服务更新)',
  status TINYINT NOT NULL COMMENT '1=交易中',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_contract_symbol (symbol_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合约标的';

INSERT INTO contract_symbol (
  symbol_code, base_coin, quote_coin, contract_size, max_leverage, maintenance_margin_rate,
  price_tick, qty_step, min_order_qty, min_notional, mark_price, status, created_at, updated_at
) VALUES (
  'BTCUSDT', 'BTC', 'USDT', 0.0001, 125, 0.004,
  0.01, 0.0001, 0.0001, 5, 68000, 1, NOW(3), NOW(3)
);

CREATE TABLE IF NOT EXISTS contract_wallet (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  asset VARCHAR(32) NOT NULL,
  available DECIMAL(36,18) NOT NULL,
  frozen DECIMAL(36,18) NOT NULL,
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_contract_wallet_user_asset (user_id, asset)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合约钱包(报价币保证金; 主干)';

CREATE TABLE IF NOT EXISTS contract_user_symbol_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  symbol_code VARCHAR(32) NOT NULL,
  leverage INT NOT NULL,
  margin_mode TINYINT NOT NULL COMMENT '1=CROSS 2=ISOLATED',
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_contract_user_symbol (user_id, symbol_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-合约偏好(杠杆/保证金模式)';

CREATE TABLE IF NOT EXISTS contract_position (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  symbol_code VARCHAR(32) NOT NULL,
  position_side TINYINT NOT NULL COMMENT '1=LONG 2=SHORT',
  contracts DECIMAL(36,18) NOT NULL DEFAULT 0,
  entry_price DECIMAL(36,18),
  leverage INT NOT NULL,
  margin_mode TINYINT NOT NULL,
  isolated_margin DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '逐仓占用; 全仓可为0由钱包承担',
  unrealized_pnl DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '未实现盈亏(行情更新)',
  liquidation_price DECIMAL(36,18) COMMENT '强平价(风控引擎)',
  risk_rate DECIMAL(36,18) COMMENT '风险率/保证金率 预留',
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_contract_pos_user_sym_side (user_id, symbol_code, position_side)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合约持仓(双向持仓模型)';

CREATE TABLE IF NOT EXISTS contract_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  symbol_code VARCHAR(32) NOT NULL,
  client_order_id VARCHAR(64),
  position_side TINYINT NOT NULL COMMENT 'LONG/SHORT',
  position_effect TINYINT NOT NULL COMMENT '1=OPEN 2=CLOSE',
  trade_side TINYINT NOT NULL COMMENT '1=BUY 2=SELL',
  order_type TINYINT NOT NULL COMMENT '1=LIMIT 2=MARKET 3=CONDITIONAL',
  price DECIMAL(36,18),
  quantity DECIMAL(36,18) NOT NULL,
  quote_qty DECIMAL(36,18),
  filled_qty DECIMAL(36,18) NOT NULL DEFAULT 0,
  avg_fill_price DECIMAL(36,18),
  reduce_only TINYINT NOT NULL DEFAULT 0,
  frozen_margin DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '挂单占用初始保证金',
  leverage_snapshot INT NOT NULL,
  margin_mode_snapshot TINYINT NOT NULL,
  take_profit_price DECIMAL(36,18) COMMENT '止盈(条件单扩展)',
  stop_loss_price DECIMAL(36,18) COMMENT '止损(条件单扩展)',
  conditional_trigger_price DECIMAL(36,18) COMMENT '条件单触发价预留',
  status TINYINT NOT NULL,
  time_in_force TINYINT NOT NULL DEFAULT 1,
  reject_reason VARCHAR(512),
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_contract_order_user_client (user_id, client_order_id),
  KEY idx_contract_ord_user_sym_st (user_id, symbol_code, status),
  KEY idx_contract_ord_user_ct (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合约委托单';
