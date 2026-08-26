import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Inbox, FileText, ShoppingBag, 
  Activity, ArrowRight, CheckCircle2, XCircle, Search, UserCheck,
  Sparkles, ChevronRight, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { CampusHeroCanvas } from '../../components/common/CampusHeroCanvas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatWidgetSkeleton, CardSkeleton, ListRowSkeleton } from '../../components/common/Skeleton';

interface AdminDashboardProps {
  onNavigate: (tab: string, courseId?: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [stats, setStats] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pendingModeration, setPendingModeration] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Role Promotion tool state
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('FACULTY');
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [statsRes, logsRes, modRes] = await Promise.all([
          api.get('/users/dashboard-stats').catch(() => ({ data: { success: false, data: {} } })),
          api.get('/users/audit-logs?limit=6').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/resources/moderation-queue?status=PENDING_REVIEW').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (logsRes.data.success) setAuditLogs(logsRes.data.data.slice(0, 6));
        if (modRes.data.success) setPendingModeration(modRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const handlePromoteRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      error('Please enter a target campus email address.');
      return;
    }

    setIsPromoting(true);
    try {
      const res = await api.post('/auth/promote-role', {
        email: targetEmail.trim().toLowerCase(),
        role: targetRole,
      });

      if (res.data.success) {
        success(`Successfully updated ${targetEmail} role to ${targetRole}`);
        setTargetEmail('');
        // Refresh audit logs
        const logsRes = await api.get('/users/audit-logs?limit=6').catch(() => ({ data: { success: false, data: [] } }));
        if (logsRes.data.success) setAuditLogs(logsRes.data.data.slice(0, 6));
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setIsPromoting(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        <div className="h-44 rounded-3xl glass-panel p-8 shimmer border border-slate-200/80 dark:border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidgetSkeleton />
          <StatWidgetSkeleton />
          <StatWidgetSkeleton />
          <StatWidgetSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 text-slate-900 dark:text-slate-100 max-w-[1400px] mx-auto pb-10 animate-fade-in-up">
      
      {/* 1. Admin Control Center Hero with Ambient Canvas */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <CampusHeroCanvas />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                {formattedDate}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Governance & System Administration
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Campus Control <span className="text-gradient">Center</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Oversee campus security audit events, supervise academic resource moderation queues, and manage institutional role permissions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('moderation')}
              leftIcon={<Inbox className="w-3.5 h-3.5" />}
            >
              Moderation Queue ({pendingModeration.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('audit-logs')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Audit Logs
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Enrolled Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalStudentsEnrolled ?? 0}</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1">
              <span>View accounts</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-indigo-800">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.coursesTaughtCount ?? 0}</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1">
              <span>Explore catalog</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-indigo-800">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('moderation')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pending Review</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingModeration.length}</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <span>Inspect items</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('resources')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Verified Resources</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.myResourcesCount ?? 0}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>Browse repository</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Audit Trail & Governance Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* Recent Audit Trail */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Recent Security Audit Events</span>
              </h2>
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View full audit trail
              </button>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center">
                  <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No recent security events</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs py-2.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-brand-600 dark:text-brand-300 font-bold uppercase px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex-shrink-0">
                        {log.action}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold truncate">
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

          {/* Pending Moderation Snapshot */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-500" />
                <span>Pending Moderation Queue</span>
              </h2>
              <button
                onClick={() => onNavigate('moderation')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Inspect queue ({pendingModeration.length})
              </button>
            </div>

            <div className="space-y-3">
              {pendingModeration.length === 0 ? (
                <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">Moderation Queue is Clear</p>
                  <p className="text-[11px] text-slate-500">All student study materials and PYQs have been verified.</p>
                </div>
              ) : (
                pendingModeration.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="amber" size="sm" dot>
                          {item.category}
                        </Badge>
                        <span className="text-[11px] text-slate-400 truncate">
                          By {item.uploader?.fullName || 'Student'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onNavigate('moderation')}
                      className="flex-shrink-0"
                    >
                      Review
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-7">
          
          {/* User Role Promotion Tool */}
          <section className="space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Role Permissions Manager</span>
            </h2>

            <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Promote verified campus accounts to Faculty or Administrator privileges.
              </p>

              <form onSubmit={handlePromoteRole} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    User Campus Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="e.g. professor@sbjit.edu.in"
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assigned Role *
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="FACULTY">FACULTY (Course & Grading Management)</option>
                    <option value="ADMIN">ADMIN (Full Governance & Security)</option>
                    <option value="STUDENT">STUDENT (Standard Academic Access)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPromoting}
                  className="w-full"
                >
                  Update User Permissions
                </Button>
              </form>
            </div>
          </section>

          {/* Quick Shortcuts */}
          <section className="space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Governance Shortcuts</span>
            </h2>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('moderation')}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Academic Moderation Queue</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Approve, reject, or request revisions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Security & Audit Logs</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Inspect IP logs and access timestamps</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('courses')}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Institutional Course Catalog</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Review and audit all department courses</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
