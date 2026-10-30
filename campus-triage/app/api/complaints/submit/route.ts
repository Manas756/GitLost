import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { computePriorityScore, containsHostel, DEPARTMENTS, PRIORITIES, PRIORITY_WEIGHT, makePublicId, type DepartmentCode, type Priority } from "@/lib/campus";

const model = "gemini-2.5-flash";
const schema = {
  type: "object",
  properties: {
    normalized_title: { type: "string" }, ai_summary: { type: "string" },
    category: { type: "string" }, subcategory: { type: "string" }, location_zone: { type: "string" },
    priority: { type: "string", enum: [...PRIORITIES] }, is_safety_critical: { type: "boolean" },
    is_damage_prone: { type: "boolean" }, primary_department_code: { type: "string", enum: [...DEPARTMENTS] },
    collaborating_department_codes: { type: "array", items: { type: "string", enum: [...DEPARTMENTS] } },
    hashtags: { type: "array", items: { type: "string" } }, routing_reasoning: { type: "string" }, confidence: { type: "number" },
  },
  required: ["normalized_title", "ai_summary", "category", "subcategory", "location_zone", "priority", "is_safety_critical", "is_damage_prone", "primary_department_code", "collaborating_department_codes", "hashtags", "routing_reasoning", "confidence"],
} as const;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function ai() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function randomId(prefix: "CSR" | "REP", existing: Set<string>) {
  let id = makePublicId(prefix);
  while (existing.has(id)) id = makePublicId(prefix);
  return id;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";
    const locationZone = typeof body.locationZone === "string" ? body.locationZone.trim() : "";
    if (rawText.length < 15 || rawText.length > 2000) return NextResponse.json({ success: false, error: "rawText must be between 15 and 2,000 characters." }, { status: 400 });
    if (!locationZone || containsHostel(`${rawText} ${locationZone}`)) return NextResponse.json({ success: false, error: "A non-hostel location is required." }, { status: 400 });

    const supabase = db();
    const { data: active, error: activeError } = await supabase.from("complaint_groups").select("id,tracking_id,normalized_title,location_zone").neq("status", "RESOLVED").limit(100);
    if (activeError) throw activeError;
    const prompt = `Return JSON only. You triage an anonymous campus issue. Never include names, roll numbers, phone numbers, emails, hostels, HST, or hostel hashtags. Map general infrastructure or sanitation issues away from hostels. Use only departments BTECH, MCA, SCI, INFRA, IT, SAN. Summarize the problem and impact professionally. Active clusters: ${JSON.stringify(active ?? [])}. Complaint: ${rawText}. Location: ${locationZone}`;
    const response = await ai().models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction: "You are Campus Speedrun's privacy-preserving triage engine.", responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.1 },
    });
    if (!response.text) throw new Error("Gemini returned an empty triage response.");
    const triage = JSON.parse(response.text) as Record<string, unknown>;
    const priority = PRIORITIES.includes(triage.priority as Priority) ? triage.priority as Priority : "MEDIUM";
    const safety = triage.is_safety_critical === true;
    const damage = triage.is_damage_prone === true;
    const normalizedPriority: Priority = safety && priority === "LOW" || damage && (priority === "LOW" || priority === "MEDIUM") ? safety ? "HIGH" : "HIGH" : priority;
    const primary = DEPARTMENTS.includes(triage.primary_department_code as DepartmentCode) ? triage.primary_department_code as DepartmentCode : "INFRA";
    const hashtags = Array.isArray(triage.hashtags) ? [...new Set(triage.hashtags.filter((tag): tag is string => typeof tag === "string" && !/hostel|hst/i.test(tag)))].slice(0, 5) : [];
    if (damage && !hashtags.includes("#LabDamage")) hashtags.push("#LabDamage");
    const matched = typeof triage.matched_cluster_id === "string" ? (active ?? []).find((item) => item.id === triage.matched_cluster_id) : null;
    let groupId = matched?.id ?? null;
    let reportCount = 1;
    let trackingId = matched?.tracking_id ?? null;
    if (groupId) {
      const { data: group, error } = await supabase.from("complaint_groups").select("report_count,priority,tracking_id").eq("id", groupId).single();
      if (error) throw error;
      reportCount = (group.report_count ?? 0) + 1;
      const groupPriority = PRIORITIES.includes(group.priority as Priority) ? group.priority as Priority : normalizedPriority;
      const finalPriority = (Object.keys(PRIORITY_WEIGHT).indexOf(groupPriority) < Object.keys(PRIORITY_WEIGHT).indexOf(normalizedPriority) ? normalizedPriority : groupPriority) as Priority;
      const { error: updateError } = await supabase.from("complaint_groups").update({ report_count: reportCount, priority: finalPriority, priority_score: computePriorityScore(finalPriority, reportCount, damage, safety), hashtags, updated_at: new Date().toISOString() }).eq("id", groupId);
      if (updateError) throw updateError;
      trackingId = group.tracking_id;
    } else {
      const existing = new Set((active ?? []).map((item) => item.tracking_id).filter(Boolean));
      trackingId = randomId("CSR", existing);
      const now = new Date();
      const deadline = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
      const { data: created, error } = await supabase.from("complaint_groups").insert({
        tracking_id: trackingId, normalized_title: typeof triage.normalized_title === "string" ? triage.normalized_title.slice(0, 160) : "Campus issue",
        title: typeof triage.normalized_title === "string" ? triage.normalized_title.slice(0, 160) : "Campus issue",
        ai_summary: typeof triage.ai_summary === "string" ? triage.ai_summary : "Campus issue requires review.",
        category: typeof triage.category === "string" ? triage.category : "INFRASTRUCTURE",
        subcategory: typeof triage.subcategory === "string" ? triage.subcategory : null,
        location_zone: typeof triage.location_zone === "string" ? triage.location_zone : locationZone,
        priority: normalizedPriority, priority_score: computePriorityScore(normalizedPriority, 1, damage, safety),
        report_count: 1, is_damage_prone: damage, is_safety_critical: safety, hashtags,
        primary_department_code: primary, collaborating_department_codes: triage.collaborating_department_codes ?? [],
        routing_reasoning: typeof triage.routing_reasoning === "string" ? triage.routing_reasoning : "",
        current_handler_role: "TEACHER", stage_entered_at: now.toISOString(), stage_deadline: deadline, status: "UNACKNOWLEDGED",
      }).select("id").single();
      if (error) throw error;
      groupId = created.id;
    }
    const { data: existingReceipts } = await supabase.from("complaints").select("receipt_id").limit(100);
    const receiptId = randomId("REP", new Set((existingReceipts ?? []).map((item) => item.receipt_id).filter(Boolean)));
    const { error: complaintError } = await supabase.from("complaints").insert({
      group_id: groupId, receipt_id: receiptId, raw_text: rawText,
      image_url: typeof body.imageUrl === "string" ? body.imageUrl : null,
      document_url: typeof body.documentUrl === "string" ? body.documentUrl : null,
      attachment_name: typeof body.attachmentName === "string" ? body.attachmentName : null,
      is_anonymous: true,
    });
    if (complaintError) throw complaintError;
    const { data: saved } = await supabase.from("complaint_groups").select("ai_summary,hashtags,priority,priority_score,current_handler_role,stage_deadline").eq("id", groupId).single();
    return NextResponse.json({ success: true, receipt: { tracking_id: trackingId, receipt_id: receiptId, ...(saved ?? {}) } }, { status: 201 });
  } catch (error) {
    console.error("[complaints/submit]", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to triage complaint." }, { status: 500 });
  }
}
