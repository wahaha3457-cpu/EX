-- MySQL 5.7 compatible baseline（主干表）
CREATE TABLE IF NOT EXISTS sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_code VARCHAR(32) NOT NULL,
  email VARCHAR(128),
  password_hash VARCHAR(256),
  status TINYINT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_user_code (user_code),
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcement (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(256) NOT NULL,
  summary VARCHAR(512),
  content MEDIUMTEXT NOT NULL,
  status TINYINT NOT NULL,
  publish_at DATETIME(3),
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS symbol_pair (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  pair_code VARCHAR(32) NOT NULL,
  base_coin VARCHAR(32) NOT NULL,
  quote_coin VARCHAR(32) NOT NULL,
  market_type TINYINT NOT NULL,
  status TINYINT NOT NULL,
  min_order_qty DECIMAL(36,18) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_pair_market (pair_code, market_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS app_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(128) NOT NULL,
  config_value TEXT NOT NULL,
  value_type TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO announcement (title, summary, content, status, publish_at, created_at, updated_at)
VALUES (
  '欢迎使用 Exchange 后端骨架',
  '系统已就绪，后续接入撮合与行情',
  '<p>企业级交易所主干：安全、账户、行情与交易将逐步扩展。</p>',
  1,
  NOW(3),
  NOW(3),
  NOW(3)
);

INSERT INTO symbol_pair (pair_code, base_coin, quote_coin, market_type, status, min_order_qty, created_at, updated_at)
VALUES (
  'BTC_USDT',
  'BTC',
  'USDT',
  1,
  1,
  0.00001000000000000000,
  NOW(3),
  NOW(3)
);

INSERT INTO app_config (config_key, config_value, value_type, created_at, updated_at)
VALUES ('site.name', 'Exchange', 1, NOW(3), NOW(3));
