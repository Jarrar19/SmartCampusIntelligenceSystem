import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Inbox, FileText, ShoppingBag, 
  Activity, ArrowRight, CheckCircle2, XCircle, Search, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface AdminDashboardProps {
  onNavigate: (tab: string, courseId?: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pendingModeration, setPendingModeration] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsRes, logsRes, modRes] = await Promise.all([
          api.get('/users/dashboard-stats').catch(() => ({ data: { success: false, data: {} } })),
          api.get('/users/audit-logs?limit=5').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/resources/moderation-queue?status=PENDING_REVIEW').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (logsRes.data.success) setAuditLogs(logsRes.data.data.slice(0, 5));
        if (modRes.data.success) setPendingModeration(modRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-7 text-slate-900 dark:text-slate-100 max-w-[1400px] mx-auto pb-10">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {formattedDate} • System Control & Governance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            System Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-normal">
            Monitor institutional security audit trails, review resource moderation queues, and manage role access control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('moderation')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition shadow-xs cursor-pointer"
          >
            Moderation Queue ({pendingModeration.length})
          </button>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* Admin Metrics Strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium py-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{stats.totalStudentsEnrolled ?? 0}</span>
          <span>Registered Students</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand-600 dark:text-brand-400 font-semibold">{stats.coursesTaughtCount ?? 0}</span>
          <span>Active Courses</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-600 dark:text-amber-400 font-semibold">{pendingModeration.length}</span>
          <span>Pending Review</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-semibold">{stats.myResourcesCount ?? 0}</span>
          <span>Verified Resources</span>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-1">
        
        {/* Left Column (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Moderation Queue Overview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Moderation Queue
              </h2>
              <button
                onClick={() => onNavigate('moderation')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View full queue
              </button>
            </div>

            {pendingModeration.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs">
                No items pending moderation. The academic repository is up to date!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingModeration.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          By {item.uploader?.fullName || 'Student'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate('moderation')}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex-shrink-0"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Audit Logs Snapshot */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Security Audit Logs
              </h2>
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View all audit logs
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 text-xs py-2">
                  No security audit events logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-brand-600 dark:text-brand-400 font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                        {log.action}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {log.user?.fullName || log.user?.email || 'System'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column (5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Quick System Tools */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Governance & Management
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('moderation')}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Resource Moderation Queue</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Review</span>
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Security & Audit Logs</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Inspect</span>
              </button>

              <button
                onClick={() => onNavigate('courses')}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Course Catalog & Portals</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Manage</span>
              </button>
            </div>
          </section>

        </div>
      </div>

    </div>
  );
};
