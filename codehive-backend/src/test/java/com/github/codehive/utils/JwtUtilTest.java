package com.github.codehive.utils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;

@DisplayName("JwtUtil Unit Tests")
class JwtUtilTest {

    private JwtUtil jwtUtil;
    private String testSecret;
    private Long testExpiration;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        
        // Use a properly encoded base64 secret for testing
        String rawSecret = "mySecretKeyForTestingPurposesOnlyThisIsVerySecure123456789";
        testSecret = Base64.getEncoder().encodeToString(rawSecret.getBytes(StandardCharsets.UTF_8));
        testExpiration = 3600000L; // 1 hour in milliseconds

        // Inject values using ReflectionTestUtils (simulates @Value injection)
        ReflectionTestUtils.setField(jwtUtil, "secret", testSecret);
        ReflectionTestUtils.setField(jwtUtil, "expiration", testExpiration);
    }

    @Nested
    @DisplayName("Token Generation Tests")
    class TokenGenerationTests {

        @Test
        @DisplayName("Should generate valid token with claims and email")
        void generateToken_WithClaimsAndEmail_ReturnsValidToken() {
            // Given
            String email = "test@example.com";
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "STUDENT");
            claims.put("userId", 123L);

            // When
            String token = jwtUtil.generateToken(claims, email);

            // Then
            assertThat(token).isNotNull();
            assertThat(token).isNotEmpty();
            assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts: header.payload.signature
        }

        @Test
        @DisplayName("Should generate token with empty claims map")
        void generateToken_WithEmptyClaims_ReturnsValidToken() {
            // Given
            String email = "user@example.com";
            Map<String, Object> claims = new HashMap<>();

            // When
            String token = jwtUtil.generateToken(claims, email);

            // Then
            assertThat(token).isNotNull();
            assertThat(token).isNotEmpty();
        }

        @Test
        @DisplayName("Should generate token with correct subject (email)")
        void generateToken_WithEmail_HasCorrectSubject() {
            // Given
            String email = "subject@example.com";
            Map<String, Object> claims = new HashMap<>();

            // When
            String token = jwtUtil.generateToken(claims, email);

            // Then
            String extractedEmail = jwtUtil.extractClaim(token, Claims::getSubject);
            assertThat(extractedEmail).isEqualTo(email);
        }

        @Test
        @DisplayName("Should generate token with custom claims")
        void generateToken_WithCustomClaims_ContainsAllClaims() {
            // Given
            String email = "test@example.com";
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "ADMIN");
            claims.put("userId", 456L);
            claims.put("department", "Engineering");

            // When
            String token = jwtUtil.generateToken(claims, email);

            // Then
            Claims extractedClaims = jwtUtil.extractClaim(token, claims1 -> claims1);
            assertThat(extractedClaims.get("role")).isEqualTo("ADMIN");
            assertThat(extractedClaims.get("userId")).isEqualTo(456);
            assertThat(extractedClaims.get("department")).isEqualTo("Engineering");
        }

        @Test
        @DisplayName("Should generate different tokens for different emails")
        void generateToken_WithDifferentEmails_GeneratesDifferentTokens() {
            // Given
            Map<String, Object> claims = new HashMap<>();
            String email1 = "user1@example.com";
            String email2 = "user2@example.com";

            // When
            String token1 = jwtUtil.generateToken(claims, email1);
            String token2 = jwtUtil.generateToken(claims, email2);

            // Then
            assertThat(token1).isNotEqualTo(token2);
        }
    }

    @Nested
    @DisplayName("Claim Extraction Tests")
    class ClaimExtractionTests {

        @Test
        @DisplayName("Should extract email from token")
        void extractClaim_WithSubject_ReturnsEmail() {
            // Given
            String email = "extract@example.com";
            String token = jwtUtil.generateToken(new HashMap<>(), email);

            // When
            String extractedEmail = jwtUtil.extractClaim(token, Claims::getSubject);

            // Then
            assertThat(extractedEmail).isEqualTo(email);
        }

        @Test
        @DisplayName("Should extract expiration date from token")
        void extractClaim_WithExpiration_ReturnsExpirationDate() {
            // Given
            String token = jwtUtil.generateToken(new HashMap<>(), "test@example.com");

            // When
            Date expiration = jwtUtil.extractClaim(token, Claims::getExpiration);

            // Then
            assertThat(expiration).isNotNull();
            assertThat(expiration).isAfter(new Date());
        }

        @Test
        @DisplayName("Should extract issued at date from token")
        void extractClaim_WithIssuedAt_ReturnsIssuedAtDate() {
            // Given
            String token = jwtUtil.generateToken(new HashMap<>(), "test@example.com");

            // When
            Date issuedAt = jwtUtil.extractClaim(token, Claims::getIssuedAt);

            // Then
            assertThat(issuedAt).isNotNull();
            assertThat(issuedAt).isBeforeOrEqualTo(new Date());
        }

        @Test
        @DisplayName("Should extract custom claims from token")
        void extractClaim_WithCustomClaims_ReturnsCorrectValues() {
            // Given
            Map<String, Object> claims = new HashMap<>();
            claims.put("customField", "customValue");
            String token = jwtUtil.generateToken(claims, "test@example.com");

            // When
            String customValue = jwtUtil.extractClaim(token, c -> c.get("customField", String.class));

            // Then
            assertThat(customValue).isEqualTo("customValue");
        }

        @Test
        @DisplayName("Should throw exception for malformed token")
        void extractClaim_WithMalformedToken_ThrowsException() {
            // Given
            String malformedToken = "not.a.valid.jwt.token";

            // When/Then
            assertThatThrownBy(() -> jwtUtil.extractClaim(malformedToken, Claims::getSubject))
                .isInstanceOf(MalformedJwtException.class);
        }

        @Test
        @DisplayName("Should throw exception for tampered token")
        void extractClaim_WithTamperedToken_ThrowsException() {
            // Given
            String token = jwtUtil.generateToken(new HashMap<>(), "test@example.com");
            String tamperedToken = token.substring(0, token.length() - 5) + "xxxxx";

            // When/Then
            assertThatThrownBy(() -> jwtUtil.extractClaim(tamperedToken, Claims::getSubject))
                .isInstanceOf(Exception.class);
        }
    }

    @Nested
    @DisplayName("Token Validation Tests")
    class TokenValidationTests {

        @Test
        @DisplayName("Should validate token with correct email and not expired")
        void isTokenValid_WithValidTokenAndEmail_ReturnsTrue() {
            // Given
            String email = "valid@example.com";
            String token = jwtUtil.generateToken(new HashMap<>(), email);

            // When
            boolean isValid = jwtUtil.isTokenValid(token, email);

            // Then
            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Should invalidate token with different email")
        void isTokenValid_WithDifferentEmail_ReturnsFalse() {
            // Given
            String email = "original@example.com";
            String differentEmail = "different@example.com";
            String token = jwtUtil.generateToken(new HashMap<>(), email);

            // When
            boolean isValid = jwtUtil.isTokenValid(token, differentEmail);

            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should invalidate expired token")
        void isTokenValid_WithExpiredToken_ReturnsFalse() {
            // Given
            String email = "test@example.com";
            ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L); // Expired 1 second ago
            String expiredToken = jwtUtil.generateToken(new HashMap<>(), email);
            
            // Reset expiration for validation
            ReflectionTestUtils.setField(jwtUtil, "expiration", testExpiration);

            // When
            boolean isValid = jwtUtil.isTokenValid(expiredToken, email);

            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should validate token immediately after generation")
        void isTokenValid_ImmediatelyAfterGeneration_ReturnsTrue() {
            // Given
            String email = "immediate@example.com";
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "STUDENT");
            String token = jwtUtil.generateToken(claims, email);

            // When
            boolean isValid = jwtUtil.isTokenValid(token, email);

            // Then
            assertThat(isValid).isTrue();
        }
    }

    @Nested
    @DisplayName("Token Expiration Tests")
    class TokenExpirationTests {

        @Test
        @DisplayName("Should detect non-expired token")
        void isTokenExpired_WithValidToken_ReturnsFalse() {
            // Given
            String token = jwtUtil.generateToken(new HashMap<>(), "test@example.com");

            // When
            boolean isExpired = jwtUtil.isTokenExpired(token);

            // Then
            assertThat(isExpired).isFalse();
        }

        @Test
        @DisplayName("Should detect expired token")
        void isTokenExpired_WithExpiredToken_ReturnsTrue() {
            // Given
            ReflectionTestUtils.setField(jwtUtil, "expiration", -5000L); // Expired 5 seconds ago
            String expiredToken = jwtUtil.generateToken(new HashMap<>(), "test@example.com");
            
            // Reset expiration
            ReflectionTestUtils.setField(jwtUtil, "expiration", testExpiration);

            // When
            boolean isExpired = jwtUtil.isTokenExpired(expiredToken);

            // Then
            assertThat(isExpired).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when extracting claims from expired token")
        void extractClaim_WithExpiredToken_ThrowsExpiredJwtException() {
            // Given
            ReflectionTestUtils.setField(jwtUtil, "expiration", -10000L); // Expired 10 seconds ago
            String expiredToken = jwtUtil.generateToken(new HashMap<>(), "test@example.com");
            
            // Reset expiration
            ReflectionTestUtils.setField(jwtUtil, "expiration", testExpiration);

            // When/Then
            assertThatThrownBy(() -> jwtUtil.extractClaim(expiredToken, Claims::getSubject))
                .isInstanceOf(ExpiredJwtException.class);
        }

        @Test
        @DisplayName("Should generate token with correct expiration time")
        void generateToken_WithExpiration_HasCorrectExpirationTime() {
            // Given
            String email = "test@example.com";
            long currentTime = System.currentTimeMillis();
            
            // When
            String token = jwtUtil.generateToken(new HashMap<>(), email);
            Date expirationDate = jwtUtil.extractClaim(token, Claims::getExpiration);

            // Then
            long expectedExpiration = currentTime + testExpiration;
            long actualExpiration = expirationDate.getTime();
            
            // Allow 1 second tolerance for execution time
            assertThat(actualExpiration).isBetween(expectedExpiration - 1000, expectedExpiration + 1000);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle token with very long email")
        void generateToken_WithVeryLongEmail_GeneratesValidToken() {
            // Given
            String longEmail = "a".repeat(100) + "@example.com";
            Map<String, Object> claims = new HashMap<>();

            // When
            String token = jwtUtil.generateToken(claims, longEmail);

            // Then
            assertThat(token).isNotNull();
            String extractedEmail = jwtUtil.extractClaim(token, Claims::getSubject);
            assertThat(extractedEmail).isEqualTo(longEmail);
        }

        @Test
        @DisplayName("Should handle token with special characters in email")
        void generateToken_WithSpecialCharactersInEmail_GeneratesValidToken() {
            // Given
            String specialEmail = "test+special.email_123@example.com";
            Map<String, Object> claims = new HashMap<>();

            // When
            String token = jwtUtil.generateToken(claims, specialEmail);

            // Then
            assertThat(token).isNotNull();
            String extractedEmail = jwtUtil.extractClaim(token, Claims::getSubject);
            assertThat(extractedEmail).isEqualTo(specialEmail);
        }

        @Test
        @DisplayName("Should handle token with many custom claims")
        void generateToken_WithManyClaims_GeneratesValidToken() {
            // Given
            Map<String, Object> claims = new HashMap<>();
            for (int i = 0; i < 20; i++) {
                claims.put("claim" + i, "value" + i);
            }
            String email = "test@example.com";

            // When
            String token = jwtUtil.generateToken(claims, email);

            // Then
            assertThat(token).isNotNull();
            Claims extractedClaims = jwtUtil.extractClaim(token, c -> c);
            assertThat(extractedClaims).hasSize(20 + 3); // custom claims + iat, exp, sub
        }

        @Test
        @DisplayName("Should generate consistent tokens within same millisecond")
        void generateToken_SameEmailAndClaims_MayGenerateDifferentTokens() {
            // Given
            String email = "test@example.com";
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", "STUDENT");

            // When - generate two tokens quickly
            String token1 = jwtUtil.generateToken(claims, email);
            String token2 = jwtUtil.generateToken(claims, email);

            // Then - tokens may differ due to issuedAt timestamp
            // Both should be valid for the same email
            assertThat(jwtUtil.isTokenValid(token1, email)).isTrue();
            assertThat(jwtUtil.isTokenValid(token2, email)).isTrue();
        }
    }
}
