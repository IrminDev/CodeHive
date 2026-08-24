package com.github.codehive.service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import io.jsonwebtoken.ExpiredJwtException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.model.enums.AdminAuditAction;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.exception.auth.IncorrectCredentialsException;
import com.github.codehive.model.mapper.UserMapper;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.response.auth.AuthResponse;
import com.github.codehive.model.response.auth.CsvBulkRegisterResponse;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.EnrollmentNumberRules;
import com.github.codehive.utils.JwtUtil;
import com.github.codehive.utils.PasswordGenerator;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MailSenderService mailSenderService;
    private AdminAuditService adminAuditService;

    // Regex pattern for email validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                        MailSenderService mailSenderService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSenderService = mailSenderService;
    }

    @Autowired
    void setAdminAuditService(AdminAuditService adminAuditService) {
        this.adminAuditService = adminAuditService;
    }

    /**
     * Check if the given identifier is an email address
     * @param identifier the identifier to check
     * @return true if it's an email, false otherwise (enrollment number)
     */
    public static boolean isEmail(String identifier) {
        return identifier != null && EMAIL_PATTERN.matcher(identifier.trim()).matches();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest loginRequest) throws IncorrectCredentialsException {
        String identifier = loginRequest.getIdentifier().trim();
        
        // Find user by email or enrollment number based on identifier format
        Optional<User> userOptional;
        if (isEmail(identifier)) {
            userOptional = userRepository.findByEmail(identifier);
        } else {
            userOptional = userRepository.findByEnrollmentNumber(identifier);
        }

        User user = userOptional.orElseThrow(() -> new IncorrectCredentialsException("Invalid credentials"));

        if (!user.canParticipate()
                || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IncorrectCredentialsException("Invalid credentials");
        }

        String token = generateToken(user);
        UserDTO userDTO = UserMapper.toDTO(user);

        return new AuthResponse(token, userDTO);
    }

    @Transactional
    public UserDTO register(SignUpRequest signUpRequest) throws AlreadyRegisteredEmailException,
            AlreadyRegisteredEnrollmentNumberException {
        EnrollmentNumberRules.validate(
                signUpRequest.getRole(), signUpRequest.getEnrollmentNumber());
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            throw new AlreadyRegisteredEmailException("Email is already registered");
        }
        if (userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber()).isPresent()) {
            throw new AlreadyRegisteredEnrollmentNumberException("Enrollment number is already registered");
        }

        String rawPassword = PasswordGenerator.generate();
        String lastName = signUpRequest.getFatherLastName() + " " + signUpRequest.getMotherLastName();

        User newUser = new User();
        newUser.setEmail(signUpRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(rawPassword));
        newUser.setName(signUpRequest.getName());
        newUser.setLastName(lastName);
        newUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
        newUser.setRole(signUpRequest.getRole());
        newUser.setIsActive(true);
        newUser.setTemporaryPassword(true);

        User savedUser = userRepository.save(newUser);

        mailSenderService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName(), rawPassword);

        return UserMapper.toDTO(savedUser);
    }

    @Transactional
    public UserDTO registerAuthorized(SignUpRequest request, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IncorrectCredentialsException("User not found"));
        if (!requester.canParticipate()) throw new AccessDeniedException("Account is unavailable");
        Scope required = request.getRole() == Role.ADMIN ? Scope.CREATE_ADMINS : Scope.CREATE_USERS;
        boolean authorized = requester.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(required.name()));
        if (requester.getRole() != Role.ADMIN || !authorized) {
            throw new AccessDeniedException("Missing scope: " + required.name());
        }
        UserDTO registered = register(request);
        if (adminAuditService != null) {
            User target = userRepository.findById(registered.getId()).orElse(null);
            adminAuditService.success(requester, target, AdminAuditAction.USER_CREATED,
                    "Account created by administrator", "role=" + request.getRole());
        }
        return registered;
    }

    @Transactional
    public CsvBulkRegisterResponse registerFromCsv(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int rowNumber = 0;

        Set<String> csvEmails = new HashSet<>();
        Set<String> csvEnrollments = new HashSet<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = CSVFormat.DEFAULT.builder()
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : csvParser) {
                rowNumber++;

                if (record.size() < 6) {
                    errors.add("Row " + rowNumber + ": Expected 6 columns but found " + record.size());
                    continue;
                }

                String roleStr = record.get(0).trim().toUpperCase();
                String name = record.get(1).trim();
                String fatherLastName = record.get(2).trim();
                String motherLastName = record.get(3).trim();
                String enrollmentNumber = record.get(4).trim();
                String email = record.get(5).trim();

                // Validate role
                Role role;
                try {
                    role = Role.valueOf(roleStr);
                } catch (IllegalArgumentException e) {
                    errors.add("Row " + rowNumber + ": Invalid role '" + roleStr + "'. Must be STUDENT, TEACHER, or ADMIN");
                    continue;
                }
                if (role == Role.ADMIN) {
                    errors.add("Row " + rowNumber + ": Admin accounts cannot be created through CSV signup");
                    continue;
                }

                // Validate required fields
                List<String> rowErrors = new ArrayList<>();
                if (name.isEmpty()) rowErrors.add("name is empty");
                if (fatherLastName.isEmpty()) rowErrors.add("father last name is empty");
                if (motherLastName.isEmpty()) rowErrors.add("mother last name is empty");
                if (enrollmentNumber.isEmpty()) rowErrors.add("enrollment number is empty");
                String enrollmentError = EnrollmentNumberRules.error(role, enrollmentNumber);
                if (!enrollmentNumber.isEmpty() && enrollmentError != null) {
                    rowErrors.add(enrollmentError);
                }
                if (email.isEmpty()) rowErrors.add("email is empty");
                if (!email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) rowErrors.add("email is invalid");

                if (!rowErrors.isEmpty()) {
                    errors.add("Row " + rowNumber + ": " + String.join(", ", rowErrors));
                    continue;
                }

                // Check for duplicates within the CSV itself
                if (!csvEmails.add(email)) {
                    errors.add("Row " + rowNumber + ": Duplicate email '" + email + "' in CSV");
                    continue;
                }
                if (!csvEnrollments.add(enrollmentNumber)) {
                    errors.add("Row " + rowNumber + ": Duplicate enrollment number '" + enrollmentNumber + "' in CSV");
                    continue;
                }

                // Check for duplicates in database
                if (userRepository.findByEmail(email).isPresent()) {
                    errors.add("Row " + rowNumber + ": Email '" + email + "' is already registered");
                    continue;
                }
                if (userRepository.findByEnrollmentNumber(enrollmentNumber).isPresent()) {
                    errors.add("Row " + rowNumber + ": Enrollment number '" + enrollmentNumber + "' is already registered");
                    continue;
                }

                String rawPassword = PasswordGenerator.generate();
                String lastName = fatherLastName + " " + motherLastName;

                User newUser = new User();
                newUser.setEmail(email);
                newUser.setPassword(passwordEncoder.encode(rawPassword));
                newUser.setName(name);
                newUser.setLastName(lastName);
                newUser.setEnrollmentNumber(enrollmentNumber);
                newUser.setRole(role);
                newUser.setIsActive(true);
                newUser.setTemporaryPassword(true);

                userRepository.save(newUser);
                mailSenderService.sendWelcomeEmail(email, name, rawPassword);
                successCount++;
            }
        }

        return new CsvBulkRegisterResponse(rowNumber, successCount, errors.size(), errors.isEmpty() ? null : errors);
    }

    public UserDTO getUserByToken(String token) {
        try {
            if (jwtUtil.isTokenExpired(token)) {
                throw new IncorrectCredentialsException("Token has expired");
            }
            String email = jwtUtil.extractClaim(token, claims -> claims.getSubject());
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IncorrectCredentialsException("User not found"));
            return UserMapper.toDTO(user);
        } catch (ExpiredJwtException e) {
            throw new IncorrectCredentialsException("Token has expired");
        }
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IncorrectCredentialsException("User not found"));
        return UserMapper.toDTO(user);
    }

    private String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        return jwtUtil.generateToken(claims, user.getEmail());
    }

    @Transactional
    public void updatePassword(UUID userId, com.github.codehive.model.request.auth.UpdatePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IncorrectCredentialsException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IncorrectCredentialsException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTemporaryPassword(false);
        userRepository.save(user);
    }
}
