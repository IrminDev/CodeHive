import { useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import type { User } from "~/shared/types/model/User";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminApiError } from "../api/client";
import { updateAdminUser, updateAdminUserRole, updateAdminUserScopes, updateAdminUserStatus } from "../api/admin.api";
import type { AdminUserDetail } from "../types/admin.types";
import { availableRoleChanges, editableScopes } from "../utils/permissions";
import { AdminDialog, inputClass } from "./AdminUI";

export type UserAction = "profile" | "role" | "scopes" | "block" | "unblock" | "delete" | null;

export function AdminUserDialogs({ action, detail, actor, onClose, onUpdated, onDeleted }: {
  action: UserAction; detail: AdminUserDetail; actor: User | null; onClose: () => void; onUpdated: (detail: AdminUserDetail) => void; onDeleted: () => void;
}) {
  const target = detail.user;
  const roleOptions = availableRoleChanges(actor, target);
  const scopeOptions = editableScopes(actor, target);
  const [name, setName] = useState(target.name); const [lastName, setLastName] = useState(target.lastName); const [email, setEmail] = useState(target.email); const [enrollment, setEnrollment] = useState(target.enrollmentNumber);
  const [role, setRole] = useState<Role>(roleOptions[0] ?? target.role); const [selectedScopes, setSelectedScopes] = useState<Set<Scope>>(new Set(target.scopes));
  const [reason, setReason] = useState(""); const [identity, setIdentity] = useState(""); const [busy, setBusy] = useState(false); const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    setName(target.name); setLastName(target.lastName); setEmail(target.email); setEnrollment(target.enrollmentNumber); setRole(roleOptions[0] ?? target.role); setSelectedScopes(new Set(target.scopes)); setReason(""); setIdentity(""); setErrors([]); setBusy(false);
  }, [action, target.email, target.enrollmentNumber, target.lastName, target.name, target.role]);

  const scopeChanges = useMemo(() => {
    const original = new Set(target.scopes);
    return { grant: scopeOptions.filter((scope) => selectedScopes.has(scope) && !original.has(scope)), revoke: scopeOptions.filter((scope) => !selectedScopes.has(scope) && original.has(scope)) };
  }, [scopeOptions, selectedScopes, target.scopes]);
  const reasonValid = reason.trim().length >= 10 && reason.trim().length <= 500;
  const identityValid = identity.trim().toLowerCase() === target.email.toLowerCase() || identity.trim() === target.enrollmentNumber;
  const scopeDeletesGroups = action === "scopes" && detail.resources.ownedGroups > 0
    && scopeChanges.revoke.includes(Scope.CREATE_GROUP);
  const profileValid = name.trim().length >= 2 && lastName.trim().length >= 2 && enrollment.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const roleValid = roleOptions.includes(role) && enrollment.trim().length > 0;
  const actionValid = action === "profile" ? profileValid : action === "role" ? roleValid : action === "scopes" ? scopeChanges.grant.length + scopeChanges.revoke.length > 0 && (!scopeDeletesGroups || identityValid) : action === "delete" ? identityValid : true;
  const disabled = !reasonValid || !actionValid;

  async function submit() {
    if (!action || disabled) return;
    setBusy(true); setErrors([]);
    try {
      let updated: AdminUserDetail;
      if (action === "profile") updated = await updateAdminUser(target.id, { name: name.trim(), lastName: lastName.trim(), enrollmentNumber: enrollment.trim(), email: email.trim(), reason: reason.trim() });
      else if (action === "role") updated = await updateAdminUserRole(target.id, { role, enrollmentNumber: enrollment.trim(), reason: reason.trim(), confirmEnrollmentCancellation: target.role === Role.STUDENT && role !== Role.STUDENT && detail.resources.activeEnrollments > 0, confirmOwnedGroupDeletion: role === Role.ADMIN && detail.resources.ownedGroups > 0 });
      else if (action === "scopes") updated = await updateAdminUserScopes(target.id, { ...scopeChanges, reason: reason.trim(), confirmOwnedGroupDeletion: scopeDeletesGroups });
      else updated = await updateAdminUserStatus(target.id, { status: action === "block" ? "BLOCKED" : action === "unblock" ? "ACTIVE" : "DELETED", reason: reason.trim() });
      sileo.success({ title: action === "delete" ? "User deleted." : "User updated." });
      if (action === "delete") onDeleted(); else { onUpdated(updated); onClose(); }
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.details.length > 0) setErrors(cause.details);
      sileo.error({ title: cause instanceof Error ? cause.message : "Administrative action failed." });
    } finally { setBusy(false); }
  }

  const config = dialogConfig(action, target.name, target.status);
  return <AdminDialog open={Boolean(action)} title={config.title} description={config.description} confirmLabel={config.confirmLabel} danger={action === "block" || action === "delete"} busy={busy} confirmDisabled={disabled} onCancel={onClose} onConfirm={() => void submit()}>
    <div className="space-y-4">
      {action === "profile" && <><Field label="Name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={50} /></Field><Field label="Last name(s)"><input className={inputClass} value={lastName} onChange={(event) => setLastName(event.target.value)} minLength={2} maxLength={80} /></Field><Field label="Email"><input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={100} /></Field><Field label="Enrollment number"><input className={`${inputClass} font-mono`} value={enrollment} onChange={(event) => setEnrollment(event.target.value)} maxLength={10} /></Field></>}
      {action === "role" && <><Field label="New role"><Dropdown value={role} onChange={(value) => setRole(value as Role)} options={roleOptions.map((option) => ({ value: option, label: option }))} /></Field><Field label="Enrollment number"><input className={`${inputClass} font-mono`} value={enrollment} onChange={(event) => setEnrollment(event.target.value)} maxLength={50} /></Field>{target.role === Role.STUDENT && role !== Role.STUDENT && detail.resources.activeEnrollments > 0 && <p className="text-sm text-amber-600">This cancels {detail.resources.activeEnrollments} active enrollment(s). Rejoining later requires group code.</p>}{role === Role.ADMIN && detail.resources.ownedGroups > 0 && <p className="text-sm text-red-600">This permanently soft-deletes {detail.resources.ownedGroups} owned group(s). They cannot be restored by owner.</p>}</>}
      {action === "scopes" && <fieldset><legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delegable scopes</legend>{target.role === Role.TEACHER ? <p className="text-sm text-gray-500">CREATE GROUP is mandatory for teachers and cannot be removed.</p> : <div className="grid gap-2 sm:grid-cols-2">{scopeOptions.map((scope) => <label key={scope} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-xs"><input type="checkbox" checked={selectedScopes.has(scope)} onChange={() => setSelectedScopes((current) => { const next = new Set(current); next.has(scope) ? next.delete(scope) : next.add(scope); return next; })} className="accent-azure" /><span>{scope.replaceAll("_", " ")}</span></label>)}</div>}<p className="mt-2 text-xs text-gray-500">MANAGE_GROUPS is reserved. At least one active superadmin must remain.</p>{scopeDeletesGroups && <><p className="mt-3 text-sm text-red-600">Revoking CREATE GROUP permanently soft-deletes {detail.resources.ownedGroups} owned group(s).</p><Field label={`Type ${target.email} or ${target.enrollmentNumber} to confirm`}><input className={inputClass} value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="off" /></Field></>}</fieldset>}
      {action === "delete" && <Field label={`Type ${target.email} or ${target.enrollmentNumber} to confirm`}><input className={inputClass} value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="off" /></Field>}
      <Field label="Administrative reason"><textarea className={`${inputClass} min-h-24 resize-y`} value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="Explain why this change is required…" /><p className={`mt-1 text-xs ${reason.length > 0 && !reasonValid ? "text-red-500" : "text-gray-400"}`}>{reason.length}/500 · minimum 10 characters</p></Field>
      {errors.length > 0 && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-sm font-semibold text-red-500">Operation blocked</p><ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-red-600 dark:text-red-400">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    </div>
  </AdminDialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</span>{children}</label>; }

function dialogConfig(action: UserAction, name: string, status: string) {
  if (action === "profile") return { title: `Edit ${name}`, description: "Update identity fields. Existing email and enrollment values remain globally reserved.", confirmLabel: "Save profile" };
  if (action === "role") return { title: `Change ${name}'s role`, description: "Role changes can cancel student enrollments or terminally delete groups when moving to admin.", confirmLabel: "Change role" };
  if (action === "scopes") return { title: `Manage ${name}'s scopes`, description: "Grant or revoke only scopes you may delegate.", confirmLabel: "Save scopes" };
  if (action === "block") return { title: `Block ${name}?`, description: "Login and password recovery stop immediately. Every active owned group is archived.", confirmLabel: "Block user" };
  if (action === "unblock") return { title: `Unblock ${name}?`, description: "Account access returns, but owned groups remain archived and require separate owner action.", confirmLabel: "Unblock user" };
  if (action === "delete") return { title: `Delete ${name}?`, description: "Account and active owned groups are soft-deleted. No restore endpoint exists.", confirmLabel: "Delete permanently" };
  return { title: status, description: "", confirmLabel: "Confirm" };
}
