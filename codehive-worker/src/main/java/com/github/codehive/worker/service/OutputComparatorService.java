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

    /**
     * Compare two outputs based on the comparator type
     * @param expected Expected output
     * @param actual Actual output from execution
     * @param comparatorType Type of comparison to perform
     * @return true if outputs match, false otherwise
     */
    public boolean compare(String expected, String actual, ComparatorType comparatorType) {
        if (expected == null && actual == null) {
            return true;
        }
        if (expected == null || actual == null) {
            return false;
        }

        switch (comparatorType) {
            case EXACT_MATCH:
                return compareExact(expected, actual);
            case FLOATING_POINT:
                return compareFloatingPoint(expected, actual);
            default:
                logger.warn("Unknown comparator type: {}, falling back to exact match", comparatorType);
                return compareExact(expected, actual);
        }
    }

    /**
     * Exact string comparison (trimmed lines, ignoring trailing whitespace)
     */
    private boolean compareExact(String expected, String actual) {
        List<String> expectedLines = normalizeLines(expected);
        List<String> actualLines = normalizeLines(actual);
        
        if (expectedLines.size() != actualLines.size()) {
            logger.debug("Line count mismatch: expected {} lines, got {} lines", 
                expectedLines.size(), actualLines.size());
            return false;
        }

        for (int i = 0; i < expectedLines.size(); i++) {
            if (!expectedLines.get(i).equals(actualLines.get(i))) {
                logger.debug("Line {} mismatch: expected '{}', got '{}'", 
                    i + 1, expectedLines.get(i), actualLines.get(i));
                return false;
            }
        }

        return true;
    }

    /**
     * Floating point comparison with tolerance
     * Compares token by token, treating numbers with epsilon tolerance
     */
    private boolean compareFloatingPoint(String expected, String actual) {
        List<String> expectedLines = normalizeLines(expected);
        List<String> actualLines = normalizeLines(actual);

        if (expectedLines.size() != actualLines.size()) {
            logger.debug("Line count mismatch: expected {} lines, got {} lines", 
                expectedLines.size(), actualLines.size());
            return false;
        }

        for (int i = 0; i < expectedLines.size(); i++) {
            String[] expectedTokens = expectedLines.get(i).split("\\s+");
            String[] actualTokens = actualLines.get(i).split("\\s+");

            if (expectedTokens.length != actualTokens.length) {
                logger.debug("Token count mismatch on line {}: expected {} tokens, got {} tokens", 
                    i + 1, expectedTokens.length, actualTokens.length);
                return false;
            }

            for (int j = 0; j < expectedTokens.length; j++) {
                if (!compareTokens(expectedTokens[j], actualTokens[j])) {
                    logger.debug("Token mismatch at line {} position {}: expected '{}', got '{}'", 
                        i + 1, j + 1, expectedTokens[j], actualTokens[j]);
                    return false;
                }
            }
        }

        return true;
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
