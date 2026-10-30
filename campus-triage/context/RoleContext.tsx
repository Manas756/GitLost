"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ActiveRole =
  | "STUDENT"
  | "INFRA_ADMIN"
  | "IT_ADMIN"
  | "SAN_ADMIN"
  | "HST_ADMIN"
  | "SUPER_ADMIN";

export type DepartmentCode = "INFRA" | "IT" | "SAN" | "HST" | "ACAD" | "SW";

export interface RoleConfig {
  label: string;
  deptCode?: DepartmentCode;
}

export const roleConfig: Record<ActiveRole, RoleConfig> = {
  STUDENT: { label: "Student" },
  INFRA_ADMIN: { label: "Infrastructure Admin", deptCode: "INFRA" },
  IT_ADMIN: { label: "IT Admin", deptCode: "IT" },
  SAN_ADMIN: { label: "Sanitation Admin", deptCode: "SAN" },
  HST_ADMIN: { label: "Hostel Admin", deptCode: "HST" },
  SUPER_ADMIN: { label: "Super Admin" },
};

interface RoleContextValue {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  roleConfig: RoleConfig;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [activeRole, setActiveRole] = useState<ActiveRole>("STUDENT");
  const value = useMemo(
    () => ({
      activeRole,
      setActiveRole,
      roleConfig: roleConfig[activeRole],
    }),
    [activeRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }

  return context;
}
