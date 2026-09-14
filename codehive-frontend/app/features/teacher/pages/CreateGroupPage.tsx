import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Link2 } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { createGroup } from "../api/group.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";

export function CreateGroupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      sileo.success({ title: "Group created. Share its join code with students." });
      navigate(`/teacher/groups/${group.id}`);
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to create group." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <form onSubmit={submit} className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => navigate("/teacher/groups")} className="btn-outline p-2.5" aria-label="Back to groups">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">Group management</p>
            <h1 className="text-3xl font-bold mt-1">Create group</h1>
            <p className="text-gray-500 mt-1">Create owned classroom group and generate join code.</p>
          </div>
        </div>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-6 grid gap-5">
          <label className="grid gap-2 text-sm font-medium">
            Group name
            <input
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. CS-201 · Algorithms"
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-surface"
            />
            <span className="text-xs text-gray-500 font-normal">Maximum 120 characters.</span>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <textarea
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Course scope, section, term, or meeting information"
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-surface"
            />
          </label>
          <div className="flex gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-surface text-sm text-gray-500">
            <Link2 size={17} className="text-azure flex-shrink-0 mt-0.5" />
            <p>CodeHive generates unique 8-character join code. Students enroll using code from Join Group page.</p>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate("/teacher/groups")} className="btn-outline">Cancel</button>
          <button disabled={submitting || !name.trim()} className="btn-primary">
            {submitting ? "Creating…" : "Create group"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
