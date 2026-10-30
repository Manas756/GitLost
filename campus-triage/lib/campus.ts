export const DEPARTMENTS = ["BTECH", "MCA", "SCI", "INFRA", "IT", "SAN"] as const;
export const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export const HANDLER_ROLES = ["TEACHER", "FACULTY", "ADMINISTRATIVE"] as const;
export const STATUSES = ["UNACKNOWLEDGED", "ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED", "RESOLVED"] as const;

export type DepartmentCode = (typeof DEPARTMENTS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type HandlerRole = (typeof HANDLER_ROLES)[number];
export type ComplaintStatus = (typeof STATUSES)[number];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
  LOW: 20,
};

export function computePriorityScore(priority: Priority, reportCount: number, damage: boolean, safety: boolean) {
  return Math.min(
    100,
    PRIORITY_WEIGHT[priority] +
      Math.min(15, Math.max(0, reportCount - 1) * 3) +
      (damage ? 10 : 0) +
      (safety ? 15 : 0),
  );
}

export function makePublicId(prefix: "CSR" | "REP") {
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
}

export function nextRole(role: HandlerRole): HandlerRole | null {
  if (role === "TEACHER") return "FACULTY";
  if (role === "FACULTY") return "ADMINISTRATIVE";
  return null;
}

export function containsHostel(value: string) {
  return /\b(hostel|hst|boys'? hostel|girls'? hostel)\b/i.test(value);
}
