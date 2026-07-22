package com.github.codehive.service;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.response.auth.CsvProgressMessage;
import com.github.codehive.model.response.auth.CsvProgressMessage.Status;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.PasswordGenerator;
import com.github.codehive.websocket.CsvProgressWebSocketHandler;

@Service
public class CsvRegistrationService {

    private static final Logger logger = LoggerFactory.getLogger(CsvRegistrationService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private static final Pattern ENROLLMENT_PATTERN = Pattern.compile(
            "^(199[4-9]|[2-9]\\d{3})630\\d{3}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailSenderService mailSenderService;
    private final CsvProgressWebSocketHandler webSocketHandler;
    private final ObjectProvider<CsvRegistrationService> selfProvider;

    public CsvRegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                   MailSenderService mailSenderService, CsvProgressWebSocketHandler webSocketHandler,
                                   ObjectProvider<CsvRegistrationService> selfProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderService = mailSenderService;
        this.webSocketHandler = webSocketHandler;
        this.selfProvider = selfProvider;
    }

    public String submitCsvJob(byte[] csvData) {
        String taskId = UUID.randomUUID().toString();
        webSocketHandler.queueTask(taskId, () -> selfProvider.getObject().processAsync(csvData, taskId));
        return taskId;
    }

    @Async
    public void processAsync(byte[] csvData, String taskId) {
        try {
            List<CSVRecord> records = parseRecords(csvData);
            int totalRows = records.size();
            int successCount = 0;
            int errorCount = 0;
            List<String> errors = new ArrayList<>();

            Set<String> csvEmails = new HashSet<>();
            Set<String> csvEnrollments = new HashSet<>();

            for (int i = 0; i < totalRows; i++) {
                CSVRecord record = records.get(i);
                int rowNumber = i + 1;

                sendProgress(taskId, Status.PROCESSING, rowNumber, totalRows, successCount, errorCount,
                        "Processing row " + rowNumber + " of " + totalRows);

                String error = processRow(record, rowNumber, csvEmails, csvEnrollments);

                if (error != null) {
                    errorCount++;
                    errors.add(error);
                    sendProgress(taskId, Status.ROW_ERROR, rowNumber, totalRows, successCount, errorCount, error);
                } else {
                    successCount++;
                    sendProgress(taskId, Status.ROW_SUCCESS, rowNumber, totalRows, successCount, errorCount,
                            "Row " + rowNumber + ": Registered successfully");
                }
            }

            String summary = "CSV processing completed. " + successCount + " succeeded, " + errorCount + " failed.";
            sendProgress(taskId, Status.COMPLETED, totalRows, totalRows, successCount, errorCount, summary);

        } catch (Exception e) {
            logger.error("Error processing CSV task {}", taskId, e);
            sendProgress(taskId, Status.COMPLETED, 0, 0, 0, 0, "Error processing CSV: " + e.getMessage());
        }
    }

    private List<CSVRecord> parseRecords(byte[] csvData) throws Exception {
        List<CSVRecord> records = new ArrayList<>();
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(csvData), StandardCharsets.UTF_8);
             CSVParser csvParser = CSVFormat.DEFAULT.builder()
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {
            for (CSVRecord record : csvParser) {
                records.add(record);
            }
        }
        return records;
    }

    private String processRow(CSVRecord record, int rowNumber,
                               Set<String> csvEmails, Set<String> csvEnrollments) {
        if (record.size() < 6) {
            return "Row " + rowNumber + ": Expected 6 columns but found " + record.size();
        }

        String roleStr = record.get(0).trim().toUpperCase();
        String name = record.get(1).trim();
        String fatherLastName = record.get(2).trim();
        String motherLastName = record.get(3).trim();
        String enrollmentNumber = record.get(4).trim();
        String email = record.get(5).trim();

        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            return "Row " + rowNumber + ": Invalid role '" + roleStr + "'. Must be STUDENT, TEACHER, or ADMIN";
        }
        if (role == Role.ADMIN) {
            return "Row " + rowNumber + ": Admin accounts cannot be created through CSV signup";
        }

        List<String> rowErrors = new ArrayList<>();
        if (name.isEmpty()) rowErrors.add("name is empty");
        if (fatherLastName.isEmpty()) rowErrors.add("father last name is empty");
        if (motherLastName.isEmpty()) rowErrors.add("mother last name is empty");
        if (enrollmentNumber.isEmpty()) rowErrors.add("enrollment number is empty");
        if (!enrollmentNumber.isEmpty() && !ENROLLMENT_PATTERN.matcher(enrollmentNumber).matches())
            rowErrors.add("enrollment number is invalid (must be 10 digits: year >=1994, then 630, then 3 digits)");
        if (email.isEmpty()) rowErrors.add("email is empty");
        if (!email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) rowErrors.add("email is invalid");

        if (!rowErrors.isEmpty()) {
            return "Row " + rowNumber + ": " + String.join(", ", rowErrors);
        }

        if (!csvEmails.add(email)) {
            return "Row " + rowNumber + ": Duplicate email '" + email + "' in CSV";
        }
        if (!csvEnrollments.add(enrollmentNumber)) {
            return "Row " + rowNumber + ": Duplicate enrollment number '" + enrollmentNumber + "' in CSV";
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return "Row " + rowNumber + ": Email '" + email + "' is already registered";
        }
        if (userRepository.findByEnrollmentNumber(enrollmentNumber).isPresent()) {
            return "Row " + rowNumber + ": Enrollment number '" + enrollmentNumber + "' is already registered";
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

        return null;
    }

    private void sendProgress(String taskId, Status status, int currentRow, int totalRows,
                               int successCount, int errorCount, String message) {
        CsvProgressMessage msg = new CsvProgressMessage(taskId, status, currentRow, totalRows,
                successCount, errorCount, message);
        webSocketHandler.sendProgress(taskId, msg);

        if (status == Status.COMPLETED) {
            webSocketHandler.completeTask(taskId);
        }
    }
}
