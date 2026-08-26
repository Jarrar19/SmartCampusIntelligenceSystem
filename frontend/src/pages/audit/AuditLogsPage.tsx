import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Clock, Terminal, Activity, Search, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AuditLog } from '../../types';
import { Badge } from '../../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.get('/users/audit-logs');
        if (res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        error('Failed to load security audit logs');
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'ALL') {
      if (!log.action.includes(filter) && !log.resourceType.includes(filter)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchType = log.resourceType.toLowerCase().includes(q);
      const matchDetails = (log.details || '').toLowerCase().includes(q);
      const matchId = (log.resourceId || '').toLowerCase().includes(q);
      if (!matchAction && !matchType && !matchDetails && !matchId) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('APPROVE') || action.includes('CREATE')) {
      return <Badge variant="emerald">{action}</Badge>;
    }
    if (action.includes('FAILED') || action.includes('REJECT') || action.includes('DELETE')) {
      return <Badge variant="rose">{action}</Badge>;
    }
    if (action.includes('UPDATE') || action.includes('REQUEST')) {
      return <Badge variant="amber">{action}</Badge>;
    }
    return <Badge variant="indigo">{action}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Security & Institutional Audit Logs</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable event stream recording logins, moderation decisions, resource interactions, and permission checks.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'AUTH', label: 'Auth' },
            { id: 'COURSE', label: 'Courses' },
            { id: 'RESOURCE', label: 'Resources' },
            { id: 'ASSIGNMENT', label: 'Assignments' },
            { id: 'MARKETPLACE', label: 'Marketplace' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                filter === tab.id
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit logs by action name, keyword, ID or JSON details..."
          className="w-full glass-input rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading audit trail...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-400 font-medium">No matching audit events found.</div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Event Action</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Resource ID</th>
                  <th className="px-6 py-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-sans">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-900 dark:text-slate-200 font-bold">
                      {log.resourceType}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-bold">
                      {log.resourceId ? `#${log.resourceId}` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 max-w-sm truncate font-sans text-xs">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
