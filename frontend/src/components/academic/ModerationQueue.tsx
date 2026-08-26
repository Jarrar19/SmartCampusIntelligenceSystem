import React, { useState, useEffect } from 'react';
import { 
  Inbox, CheckCircle, XCircle, Download, FileText, 
  AlertCircle, Clock, User, Check, ShieldCheck, X
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Resource } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export const ModerationQueue: React.FC = () => {
  const { success, error } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING_REVIEW');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/resources/moderation-queue?status=${activeTab}`);
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (err: any) {
      error('Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleModerate = async (resourceId: number, status: 'APPROVED' | 'REJECTED') => {
    let rejectionReason: string | null = null;
    if (status === 'REJECTED') {
      rejectionReason = window.prompt('Please provide a constructive reason for rejecting this upload:');
      if (!rejectionReason || !rejectionReason.trim()) {
        error('Rejection reason is required.');
        return;
      }
    }

    setProcessingId(resourceId);
    try {
      const res = await api.patch(`/resources/${resourceId}/moderate`, {
        status,
        rejectionReason,
      });

      if (res.data.success) {
        success(res.data.message);
        setResources(prev => prev.filter(r => r.id !== resourceId));
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await api.get(`/resources/${resource.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Download failed');
      error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Inbox className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>Academic Resource Moderation Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review student uploads, verify academic integrity of PYQs and notes, and approve for campus catalog.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
          {[
            { id: 'PENDING_REVIEW', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review Queue Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading moderation queue...</div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Resources in Queue"
          description={`There are currently no materials in the ${activeTab.toLowerCase().replace('_', ' ')} queue.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {resources.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl glass-panel flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-brand-500 to-indigo-500" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={r.category === 'PYQ' ? 'indigo' : 'emerald'}>{r.category}</Badge>
                  {r.subjectCode && (
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {r.subjectCode}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-slate-400">
                    Uploaded {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {r.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap font-semibold">
                  <span>Student: <strong>{r.uploader?.fullName}</strong> ({r.uploader?.department || 'Student'})</span>
                  <span>File: <strong className="text-slate-700 dark:text-slate-300">{r.fileName}</strong> ({(r.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                </div>

                {r.rejectionReason && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                    <strong>Rejection Feedback:</strong> {r.rejectionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => handleDownload(r)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Inspect File</span>
                </button>

                {activeTab === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => handleModerate(r.id, 'APPROVED')}
                      disabled={processingId === r.id}
                      className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleModerate(r.id, 'REJECTED')}
                      disabled={processingId === r.id}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
