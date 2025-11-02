package com.github.codehive.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.exception.auth.IncorrectCredentialsException;
import com.github.codehive.model.mapper.UserMapper;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.response.auth.AuthResponse;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest loginRequest) throws IncorrectCredentialsException {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new IncorrectCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IncorrectCredentialsException("Invalid credentials");
        }

        String token = generateToken(user);
        UserDTO userDTO = UserMapper.toDTO(user);

        return new AuthResponse(token, userDTO);
    }

    @Transactional
    public AuthResponse register(SignUpRequest signUpRequest) throws AlreadyRegisteredEmailException,
            AlreadyRegisteredEnrollmentNumberException {
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            throw new AlreadyRegisteredEmailException("Email is already registered");
        }
        if (userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber()).isPresent()) {
            throw new AlreadyRegisteredEnrollmentNumberException("Enrollment number is already registered");
        }

        User newUser = new User();
        newUser.setEmail(signUpRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        newUser.setName(signUpRequest.getName());
        newUser.setLastName(signUpRequest.getLastName());
        newUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
        newUser.setProfilePictureUrl(signUpRequest.getProfilePictureUrl());
        newUser.setRole(Role.STUDENT); // Default role
        newUser.setIsActive(true);

        User savedUser = userRepository.save(newUser);
        String token = generateToken(savedUser);
        UserDTO userDTO = UserMapper.toDTO(savedUser);

        return new AuthResponse(token, userDTO);
    }

    private String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        return jwtUtil.generateToken(claims, user.getEmail());
    }
}
