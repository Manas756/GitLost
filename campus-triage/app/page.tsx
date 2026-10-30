"use client";

import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
          <Sparkles className="size-4" /> Campus Speedrun
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Campus issues, triaged at speed.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-400">
          AI-Powered Academic &amp; Infrastructure Triage Engine for safer,
          faster campus resolution.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-9 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Register <ArrowRight className="size-4" />
        </button>
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4 text-emerald-400" /> Anonymous reporting
          · email-only access · no hostel scope
        </div>
      </div>
    </main>
  );
}
