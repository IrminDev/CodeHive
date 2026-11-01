import { describe, expect, it } from "vitest";

import { readErrorMessage } from "./http";

function jsonResponse(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("readErrorMessage", () => {
  it("shows the field validation messages instead of the generic summary", async () => {
    const response = jsonResponse({
      success: false,
      message: "Validation failed",
      errors: ["Father last name must be between 2 and 40 characters"],
    });

    expect(await readErrorMessage(response)).toBe("Father last name must be between 2 and 40 characters");
  });

  it("joins several field messages", async () => {
    const response = jsonResponse({ success: false, message: "Validation failed", errors: ["Name is required", "Email must be valid"] });

    expect(await readErrorMessage(response)).toBe("Name is required. Email must be valid");
  });

  it("falls back to error and message when there are no field messages", async () => {
    expect(await readErrorMessage(jsonResponse({ success: false, message: "Invalid Email Or Password", errors: [] }, 401)))
      .toBe("Invalid Email Or Password");
    expect(await readErrorMessage(jsonResponse({ success: false, message: "Registration failed", error: "Email already exists" }, 409)))
      .toBe("Email already exists");
  });
});
