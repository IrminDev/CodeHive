import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthService } from "~/features/auth/services/auth.service";
import { ProfileSettingsModal } from "~/shared/components/ProfileSettingsModal";
import { Role, type User } from "~/shared/types/model/User";
import { getAuthToken, setAuthToken } from "../storage/token.storage";
import { AuthProvider, useAuth } from "./AuthProvider";

const notices = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sileo", () => ({ sileo: notices }));

const OLD_TOKEN = "old-session-token";
const NEW_TOKEN = "replacement-session-token";
const user: User = {
  id: "00000000-0000-0000-0000-000000000001", email: "student@example.com", name: "Ada", lastName: "Lovelace",
  enrollmentNumber: "2026630001", role: Role.STUDENT, scopes: [], isActive: true,
  temporaryPassword: true, createdAt: "2026-10-01T00:00:00Z",
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function SessionProbe() {
  const { user: current, isAuthenticated } = useAuth();
  return <>
    <output aria-label="Session state">{current?.role}:{String(current?.temporaryPassword)}:{String(isAuthenticated)}</output>
    <ProfileSettingsModal isOpen onClose={() => undefined} />
  </>;
}

function open() {
  render(<MemoryRouter><AuthProvider><SessionProbe /></AuthProvider></MemoryRouter>);
}

async function submitPassword() {
  fireEvent.click(screen.getByRole("button", { name: "Security" }));
  fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "old-password" } });
  fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "new-strong-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  setAuthToken(OLD_TOKEN);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

it.each([Role.STUDENT, Role.TEACHER, Role.ADMIN])("preserves %s access using replacement JWT after password change", async (role) => {
  let changed = false;
  const current = { ...user, role };
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const authorization = new Headers(init?.headers).get("Authorization");
    if (String(url).endsWith("/me/password")) {
      expect(authorization).toBe(`Bearer ${OLD_TOKEN}`);
      expect(JSON.parse(String(init?.body))).toEqual({ currentPassword: "old-password", newPassword: "new-strong-password" });
      changed = true;
      return response({ success: true, data: { token: NEW_TOKEN, user: { ...current, temporaryPassword: false } } });
    }
    if (authorization === `Bearer ${NEW_TOKEN}` || !changed && authorization === `Bearer ${OLD_TOKEN}`) {
      return response({ success: true, data: { ...current, temporaryPassword: !changed } });
    }
    return response({ error: "Token revoked" }, 403);
  });
  vi.stubGlobal("fetch", fetchMock);
  open();
  await waitFor(() => expect(screen.getByLabelText("Session state")).toHaveTextContent(`${role}:true:true`));

  await submitPassword();

  await waitFor(() => expect(screen.getByLabelText("Session state")).toHaveTextContent(`${role}:false:true`));
  expect(getAuthToken()).toBe(NEW_TOKEN);
  expect(notices.success).toHaveBeenCalledWith({ title: "Password updated successfully" });
  const protectedResponse = await AuthService.getMe();
  expect(protectedResponse.data.email).toBe(user.email);
  expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).toEqual({ Authorization: `Bearer ${NEW_TOKEN}` });
  expect(screen.getByLabelText("Current Password")).toHaveValue("");
  expect(screen.getByLabelText("New Password")).toHaveValue("");
});

it("keeps existing token and user state when password update fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => String(url).endsWith("/me/password")
    ? response({ error: "Incorrect current password" }, 401)
    : response({ success: true, data: user })));
  open();
  await waitFor(() => expect(screen.getByLabelText("Session state")).toHaveTextContent("STUDENT:true:true"));

  await submitPassword();

  await waitFor(() => expect(notices.error).toHaveBeenCalledWith({ title: "Incorrect current password" }));
  expect(getAuthToken()).toBe(OLD_TOKEN);
  expect(screen.getByLabelText("Session state")).toHaveTextContent("STUDENT:true:true");
  expect(notices.success).not.toHaveBeenCalled();
  expect(screen.getByLabelText("New Password")).toHaveValue("new-strong-password");
});
