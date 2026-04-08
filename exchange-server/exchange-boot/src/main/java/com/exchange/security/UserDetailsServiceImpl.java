package com.exchange.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exchange.modules.user.entity.User;
import com.exchange.modules.user.enums.UserStatus;
import com.exchange.modules.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

  private final UserMapper userMapper;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User u =
        userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getEmail, username).last("LIMIT 1"));
    if (u == null) {
      throw new UsernameNotFoundException(username);
    }
    boolean enabled = u.getStatus() == UserStatus.ACTIVE;
    return new SecurityUser(u.getId(), u.getUserCode(), u.getEmail(), u.getPasswordHash(), enabled);
  }
}
