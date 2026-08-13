package com.github.codehive.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.github.codehive.model.entity.User;
import com.github.codehive.utils.JwtUtil;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JWTAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JWTAuthenticationFilter.class);
    
    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImplementation userDetailsService;

    public JWTAuthenticationFilter(JwtUtil jwtUtil, UserDetailsServiceImplementation userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            authenticate(header.substring(7), request);
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, HttpServletRequest request) {
        try {
            String email = jwtUtil.extractClaim(token, claims -> claims.getSubject());
            if (email == null) {
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (!userDetails.isEnabled() || !jwtUtil.isTokenValid(token, email)) {
                return;
            }
            if (userDetails instanceof User user && jwtUtil.extractTokenVersion(token) != user.getTokenVersion()) {
                return;
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
            // Invalid/expired token or unknown subject: leave the request unauthenticated.
            logger.debug("Skipping authentication for invalid JWT: {}", e.getMessage());
        }
    }
}
