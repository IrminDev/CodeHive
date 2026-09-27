import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AiPolicyFields, normalizeAiPolicy, validAiPolicy } from "./AiPolicyFields";

afterEach(cleanup);

describe("teacher AI policy fields", () => {
  it("starts disabled with zero quota and enables at one answer", () => {
    const onChange = vi.fn();
    render(<AiPolicyFields value={{ aiAssistanceEnabled: false, maxAiRequests: 0,
      aiAssistanceLevel: "CONCEPTUAL_ONLY" }} onChange={onChange} />);

    expect(screen.getByRole("spinbutton", { name: /Lifetime answers/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Enable assistant/ }));
    expect(onChange).toHaveBeenCalledWith({ aiAssistanceEnabled: true, maxAiRequests: 1,
      aiAssistanceLevel: "CONCEPTUAL_ONLY" });
  });

  it("normalizes disabled quota to zero and lists all three levels", () => {
    const onChange = vi.fn();
    render(<AiPolicyFields value={{ aiAssistanceEnabled: true, maxAiRequests: 10,
      aiAssistanceLevel: "EXPLANATIONS_AND_GUIDING" }} onChange={onChange} />);

    expect(screen.getByRole("option", { name: "Conceptual only" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Explanations and guiding" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Guiding with snippets" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Assistance level" }),
      { target: { value: "EXPLANATIONS_GUIDING_AND_SNIPPETS" } });
    expect(onChange).toHaveBeenCalledWith({ aiAssistanceEnabled: true, maxAiRequests: 10,
      aiAssistanceLevel: "EXPLANATIONS_GUIDING_AND_SNIPPETS" });
    expect(normalizeAiPolicy({ aiAssistanceEnabled: false, maxAiRequests: 10,
      aiAssistanceLevel: "EXPLANATIONS_AND_GUIDING" }).maxAiRequests).toBe(0);
    expect(validAiPolicy({ aiAssistanceEnabled: true, maxAiRequests: 0,
      aiAssistanceLevel: "CONCEPTUAL_ONLY" })).toBe(false);
    expect(validAiPolicy({ aiAssistanceEnabled: true, maxAiRequests: 11,
      aiAssistanceLevel: "CONCEPTUAL_ONLY" })).toBe(false);
  });
});
