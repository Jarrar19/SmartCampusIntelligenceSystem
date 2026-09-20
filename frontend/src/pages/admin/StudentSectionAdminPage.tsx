import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Search, Users, FileCheck2, AlertCircle, CheckCircle2,
  Clock, Filter, Download, Eye, Plus, Trash2, X, RefreshCw, Sparkles,
  ChevronRight, ExternalLink, ArrowLeft, Tag, Inbox, FileText, Check, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { api, extractErrorMessage } from '../../services/api';

export const StudentSectionAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  // Navigation tab: REVIEW_QUEUE vs DIRECTORY
  const [activeTab, setActiveTab] = useState<'REVIEW_QUEUE' | 'DIRECTORY'>('REVIEW_QUEUE');

  // All Documents (Review Queue) state
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [isLoadingAllDocs, setIsLoadingAllDocs] = useState(true);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');
  const [docVerifyFilter, setDocVerifyFilter] = useState('ALL');

  // Student directory state
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inspected student state
  const [inspectedStudent, setInspectedStudent] = useState<any | null>(null);
  const [inspectedDocs, setInspectedDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Quick verify modal state
  const [selectedDocForVerify, setSelectedDocForVerify] = useState<any | null>(null);
  const [verifyAction, setVerifyAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifierNotes, setVerifierNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Requirements management modal
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('ADMISSION_RENEWAL');
  const [newReqDescription, setNewReqDescription] = useState('');
  const [newReqMandatory, setNewReqMandatory] = useState(true);
  const [isAddingReq, setIsAddingReq] = useState(false);

  // Interactive Document Preview & Review Modal
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const categories = [
    { id: 'ADMISSION_RENEWAL', label: 'Admission & Renewal' },
    { id: 'SCHOLARSHIPS', label: 'Scholarships' },
    { id: 'ACADEMIC_RECORDS', label: 'Academic Records' },
    { id: 'IDENTITY_DOCUMENTS', label: 'Identity Documents' },
    { id: 'CERTIFICATES', label: 'Certificates' },
    { id: 'OTHER_DOCUMENTS', label: 'Other Documents' },
  ];

  // Fetch all documents for the Review Queue
  const fetchAllDocuments = async () => {
    setIsLoadingAllDocs(true);
    try {
      let url = '/student-docs/admin/all-documents';
      const params: string[] = [];
      if (docSearchQuery.trim()) params.push(`search=${encodeURIComponent(docSearchQuery.trim())}`);
      if (docCategoryFilter !== 'ALL') params.push(`category=${encodeURIComponent(docCategoryFilter)}`);
      if (docVerifyFilter !== 'ALL') params.push(`verificationStatus=${encodeURIComponent(docVerifyFilter)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      if (res.data.success) {
        setAllDocuments(res.data.data);
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to fetch documents queue');
      error(msg);
    } finally {
      setIsLoadingAllDocs(false);
    }
  };

  // Fetch student directory
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let url = '/student-docs/admin/students';
      const params: string[] = [];
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (departmentFilter !== 'ALL') params.push(`department=${encodeURIComponent(departmentFilter)}`);
      if (statusFilter !== 'ALL') params.push(`status=${statusFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      if (res.data.success) {
        setStudents(res.data.data.students);
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to fetch student directory');
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch requirements
  const fetchRequirements = async () => {
    try {
      const res = await api.get('/student-docs/admin/requirements');
      if (res.data.success) {
        setRequirements(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
    fetchStudents();
    fetchRequirements();
  }, [docCategoryFilter, docVerifyFilter, departmentFilter, statusFilter]);

  const handleInspectStudent = async (student: any) => {
    setInspectedStudent(student);
    setIsLoadingDocs(true);
    try {
      const res = await api.get(`/student-docs/admin/students/${student.id}`);
      if (res.data.success) {
        setInspectedDocs(res.data.data.documents);
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to load student documents');
      error(msg);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Inline Verification Handler triggered from DocumentPreviewModal
  const handleVerifyFromModal = async (
    docId: number,
    status: 'VERIFIED' | 'REJECTED',
    notes: string
  ) => {
    try {
      const res = await api.patch(`/student-docs/admin/${docId}/verify`, {
        verificationStatus: status,
        verifierNotes: notes || undefined,
      });

      if (res.data.success) {
        const updated = res.data.data;
        success(`Document successfully marked as ${status}!`);

        // Update in allDocuments list
        setAllDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...updated } : d))
        );

        // Update in inspectedDocs list
        setInspectedDocs((prev) =>
          prev.map((d) => (d.id === docId ? updated : d))
        );

        // Update previewDoc with verified state
        setPreviewDoc((prev) => (prev && prev.id === docId ? { ...prev, ...updated } : prev));

        // Refresh stats
        fetchStudents();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Verification update failed');
      error(msg);
      throw err;
    }
  };

  const handleOpenVerify = (doc: any, action: 'VERIFIED' | 'REJECTED') => {
    setSelectedDocForVerify(doc);
    setVerifyAction(action);
    setVerifierNotes(action === 'VERIFIED' ? 'Document verified with institutional records.' : '');
  };

  const handleConfirmVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForVerify) return;

    setIsVerifying(true);
    try {
      await handleVerifyFromModal(
        selectedDocForVerify.id,
        verifyAction,
        verifierNotes.trim()
      );
      setSelectedDocForVerify(null);
    } catch (err: any) {
      // Handled in handleVerifyFromModal
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle.trim()) return;

    setIsAddingReq(true);
    try {
      const res = await api.post('/student-docs/admin/requirements', {
        title: newReqTitle.trim(),
        category: newReqCategory,
        description: newReqDescription.trim() || undefined,
        isMandatory: newReqMandatory,
      });

      if (res.data.success) {
        success('New document requirement category created!');
        setNewReqTitle('');
        setNewReqDescription('');
        fetchRequirements();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to create requirement');
      error(msg);
    } finally {
      setIsAddingReq(false);
    }
  };

  const handleDeleteRequirement = async (reqId: number) => {
    if (!window.confirm('Delete this requirement item?')) return;
    try {
      const res = await api.delete(`/student-docs/admin/requirements/${reqId}`);
      if (res.data.success) {
        success('Requirement removed.');
        fetchRequirements();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to delete requirement');
      error(msg);
    }
  };

  // Metrics summary
  const totalStudents = students.length;
  const compliantCount = students.filter((s) => s.metrics?.isCompliant).length;
  const pendingDocsCount = allDocuments.filter((d) => d.verificationStatus === 'PENDING').length;
  const verifiedDocsCount = allDocuments.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const expiredCount = students.reduce((acc, s) => acc + (s.metrics?.expiredDocs || 0), 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CENTRAL STUDENT SECTION ADMINISTRATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Student DOCX Management Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Inspect marksheet scans, scholarship applications, and renewal forms directly within the site without downloading.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRequirementsModal(true)}
              leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}
            >
              Manage Requirements
            </Button>
            <Button
              variant="tricolor"
              size="sm"
              onClick={() => {
                fetchAllDocuments();
                fetchStudents();
              }}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingAllDocs ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Total Students</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalStudents}</span>
            <span className="text-[10px] text-blue-600 font-bold">Enrolled</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Pending Staff Review</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-amber-500">{pendingDocsCount}</span>
            <span className="text-[10px] text-amber-600 font-bold">Docs Awaiting</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Verified Documents</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{verifiedDocsCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Approved</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Expired Documents</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-rose-500">{expiredCount}</span>
            <span className="text-[10px] text-rose-600 font-bold">Need Renewal</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('REVIEW_QUEUE')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'REVIEW_QUEUE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Document Review Queue</span>
          {pendingDocsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {pendingDocsCount} PENDING
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Directory & Vaults</span>
          <span className="text-[10px] opacity-70">({totalStudents} Students)</span>
        </button>
      </div>

      {/* TAB 1: DOCUMENT REVIEW QUEUE */}
      {activeTab === 'REVIEW_QUEUE' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by student name, USN, or document..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchAllDocuments();
                }}
                className="w-full glass-input rounded-2xl pl-9 pr-3.5 py-2 text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={docVerifyFilter}
                onChange={(e) => setDocVerifyFilter(e.target.value)}
                className="glass-input rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
              >
                <option value="ALL">All Review Statuses</option>
                <option value="PENDING">⏳ Awaiting Review (Pending)</option>
                <option value="VERIFIED">✅ Verified / Approved</option>
                <option value="REJECTED">❌ Rejected / Action Needed</option>
              </select>

              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="glass-input rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <Button variant="secondary" size="sm" onClick={fetchAllDocuments}>
                Filter
              </Button>
            </div>
          </div>

          {/* Documents Grid */}
          {isLoadingAllDocs ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Loading review queue documents...
              </p>
            </div>
          ) : allDocuments.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No documents found matching the filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDocuments.map((doc) => {
                const isPending = doc.verificationStatus === 'PENDING';
                const isVerified = doc.verificationStatus === 'VERIFIED';
                const isRejected = doc.verificationStatus === 'REJECTED';

                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-sm hover:shadow-md flex flex-col justify-between space-y-3.5 ${
                      isPending
                        ? 'border-amber-400/60 dark:border-amber-500/40 ring-2 ring-amber-400/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Student Info Ribbon */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            {doc.student?.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                              {doc.student?.fullName || 'Student'}
                            </h5>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                              USN: {doc.student?.prn || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={isVerified ? 'emerald' : isRejected ? 'rose' : 'amber'}
                          size="xs"
                        >
                          {doc.verificationStatus}
                        </Badge>
                      </div>

                      {/* Document Details */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="indigo" size="xs">
                            {doc.category.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            .{doc.fileType}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                          {doc.documentName}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          File: {doc.fileName}
                        </p>
                      </div>

                      {/* Verification Feedback if exists */}
                      {doc.verifierNotes && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="font-bold block text-[10px] text-slate-400">
                            Staff Note:
                          </span>
                          {doc.verifierNotes}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span>{doc.student?.department || 'Department'}</span>
                      </div>

                      {/* Primary Action: View & Verify In-Browser */}
                      <Button
                        variant={isPending ? 'tricolor' : 'primary'}
                        size="xs"
                        fullWidth
                        onClick={() => setPreviewDoc(doc)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {isPending ? '🔍 View & Verify Document' : '👁️ View Document Preview'}
                      </Button>

                      {/* Quick 1-click verify buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenVerify(doc, 'VERIFIED')}
                          className="flex-1 py-1 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenVerify(doc, 'REJECTED')}
                          className="flex-1 py-1 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-800 flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT DIRECTORY & INDIVIDUAL VAULTS */}
      {activeTab === 'DIRECTORY' && (
        <div>
          {/* If a student is selected for inspection, show the Document Inspection View */}
          {inspectedStudent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setInspectedStudent(null)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Back to Directory"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    {inspectedStudent.fullName?.charAt(0) || 'S'}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{inspectedStudent.fullName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold">
                        USN: {inspectedStudent.prn || 'N/A'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {inspectedStudent.department || 'Department not set'} • Semester {inspectedStudent.semester || 'N/A'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleInspectStudent(inspectedStudent)}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />}
                >
                  Refresh Docs
                </Button>
              </div>

              {/* Student's Documents Grid */}
              {isLoadingDocs ? (
                <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Loading student vault documents...</p>
                </div>
              ) : inspectedDocs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    This student has not uploaded any documents yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inspectedDocs.map((doc) => {
                    const isVerified = doc.verificationStatus === 'VERIFIED';
                    const isRejected = doc.verificationStatus === 'REJECTED';
                    const isPending = doc.verificationStatus === 'PENDING';

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <Badge variant="indigo" size="xs">
                              {doc.category.replace(/_/g, ' ')}
                            </Badge>
                            <Badge
                              variant={isVerified ? 'emerald' : isRejected ? 'rose' : 'amber'}
                              size="xs"
                            >
                              {doc.verificationStatus}
                            </Badge>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {doc.documentName}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {doc.fileName} • {doc.fileType.toUpperCase()}
                          </p>

                          {doc.verifierNotes && (
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-bold block text-[10px] text-slate-400">Review Note:</span>
                              {doc.verifierNotes}
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">
                              Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setPreviewDoc({ ...doc, student: inspectedStudent })}
                                className="p-1 rounded text-slate-600 hover:text-blue-600 cursor-pointer"
                                title="Preview & Verify In-Browser"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`/api/v1/student-docs/${doc.id}/download`}
                                download={doc.fileName}
                                className="p-1 rounded text-slate-600 hover:text-blue-600 cursor-pointer"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* In-browser Review & Verify button */}
                          <Button
                            variant="primary"
                            size="xs"
                            fullWidth
                            onClick={() => setPreviewDoc({ ...doc, student: inspectedStudent })}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View & Verify In-Browser
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Main Student Directory Table / View */
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by USN (e.g. CM23013) or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchStudents();
                    }}
                    className="w-full glass-input rounded-2xl pl-9 pr-3.5 py-2 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="glass-input rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="ALL">All Compliance Statuses</option>
                    <option value="ACTION_NEEDED">Action Needed / Incomplete</option>
                    <option value="PENDING">Has Pending Verification</option>
                    <option value="EXPIRED">Has Expired Documents</option>
                    <option value="VERIFIED">Has Verified Documents</option>
                  </select>

                  <Button variant="secondary" size="sm" onClick={fetchStudents}>
                    Search
                  </Button>
                </div>
              </div>

              {/* Students Cards / Table */}
              {isLoading ? (
                <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Searching student directory...
                  </p>
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No students found matching current filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => {
                    const { metrics } = student;

                    return (
                      <div
                        key={student.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-black">
                              USN: {student.prn || 'CM23xxx'}
                            </span>

                            <Badge
                              variant={
                                metrics.isCompliant
                                  ? 'emerald'
                                  : metrics.expiredDocs > 0
                                  ? 'rose'
                                  : 'amber'
                              }
                              size="xs"
                            >
                              {metrics.isCompliant
                                ? 'Compliant'
                                : metrics.expiredDocs > 0
                                ? 'Expired Docs'
                                : 'Pending Docs'}
                            </Badge>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                              {student.fullName}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {student.department || 'Department CSE'} • Sem {student.semester || 6}
                            </p>
                          </div>

                          {/* Mini Stats Breakdown */}
                          <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center text-[10px]">
                            <div>
                              <span className="text-slate-400 block text-[9px]">Uploaded</span>
                              <span className="font-black text-slate-800 dark:text-slate-200">
                                {metrics.totalDocs}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px]">Verified</span>
                              <span className="font-black text-emerald-600">
                                {metrics.verifiedDocs}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px]">Pending</span>
                              <span className="font-black text-amber-500">
                                {metrics.pendingDocs}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleInspectStudent(student)}
                          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        >
                          Inspect Documents Vault
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Verify Document Modal (Quick Actions) */}
      {selectedDocForVerify && (
        <Modal
          isOpen={Boolean(selectedDocForVerify)}
          onClose={() => setSelectedDocForVerify(null)}
          title={`Review Document: ${selectedDocForVerify.documentName}`}
          subtitle={`Student File: ${selectedDocForVerify.fileName}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmVerify} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                Action Decision
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyAction('VERIFIED')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyAction === 'VERIFIED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Document
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyAction('REJECTED')}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyAction === 'REJECTED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                  }`}
                >
                  <X className="w-4 h-4" /> Reject / Re-upload
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                Staff Feedback Remarks / Reason
              </label>
              <textarea
                rows={3}
                placeholder="Write specific notes for the student (e.g. Verified with admissions desk or Marksheet image is unreadable)..."
                value={verifierNotes}
                onChange={(e) => setVerifierNotes(e.target.value)}
                className="w-full glass-input rounded-2xl p-3 text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocForVerify(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={verifyAction === 'VERIFIED' ? 'primary' : 'danger'}
                size="sm"
                isLoading={isVerifying}
              >
                Submit Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Requirements Modal */}
      {showRequirementsModal && (
        <Modal
          isOpen={showRequirementsModal}
          onClose={() => setShowRequirementsModal(false)}
          title="Institutional Required Document Checklist"
          subtitle="Define mandatory and optional document requirements across campus"
          maxWidth="lg"
        >
          <div className="space-y-5 text-left">
            {/* Create New Requirement Form */}
            <form onSubmit={handleCreateRequirement} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                + Add New Required Document Type
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Requirement Title"
                  placeholder="e.g. Caste Validity Certificate"
                  value={newReqTitle}
                  onChange={(e) => setNewReqTitle(e.target.value)}
                  isRequired
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    Category
                  </label>
                  <select
                    value={newReqCategory}
                    onChange={(e) => setNewReqCategory(e.target.value)}
                    className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isMandatoryCheck"
                    checked={newReqMandatory}
                    onChange={(e) => setNewReqMandatory(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isMandatoryCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mandatory for All Students
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="tricolor"
                  size="xs"
                  isLoading={isAddingReq}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Requirement
                </Button>
              </div>
            </form>

            {/* Existing Requirements List */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Current Active Requirements ({requirements.length})
              </h4>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {req.title}
                        </span>
                        {req.isMandatory && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[9px] uppercase">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {req.category.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Delete Requirement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* In-Browser Document Previewer & Verification Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          doc={previewDoc}
          canVerify={true}
          onVerify={handleVerifyFromModal}
        />
      )}
    </div>
  );
};
