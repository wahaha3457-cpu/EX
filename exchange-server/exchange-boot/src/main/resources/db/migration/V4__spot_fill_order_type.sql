-- 成交明细记录委托类型，便于前端「成交记录」展示限价/市价
ALTER TABLE spot_fill
  ADD COLUMN order_type TINYINT NOT NULL DEFAULT 1 COMMENT '1=LIMIT 2=MARKET' AFTER side;
