"use client";

import { roleConfig, type ActiveRole, useRole } from "@/context/RoleContext";
import { ArrowRight, LayoutDashboard, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname?.startsWith("/dashboard");

  const handleRoleSelect = (role: ActiveRole) => {
    setActiveRole(role);
    if (!isDashboard) {
      router.push("/dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition-transform group-hover:scale-105">
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-950">
                  CampusPulse
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  HPTU
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Autonomous Campus Operations & Triage
              </p>
            </div>
          </Link>

          {/* Mobile Launch CTA if on landing page */}
          {!isDashboard && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 lg:hidden"
            >
              <span>Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Dynamic Center/Right Bar */}
        {isDashboard ? (
          /* Role Switcher when in Workspace */
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Role:
            </div>
            <nav aria-label="Role switcher" className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              {roles.map((role) => {
                const isActive = role === activeRole;
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveRole(role)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {roleConfig[role].label}
                  </button>
                );
              })}
            </nav>
            <div className="hidden lg:block h-4 w-px bg-slate-200 mx-1" />
            <Link
              href="/"
              className="hidden lg:inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Exit to Home
            </Link>
          </div>
        ) : (
          /* Navigation Links & Quick Launch when on Landing Page */
          <div className="flex items-center justify-between lg:justify-end gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-slate-950 transition-colors">
                How It Works
              </a>
              <a href="#demo" className="hover:text-slate-950 transition-colors">
                AI Triage Demo
              </a>
              <a href="#departments" className="hover:text-slate-950 transition-colors">
                Departments
              </a>
              <a href="#architecture" className="hover:text-slate-950 transition-colors">
                Architecture
              </a>
            </nav>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleRoleSelect("STUDENT")}
                className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Student Portal
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all hover:gap-2.5 active:scale-98"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
                <span>Launch Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
