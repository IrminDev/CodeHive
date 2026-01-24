package com.github.codehive.worker.service;

import com.github.codehive.worker.model.enums.ComparatorType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OutputComparatorService {
    private static final Logger logger = LoggerFactory.getLogger(OutputComparatorService.class);
    private static final double EPSILON = 1e-9;

    public static class ComparisonResult {
        private final boolean matches;
        private final String feedback;

        public ComparisonResult(boolean matches, String feedback) {
            this.matches = matches;
            this.feedback = feedback;
        }

        public boolean matches() {
            return matches;
        }

        public String getFeedback() {
            return feedback;
        }
    }

    /**
     * Compare two outputs based on the comparator type
     * @param expected Expected output
     * @param actual Actual output from execution
     * @param comparatorType Type of comparison to perform
     * @return ComparisonResult with match status and detailed feedback
     */
    public ComparisonResult compareWithFeedback(String expected, String actual, ComparatorType comparatorType) {
        if (expected == null && actual == null) {
            return new ComparisonResult(true, "Passed");
        }
        if (expected == null || actual == null) {
            return new ComparisonResult(false, "Output is null");
        }

        switch (comparatorType) {
            case EXACT_MATCH:
                return compareExactWithFeedback(expected, actual);
            case FLOATING_POINT:
                return compareFloatingPointWithFeedback(expected, actual);
            default:
                logger.warn("Unknown comparator type: {}, falling back to exact match", comparatorType);
                return compareExactWithFeedback(expected, actual);
        }
    }

    /**
     * Compare two outputs based on the comparator type (legacy method)
     * @param expected Expected output
     * @param actual Actual output from execution
     * @param comparatorType Type of comparison to perform
     * @return true if outputs match, false otherwise
     */
    public boolean compare(String expected, String actual, ComparatorType comparatorType) {
        return compareWithFeedback(expected, actual, comparatorType).matches();
    }

    /**
     * Exact string comparison with detailed feedback
     */
    private ComparisonResult compareExactWithFeedback(String expected, String actual) {
        List<String> expectedLines = normalizeLines(expected);
        List<String> actualLines = normalizeLines(actual);
        
        if (expectedLines.size() != actualLines.size()) {
            String feedback = String.format("Line count mismatch: expected %d lines, got %d lines", 
                expectedLines.size(), actualLines.size());
            logger.debug(feedback);
            return new ComparisonResult(false, feedback);
        }

        for (int i = 0; i < expectedLines.size(); i++) {
            if (!expectedLines.get(i).equals(actualLines.get(i))) {
                String feedback = String.format("Line %d mismatch: expected '%s', got '%s'", 
                    i + 1, truncate(expectedLines.get(i), 50), truncate(actualLines.get(i), 50));
                logger.debug(feedback);
                return new ComparisonResult(false, feedback);
            }
        }

        return new ComparisonResult(true, "Passed");
    }


    /**
     * Floating point comparison with tolerance and detailed feedback
     */
    private ComparisonResult compareFloatingPointWithFeedback(String expected, String actual) {
        List<String> expectedLines = normalizeLines(expected);
        List<String> actualLines = normalizeLines(actual);

        if (expectedLines.size() != actualLines.size()) {
            String feedback = String.format("Line count mismatch: expected %d lines, got %d lines", 
                expectedLines.size(), actualLines.size());
            logger.debug(feedback);
            return new ComparisonResult(false, feedback);
        }

        for (int i = 0; i < expectedLines.size(); i++) {
            String[] expectedTokens = expectedLines.get(i).split("\\s+");
            String[] actualTokens = actualLines.get(i).split("\\s+");

            if (expectedTokens.length != actualTokens.length) {
                String feedback = String.format("Token count mismatch on line %d: expected %d tokens, got %d tokens", 
                    i + 1, expectedTokens.length, actualTokens.length);
                logger.debug(feedback);
                return new ComparisonResult(false, feedback);
            }

            for (int j = 0; j < expectedTokens.length; j++) {
                if (!compareTokens(expectedTokens[j], actualTokens[j])) {
                    String feedback = String.format("Token mismatch at line %d position %d: expected '%s', got '%s'", 
                        i + 1, j + 1, expectedTokens[j], actualTokens[j]);
                    logger.debug(feedback);
                    return new ComparisonResult(false, feedback);
                }
            }
        }

        return new ComparisonResult(true, "Passed");
    }

    /**
     * Truncate string for display in feedback
     */
    private String truncate(String str, int maxLength) {
        if (str == null) return "null";
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength) + "...";
    }

    /**
     * Compare individual tokens, treating numbers with epsilon tolerance
     */
    private boolean compareTokens(String expected, String actual) {
        // Try to parse as numbers first
        try {
            double expectedNum = Double.parseDouble(expected);
            double actualNum = Double.parseDouble(actual);
            return Math.abs(expectedNum - actualNum) <= EPSILON;
        } catch (NumberFormatException e) {
            // Not numbers, compare as strings
            return expected.equals(actual);
        }
    }

    /**
     * Normalize output into list of trimmed non-empty lines
     */
    private List<String> normalizeLines(String output) {
        return Arrays.stream(output.split("\\r?\\n"))
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .collect(Collectors.toList());
    }
}
