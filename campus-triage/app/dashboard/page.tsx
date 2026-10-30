"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Clock3, Filter, Forward, Radar, RefreshCw, ShieldAlert } from "lucide-react";
import type { HandlerRole } from "@/lib/campus";

interface Group {
  id: string; tracking_id: string; normalized_title?: string; title?: string; ai_summary: string; location_zone: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; priority_score: number; hashtags: string[]; report_count: number;
  current_handler_role: HandlerRole; stage_deadline: string; status: string; routing_reasoning: string;
  is_damage_prone: boolean; is_safety_critical: boolean;
}
const roles: HandlerRole[] = ["TEACHER", "FACULTY", "ADMINISTRATIVE"];
const colors = { CRITICAL: "border-red-500/50 bg-red-500/10 text-red-300", HIGH: "border-amber-500/50 bg-amber-500/10 text-amber-300", MEDIUM: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300", LOW: "border-slate-600 bg-slate-800 text-slate-300" };

export default function DashboardPage() {
  const initialRole = (new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("role") as HandlerRole) || "TEACHER";
  const [role, setRole] = useState<HandlerRole>(roles.includes(initialRole) ? initialRole : "TEACHER");
  const [groups, setGroups] = useState<Group[]>([]);
  const [hashtag, setHashtag] = useState("ALL");
  const [zone, setZone] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const response = await fetch(`/api/complaints/list?role=${role}`); const result = await response.json() as { groups?: Group[]; error?: string }; if (!response.ok) throw new Error(result.error ?? "Unable to load queue."); setGroups(result.groups ?? []); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load queue."); }
    finally { setLoading(false); }
  }, [role]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const tags = useMemo(() => [...new Set(groups.flatMap((group) => group.hashtags ?? []))], [groups]);
  const zones = useMemo(() => [...new Set(groups.map((group) => group.location_zone))], [groups]);
  const filtered = groups.filter((group) => (hashtag === "ALL" || group.hashtags?.includes(hashtag)) && (zone === "ALL" || group.location_zone === zone));
  const hotspots = useMemo(() => Object.values(groups.filter((g) => g.is_damage_prone).reduce<Record<string, { zone: string; count: number; peak: number }>>((acc, g) => { const current = acc[g.location_zone] ?? { zone: g.location_zone, count: 0, peak: 0 }; current.count += 1; current.peak = Math.max(current.peak, g.priority_score); acc[g.location_zone] = current; return acc; }, {})), [groups]);

  async function action(groupId: string, simulateDays = false) { await fetch("/api/complaints/forward", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId, fromRole: role, simulateDays }) }); await load(); }

  return (
    <main className="mx-auto min-h-[calc(100vh-73px)] max-w-7xl px-5 py-8 text-white">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-cyan-300">AI operations command center</p><h1 className="mt-1 text-3xl font-semibold">{role} Priority Queue</h1><p className="mt-2 text-sm text-slate-400">Anonymous tickets ordered by deterministic urgency score.</p></div><div className="flex gap-2"><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm"><RefreshCw className="size-4" /> Refresh</button><button onClick={() => filtered[0] && void action(filtered[0].id, true)} className="rounded-lg border border-amber-500/40 px-3 py-2 text-sm text-amber-300">Simulate +3 Days</button></div></div>
      <div className="mt-5 flex flex-wrap gap-2">{roles.map((item) => <button key={item} onClick={() => setRole(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${role === item ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-400"}`}>{item}</button>)}</div>
      <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3"><button onClick={() => { setHashtag("ALL"); setZone("ALL"); }} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs"><Filter className="mr-1 inline size-3" />All filters</button>{["ALL", ...tags].map((tag) => <button key={tag} onClick={() => setHashtag(tag)} className={`rounded-full px-3 py-1.5 text-xs ${hashtag === tag ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-400"}`}>{tag}</button>)}{zones.map((item) => <button key={item} onClick={() => setZone(item)} className={`rounded-full px-3 py-1.5 text-xs ${zone === item ? "bg-emerald-400 text-slate-950" : "border border-slate-700 text-slate-400"}`}>{item}</button>)}</div>
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center gap-2"><Radar className="size-5 text-amber-300" /><h2 className="font-semibold">Damage-Prone Areas &amp; Physical Hazard Radar</h2></div><div className="mt-4 grid gap-3 md:grid-cols-3">{hotspots.length === 0 ? <p className="text-sm text-slate-500">No active physical hazard hotspots.</p> : hotspots.map((hotspot) => <button key={hotspot.zone} onClick={() => setZone(hotspot.zone)} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left"><p className="font-medium">{hotspot.zone}</p><p className="mt-1 text-sm text-amber-300">{hotspot.count} active physical hazard{hotspot.count === 1 ? "" : "s"}</p><p className="mt-1 text-xs text-slate-500">Peak score {hotspot.peak}/100</p></button>)}</div></section>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <section className="mt-6 space-y-4">{loading ? <p className="text-slate-400">Loading queue...</p> : filtered.length === 0 ? <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-500">No active tickets match these filters.</p> : filtered.map((group, index) => <article key={group.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-col justify-between gap-4 md:flex-row"><div className="flex gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-cyan-300">#{index + 1}</div><div><p className="text-xs text-slate-500">Ticket #{group.tracking_id} · Reported by Anonymous Student · {group.report_count} report{group.report_count === 1 ? "" : "s"}</p><h3 className="mt-1 text-xl font-semibold">{group.normalized_title ?? group.title}</h3><p className="mt-1 text-sm text-slate-400">{group.location_zone}</p></div></div><div className={`h-fit rounded-full border px-3 py-1 text-sm font-semibold ${colors[group.priority]}`}>{group.priority} · {group.priority_score}/100</div></div><div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]"><div><p className="text-sm leading-6 text-slate-300">{group.ai_summary}</p><div className="mt-3 flex flex-wrap gap-2">{(group.hashtags ?? []).map((tag) => <button key={tag} onClick={() => setHashtag(tag)} className="rounded-full border border-indigo-800 bg-indigo-950 px-2.5 py-1 text-xs text-indigo-300">{tag}</button>)}</div><p className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs leading-5 text-cyan-100"><ShieldAlert className="mr-1 inline size-4" />{group.routing_reasoning || "Ranked using severity, safety, damage and independent report volume."}</p></div><div className="rounded-xl bg-slate-950 p-4 text-sm"><p className="flex items-center gap-2 text-slate-400"><Clock3 className="size-4" /> {new Date(group.stage_deadline).toLocaleString()}</p><p className="mt-3 flex items-center gap-2 text-slate-400"><Bell className="size-4" /> Handler: {group.current_handler_role}</p><div className="mt-4 flex flex-wrap gap-2"><button disabled={role === "ADMINISTRATIVE"} onClick={() => void action(group.id)} className="inline-flex items-center gap-1 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40"><Forward className="size-3" /> Forward</button></div></div></div></article>)}</section>
    </main>
  );
}
