import { describe, expect, it } from "vitest";

import { shouldPollAssignmentValidation } from "./TeacherAssignmentsPage";

describe("shouldPollAssignmentValidation", () => {
  it("polls while an assignment is being validated for the first time", () => {
    expect(shouldPollAssignmentValidation([{ validationStatus: "PROCESSING" }])).toBe(true);
  });

  it("stops polling once everything is settled", () => {
    expect(shouldPollAssignmentValidation([
      { validationStatus: "READY" },
      { validationStatus: "FAILED" },
    ])).toBe(false);
  });
});
