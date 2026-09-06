---
name: spring-unit-tests
description: >
  Create or improve unit tests for Java Spring Boot backend code.
  Use when asked to test services, domain logic, validators, mappers,
  controllers, repositories abstractions, or other backend classes without
  manually running the application. Focus on behavior, edge cases, failure
  paths, boundaries, and regression prevention rather than maximizing line
  coverage.
---

# Spring Backend Unit Testing

Create meaningful automated tests that demonstrate the behavior of the code
under test.

The goal is NOT maximum coverage.

The goal is to detect regressions and prove important behavior.

## Before writing tests

Inspect:

1. The class under test.
2. Its collaborators.
3. Existing tests for the same module.
4. Existing test conventions in the repository.
5. The public behavior expected from the class.
6. Input constraints and domain invariants.
7. Failure paths.
8. Boundary conditions.

Do not immediately generate tests after reading a single method.

Understand how the class is expected to behave first.

## Determine test scenarios

For every behavior, consider:

### Normal cases

Test representative valid input and expected output or state changes.

### Boundary cases

Consider when applicable:

- zero
- one
- minimum allowed value
- maximum allowed value
- value immediately below minimum
- value immediately above maximum
- empty collections
- collections with one element
- large collections
- duplicate elements
- first/last element
- empty strings
- whitespace
- unusually long strings

### Invalid input

Consider:

- null when relevant
- malformed values
- missing required values
- invalid enum/state combinations
- illegal transitions
- invalid identifiers

Do not add meaningless null tests when null is impossible by contract.

### Dependency behavior

Consider:

- dependency returns expected value
- dependency returns empty/not found
- dependency throws an expected exception
- dependency returns unexpected/inconsistent state

Only test dependency interactions that are part of the behavior of the class.

### Failure paths

Verify:

- correct exception type
- important exception information
- no unintended state changes
- required cleanup
- expected collaborator interactions
- collaborators that must NOT be called

### State transitions

If behavior changes persistent/domain state, test:

- valid transition
- invalid transition
- repeated transition
- behavior from terminal state
- partial failure when applicable

### Idempotency

When an operation is expected to be idempotent, execute it more than once and
verify that repeated execution does not create an invalid result.

## Test behavior, not implementation

Prefer:

    givenX_whenY_thenZ

or descriptive equivalent names used by the repository.

Tests should verify observable behavior.

Avoid tests whose primary purpose is verifying private implementation details.

Do not test private methods directly.

Do not make methods public only to test them.

## Mocking

Use mocks only for external collaborators or boundaries that need isolation.

Do not mock:

- simple value objects
- the class under test
- pure domain objects
- trivial data structures

Avoid excessive `verify(...)`.

Verify interactions only when the interaction itself matters, for example:

- an event must be emitted
- persistence must occur
- a call must not happen after validation fails
- exactly-once behavior matters

Prefer state/result assertions when possible.

## Spring context

For pure unit tests:

- Do NOT use `@SpringBootTest`.
- Do NOT start the Spring application.
- Do NOT load Spring context unless the behavior specifically requires it.
- Instantiate the class directly.
- Mock dependencies when necessary.

Prefer JUnit 5 and the mocking/assertion libraries already used by the project.

For Mockito-based classes, prefer the repository's existing Mockito setup
such as `@ExtendWith(MockitoExtension.class)` when appropriate.

Do not introduce a new test library unless there is a strong reason.

## Parameterized tests

Use parameterized tests when several inputs represent the same logical
behavior.

Do not use parameterized tests when doing so makes different scenarios harder
to understand.

## Assertions

Assertions should make failures understandable.

Test the exact behavior that matters.

Avoid weak assertions such as only:

    assertNotNull(result)

when important properties of `result` should be checked.

For collections, verify important content and ordering when ordering is part
of the contract.

For exceptions, verify relevant details when they are part of behavior.

## False-positive prevention

A test must be capable of failing if the implementation is wrong.

Before finishing each important test, mentally consider:

"If the implementation returned the wrong result or skipped the relevant
behavior, would this test actually fail?"

Avoid tests that merely execute code without proving anything.

## Existing implementation vs expected behavior

Do not blindly derive expected behavior from the implementation.

If requirements, documentation, existing domain rules, or other callers
indicate different intended behavior, test the intended behavior and report
the discrepancy.

If expected behavior is ambiguous, report the ambiguity instead of inventing
a rule.

## Test quality

Tests themselves must be maintainable.

Avoid:

- duplicated test setup
- giant fixtures
- unexplained magic values
- testing multiple unrelated behaviors in one test
- mocks for every object
- fragile interaction verification
- dependence on execution order
- real network calls
- real external infrastructure for unit tests
- `Thread.sleep`
- nondeterministic values without control
- unnecessary Spring context loading

Use helper methods/builders only when they reduce meaningful duplication.

Do not abstract test code prematurely.

## Existing tests

When improving an existing test class:

1. Preserve useful tests.
2. Identify duplicated or meaningless tests.
3. Identify important missing scenarios.
4. Avoid rewriting the entire suite without reason.

## Execution

After creating or modifying tests:

1. Run the smallest relevant test set first.
2. Fix compilation errors.
3. Fix failing tests only when the test itself is incorrect.
4. Do not change production behavior merely to make an incorrect test pass.
5. Run the relevant broader test suite when practical.

## Final report

Report:

- behavior covered
- edge cases added
- failure paths covered
- tests executed
- any suspicious production behavior discovered
- any requirement ambiguity
- important scenarios that could not reasonably be unit tested