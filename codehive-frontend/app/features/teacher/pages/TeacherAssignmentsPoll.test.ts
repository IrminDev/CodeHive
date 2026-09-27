import { describe, expect, it } from "vitest";

import { shouldPollAssignmentValidation } from "./TeacherAssignmentsPage";

describe("shouldPollAssignmentValidation", () => {
  it("polls while an assignment is being validated for the first time", () => {
    expect(shouldPollAssignmentValidation([{ validationStatus: "PROCESSING" }])).toBe(true);
  });

  it("polls while a published assignment validates a new revision in the background", () => {
    expect(shouldPollAssignmentValidation([{ validationStatus: "READY", pendingUpdate: true }])).toBe(true);
  });

  it("stops polling once everything is settled", () => {
    expect(shouldPollAssignmentValidation([
      { validationStatus: "READY", pendingUpdate: false },
      { validationStatus: "FAILED" },
    ])).toBe(false);
  });
});
