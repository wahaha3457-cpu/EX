package com.exchange.modules.marketdata.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MarketCacheService {

  private final StringRedisTemplate redis;
  private final ObjectMapper objectMapper;

  public <T> Optional<T> getJson(String key, TypeReference<T> ref) {
    String v = redis.opsForValue().get(key);
    if (v == null || v.isBlank()) return Optional.empty();
    try {
      return Optional.of(objectMapper.readValue(v, ref));
    } catch (Exception e) {
      return Optional.empty();
    }
  }

  public void setJson(String key, Object value, Duration ttl) {
    try {
      String s = objectMapper.writeValueAsString(value);
      redis.opsForValue().set(key, s, ttl);
    } catch (Exception ignored) {
      // ignore cache failures
    }
  }
}

