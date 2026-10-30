"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ActiveRole = "STUDENT" | "TEACHER" | "FACULTY" | "ADMINISTRATIVE";
export type DepartmentCode = "BTECH" | "MCA" | "SCI" | "INFRA" | "IT" | "SAN";

export const roleConfig: Record<ActiveRole, { label: string; description: string }> = {
  STUDENT: { label: "Student", description: "Submit and track anonymous campus issues." },
  TEACHER: { label: "Teacher", description: "Tier 1 triage and first response queue." },
  FACULTY: { label: "Faculty", description: "Tier 2 escalation and coordination queue." },
  ADMINISTRATIVE: { label: "Administrative", description: "Tier 3 command and resolution queue." },
};

interface RoleContextValue {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  roleConfig: (typeof roleConfig)[ActiveRole];
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [activeRole, setActiveRole] = useState<ActiveRole>("STUDENT");
  const value = useMemo(
    () => ({ activeRole, setActiveRole, roleConfig: roleConfig[activeRole] }),
    [activeRole],
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error("useRole must be used within a RoleProvider");
  return value;
}
