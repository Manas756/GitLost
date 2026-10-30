import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { nextRole, type HandlerRole } from "@/lib/campus";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { groupId?: string; fromRole?: HandlerRole; simulateDays?: boolean };
    if (!body.groupId) return NextResponse.json({ error: "groupId is required." }, { status: 400 });
    const supabase = db();
    if (body.simulateDays) {
      const { error } = await supabase.from("complaint_groups").update({ stage_deadline: new Date(Date.now() - 1_000).toISOString() }).eq("id", body.groupId);
      if (error) throw error;
      return NextResponse.json({ success: true, simulated: true });
    }
    const from = body.fromRole ?? "TEACHER";
    const target = nextRole(from);
    if (!target) return NextResponse.json({ error: "Administrative tickets cannot be forwarded further." }, { status: 400 });
    const now = new Date();
    const deadline = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("complaint_groups").update({ current_handler_role: target, stage_entered_at: now.toISOString(), stage_deadline: deadline, status: "ESCALATED", updated_at: now.toISOString() }).eq("id", body.groupId);
    if (error) throw error;
    await supabase.from("complaint_events").insert({ complaint_group_id: body.groupId, event_type: "FORWARDED", note: `Manually forwarded from ${from} to ${target}` });
    await supabase.from("notifications").insert({ complaint_group_id: body.groupId, type: "NEW_ASSIGNMENT", message: `Ticket forwarded to ${target} queue.` });
    return NextResponse.json({ success: true, current_handler_role: target, stage_deadline: deadline });
  } catch (error) {
    console.error("[complaints/forward]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to forward ticket." }, { status: 500 });
  }
}
