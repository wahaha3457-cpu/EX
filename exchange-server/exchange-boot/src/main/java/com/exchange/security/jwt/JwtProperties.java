package com.exchange.security.jwt;

import java.time.Duration;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "exchange.jwt")
public class JwtProperties {

  private String issuer = "exchange";

  /** HS256 密钥，生产环境必须由 KMS/配置中心注入且足够长 */
  private String secret = "change-me-dev-only-min-32-chars-long-key!!";

  private Duration accessTokenTtl = Duration.ofMinutes(30);
}
