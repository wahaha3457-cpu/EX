-- 现货交易主干：交易对精度、订单、成交、账户余额（MySQL 5.7）

ALTER TABLE symbol_pair
  ADD COLUMN price_tick DECIMAL(36,18) NOT NULL DEFAULT 0.010000000000000000 COMMENT '最小报价单位' AFTER min_order_qty,
  ADD COLUMN qty_step DECIMAL(36,18) NOT NULL DEFAULT 0.000010000000000000 COMMENT '数量步进' AFTER price_tick,
  ADD COLUMN min_notional DECIMAL(36,18) NOT NULL DEFAULT 10.000000000000000000 COMMENT '最小名义成交额(报价币)' AFTER qty_step;

UPDATE symbol_pair SET
  price_tick = 0.01,
  qty_step = 0.00001,
  min_notional = 10,
  min_order_qty = 0.00001
WHERE pair_code = 'BTC_USDT';

CREATE TABLE IF NOT EXISTS spot_account_balance (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  asset VARCHAR(32) NOT NULL,
  available DECIMAL(36,18) NOT NULL,
  frozen DECIMAL(36,18) NOT NULL,
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_spot_bal_user_asset (user_id, asset)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='现货账户余额(主干; 未来可拆分钱包域)';

CREATE TABLE IF NOT EXISTS spot_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  pair_code VARCHAR(32) NOT NULL,
  client_order_id VARCHAR(64) COMMENT '客户端幂等键; 与 user_id 唯一',
  side TINYINT NOT NULL COMMENT '1=BUY 2=SELL',
  order_type TINYINT NOT NULL COMMENT '1=LIMIT 2=MARKET',
  price DECIMAL(36,18) COMMENT '限价必填; 市价可空',
  quantity DECIMAL(36,18) NOT NULL COMMENT '基础币数量',
  quote_qty DECIMAL(36,18) COMMENT '市价买单: 报价币金额',
  filled_qty DECIMAL(36,18) NOT NULL DEFAULT 0,
  avg_fill_price DECIMAL(36,18),
  frozen_base DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '挂单冻结基础币',
  frozen_quote DECIMAL(36,18) NOT NULL DEFAULT 0 COMMENT '挂单冻结报价币',
  status TINYINT NOT NULL COMMENT '见 SpotOrderStatus',
  time_in_force TINYINT NOT NULL DEFAULT 1 COMMENT '1=GTC 2=IOC 3=FOK',
  reject_reason VARCHAR(512),
  version INT NOT NULL DEFAULT 0 COMMENT '乐观锁; 撮合回写',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_spot_order_user_client (user_id, client_order_id),
  KEY idx_spot_order_user_pair_st (user_id, pair_code, status),
  KEY idx_spot_order_user_ct (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='现货订单(持久化; 撮合通过消息/回写对接)';

CREATE TABLE IF NOT EXISTS spot_fill (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  pair_code VARCHAR(32) NOT NULL,
  side TINYINT NOT NULL,
  price DECIMAL(36,18) NOT NULL,
  quantity DECIMAL(36,18) NOT NULL,
  quote_amount DECIMAL(36,18) NOT NULL,
  fee DECIMAL(36,18) NOT NULL,
  fee_asset VARCHAR(32) NOT NULL,
  is_maker TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  KEY idx_spot_fill_user_ct (user_id, created_at),
  KEY idx_spot_fill_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='现货成交明细';
