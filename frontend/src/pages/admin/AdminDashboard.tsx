import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Inbox, FileText, ShoppingBag, 
  Activity, ArrowRight, CheckCircle2, XCircle, Search, UserCheck,
  Sparkles, ChevronRight, ShieldAlert, Download, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, extractErrorMessage } from '../../services/api';
import { CampusHeroCanvas } from '../../components/common/CampusHeroCanvas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
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
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Role Promotion tool state
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('FACULTY');
  const [isPromoting, setIsPromoting] = useState(false);

  const loadAdminData = async () => {
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
  };

  useEffect(() => {
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
        loadAdminData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleQuickApprove = async (resourceId: number) => {
    setProcessingId(resourceId);
    try {
      const res = await api.patch(`/resources/${resourceId}/moderate`, {
        status: 'APPROVED',
      });
      if (res.data.success) {
        success('Resource approved into campus catalog!');
        setPendingModeration((prev) => prev.filter((r) => r.id !== resourceId));
        loadAdminData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('BLOCK')) {
      return <Badge variant="rose" size="xs">{action}</Badge>;
    }
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('PROMOTE')) {
      return <Badge variant="emerald" size="xs">{action}</Badge>;
    }
    if (action.includes('UPDATE') || action.includes('MODERATE')) {
      return <Badge variant="amber" size="xs">{action}</Badge>;
    }
    return <Badge variant="indigo" size="xs">{action}</Badge>;
  };

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
                Institutional Governance & Security Control
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
              Moderation Hub ({pendingModeration.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('audit-logs')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Security Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('courses')}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Course Catalog
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Registered Users</span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalUsersCount || '500+'}
            </span>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Students & faculty members
          </p>
        </div>

        {/* Active Courses */}
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Courses</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.coursesCount || '18'}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Published</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Curriculum classes
          </p>
        </div>

        {/* Moderation Queue */}
        <div 
          onClick={() => onNavigate('moderation')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Moderation</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {pendingModeration.length}
            </span>
            <Badge variant={pendingModeration.length > 0 ? 'amber' : 'emerald'} size="xs" dot>
              {pendingModeration.length > 0 ? 'Queue' : 'Clean'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Awaiting campus review
          </p>
        </div>

        {/* Audit Events */}
        <div 
          onClick={() => onNavigate('audit-logs')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Security Trail</span>
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.auditLogsCount || auditLogs.length || 0}
            </span>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Logged</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Immutable system logs
          </p>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Security Trail & Moderation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Security Audit Trail Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Live Security & Audit Trail
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Real-time campus user actions and security events
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-xs font-bold">No security events logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        {getActionBadge(log.action)}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {log.details || log.action}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Moderation Queue Preview */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Supervisory Resource Moderation
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Approve uploaded academic resources for campus access
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('moderation')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Review All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingModeration.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">All pending resource uploads are reviewed.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingModeration.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="amber" size="xs">
                          {res.category}
                        </Badge>
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {res.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Uploaded by {res.uploader?.fullName || 'User'} • {res.fileName}
                      </p>
                    </div>

                    <Button
                      variant="emerald"
                      size="xs"
                      isLoading={processingId === res.id}
                      onClick={() => handleQuickApprove(res.id)}
                      leftIcon={<Check className="w-3 h-3" />}
                    >
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: User Role Governance & Tools (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Institutional User Role Promoter Tool */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Institutional User Role Manager
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Promote verified user roles across the campus directory
                </p>
              </div>
            </div>

            <form onSubmit={handlePromoteRole} className="space-y-3.5">
              <Input
                label="Target User Campus Email"
                placeholder="faculty.member@sbjit.edu.in"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                isRequired
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                  Assign Campus Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STUDENT', 'FACULTY', 'ADMIN'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                        targetRole === role
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 border border-transparent'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full"
                isLoading={isPromoting}
              >
                Apply Role Permission Change
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
