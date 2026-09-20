import React, { useState, useEffect } from 'react';
import {
  FolderLock, Plus, Search, FileText, Download, Eye, Trash2,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, Tag, Filter,
  RefreshCw, Sparkles, AlertCircle, FileCheck, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { UploadStudentDocModal } from '../../components/student/UploadStudentDocModal';
import { api, extractErrorMessage } from '../../services/api';

export const StudentDocxPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    available: 0,
    expired: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    requiredChecklistTotal: 0,
    requiredUploadedCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategoryPreset, setUploadCategoryPreset] = useState('ADMISSION_RENEWAL');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Documents' },
    { id: 'ADMISSION_RENEWAL', label: 'Admission & Renewal' },
    { id: 'SCHOLARSHIPS', label: 'Scholarships' },
    { id: 'ACADEMIC_RECORDS', label: 'Academic Records' },
    { id: 'IDENTITY_DOCUMENTS', label: 'Identity Documents' },
    { id: 'CERTIFICATES', label: 'Certificates' },
    { id: 'OTHER_DOCUMENTS', label: 'Other Documents' },
  ];

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      let url = '/student-docs';
      const params: string[] = [];
      if (selectedCategory !== 'ALL') params.push(`category=${selectedCategory}`);
      if (selectedStatus !== 'ALL') params.push(`status=${selectedStatus}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      if (res.data.success) {
        setDocuments(res.data.data.documents);
        setStats(res.data.data.stats);
        setRequirements(res.data.data.requirements);
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to fetch documents');
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, selectedStatus]);

  const handleDelete = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document from your vault?')) return;
    try {
      const res = await api.delete(`/student-docs/${docId}`);
      if (res.data.success) {
        success('Document deleted successfully');
        fetchDocuments();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to delete document');
      error(msg);
    }
  };

  const handleOpenUploadWithCategory = (cat: string) => {
    setUploadCategoryPreset(cat);
    setShowUploadModal(true);
  };

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'ADMISSION_RENEWAL': return 'indigo';
      case 'SCHOLARSHIPS': return 'emerald';
      case 'ACADEMIC_RECORDS': return 'purple';
      case 'IDENTITY_DOCUMENTS': return 'blue';
      case 'CERTIFICATES': return 'amber';
      default: return 'slate';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-black">
              <FolderLock className="w-3.5 h-3.5" />
              <span>SECURE STUDENT DOCX VAULT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Student Document Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Manage your essential college documents for admission renewals, scholarships, exams, and compliance with verified status tracking.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDocuments}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="tricolor"
              size="sm"
              onClick={() => handleOpenUploadWithCategory('ADMISSION_RENEWAL')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload Document
            </Button>
          </div>
        </div>

        {/* Decorative Grid SVG */}
        <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Total Vault Files</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Uploaded</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Verified by Staff</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.verified}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Approved</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Under Staff Review</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-amber-500">{stats.pending}</span>
            <span className="text-[10px] text-amber-600/80 font-semibold">Pending</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Expired / Action Needed</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-rose-500">{stats.expired + stats.rejected}</span>
            <span className="text-[10px] text-rose-600 font-semibold">Attention</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Documents List & Categories */}
        <div className="lg:col-span-3 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filters & Search Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search documents by name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchDocuments();
                }}
                className="w-full glass-input rounded-2xl pl-9 pr-3.5 py-2 text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="glass-input rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none w-full sm:w-auto"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="EXPIRED">Expired</option>
                <option value="REQUIRED">Required</option>
              </select>

              <Button variant="secondary" size="sm" onClick={fetchDocuments}>
                Filter
              </Button>
            </div>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs font-black text-slate-600 dark:text-slate-400">
                Loading your documents vault...
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <FolderLock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                No documents in this category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'No documents matched your search filter.'
                  : 'You have not uploaded any documents in this category yet.'}
              </p>
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleOpenUploadWithCategory(selectedCategory === 'ALL' ? 'ADMISSION_RENEWAL' : selectedCategory)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Upload Document Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const isVerified = doc.verificationStatus === 'VERIFIED';
                const isRejected = doc.verificationStatus === 'REJECTED';
                const isExpired = doc.status === 'EXPIRED';

                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between space-y-3 relative ${
                      isRejected
                        ? 'border-rose-400 dark:border-rose-800 ring-1 ring-rose-400/20'
                        : isExpired
                        ? 'border-amber-400 dark:border-amber-800'
                        : isVerified
                        ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header Strip */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={getCategoryBadgeVariant(doc.category)} size="xs">
                          {doc.category.replace(/_/g, ' ')}
                        </Badge>

                        <div className="flex items-center gap-1.5">
                          {isVerified && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-500" /> Action Needed
                            </span>
                          )}
                          {!isVerified && !isRejected && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> Pending Review
                            </span>
                          )}

                          {isExpired && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Expired
                            </span>
                          )}
                        </div>
                      </div>

                      {/* File Icon & Name */}
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug truncate">
                            {doc.documentName}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {doc.fileName} • {formatFileSize(doc.fileSize)}
                          </p>
                        </div>
                      </div>

                      {/* Reviewer Feedback Notes if rejected or verified */}
                      {doc.verifierNotes && (
                        <div
                          className={`p-2 rounded-xl text-[11px] font-medium leading-relaxed ${
                            isRejected
                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                          }`}
                        >
                          <span className="font-bold block text-[10px] uppercase">
                            Reviewer Note:
                          </span>
                          {doc.verifierNotes}
                        </div>
                      )}

                      {/* Optional Notes */}
                      {doc.notes && !doc.verifierNotes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {doc.notes}
                        </p>
                      )}
                    </div>

                    {/* Footer Strip */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="text-[10px] text-slate-400">
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {doc.expiryDate && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                            Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`/api/v1/student-docs/${doc.id}/download`}
                          download={doc.fileName}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Institutional Checklist Widget */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Compliance Checklist
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Institutional document requirements required by College Student Section for registration renewal & scholarships.
            </p>

            <div className="space-y-2.5">
              {requirements.map((req) => {
                const uploaded = documents.find(
                  (d) => d.category === req.category && d.status !== 'EXPIRED'
                );
                const isVerified = uploaded?.verificationStatus === 'VERIFIED';

                return (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {req.title}
                      </span>
                      {uploaded ? (
                        isVerified ? (
                          <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex-shrink-0" title="Verified">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex-shrink-0" title="Uploaded, Pending Review">
                            <Clock className="w-3 h-3" />
                          </span>
                        )
                      ) : (
                        <span className="p-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex-shrink-0" title="Not Uploaded">
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-semibold capitalize">
                        {req.category.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {!uploaded && (
                        <button
                          onClick={() => handleOpenUploadWithCategory(req.category)}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          + Upload
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadStudentDocModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploaded={fetchDocuments}
          initialCategory={uploadCategoryPreset}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          doc={previewDoc}
        />
      )}
    </div>
  );
};
