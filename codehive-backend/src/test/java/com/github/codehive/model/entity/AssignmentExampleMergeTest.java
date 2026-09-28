package com.github.codehive.model.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * Replacing an assignment's examples must reuse the rows already attached and only trim or append,
 * so Hibernate never inserts a new (assignment_id, order_index) before deleting the row that held it
 * — the cause of the "uk_assignment_example_order" unique-constraint violation.
 */
class AssignmentExampleMergeTest {

    private static AssignmentExample example(String tag) {
        return new AssignmentExample(null, 0, tag + "-in", tag + "-out", tag + "-why");
    }

    private static Assignment assignmentWith(String... tags) {
        Assignment assignment = new Assignment();
        assignment.setExamples(List.of(java.util.Arrays.stream(tags).map(AssignmentExampleMergeTest::example).toArray(AssignmentExample[]::new)));
        return assignment;
    }

    @Test
    void reusesExistingRowsAndKeepsContiguousOrdersWhenReplacing() {
        Assignment assignment = assignmentWith("a", "b", "c");
        List<AssignmentExample> original = List.copyOf(assignment.getExamples());

        assignment.setExamples(List.of(example("x"), example("y"), example("z")));

        // Same three row instances are reused (updated in place), not deleted and re-created.
        assertThat(assignment.getExamples()).containsExactlyElementsOf(original);
        assertThat(assignment.getExamples()).extracting(AssignmentExample::getOrder).containsExactly(1, 2, 3);
        assertThat(assignment.getExamples()).extracting(AssignmentExample::getInput).containsExactly("x-in", "y-in", "z-in");
        assignment.getExamples().forEach(e -> assertThat(e.getAssignment()).isSameAs(assignment));
    }

    @Test
    void trimsSurplusRowsFromTheTail() {
        Assignment assignment = assignmentWith("a", "b", "c");
        AssignmentExample firstKept = assignment.getExamples().get(0);

        assignment.setExamples(List.of(example("only")));

        assertThat(assignment.getExamples()).hasSize(1);
        assertThat(assignment.getExamples().get(0)).isSameAs(firstKept);
        assertThat(assignment.getExamples().get(0).getOrder()).isEqualTo(1);
        assertThat(assignment.getExamples().get(0).getInput()).isEqualTo("only-in");
    }

    @Test
    void appendsNewRowsWithContiguousOrdersWhenGrowing() {
        Assignment assignment = assignmentWith("a");
        AssignmentExample kept = assignment.getExamples().get(0);

        assignment.setExamples(List.of(example("a2"), example("b"), example("c")));

        assertThat(assignment.getExamples()).hasSize(3);
        assertThat(assignment.getExamples().get(0)).isSameAs(kept);
        assertThat(assignment.getExamples()).extracting(AssignmentExample::getOrder).containsExactly(1, 2, 3);
    }

    @Test
    void clearsEveryRowWhenSetToNull() {
        Assignment assignment = assignmentWith("a", "b");
        assignment.setExamples(null);
        assertThat(assignment.getExamples()).isEmpty();
    }
}
