package com.github.codehive.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.exception.auth.IncorrectCredentialsException;
import com.github.codehive.model.mapper.UserMapper;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.repository.UserRepository;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO login(String email, String password) throws IncorrectCredentialsException{
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IncorrectCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IncorrectCredentialsException("Invalid credentials");
        }

        return UserMapper.toDTO(user);
    }

    public UserDTO register(SignUpRequest signUpRequest) throws AlreadyRegisteredEmailException,
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
        newUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
        newUser.setIsActive(true);

        User savedUser = userRepository.save(newUser);
        return UserMapper.toDTO(savedUser);
    }
}
