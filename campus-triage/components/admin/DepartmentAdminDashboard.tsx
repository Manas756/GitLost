"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Loader2,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export type DepartmentCode = "INFRA" | "IT" | "SAN" | "HST" | "ACAD" | "SW";
type GroupStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type StatusFilter = "ALL" | GroupStatus;
type PriorityFilter = "ALL" | Priority;

interface DepartmentAdminDashboardProps {
  deptCode: DepartmentCode;
}

interface StudentReport {
  id: string;
  student_id: string;
  raw_text: string;
  image_url: string | null;
  created_at: string;
}

interface ComplaintGroup {
  id: string;
  title: string;
  location_zone: string;
  category: string;
  priority: Priority;
  priority_score: number;
  report_count: number;
  status: GroupStatus;
  sla_deadline: string;
  routing_reasoning?: string | null;
  primary_department?: { code: DepartmentCode; name: string } | null;
  collaborating_department_codes?: DepartmentCode[] | null;
  complaints: StudentReport[];
}

interface SupabaseGroupRow
  extends Omit<ComplaintGroup, "complaints" | "primary_department"> {
  complaints: StudentReport[] | null;
  primary_department:
    | { code: DepartmentCode; name: string }
    | { code: DepartmentCode; name: string }[]
    | null;
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "All status" },
  { value: "OPEN", label: "Unacknowledged" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ESCALATED", label: "Escalated" },
];

const PRIORITY_OPTIONS: Array<{ value: PriorityFilter; label: string }> = [
  { value: "ALL", label: "All priority" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const priorityClasses: Record<Priority, string> = {
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-300",
  HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  MEDIUM: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const statusClasses: Record<GroupStatus, string> = {
  OPEN: "border-slate-600 bg-slate-800 text-slate-300",
  IN_PROGRESS: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  RESOLVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  ESCALATED: "border-red-500/30 bg-red-500/10 text-red-300",
};

function formatStatus(status: GroupStatus): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function formatCountdown(deadline: string, now: number): string {
  const remaining = new Date(deadline).getTime() - now;
  if (remaining <= 0) return "SLA breached";

  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function normalizeDepartment(
  department: SupabaseGroupRow["primary_department"],
): ComplaintGroup["primary_department"] {
  return Array.isArray(department) ? department[0] ?? null : department;
}

export default function DepartmentAdminDashboard({
  deptCode,
}: DepartmentAdminDashboardProps) {
  const [groups, setGroups] = useState<ComplaintGroup[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("complaint_groups")
      .select(
        "id,title,location_zone,category,priority,priority_score,report_count,status,sla_deadline,routing_reasoning,primary_department:departments!primary_department_id(code,name),complaints(id,student_id,raw_text,image_url,created_at)",
      )
      .eq("primary_department.code", deptCode)
      .order("priority_score", { ascending: false });

    if (error) {
      setLoadError("Unable to load complaint groups. Please try again.");
      setIsLoading(false);
      return;
    }

    const normalized = ((data ?? []) as SupabaseGroupRow[]).map((group) => ({
      ...group,
      primary_department: normalizeDepartment(group.primary_department),
      complaints: group.complaints ?? [],
    }));
    setGroups(normalized);
    setIsLoading(false);
  }, [deptCode]);

  useEffect(() => {
    const request = window.setTimeout(() => {
      void loadGroups();
    }, 0);

    return () => window.clearTimeout(request);
  }, [loadGroups]);

  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          (statusFilter === "ALL" || group.status === statusFilter) &&
          (priorityFilter === "ALL" || group.priority === priorityFilter),
      ),
    [groups, priorityFilter, statusFilter],
  );

  async function updateStatus(group: ComplaintGroup, status: GroupStatus) {
    if (group.status === status) return;
    const previousStatus = group.status;
    setUpdatingId(group.id);
    setGroups((current) =>
      current.map((item) =>
        item.id === group.id ? { ...item, status } : item,
      ),
    );

    const { error } = await supabase
      .from("complaint_groups")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", group.id);

    if (error) {
      setGroups((current) =>
        current.map((item) =>
          item.id === group.id
            ? { ...item, status: previousStatus }
            : item,
        ),
      );
      setLoadError("Status update failed. The previous status was restored.");
    }
    setUpdatingId(null);
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white shadow-xl sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">{deptCode} operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Complaint groups
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Review clustered reports and keep response SLAs on track.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="size-4" aria-hidden="true" />
          <span>{filteredGroups.length} groups</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-800 py-4 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 text-sm text-slate-400">
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 items-center gap-2 text-sm text-slate-400">
          <span className="sr-only">Filter by priority</span>
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as PriorityFilter)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loadError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Loading complaint groups...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle2 className="mx-auto size-8 text-emerald-400" aria-hidden="true" />
          <p className="mt-3 font-medium text-slate-200">No matching complaint groups</p>
          <p className="mt-1 text-sm text-slate-500">Try changing the active filters.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filteredGroups.map((group) => {
            const isExpanded = expandedId === group.id;
            const isBreached =
              new Date(group.sla_deadline).getTime() <= now &&
              group.status !== "RESOLVED";

            return (
              <article
                key={group.id}
                className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60"
              >
                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-center">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium text-slate-100">{group.title}</h2>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {group.location_zone} · {group.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Priority score</p>
                    <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${priorityClasses[group.priority]}`}>
                      {group.priority} · {group.priority_score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Users className="size-4 text-slate-500" aria-hidden="true" />
                    <span><strong>{group.report_count}</strong> reports</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isBreached ? "text-red-300" : "text-slate-300"}`}>
                    <Clock className="size-4" aria-hidden="true" />
                    <span>{formatCountdown(group.sla_deadline, now)}</span>
                  </div>
                  <span className={`w-fit rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses[group.status]}`}>
                    {formatStatus(group.status)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : group.id)}
                      aria-expanded={isExpanded}
                      className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void updateStatus(
                          group,
                          group.status === "OPEN" ? "IN_PROGRESS" : "RESOLVED",
                        )
                      }
                      disabled={updatingId === group.id || group.status === "RESOLVED"}
                      className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === group.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      {group.status === "OPEN" ? "Acknowledge" : "Resolve"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-900/70 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200">Administrative actions</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"] as GroupStatus[]).map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={updatingId === group.id || group.status === status}
                              onClick={() => void updateStatus(group, status)}
                              className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${statusClasses[status]} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {formatStatus(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="max-w-xl text-sm text-slate-400">
                        <p className="font-semibold text-slate-200">AI routing reasoning</p>
                        <p className="mt-1">{group.routing_reasoning ?? "Routing reasoning is not available for this group."}</p>
                      </div>
                    </div>
                    <div className="mt-5">
                      <h3 className="text-sm font-semibold text-slate-200">Linked student reports</h3>
                      <div className="mt-2 space-y-2">
                        {group.complaints.length === 0 ? (
                          <p className="text-sm text-slate-500">No individual reports are available.</p>
                        ) : (
                          group.complaints.map((report) => (
                            <div key={report.id} className="rounded-md border border-slate-800 p-3">
                              <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                                <span>Student {report.student_id}</span>
                                <time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString()}</time>
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{report.raw_text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
