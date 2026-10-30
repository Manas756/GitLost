import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim().toUpperCase();
    if (!id) return NextResponse.json({ error: "A CSR or REP tracking ID is required." }, { status: 400 });
    const supabase = db();
    let groupId: string | null = null;
    if (id.startsWith("REP-")) {
      const { data, error } = await supabase.from("complaints").select("group_id").eq("receipt_id", id).maybeSingle();
      if (error) throw error;
      groupId = data?.group_id ?? null;
    }
    const query = supabase.from("complaint_groups").select("id,tracking_id,title,normalized_title,ai_summary,category,location_zone,priority,priority_score,hashtags,report_count,current_handler_role,stage_entered_at,stage_deadline,status,routing_reasoning,is_damage_prone,is_safety_critical");
    const { data: group, error } = groupId ? await query.eq("id", groupId).maybeSingle() : await query.eq("tracking_id", id).maybeSingle();
    if (error) throw error;
    if (!group) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    const { data: events, error: eventsError } = await supabase.from("complaint_events").select("event_type,note,created_at").eq("complaint_group_id", group.id).order("created_at", { ascending: true });
    if (eventsError) throw eventsError;
    return NextResponse.json({ group, events: events ?? [] });
  } catch (error) {
    console.error("[complaints/track]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to track ticket." }, { status: 500 });
  }
}
