import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { nextRole, type HandlerRole } from "@/lib/campus";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const role = (url.searchParams.get("role") ?? "TEACHER") as HandlerRole;
    const supabase = db();
    const { data: expired, error: expiredError } = await supabase.from("complaint_groups")
      .select("id,current_handler_role,tracking_id,priority_score")
      .neq("status", "RESOLVED").lte("stage_deadline", new Date().toISOString());
    if (expiredError) throw expiredError;
    for (const group of expired ?? []) {
      const current = group.current_handler_role as HandlerRole;
      const target = nextRole(current);
      if (!target) continue;
      const now = new Date();
      const deadline = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("complaint_groups").update({
        current_handler_role: target, stage_entered_at: now.toISOString(), stage_deadline: deadline, status: "ESCALATED",
        escalated_to_super_admin: target === "ADMINISTRATIVE", updated_at: now.toISOString(),
      }).eq("id", group.id).neq("status", "RESOLVED");
      if (error) throw error;
      await supabase.from("complaint_events").insert({ complaint_group_id: group.id, event_type: "AUTO_ESCALATED", note: `Auto-escalated from ${current} to ${target} after 3 days of inactivity` });
      await supabase.from("notifications").insert({ complaint_group_id: group.id, type: "CRITICAL_ESCALATION", message: `AUTO-ESCALATED: Ticket #${group.tracking_id} moved to ${target} queue.` });
    }
    const { data, error } = await supabase.from("complaint_groups")
      .select("id,tracking_id,title,normalized_title,ai_summary,category,location_zone,priority,priority_score,hashtags,report_count,current_handler_role,stage_deadline,status,routing_reasoning,is_damage_prone,is_safety_critical,primary_department_code")
      .neq("status", "RESOLVED").eq("current_handler_role", role)
      .order("priority_score", { ascending: false }).order("stage_deadline", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ groups: data ?? [] });
  } catch (error) {
    console.error("[complaints/list]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load queue." }, { status: 500 });
  }
}
