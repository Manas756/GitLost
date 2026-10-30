"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";

interface Group {
  tracking_id: string; ai_summary: string; priority: string; priority_score: number; hashtags: string[];
  current_handler_role: string; stage_deadline: string; status: string; location_zone: string; report_count: number;
}
interface Event { event_type: string; note: string; created_at: string; }

const stages = ["TEACHER", "FACULTY", "ADMINISTRATIVE"];

export default function TrackPage() {
  const [id, setId] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = new URLSearchParams(window.location.search).get("id");
    if (!saved) return;
    const timer = window.setTimeout(() => { setId(saved); void lookup(saved); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function lookup(value: string) {
    setError(null); setBusy(true);
    try {
      const response = await fetch(`/api/complaints/track?id=${encodeURIComponent(value)}`);
      const result = await response.json() as { error?: string; group?: Group; events?: Event[] };
      if (!response.ok || !result.group) throw new Error(result.error ?? "Ticket not found.");
      setGroup(result.group); setEvents(result.events ?? []);
      localStorage.setItem("campus-speedrun-last-ticket", result.group.tracking_id);
    } catch (caught) { setGroup(null); setEvents([]); setError(caught instanceof Error ? caught.message : "Unable to find ticket."); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void lookup(id.trim()); }

  return (
    <main className="mx-auto min-h-[calc(100vh-73px)] max-w-3xl px-5 py-12 text-white">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2 text-cyan-300"><ShieldCheck className="size-5" /> Anonymous live tracker</div>
        <h1 className="mt-3 text-3xl font-semibold">Track your complaint</h1>
        <p className="mt-2 text-sm text-slate-400">Enter a CSR-XXXXX tracking ID or REP-XXXXX receipt ID.</p>
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="CSR-48291" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-400" />
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 font-semibold text-slate-950"><Search className="size-4" /> Track</button>
        </form>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      </section>
      {group && (
        <section className="mt-6 space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Ticket</p><h2 className="text-2xl font-semibold">{group.tracking_id}</h2><p className="mt-1 text-sm text-slate-400">{group.location_zone} · {group.report_count} anonymous report{group.report_count === 1 ? "" : "s"}</p></div><span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-300">{group.priority} · {group.priority_score}/100</span></div>
          <p className="rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-200">{group.ai_summary}</p>
          <div className="flex flex-wrap gap-2">{(group.hashtags ?? []).map((tag) => <span key={tag} className="rounded-full border border-indigo-800 bg-indigo-950 px-2.5 py-1 text-xs text-indigo-300">{tag}</span>)}</div>
          <div className="grid gap-3 sm:grid-cols-3">{stages.map((stage, index) => { const current = stages.indexOf(group.current_handler_role); const complete = group.status === "RESOLVED" || index < current; const active = index === current && group.status !== "RESOLVED"; return <div key={stage} className={`rounded-xl border p-4 ${active ? "border-cyan-400 bg-cyan-400/10" : complete ? "border-emerald-500/40 bg-emerald-500/10" : "border-slate-800 bg-slate-950"}`}><p className="text-xs text-slate-500">Stage {index + 1}</p><p className="mt-1 font-medium">{stage}</p><p className="mt-2 text-xs text-slate-400">{active ? "Current handler" : complete ? "Passed" : "Waiting"}</p></div>; })}</div>
          <div><p className="text-sm font-medium">Execution status: <span className="text-cyan-300">{group.status}</span></p><p className="mt-1 text-xs text-slate-500">Current SLA deadline: {new Date(group.stage_deadline).toLocaleString()}</p></div>
          <div className="border-t border-slate-800 pt-4"><h3 className="text-sm font-semibold">Timeline</h3>{events.length === 0 ? <p className="mt-2 text-sm text-slate-500">The first event will appear after database event logging is enabled.</p> : <ol className="mt-3 space-y-3">{events.map((event) => <li key={`${event.created_at}-${event.event_type}`} className="text-sm"><span className="text-cyan-300">{event.event_type}</span><span className="ml-2 text-slate-500">{new Date(event.created_at).toLocaleString()}</span><p className="text-slate-300">{event.note}</p></li>)}</ol>}</div>
        </section>
      )}
    </main>
  );
}
