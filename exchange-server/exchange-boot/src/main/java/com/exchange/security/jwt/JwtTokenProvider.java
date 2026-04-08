package com.exchange.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

  private final JwtProperties props;

  public String createAccessToken(long userId, String userCode) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + props.getAccessTokenTtl().toMillis());
    SecretKey key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    return Jwts.builder()
        .issuer(props.getIssuer())
        .subject(String.valueOf(userId))
        .claim("userCode", userCode)
        .issuedAt(now)
        .expiration(exp)
        .signWith(key)
        .compact();
  }

  public Claims parseAndValidate(String token) {
    SecretKey key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }
}
