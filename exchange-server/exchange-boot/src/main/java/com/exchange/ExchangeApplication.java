package com.exchange;

import com.exchange.security.jwt.JwtProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.exchange.modules.**.mapper")
@EnableConfigurationProperties(JwtProperties.class)
@EnableScheduling
public class ExchangeApplication {

  public static void main(String[] args) {
    SpringApplication.run(ExchangeApplication.class, args);
  }
}
