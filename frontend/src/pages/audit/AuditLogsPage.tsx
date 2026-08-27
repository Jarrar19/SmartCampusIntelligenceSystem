import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Activity, Clock, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AuditLog } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ListRowSkeleton } from '../../components/common/Skeleton';

export const AuditLogsPage: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/users/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      error('Failed to load security audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>Campus Security & Governance Trail</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit logs recording access, role changes, moderation actions, and administrative transactions.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchLogs}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search audit details, IP addresses, or actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input rounded-2xl text-xs font-medium pl-10 pr-4 py-2.5 focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="glass-input rounded-2xl text-xs font-bold px-3 py-2.5 focus:outline-none"
        >
          <option value="">All Action Types</option>
          <option value="LOGIN">User Authentication</option>
          <option value="REGISTER">Registrations</option>
          <option value="PROMOTE_ROLE">Role Promotions</option>
          <option value="COURSE_CREATE">Course Creation</option>
          <option value="RESOURCE_MODERATE">Resource Moderation</option>
          <option value="PRODUCT_CREATE">Marketplace Listings</option>
        </select>
      </div>

      {/* Audit Log Stream */}
      {isLoading ? (
        <div className="space-y-3">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Security Logs Found"
          description="No audit events matched your search filter criteria."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4.5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  {getActionBadge(log.action)}
                  <span className="text-[10px] text-slate-400 font-mono">
                    IP: {log.ipAddress || '127.0.0.1'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Resource: {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {log.details || log.action}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-bold flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
