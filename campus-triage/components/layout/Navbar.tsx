"use client";

import { roleConfig, type ActiveRole, useRole } from "@/context/RoleContext";

const roles: ActiveRole[] = [
  "STUDENT",
  "INFRA_ADMIN",
  "IT_ADMIN",
  "SAN_ADMIN",
  "HST_ADMIN",
  "SUPER_ADMIN",
];

export default function Navbar() {
  const { activeRole, setActiveRole } = useRole();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-950">
            CampusPulse
          </p>
          <p className="text-xs text-slate-500">Campus issue resolution hub</p>
        </div>

        <nav
          aria-label="Role switcher"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {roles.map((role) => {
            const isActive = role === activeRole;

            return (
              <button
                key={role}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveRole(role)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950"
                }`}
              >
                {roleConfig[role].label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
