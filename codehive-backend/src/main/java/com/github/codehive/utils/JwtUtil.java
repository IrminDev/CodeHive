package com.github.codehive.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
    @Value("${security.jwt.secret}")
    private String secret;    

    @Value("${security.jwt.expiration}")
    private Long expiration;

    public String generateToken(Map<String, Object> claims, String email) {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
    
        return Jwts.builder()
            .subject(email)
            .issuedAt(now)
            .expiration(new Date(nowMillis + expiration))
            .signWith(getSignInKey())
            .claims(claims)
            .compact();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = extractAllClaims(token);
            return claimsResolver.apply(claims);
        } catch (ExpiredJwtException e) {
            throw e;
        }
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (ExpiredJwtException e) {
            throw e;
        }
    }

    public boolean isTokenValid(String token, String email){
        try {
            final String emailToken = extractClaim(token, Claims::getSubject);
            return (emailToken.equals(email) && !isTokenExpired(token));
        } catch (ExpiredJwtException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token){
        try {
            return extractExpiration(token).before(new Date(
                System.currentTimeMillis()
            ));
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    private Date extractExpiration(String token){
        return extractClaim(token, Claims::getExpiration);
    }
}