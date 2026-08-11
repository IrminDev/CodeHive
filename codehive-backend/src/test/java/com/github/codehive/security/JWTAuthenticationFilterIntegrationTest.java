package com.github.codehive.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

import org.springframework.context.annotation.Import;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
@DisplayName("JWT filter rejects bad tokens without 500")
class JWTAuthenticationFilterIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private User user;

    @BeforeEach
    void setUp() {
        user = userRepository.save(new User("Ada", "Lovelace", "STU-JWT", "jwt-filter@codehive.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
    }

    @Test
    @DisplayName("Malformed bearer token is unauthorized, not a server error")
    void malformedToken_isUnauthorizedNotServerError() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Tampered token signature is unauthorized, not a server error")
    void tamperedToken_isUnauthorizedNotServerError() throws Exception {
        String token = jwtUtil.generateToken(java.util.Map.of("role", "STUDENT"), user.getEmail());
        String tampered = token.substring(0, token.length() - 3) + "abc";

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + tampered))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Expired token is unauthorized, not a server error")
    void expiredToken_isUnauthorizedNotServerError() throws Exception {
        Object originalExpiration = ReflectionTestUtils.getField(jwtUtil, "expiration");
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L);
        String expiredToken = jwtUtil.generateToken(java.util.Map.of("role", "STUDENT"), user.getEmail());
        ReflectionTestUtils.setField(jwtUtil, "expiration", originalExpiration);

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Valid token still authenticates")
    void validToken_authenticates() throws Exception {
        String token = jwtUtil.generateToken(java.util.Map.of("role", "STUDENT"), user.getEmail());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
