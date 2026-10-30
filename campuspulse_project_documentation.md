# CampusPulse — Intelligent Campus Grievance & Issue Resolution System

**CampusPulse** is a modular, AI-assisted campus grievance and maintenance management system built on **Supabase (PostgreSQL)**, **Node.js**, **Express**, and **Redis**. It supports the complete lifecycle of campus complaints—from student reporting and automated AI triaging to SLA-driven priority calculation, multi-department routing, event-sourced tracking, and administrative auditing.

---

## Core Architectural Principles

1. **PostgreSQL as the Single Source of Truth:** All relational states, constraints, and histories live in PostgreSQL with strict foreign key enforcement and Row Level Security (RLS).
2. **Strict AI & Human Decision Separation:** AI models analyze text and images to suggest categories, severity, and routing, storing findings in dedicated read-only analysis tables (`complaint_ai_analysis`, `ai_image_analysis`). **AI predictions never overwrite administrator-approved classifications or priorities.**
3. **Immutable Event-Driven Tracking:** Every state change, assignment, escalation, or status update generates a permanent record in `complaint_events`, while keeping the latest status on the `complaints` table for fast reads.
4. **Audited Anonymity:** Students can submit anonymous complaints (`is_anonymous = TRUE`). Ordinary viewers cannot see their identity, and any authorized administrative lookup is permanently recorded in `identity_access_logs`.

---

## System Lifecycle

```text
Student Report ──► AI Analysis (Text + Vision) ──► Priority & SLA Calculation 
      │
      ▼
Analytics & Feedback ◄── Resolution & Tracking ◄── Department & Staff Routing
```

---

## Database Architecture (10 Modules, 23 Tables)

The database is organized into 10 logical modules using internal `UUID` primary keys (`gen_random_uuid()`) paired with human-readable public codes (e.g., `CMP-2026-0041`, `USR-8F31A2`).

| Module | Tables | Responsibility |
| :--- | :--- | :--- |
| **01. Identity** | `profiles`, `roles`, `user_roles` | User profiles linked to `auth.users` and multi-role RBAC (`student`, `faculty`, `staff`, `department_admin`, `super_admin`). |
| **02. Organization** | `departments`, `department_members` | Campus departments (IT, Sanitation, Hostel, etc.) and their assigned staff/admins. |
| **03. Classification** | `categories`, `department_categories` | Hierarchical issue categories and configurable routing rules to primary/secondary departments. |
| **04. Complaints** | `complaints`, `complaint_attachments` | Core complaint records and metadata linking to files stored in Supabase Storage. |
| **05. AI Intelligence** | `complaint_ai_analysis`, `ai_image_analysis` | Isolated storage for NLP category/urgency predictions and computer vision damage/safety detection. |
| **06. Priority & SLA** | `priority_records`, `sla_policies` | Historical priority score breakdowns and department-specific acknowledgement/resolution SLA targets. |
| **07. Assignment** | `complaint_assignments` | Multi-department collaboration with a partial unique index enforcing a single active primary department per complaint. |
| **08. Tracking** | `complaint_events`, `escalation_logs` | Canonical, append-only audit trail of every lifecycle event and SLA escalation history. |
| **09. Engagement** | `complaint_groups`, `complaint_group_members`, `complaint_votes`, `complaint_feedback` | Duplicate issue clustering, community upvoting (1 vote per user), and post-resolution CSAT ratings (1–5). |
| **10. System & Security** | `notifications`, `audit_logs`, `identity_access_logs` | In-app alerts, administrative action logs, and strict auditing for unveiling anonymous submitters. |

### Analytics Views
Instead of maintaining redundant counter tables, real-time and cached reporting is powered by SQL views:
* `v_global_complaint_stats` — Total, pending, and resolved counts.
* `v_department_workload` — Open complaint queues per department.
* `v_priority_distribution` — Breakdown across `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.

---

## Redis Caching Layer

Redis acts as a high-speed performance layer alongside PostgreSQL:

| Redis Key Pattern | Purpose | Invalidation Trigger |
| :--- | :--- | :--- |
| `cp:departments:all` | Active department directory | Department created/updated |
| `cp:categories:all` | Category tree & routing map | Category modified |
| `cp:queue:department:{id}` | Sorted priority queue for a department | New assignment, status, or priority change |
| `cp:dashboard:global` | Cached output of `v_global_complaint_stats` | Any complaint status change |
| `cp:complaint:{id}` | Hydrated complaint detail view | Event appended to `complaint_events` |
| `cp:ai:fingerprint:{hash}` | Cached AI evaluation for near-identical text | TTL expiration |

---

## Getting Started

### 1. Prerequisites
* **Node.js** (v18+ recommended)
* **Supabase Project** (or local Supabase CLI / PostgreSQL 15+)
* **Redis** instance (local or Upstash/Redis Cloud)

### 2. Environment Variables
Create a `.env` file in the root of your Node.js backend:

```env
PORT=4000
NODE_ENV=development

# Supabase Connection
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres

# Redis Connection
REDIS_URL=redis://localhost:6379

# AI Service Configuration
AI_MODEL_NAME=gemini-2.5-flash
AI_API_KEY=your-ai-api-key
```

### 3. Database Setup
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Paste and execute the complete CampusPulse DDL schema script to create the 23 tables, constraints, indexes, views, and initial role seeds.
3. Configure a Supabase Storage bucket named `complaint-attachments` for storing user-uploaded photos.

### 4. Staged Rollout Plan (For Incremental Development)
If deploying incrementally, follow this dependency order:
* **Stage 1–2:** `profiles`, `roles`, `user_roles`, `departments`, `department_members`, `categories`, `department_categories`
* **Stage 3–4:** `complaints`, `complaint_attachments`, `complaint_ai_analysis`, `ai_image_analysis`
* **Stage 5–6:** `complaint_assignments`, `sla_policies`, `priority_records`, `complaint_events`, `escalation_logs`
* **Stage 7–9:** Community tables (`complaint_groups`, `complaint_votes`, `complaint_feedback`), `notifications`, and Security (`audit_logs`, `identity_access_logs`).

---

## Security & Data Integrity Checklist

- [x] **No Plaintext Credentials:** Authentication is delegated strictly to Supabase Auth (`auth.users`).
- [x] **Idempotent Voting & Feedback:** Composite `UNIQUE (complaint_id, user_id)` constraints prevent duplicate votes or reviews.
- [x] **Single Primary Owner:** Enforced via partial unique index `idx_one_active_primary_assignment`.
- [x] **Transactional Writes:** Complaint creation, initial assignment, and event logging must execute inside a single database transaction.