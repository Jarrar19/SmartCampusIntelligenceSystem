import React, { useState, useEffect } from 'react';
import { 
  Inbox, CheckCircle, XCircle, Download, FileText, 
  AlertCircle, Clock, User, Check, ShieldCheck, X, Sparkles
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Resource } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ModerationFeedbackModal } from './ModerationFeedbackModal';

export const ModerationQueue: React.FC = () => {
  const { success, error } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING_REVIEW');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedbackModalTarget, setFeedbackModalTarget] = useState<{
    resource: Resource;
    status: 'REJECTED' | 'CHANGES_REQUESTED';
  } | null>(null);

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

  const handleApprove = async (resourceId: number) => {
    setProcessingId(resourceId);
    try {
      const res = await api.patch(`/resources/${resourceId}/moderate`, {
        status: 'APPROVED',
      });

      if (res.data.success) {
        success('Resource approved and cataloged successfully!');
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFeedbackSubmit = async (reason: string) => {
    if (!feedbackModalTarget) return;
    const { resource, status } = feedbackModalTarget;

    setProcessingId(resource.id);
    try {
      const res = await api.patch(`/resources/${resource.id}/moderate`, {
        status,
        rejectionReason: reason,
      });

      if (res.data.success) {
        success(res.data.message);
        setResources((prev) => prev.filter((r) => r.id !== resource.id));
        setFeedbackModalTarget(null);
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
    <div className="space-y-6 animate-fade-in-up">
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
            { id: 'APPROVED', label: 'Approved Catalog' },
            { id: 'REJECTED', label: 'Rejected Uploads' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
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

      {/* Moderation List */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 glass-panel rounded-2xl shimmer" />
          <div className="h-24 glass-panel rounded-2xl shimmer" />
          <div className="h-24 glass-panel rounded-2xl shimmer" />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={activeTab === 'PENDING_REVIEW' ? 'Moderation Queue is Clean!' : `No ${activeTab.toLowerCase()} items.`}
          description={
            activeTab === 'PENDING_REVIEW'
              ? 'All student uploads and study materials have been reviewed by academic faculty.'
              : 'No resources found in this review status.'
          }
        />
      ) : (
        <div className="space-y-3">
          {resources.map((res) => (
            <div
              key={res.id}
              className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge variant={res.approvalStatus === 'APPROVED' ? 'emerald' : res.approvalStatus === 'REJECTED' ? 'rose' : 'amber'} size="xs" dot>
                    {res.approvalStatus}
                  </Badge>
                  <Badge variant="indigo" size="xs">
                    {res.category}
                  </Badge>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Sem {res.semester || 6} • {res.department || 'Engineering'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                  {res.description || `File: ${res.fileName}`}
                </p>

                <div className="pt-1 flex items-center space-x-3 text-[11px] text-slate-400 font-bold">
                  <span>Uploaded by: {res.uploader?.fullName || 'Student'}</span>
                  <span>•</span>
                  <span>Date: {new Date(res.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleDownload(res)}
                  className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  title="Download File to Inspect"
                >
                  <Download className="w-4 h-4" />
                </button>

                {activeTab === 'PENDING_REVIEW' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setFeedbackModalTarget({ resource: res, status: 'REJECTED' })}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="emerald"
                      size="sm"
                      isLoading={processingId === res.id}
                      onClick={() => handleApprove(res.id)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Approve & Publish
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderation Feedback Modal */}
      {feedbackModalTarget && (
        <ModerationFeedbackModal
          isOpen={true}
          onClose={() => setFeedbackModalTarget(null)}
          resource={feedbackModalTarget.resource}
          status={feedbackModalTarget.status}
          onSubmit={handleFeedbackSubmit}
          isSubmitting={processingId === feedbackModalTarget.resource.id}
        />
      )}
    </div>
  );
};
