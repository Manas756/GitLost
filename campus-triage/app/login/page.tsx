"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ActiveRole, DepartmentCode } from "@/context/RoleContext";

const roles: Array<{ value: Exclude<ActiveRole, "STUDENT"> | "STUDENT"; label: string }> = [
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
  { value: "FACULTY", label: "Faculty" },
  { value: "ADMINISTRATIVE", label: "Administrative" },
];

const departments: Array<{ value: DepartmentCode; label: string }> = [
  { value: "BTECH", label: "B.Tech / Technical" },
  { value: "MCA", label: "MCA" },
  { value: "SCI", label: "Applied Sciences" },
  { value: "INFRA", label: "Infrastructure & Maintenance" },
  { value: "IT", label: "IT & Network Support" },
  { value: "SAN", label: "Sanitation & Hygiene" },
];

function destination(role: ActiveRole) {
  return role === "STUDENT" ? "/student/submit" : `/dashboard?role=${role}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ActiveRole>("STUDENT");
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode>("BTECH");
  const [identifierNo, setIdentifierNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const result =
        mode === "register"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      const user = result.data.user;
      if (!user) throw new Error("Authentication succeeded without a user session.");

      if (mode === "register") {
        const { error: profileError } = await supabase.from("users").upsert({
          id: user.id,
          email,
          full_name: email.split("@")[0],
          identifier_no:
            identifierNo.trim() ||
            `${role === "STUDENT" ? "STU" : "EMP"}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          role,
          department_code: role === "STUDENT" ? null : departmentCode,
        });
        if (profileError) throw profileError;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      const resolvedRole = (profile?.role ?? role) as ActiveRole;
      if (mode === "register" && !result.data.session) {
        setMessage("Account created. Confirm your email if your Supabase project requires it, then sign in.");
      } else {
        router.push(destination(resolvedRole));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex rounded-lg bg-slate-950 p-1">
          {(["register", "login"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === value ? "bg-cyan-400 text-slate-950" : "text-slate-400"
              }`}
            >
              {value === "register" ? "Register" : "Login"}
            </button>
          ))}
        </div>
        <h1 className="text-2xl font-semibold">{mode === "register" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-400">Email and password only. No social logins or magic links.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm text-slate-300">
            Institutional email
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400" />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400" />
          </label>
          {mode === "register" && (
            <>
              <label className="block text-sm text-slate-300">
                Role
                <select value={role} onChange={(e) => setRole(e.target.value as ActiveRole)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white">
                  {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {role !== "STUDENT" && (
                <label className="block text-sm text-slate-300">
                  Department
                  <select value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value as DepartmentCode)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white">
                    {departments.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
              )}
              <label className="block text-sm text-slate-300">
                Identifier <span className="text-slate-500">(optional)</span>
                <input value={identifierNo} onChange={(e) => setIdentifierNo(e.target.value)} placeholder="STU-XXXX or EMP-XXXX" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400" />
              </label>
            </>
          )}
          {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
            {busy ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
