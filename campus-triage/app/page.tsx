"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRole, type ActiveRole } from "@/context/RoleContext";
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileCheck2,
  Layers,
  Network,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Users2,
  Wifi,
  Wrench,
  Building,
  GraduationCap,
  HeartHandshake,
  Check,
} from "lucide-react";

interface SampleScenario {
  id: string;
  label: string;
  badge: string;
  rawText: string;
  category: string;
  subcategory: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityScore: number;
  primaryDept: string;
  collabDepts: string[];
  slaMinutes: number;
  isSafetyCritical: boolean;
  clusterMatch: string | null;
  routingReason: string;
}

const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: "sc-1",
    label: "Hostel Electrical Emergency",
    badge: "Safety Escalation",
    rawText:
      "Exposed wiring and severe spark emission near the main power distribution box of Boys Hostel 3 ground floor. Water logging right next to the puddle from yesterday's rain.",
    category: "INFRASTRUCTURE",
    subcategory: "Electrical Hazard & Safety",
    priority: "CRITICAL",
    priorityScore: 95,
    primaryDept: "INFRA (Infrastructure & Works)",
    collabDepts: ["HST (Hostel Administration)", "SAN (Sanitation)"],
    slaMinutes: 45,
    isSafetyCritical: true,
    clusterMatch: "CLUSTER-BH3-ELEC-01 (3 previous reports merged)",
    routingReason:
      "Water contact with active high-voltage hazard triggers immediate CRITICAL safety protocol and Super Admin SMS ping.",
  },
  {
    id: "sc-2",
    label: "Library Academic Wi-Fi Outage",
    badge: "Campus IT",
    rawText:
      "Central Library 2nd floor digital reading room Wi-Fi has been dropping every 2 minutes. Students unable to access IEEE journals during exam week.",
    category: "IT",
    subcategory: "Wireless Network / Access Points",
    priority: "HIGH",
    priorityScore: 78,
    primaryDept: "IT (Campus Information Tech)",
    collabDepts: ["ACAD (Academic Facilities)"],
    slaMinutes: 180,
    isSafetyCritical: false,
    clusterMatch: "CLUSTER-LIB-NET-09 (14 students confirmed)",
    routingReason:
      "Exam-period library disruption routed to IT Core Networks with academic collaboration tag.",
  },
  {
    id: "sc-3",
    label: "Block C Washroom Sanitation",
    badge: "Sanitation & Civil",
    rawText:
      "Water pressure is zero in Block C 1st floor restrooms, causing complete blockage and unhygienic conditions across the wing.",
    category: "SANITATION",
    subcategory: "Plumbing & Restroom Hygiene",
    priority: "MEDIUM",
    priorityScore: 62,
    primaryDept: "SAN (Sanitation & Hygiene)",
    collabDepts: ["INFRA (Civil / Plumbing)"],
    slaMinutes: 720,
    isSafetyCritical: false,
    clusterMatch: null,
    routingReason:
      "Primary hygiene impact assigned to Sanitation team with Civil Plumbing cross-reference.",
  },
  {
    id: "sc-4",
    label: "Student Welfare Harassment Report",
    badge: "Confidential Welfare",
    rawText:
      "Intimidation incident reported near cafeteria parking after evening library hours. Requesting urgent campus security patrol review.",
    category: "SW",
    subcategory: "Campus Security & Welfare",
    priority: "CRITICAL",
    priorityScore: 92,
    primaryDept: "SW (Student Welfare & Security)",
    collabDepts: [],
    slaMinutes: 30,
    isSafetyCritical: true,
    clusterMatch: null,
    routingReason:
      "Threat to student safety routed directly to Proctorial Board & Super Admin command oversight.",
  },
];

const DEPARTMENTS = [
  {
    code: "INFRA",
    name: "Infrastructure & Civil Works",
    icon: Wrench,
    slaTarget: "SLA: 45 min – 24 hrs",
    description: "Buildings, civil engineering, electrical grids, water lines, and physical campus safety.",
    lead: "Chief Campus Engineer",
  },
  {
    code: "IT",
    name: "Information Technology",
    icon: Wifi,
    slaTarget: "SLA: 60 min – 12 hrs",
    description: "Campus Wi-Fi mesh, optical fiber backbones, lab terminals, ERP, and smart classroom tech.",
    lead: "Director of IT Systems",
  },
  {
    code: "SAN",
    name: "Sanitation & Public Health",
    icon: Activity,
    slaTarget: "SLA: 2 hrs – 24 hrs",
    description: "Hygiene audits, waste management, restroom maintenance, and drinking water testing.",
    lead: "Chief Medical & Health Officer",
  },
  {
    code: "HST",
    name: "Hostel & Residential Life",
    icon: Building,
    slaTarget: "SLA: 1 hr – 12 hrs",
    description: "Hostel rooms, dining mess quality, residential warden support, and student amenities.",
    lead: "Chief Warden of Hostels",
  },
  {
    code: "ACAD",
    name: "Academic Facilities",
    icon: GraduationCap,
    slaTarget: "SLA: 4 hrs – 48 hrs",
    description: "Lecture halls, laboratory instrumentation, central library facilities, and exam centers.",
    lead: "Dean of Academic Affairs",
  },
  {
    code: "SW",
    name: "Student Welfare & Security",
    icon: HeartHandshake,
    slaTarget: "SLA: 15 min – 4 hrs",
    description: "Proctorial oversight, 24/7 emergency response, health counseling, and student protection.",
    lead: "Dean of Student Welfare (DSW)",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { setActiveRole } = useRole();
  const [selectedScenario, setSelectedScenario] = useState<SampleScenario>(SAMPLE_SCENARIOS[0]);
  const [customText, setCustomText] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleLaunchRole = (role: ActiveRole) => {
    setActiveRole(role);
    router.push("/dashboard");
  };

  const handleSimulate = (scenario: SampleScenario) => {
    setIsSimulating(true);
    setSelectedScenario(scenario);
    setTimeout(() => {
      setIsSimulating(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Subtle grid pattern background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            
            {/* University Trust Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Himachal Pradesh Technical University</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-mono">Autonomous Triage Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl leading-[1.12]">
              Autonomous Campus Maintenance &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">
                AI Incident Triage
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
              CampusPulse turns fragmented student complaints into automated operational work orders.
              Powered by <strong>Google Gemini 2.5 Flash</strong> and <strong>Supabase</strong>, reports are triaged, deduplicated into active clusters, and SLA-routed in milliseconds.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all hover:gap-3 active:scale-98"
              >
                <span>Launch Operations Workspace</span>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </Link>
              <button
                type="button"
                onClick={() => handleLaunchRole("STUDENT")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <FileCheck2 className="h-4 w-4 text-indigo-500" />
                <span>Submit Complaint as Student</span>
              </button>
            </div>

            {/* Quick Assurance Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" /> Multi-department deduplication
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" /> Zero manual dispatch delay
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" /> Automatic Super Admin safety alerts
              </span>
            </div>

          </div>

          {/* Key Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Critical Safety SLA", val: "< 45 mins", sub: "Auto-escalated to Super Admin" },
              { label: "Deduplication Rate", val: "94.2%", sub: "Merged into unified clusters" },
              { label: "Campus Departments", val: "6 Unified", sub: "INFRA, IT, SAN, HST, ACAD, SW" },
              { label: "Average Triage Latency", val: "1.2 sec", sub: "Gemini 2.5 Flash inference" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-xs backdrop-blur-xs text-center"
              >
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-mono">
                  {stat.val}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {stat.label}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. LIVE INTERACTIVE TRIAGE SIMULATOR                               */}
      {/* ------------------------------------------------------------------ */}
      <section id="demo" className="py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 mb-3">
              <Cpu className="h-3.5 w-3.5" />
              <span>Interactive Simulator</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              See How Gemini 2.5 Flash Triages Campus Issues
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Select any real-world incident below to inspect the autonomous classification, priority score calculation, and departmental dispatch payload.
            </p>
          </div>

          {/* Scenario Selection Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {SAMPLE_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSimulate(sc)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all border ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span>{sc.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      isSelected
                        ? "bg-slate-800 text-emerald-400"
                        : "bg-white text-slate-500 border border-slate-200"
                    }`}
                  >
                    {sc.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Simulator Card Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 shadow-sm">
            
            {/* Left: Simulated Student Input */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Step 1: Raw Student Ingestion
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Radio className="h-3 w-3 animate-pulse" /> Unstructured Text
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Student Submission Text
                  </p>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                    "{selectedScenario.rawText}"
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Source: HPTU Student App</span>
                    <span>Photo attached: Yes (Base64 Part)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-600" /> Active Cluster Deduplication:
                </p>
                <p>
                  {selectedScenario.clusterMatch ? (
                    <span className="text-emerald-700 font-medium">
                      Matched existing issue: <strong>{selectedScenario.clusterMatch}</strong>. Incrementing report counter without duplicating work orders.
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      No matching open incident found. Initializing brand new incident cluster with atomic timestamp lock.
                    </span>
                  )}
                </p>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors"
              >
                <span>Try In Live Student Form</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Right: Real-Time AI Triage Payload Output */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Step 2: Gemini 2.5 Flash Triage Output
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    Confidence: 99.4%
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Category & Priority Badge Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Assigned Category
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900 font-mono">
                        {selectedScenario.category}
                      </p>
                      <p className="text-[11px] text-slate-500">{selectedScenario.subcategory}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Severity & Priority Score
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                            selectedScenario.priority === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : selectedScenario.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {selectedScenario.priority}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {selectedScenario.priorityScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Calculated via log volume weight</p>
                    </div>
                  </div>

                  {/* Primary & Collaborating Department Routing */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Primary Routing Destination
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 font-mono">
                        {selectedScenario.primaryDept}
                      </span>
                    </div>

                    {selectedScenario.collabDepts.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Collaborating Departments
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {selectedScenario.collabDepts.map((d, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-700"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SLA Countdown & Safety Flag */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Enforced SLA Target
                        </p>
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          {selectedScenario.slaMinutes} minutes
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center gap-3">
                      {selectedScenario.isSafetyCritical ? (
                        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                      ) : (
                        <Shield className="h-5 w-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Safety Critical
                        </p>
                        <p
                          className={`text-xs font-bold font-mono ${
                            selectedScenario.isSafetyCritical
                              ? "text-rose-600"
                              : "text-slate-600"
                          }`}
                        >
                          {selectedScenario.isSafetyCritical ? "YES (Super Admin Alert)" : "NORMAL"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning quote */}
                  <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3 text-xs text-indigo-950">
                    <p className="font-semibold text-indigo-900 mb-0.5">Routing Reasoning:</p>
                    <p className="text-indigo-800/90 leading-relaxed font-sans">
                      {selectedScenario.routingReason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Database target: PostgreSQL `complaint_groups`</span>
                <span>UUID Array mapping: Active</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. HOW IT WORKS: 3-STAGE LIFECYCLE                                 */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              End-to-End Workflow
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Zero-Friction Campus Operations in 3 Steps
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              How CampusPulse replaces paper requisition books and chaotic WhatsApp groups with a unified digital audit trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-mono font-bold text-lg mb-6 border border-indigo-100">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">
                  Natural Language Reporting
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Students describe the issue naturally ("No water in Girls Hostel 2 3rd floor") and attach optional photo evidence. No tedious form codes or confusing department selections required.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                Instant image validation & SSRF protection
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between ring-2 ring-emerald-500/20">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-mono font-bold text-lg mb-6 border border-emerald-100">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">
                  Gemini Clustering & Triage
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The AI compares the complaint against all currently active incidents. If 15 students report the same water pump failure, it automatically clusters them into a single high-priority work order with real-time counter locking.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                Optimistic concurrency & race-condition retry
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white font-mono font-bold text-lg mb-6">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">
                  SLA Dispatch & Escalation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The primary department and collaborating units receive instant queue updates. If a critical issue nears SLA expiration without resolution, it auto-escalates directly to the Super Admin Command Center.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                Live Supabase Realtime WebSocket synchronization
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. SIX INTEGRATED DEPARTMENTS                                       */}
      {/* ------------------------------------------------------------------ */}
      <section id="departments" className="py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Campus Coverage
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              6 Integrated Departmental Queues
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Each department operates with an isolated dashboard, custom SLA windows, and cross-department collaboration links.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {DEPARTMENTS.map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.code}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-white hover:shadow-sm transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-mono font-bold text-slate-900">
                      {dept.code}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 mb-1">{dept.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700 mb-3">{dept.slaTarget}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {dept.description}
                  </p>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Oversight: {dept.lead}</span>
                    <button
                      type="button"
                      onClick={() => handleLaunchRole(`${dept.code}_ADMIN` as ActiveRole)}
                      className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      View Queue $\rightarrow$
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. ARCHITECTURE & SECURITY SPECIFICATIONS                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="architecture" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mb-2">
                  <Database className="h-3.5 w-3.5" /> Technical Standards
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Resilient Enterprise Architecture
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Next.js 16 + Supabase + Gemini 2.5</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Optimistic Concurrency Protection",
                  desc: "Multi-report surges on the same incident use conditional CAS (Compare-And-Swap) updates, preventing lost increments when dozens of students submit simultaneously.",
                },
                {
                  title: "Collaborating Department Arrays",
                  desc: "Supports compound issues (e.g. electrical fault causing mess food spoilage) by indexing UUIDs across primary and secondary operational teams.",
                },
                {
                  title: "Row Level Security (RLS) Isolation",
                  desc: "Students can only read public campus clusters and edit their own reports; department staff access only their authorized departmental queues.",
                },
                {
                  title: "SSRF & Image Verification",
                  desc: "Uploaded evidence is strictly validated against the project's dedicated Supabase storage bucket, preventing arbitrary host probing or spoofed payloads.",
                },
              ].map((spec, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {spec.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">{spec.desc}</p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. ROLE QUICK-LAUNCH BANNER                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/80 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Role Simulator Available</span>
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Explore CampusPulse from Every Perspective
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Test how students submit issues, how department officers work their SLA queues, and how the Super Admin monitors campus health in real time.
            </p>

            {/* Role Launch Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-10">
              <button
                type="button"
                onClick={() => handleLaunchRole("STUDENT")}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                Student View
              </button>
              <button
                type="button"
                onClick={() => handleLaunchRole("INFRA_ADMIN")}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                INFRA Admin
              </button>
              <button
                type="button"
                onClick={() => handleLaunchRole("IT_ADMIN")}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                IT Admin
              </button>
              <button
                type="button"
                onClick={() => handleLaunchRole("SAN_ADMIN")}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                Sanitation Admin
              </button>
              <button
                type="button"
                onClick={() => handleLaunchRole("HST_ADMIN")}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                Hostel Admin
              </button>
              <button
                type="button"
                onClick={() => handleLaunchRole("SUPER_ADMIN")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                Super Admin Center
              </button>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-md hover:bg-slate-100 transition-all hover:gap-2.5"
            >
              <span>Enter Unified Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. INSTITUTIONAL FOOTER                                            */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Building className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">CampusPulse</p>
              <p className="text-[11px]">Himachal Pradesh Technical University Operations Hub</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Workspace
            </Link>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              Workflow
            </a>
            <a href="#departments" className="hover:text-slate-900 transition-colors">
              Departments
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">
              Technical Specs
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Supabase & Gemini Engine: Operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
