package com.exchange.security.jwt;

import com.exchange.common.api.Result;
import com.exchange.common.exception.ErrorCode;
import com.exchange.security.SecurityUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtTokenProvider jwtTokenProvider;
  private final ObjectMapper objectMapper;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }
    String token = header.substring(7).trim();
    if (token.isEmpty()) {
      filterChain.doFilter(request, response);
      return;
    }
    try {
      Claims claims = jwtTokenProvider.parseAndValidate(token);
      long userId = Long.parseLong(claims.getSubject());
      String userCode = claims.get("userCode", String.class);
      SecurityUser principal = new SecurityUser(userId, userCode, null, "", true);
      UsernamePasswordAuthenticationToken auth =
          new UsernamePasswordAuthenticationToken(
              principal, null, principal.getAuthorities());
      auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(auth);
    } catch (Exception ex) {
      SecurityContextHolder.clearContext();
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.setCharacterEncoding("UTF-8");
      response
          .getWriter()
          .write(objectMapper.writeValueAsString(Result.fail(ErrorCode.AUTH_TOKEN_INVALID)));
      return;
    }
    filterChain.doFilter(request, response);
  }
}
