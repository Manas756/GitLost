"use client";

import { FormEvent, useState } from "react";
import { Copy, FileUp, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Receipt {
  tracking_id: string;
  receipt_id: string;
  ai_summary: string;
  hashtags: string[];
  priority: string;
  priority_score: number;
  current_handler_role: string;
  stage_deadline: string;
}

const zones = ["B.Tech Block", "MCA Block", "Applied Sciences Block", "Central Library", "Academic Main Block"];

export default function StudentSubmitPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [locationZone, setLocationZone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (rawText.trim().length < 15 || rawText.trim().length > 2000) {
      setError("Describe the issue in 15–2,000 characters.");
      return;
    }
    if (/hostel|#hst/i.test(`${rawText} ${locationZone}`)) {
      setError("Hostel issues are outside Campus Speedrun scope.");
      return;
    }
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      let documentUrl: string | null = null;
      if (file) {
        const allowed = file.type.startsWith("image/") ? 8 : 10;
        if (file.size > allowed * 1024 * 1024) throw new Error(`Attachment must be smaller than ${allowed} MB.`);
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const uploaded = await supabase.storage.from("complaint-evidence").upload(path, file, { upsert: false });
        if (uploaded.error) throw uploaded.error;
        const { data } = supabase.storage.from("complaint-evidence").getPublicUrl(path);
        if (file.type.startsWith("image/")) imageUrl = data.publicUrl;
        else documentUrl = data.publicUrl;
      }
      const response = await fetch("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim(), locationZone: locationZone.trim(), imageUrl, documentUrl, attachmentName: file?.name ?? null }),
      });
      const result = await response.json() as { success?: boolean; error?: string; receipt?: Receipt };
      if (!response.ok || !result.success || !result.receipt) throw new Error(result.error ?? "Submission failed.");
      setReceipt(result.receipt);
      setRawText("");
      setLocationZone("");
      setFile(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    return (
      <main className="mx-auto min-h-[calc(100vh-73px)] max-w-3xl px-5 py-12 text-white">
        <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-7 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="size-5" /> Anonymous receipt created</div>
          <h1 className="mt-4 text-3xl font-semibold">Ticket {receipt.tracking_id}</h1>
          <p className="mt-2 text-sm text-slate-400">Receipt ID: {receipt.receipt_id}. Keep either ID to track this issue.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-950 p-4"><p className="text-xs uppercase text-slate-500">AI summary</p><p className="mt-2 text-sm leading-6 text-slate-200">{receipt.ai_summary}</p></div>
            <div className="rounded-xl bg-slate-950 p-4"><p className="text-xs uppercase text-slate-500">Priority</p><p className="mt-2 text-xl font-semibold text-red-300">{receipt.priority} <span className="text-sm text-slate-400">({receipt.priority_score}/100)</span></p><p className="mt-2 text-xs text-slate-400">Tier: {receipt.current_handler_role} · 72-hour SLA</p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{receipt.hashtags.map((tag) => <span key={tag} className="rounded-full border border-indigo-800 bg-indigo-950 px-2.5 py-1 text-xs text-indigo-300">{tag}</span>)}</div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => void navigator.clipboard.writeText(receipt.tracking_id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm"><Copy className="size-4" /> Copy ID</button>
            <button type="button" onClick={() => router.push(`/track?id=${receipt.tracking_id}`)} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Track Complaint Live</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-73px)] max-w-3xl px-5 py-12 text-white">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm text-cyan-300">Anonymous student intake</p>
        <h1 className="mt-2 text-3xl font-semibold">Submit a campus issue</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Your identity is not shown to staff. Images and documents receive randomized storage names.</p>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="block text-sm text-slate-300">Problem narration
            <textarea required minLength={15} maxLength={2000} rows={7} value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="What happened, what is affected, and what action is needed?" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-400" />
            <span className="mt-1 block text-xs text-slate-500">{rawText.length}/2,000</span>
          </label>
          <label className="block text-sm text-slate-300">Location zone
            <input required value={locationZone} onChange={(e) => setLocationZone(e.target.value)} placeholder="B.Tech Block - CSE Lab 3" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-400" />
          </label>
          <div className="flex flex-wrap gap-2">{zones.map((zone) => <button type="button" key={zone} onClick={() => setLocationZone(zone)} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-cyan-400 hover:text-cyan-300">{zone}</button>)}</div>
          <label className="block text-sm text-slate-300">Image or document <span className="text-slate-500">(optional)</span>
            <span className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-4 text-sm text-slate-400"><FileUp className="size-5" /><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /> </span>
            <span className="mt-1 block text-xs text-slate-500">Images up to 8 MB; documents up to 10 MB.</span>
          </label>
          {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{busy ? "Running AI triage..." : "Submit & Speedrun Triage"}</button>
        </form>
      </section>
    </main>
  );
}
