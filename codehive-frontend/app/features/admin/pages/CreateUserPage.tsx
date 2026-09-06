import { useMemo, useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { sileo } from "sileo";
import { useAuth } from "~/core/providers/AuthProvider";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import { AuthService } from "~/features/auth/services/auth.service";
import { Role, Scope } from "~/shared/types/model/User";
import { AdminShell } from "../components/AdminShell";
import { AdminPageHeader, inputClass, panelClass, primaryCompactClass } from "../components/AdminUI";
import { hasEffectiveScope } from "../utils/permissions";

const emptyForm = { name: "", fatherLastName: "", motherLastName: "", enrollmentNumber: "", email: "" };

export function CreateUserPage() {
  const { user } = useAuth(); const [form, setForm] = useState(emptyForm); const [role, setRole] = useState<Role | null>(null); const [busy, setBusy] = useState(false);
  const roles = useMemo(() => {
    const result: Role[] = [];
    if (hasEffectiveScope(user, Scope.CREATE_USERS)) result.push(Role.STUDENT, Role.TEACHER);
    if (hasEffectiveScope(user, Scope.CREATE_ADMINS)) result.push(Role.ADMIN);
    return result;
  }, [user]);
  const selectedRole = role && roles.includes(role) ? role : roles[0];
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!selectedRole) return; setBusy(true);
    try { await AuthService.signUp({ ...form, role: selectedRole }); sileo.success({ title: "User created. Temporary credentials were emailed." }); setForm(emptyForm); setRole(null); }
    catch (cause) { sileo.error({ title: cause instanceof Error ? cause.message : "Registration failed." }); }
    finally { setBusy(false); }
  }
  function field(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  return <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: "Create" }]} contentClassName="max-w-3xl">
    <AdminPageHeader eyebrow="Registration" title="Create user" description="Create one permitted account. Temporary credentials are delivered by email." actions={<Link to="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-azure dark:hover:text-yellow"><ArrowLeft size={14} /> Users</Link>} />
    <form onSubmit={(event) => void submit(event)} className={`${panelClass} p-5 sm:p-7 space-y-5`}>
      <Field label="Role"><Dropdown value={selectedRole ?? ""} onChange={(value) => setRole(value as Role)} required options={roles.map((item) => ({ value: item, label: item[0] + item.slice(1).toLowerCase() }))} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Name(s)"><input className={inputClass} value={form.name} onChange={(event) => field("name", event.target.value)} required minLength={2} maxLength={50} /></Field><Field label="Email"><input className={inputClass} type="email" value={form.email} onChange={(event) => field("email", event.target.value)} required maxLength={100} /></Field><Field label="Father's last name"><input className={inputClass} value={form.fatherLastName} onChange={(event) => field("fatherLastName", event.target.value)} required /></Field><Field label="Mother's last name"><input className={inputClass} value={form.motherLastName} onChange={(event) => field("motherLastName", event.target.value)} required /></Field></div>
      <Field label="Enrollment number"><input className={`${inputClass} font-mono`} value={form.enrollmentNumber} onChange={(event) => field("enrollmentNumber", event.target.value)} required maxLength={10} pattern={selectedRole === Role.STUDENT ? "(199[4-9]|[2-9][0-9]{3})630[0-9]{3}" : "[A-Za-z0-9._-]{1,10}"} /><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedRole === Role.STUDENT ? "Format YYYY630XXX; year 1994 or later." : "Up to 10 letters, numbers, dots, underscores, or hyphens."}</p></Field>
      <button type="submit" disabled={busy || !selectedRole} className={`${primaryCompactClass} w-full py-3 text-sm`}><UserPlus size={16} /> {busy ? "Creating…" : "Create user"}</button>
    </form>
  </AdminShell>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</span>{children}</label>; }
