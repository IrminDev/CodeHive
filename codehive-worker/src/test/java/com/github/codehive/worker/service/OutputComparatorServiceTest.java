package com.github.codehive.worker.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.codehive.worker.model.enums.ComparatorType;
import com.github.codehive.worker.service.OutputComparatorService.ComparisonResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("OutputComparatorService")
class OutputComparatorServiceTest {

    private OutputComparatorService service;

    @BeforeEach
    void setUp() {
        service = new OutputComparatorService();
    }

    // ── Null handling ─────────────────────────────────────────────────────

    @Test
    @DisplayName("both null → match")
    void bothNull() {
        ComparisonResult r = service.compareWithFeedback(null, null, ComparatorType.EXACT_MATCH);
        assertThat(r.matches()).isTrue();
    }

    @Test
    @DisplayName("expected null, actual non-null → no match")
    void expectedNull() {
        ComparisonResult r = service.compareWithFeedback(null, "42\n", ComparatorType.EXACT_MATCH);
        assertThat(r.matches()).isFalse();
    }

    @Test
    @DisplayName("expected non-null, actual null → no match")
    void actualNull() {
        ComparisonResult r = service.compareWithFeedback("42\n", null, ComparatorType.EXACT_MATCH);
        assertThat(r.matches()).isFalse();
    }

    // ── EXACT_MATCH ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("EXACT_MATCH")
    class ExactMatch {

        @Test
        @DisplayName("identical single-line output → match")
        void identical() {
            ComparisonResult r = service.compareWithFeedback("42", "42", ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isTrue();
            assertThat(r.getFeedback()).isEqualTo("Passed");
        }

        @Test
        @DisplayName("multi-line identical → match")
        void multiLineIdentical() {
            String out = "1\n2\n3";
            ComparisonResult r = service.compareWithFeedback(out, out, ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("line count mismatch → no match with feedback")
        void lineCountMismatch() {
            ComparisonResult r = service.compareWithFeedback("1\n2\n3", "1\n2", ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isFalse();
            assertThat(r.getFeedback()).containsIgnoringCase("line count");
        }

        @Test
        @DisplayName("same line count but different content → no match with line number in feedback")
        void contentMismatch() {
            ComparisonResult r = service.compareWithFeedback("hello", "world", ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isFalse();
            assertThat(r.getFeedback()).contains("1");
        }

        @Test
        @DisplayName("trailing whitespace stripped by normalizeLines → match")
        void trailingWhitespace() {
            ComparisonResult r = service.compareWithFeedback("42   ", "42", ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("CRLF vs LF normalised → match")
        void crlfNormalised() {
            ComparisonResult r = service.compareWithFeedback("1\r\n2", "1\n2", ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("blank trailing line ignored → match")
        void blankTrailingLine() {
            ComparisonResult r = service.compareWithFeedback("42\n\n", "42", ComparatorType.EXACT_MATCH);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("feedback contains expected and actual on content mismatch")
        void feedbackShowsDiff() {
            ComparisonResult r = service.compareWithFeedback("yes", "no", ComparatorType.EXACT_MATCH);
            assertThat(r.getFeedback()).contains("yes").contains("no");
        }
    }

    // ── FLOATING_POINT ────────────────────────────────────────────────────

    @Nested
    @DisplayName("FLOATING_POINT")
    class FloatingPoint {

        @Test
        @DisplayName("exact equal numbers → match")
        void exactNumbers() {
            ComparisonResult r = service.compareWithFeedback("3.14", "3.14", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("numbers within epsilon → match")
        void withinEpsilon() {
            ComparisonResult r = service.compareWithFeedback("1.0", "1.0000000001", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("numbers beyond epsilon → no match")
        void beyondEpsilon() {
            ComparisonResult r = service.compareWithFeedback("1.0", "1.1", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isFalse();
        }

        @Test
        @DisplayName("non-numeric tokens compared as strings → match")
        void nonNumericTokens() {
            ComparisonResult r = service.compareWithFeedback("YES", "YES", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("non-numeric tokens differ → no match")
        void nonNumericTokensDiffer() {
            ComparisonResult r = service.compareWithFeedback("YES", "NO", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isFalse();
        }

        @Test
        @DisplayName("token count mismatch on same line → no match")
        void tokenCountMismatch() {
            ComparisonResult r = service.compareWithFeedback("1 2 3", "1 2", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isFalse();
            assertThat(r.getFeedback()).containsIgnoringCase("token");
        }

        @Test
        @DisplayName("multi-line mixed content → match")
        void multiLineMixed() {
            String expected = "3.14159\nYES\n100";
            String actual   = "3.14159\nYES\n100";
            ComparisonResult r = service.compareWithFeedback(expected, actual, ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isTrue();
        }

        @Test
        @DisplayName("line count mismatch → no match")
        void lineCountMismatch() {
            ComparisonResult r = service.compareWithFeedback("1.0\n2.0", "1.0", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isFalse();
            assertThat(r.getFeedback()).containsIgnoringCase("line count");
        }

        @Test
        @DisplayName("integer values compared as doubles → match")
        void integersAsDoubles() {
            ComparisonResult r = service.compareWithFeedback("100", "100", ComparatorType.FLOATING_POINT);
            assertThat(r.matches()).isTrue();
        }
    }
}
