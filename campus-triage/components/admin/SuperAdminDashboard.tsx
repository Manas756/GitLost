"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Lock,
  ShieldAlert,
  TrendingUp,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DepartmentCode = "INFRA" | "IT" | "SAN" | "HST" | "ACAD" | "SW";
type GroupStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface SuperAdminDashboardProps {
  className?: string;
}

interface ComplaintGroup {
  id: string;
  title: string;
  location_zone: string;
  priority: Priority;
  priority_score: number;
  report_count: number;
  status: GroupStatus;
  escalated_to_super_admin: boolean;
  primary_department_id: string;
  sla_deadline: string;
}

interface Department {
  id: string;
  name: string;
  code: DepartmentCode;
  is_active: boolean;
  sla_minutes: number;
}

interface StudentIdentity {
  rollNumber: string;
  email: string;
}

interface MetricCard {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone: string;
}

interface GroupRow {
  id: string;
  title: string;
  studentId: string;
}

interface IdentityRevealModalProps {
  group: GroupRow;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (justification: string) => void;
}

const DEPARTMENT_DEFAULTS: Array<{
  code: DepartmentCode;
  name: string;
}> = [
  { code: "INFRA", name: "Infrastructure" },
  { code: "IT", name: "IT Support" },
  { code: "SAN", name: "Sanitation" },
  { code: "HST", name: "Hostel" },
  { code: "ACAD", name: "Academics" },
  { code: "SW", name: "Student Welfare" },
];

const priorityClasses: Record<Priority, string> = {
  CRITICAL: "text-red-300",
  HIGH: "text-orange-300",
  MEDIUM: "text-yellow-300",
  LOW: "text-emerald-300",
};

function isActiveGroup(group: ComplaintGroup): boolean {
  return group.status !== "RESOLVED";
}

function isSlaBreached(group: ComplaintGroup, now: number): boolean {
  return isActiveGroup(group) && new Date(group.sla_deadline).getTime() <= now;
}

function IdentityRevealModal({
  group,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: IdentityRevealModalProps) {
  const [justification, setJustification] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(justification.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-reveal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300">
              <Unlock className="size-5" aria-hidden="true" />
              <span className="text-sm font-semibold">Restricted action</span>
            </div>
            <h2 id="identity-reveal-title" className="mt-2 text-xl font-semibold">
              Reveal student identity
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close identity reveal dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          This access is immutable and will be recorded in the identity audit
          log for <span className="font-medium text-slate-200">{group.title}</span>.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label
              htmlFor="identity-justification"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Justification <span className="text-red-400">*</span>
            </label>
            <textarea
              id="identity-justification"
              required
              minLength={10}
              rows={4}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              placeholder="Explain why identity access is necessary for this operational decision."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || justification.trim().length < 10}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Confirm audited reveal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard({
  className = "",
}: SuperAdminDashboardProps) {
  const [groups, setGroups] = useState<ComplaintGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rawSubmissionCount, setRawSubmissionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedIdentity, setRevealedIdentity] = useState<
    Record<string, StudentIdentity>
  >({});
  const [updatingDepartmentId, setUpdatingDepartmentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [groupsResult, departmentsResult, submissionsResult] = await Promise.all([
      supabase
        .from("complaint_groups")
        .select(
          "id,title,location_zone,priority,priority_score,report_count,status,escalated_to_super_admin,primary_department_id,sla_deadline",
        )
        .order("priority_score", { ascending: false }),
      supabase
        .from("departments")
        .select("id,name,code,is_active,sla_minutes")
        .order("name"),
      supabase.from("complaints").select("id", { count: "exact", head: true }),
    ]);

    if (groupsResult.error || departmentsResult.error || submissionsResult.error) {
      setError(
        groupsResult.error?.message ??
          departmentsResult.error?.message ??
          submissionsResult.error?.message ??
          "Unable to load command center data.",
      );
      setIsLoading(false);
      return;
    }

    setGroups((groupsResult.data ?? []) as ComplaintGroup[]);
    setDepartments((departmentsResult.data ?? []) as Department[]);
    setRawSubmissionCount(submissionsResult.count ?? 0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(request);
  }, [loadDashboard]);

  const metrics = useMemo<MetricCard[]>(() => {
    const active = groups.filter(isActiveGroup);
    const criticalUnacknowledged = groups.filter(
      (group) =>
        group.priority === "CRITICAL" &&
        group.status === "OPEN",
    ).length;
    const breached = groups.filter((group) => isSlaBreached(group, now)).length;
    const clusteredReports = groups.reduce(
      (total, group) => total + group.report_count,
      0,
    );

    return [
      {
        label: "Total active issues",
        value: active.length.toLocaleString(),
        detail: "Open, in progress, or escalated",
        icon: Activity,
        tone: "text-sky-300",
      },
      {
        label: "Critical unacknowledged",
        value: criticalUnacknowledged.toLocaleString(),
        detail: "Requires immediate ownership",
        icon: AlertOctagon,
        tone: "text-red-300",
      },
      {
        label: "SLA breached",
        value: breached.toLocaleString(),
        detail: "Active groups past deadline",
        icon: Clock3,
        tone: "text-amber-300",
      },
      {
        label: "Clustered vs raw reports",
        value: `${clusteredReports.toLocaleString()} / ${rawSubmissionCount.toLocaleString()}`,
        detail: "Clustered reports / raw submissions",
        icon: Users,
        tone: "text-violet-300",
      },
    ];
  }, [groups, now, rawSubmissionCount]);

  const escalations = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.escalated_to_super_admin || group.status === "ESCALATED",
      ),
    [groups],
  );

  function departmentStats(department: Department) {
    const departmentGroups = groups.filter(
      (group) => group.primary_department_id === department.id,
    );
    return {
      active: departmentGroups.filter(isActiveGroup).length,
      resolved: departmentGroups.filter((group) => group.status === "RESOLVED")
        .length,
    };
  }

  async function updateEscalation(
    group: ComplaintGroup,
    changes: Partial<Pick<ComplaintGroup, "status" | "escalated_to_super_admin">>,
  ) {
    setGroups((current) =>
      current.map((item) => (item.id === group.id ? { ...item, ...changes } : item)),
    );
    const { error: updateError } = await supabase
      .from("complaint_groups")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", group.id);

    if (updateError) {
      setError(`Could not update "${group.title}": ${updateError.message}`);
      setGroups((current) =>
        current.map((item) => (item.id === group.id ? group : item)),
      );
    }
  }

  async function updateDepartment(
    department: Department,
    changes: Partial<Pick<Department, "is_active" | "sla_minutes">>,
  ) {
    setUpdatingDepartmentId(department.id);
    setDepartments((current) =>
      current.map((item) =>
        item.id === department.id ? { ...item, ...changes } : item,
      ),
    );

    const { error: updateError } = await supabase
      .from("departments")
      .update(changes)
      .eq("id", department.id);

    if (updateError) {
      setError(`Could not update ${department.name}: ${updateError.message}`);
      setDepartments((current) =>
        current.map((item) => (item.id === department.id ? department : item)),
      );
    }
    setUpdatingDepartmentId(null);
  }

  async function revealIdentity(justification: string) {
    if (!selectedGroup || justification.length < 10) return;
    setIsRevealing(true);
    setRevealError(null);

    const { data: report, error: reportError } = await supabase
      .from("complaints")
      .select("student_id")
      .eq("group_id", selectedGroup.id)
      .limit(1)
      .maybeSingle();

    if (reportError || !report?.student_id) {
      setRevealError(reportError?.message ?? "No student report is linked to this group.");
      setIsRevealing(false);
      return;
    }

    const { error: auditError } = await supabase.from("identity_access_logs").insert({
      complaint_group_id: selectedGroup.id,
      student_id: report.student_id,
      justification,
      accessed_at: new Date().toISOString(),
    });

    if (auditError) {
      setRevealError(`Identity access was not logged: ${auditError.message}`);
      setIsRevealing(false);
      return;
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("roll_number,email")
      .eq("id", report.student_id)
      .single();

    if (studentError || !student) {
      setRevealError(
        studentError?.message ??
          "Audit saved, but student identity could not be retrieved.",
      );
      setIsRevealing(false);
      return;
    }

    setRevealedIdentity((current) => ({
      ...current,
      [selectedGroup.id]: {
        rollNumber: String(student.roll_number),
        email: String(student.email),
      },
    }));
    setSelectedGroup(null);
    setIsRevealing(false);
  }

  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-950 p-4 text-white shadow-xl sm:p-6 ${className}`}
      aria-labelledby="super-admin-dashboard-title"
    >
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-violet-300">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Registrar / Principal command center
          </p>
          <h1 id="super-admin-dashboard-title" className="mt-1 text-2xl font-semibold">
            Campus-wide operations
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="size-4 text-emerald-400" aria-hidden="true" />
          Live operational view
        </div>
      </div>

      {error && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Loading campus operations...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <Icon className={`size-5 ${metric.tone}`} aria-hidden="true" />
                  <p className="mt-4 text-sm text-slate-400">{metric.label}</p>
                  <p className="mt-1 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                </div>
              );
            })}
          </div>

          <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-red-200">
                  <AlertOctagon className="size-5" aria-hidden="true" />
                  Critical SLA escalations
                </h2>
                <p className="mt-1 text-sm text-red-200/60">
                  Safety-critical and manually escalated issues requiring executive oversight.
                </p>
              </div>
              <span className="text-sm font-semibold text-red-300">{escalations.length} active</span>
            </div>
            {escalations.length === 0 ? (
              <p className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                No critical escalations require attention.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {escalations.map((group) => (
                  <div key={group.id} className="flex flex-col gap-3 rounded-md border border-red-500/20 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{group.title}</p>
                      <p className={`mt-1 text-xs ${priorityClasses[group.priority]}`}>
                        {group.priority} · {group.location_zone} · {group.report_count} reports
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void updateEscalation(group, { status: "IN_PROGRESS" })}
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Reassign / own
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateEscalation(group, { escalated_to_super_admin: false, status: "IN_PROGRESS" })}
                        className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400"
                      >
                        Override escalation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Department management matrix</h2>
                <p className="mt-1 text-sm text-slate-500">Control operational availability and default SLA windows.</p>
              </div>
              <TrendingUp className="size-4 text-slate-500" aria-hidden="true" />
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Active issues</th>
                    <th className="px-4 py-3">Resolved</th>
                    <th className="px-4 py-3">SLA timer</th>
                    <th className="px-4 py-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {DEPARTMENT_DEFAULTS.map((defaultDepartment) => {
                    const department = departments.find((item) => item.code === defaultDepartment.code);
                    if (!department) return null;
                    const stats = departmentStats(department);
                    return (
                      <tr key={department.id} className="bg-slate-950/40">
                        <td className="px-4 py-3 font-medium text-slate-200">{department.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{department.code}</td>
                        <td className="px-4 py-3 text-slate-300">{stats.active}</td>
                        <td className="px-4 py-3 text-emerald-300">{stats.resolved}</td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-2">
                            <span className="sr-only">SLA minutes for {department.name}</span>
                            <input
                              type="number"
                              min={1}
                              value={department.sla_minutes}
                              disabled={updatingDepartmentId === department.id}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                if (Number.isFinite(value) && value > 0) {
                                  void updateDepartment(department, { sla_minutes: value });
                                }
                              }}
                              className="w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-200 outline-none focus:border-sky-500"
                            />
                            <span className="text-xs text-slate-500">min</span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void updateDepartment(department, { is_active: !department.is_active })}
                            disabled={updatingDepartmentId === department.id}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${department.is_active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-slate-400"}`}
                          >
                            {department.is_active ? <Unlock className="size-3" /> : <Lock className="size-3" />}
                            {department.is_active ? "Active" : "Paused"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-semibold">Audited identity access</h2>
            <p className="mt-1 text-sm text-slate-500">Identity remains masked until a documented operational need is approved.</p>
            <div className="mt-3 space-y-2">
              {groups.slice(0, 5).map((group) => {
                const revealed = revealedIdentity[group.id];
                return (
                  <div key={group.id} className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{group.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {revealed ? `${revealed.rollNumber} · ${revealed.email}` : "Student identity masked"}
                      </p>
                    </div>
                    {revealed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                        <Unlock className="size-3" aria-hidden="true" /> Audited reveal complete
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRevealError(null);
                          setSelectedGroup({ id: group.id, title: group.title, studentId: "" });
                        }}
                        className="inline-flex items-center gap-2 self-start rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 sm:self-auto"
                      >
                        <Lock className="size-3" aria-hidden="true" /> Reveal student identity
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {selectedGroup && (
        <IdentityRevealModal
          group={selectedGroup}
          isSubmitting={isRevealing}
          error={revealError}
          onClose={() => {
            if (!isRevealing) setSelectedGroup(null);
          }}
          onSubmit={(justification) => void revealIdentity(justification)}
        />
      )}
    </section>
  );
}
