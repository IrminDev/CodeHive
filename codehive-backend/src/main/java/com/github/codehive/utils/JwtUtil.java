package com.github.codehive.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

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
        byte[] bytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(bytes, "HmacSHA256"); 
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver){
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSignInKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isTokenValid(String token, String email){
        final String emailToken = extractClaim(token, Claims::getSubject);
        return (emailToken.equals(email) && !isTokenExpired(token));
    }

    public boolean isTokenExpired(String token){
        return extractExpiration(token).before(new Date(
            System.currentTimeMillis()
        ));
    }

    private Date extractExpiration(String token){
        return extractClaim(token, Claims::getExpiration);
    }
}