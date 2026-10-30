'use client';

import { useRole } from '@/context/RoleContext';
import StudentComplaintForm from '@/components/student/StudentComplaintForm';
import DepartmentAdminDashboard from '@/components/admin/DepartmentAdminDashboard';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { Activity, Sparkles } from 'lucide-react';

export default function Home() {
  const { activeRole, roleConfig } = useRole();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Active Workspace Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wide uppercase mb-1">
              <Sparkles className="w-4 h-4" /> Active Workspace View
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {roleConfig.label}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {activeRole === 'STUDENT' 
                ? 'Submit campus maintenance and infrastructure issues with AI-powered instant triage.'
                : activeRole === 'SUPER_ADMIN'
                ? 'Central Registrar Command Center: Monitoring campus health and SLA escalations.'
                : `Managing operations and department triage queue for ${roleConfig.label}.`}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">Live Supabase Sync</span>
          </div>
        </div>

        {/* Dynamic Role-Based View Switcher */}
        {activeRole === 'STUDENT' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <StudentComplaintForm />
            </div>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
              <Activity className="w-12 h-12 text-indigo-500 mb-4 animate-bounce" />
              <h3 className="text-xl font-semibold text-white mb-2">Live Campus Issue Feed</h3>
              <p className="text-slate-400 text-sm max-w-md">
                Active clusters and resolved maintenance updates from across the campus will appear here in real time.
              </p>
            </div>
          </div>
        ) : activeRole === 'SUPER_ADMIN' ? (
          <SuperAdminDashboard />
        ) : (
          <DepartmentAdminDashboard deptCode={roleConfig.deptCode || 'INFRA'} />
        )}

      </div>
    </main>
  );
}
