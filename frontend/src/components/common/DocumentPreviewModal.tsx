import React, { useState, useEffect } from 'react';
import {
  Download, ExternalLink, FileText, AlertCircle, CheckCircle2, Clock,
  ZoomIn, ZoomOut, RotateCw, RefreshCcw, Sparkles, Send, Eye, ShieldCheck,
  User, Building2, Calendar, FileCheck
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { api } from '../../services/api';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Student Doc object
  doc?: {
    id: number;
    documentName: string;
    fileName: string;
    fileType: string;
    category?: string;
    status?: string;
    verificationStatus?: string;
    verifierNotes?: string | null;
    notes?: string | null;
    fileSize?: number;
    createdAt?: string;
    updatedAt?: string;
    student?: {
      id?: number;
      fullName?: string;
      email?: string;
      prn?: string | null;
      department?: string | null;
      semester?: number | null;
    };
  } | null;

  // Legacy/Generic props (for GradingModal, ResourcesPage)
  title?: string;
  subtitle?: string;
  previewUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  similarityScore?: number;

  // Staff Verification Props
  canVerify?: boolean;
  onVerify?: (docId: number, status: 'VERIFIED' | 'REJECTED', notes: string) => Promise<void>;
  isVerifying?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  doc,
  title,
  subtitle,
  previewUrl,
  downloadUrl,
  fileName,
  fileSize,
  similarityScore,
  canVerify = false,
  onVerify,
  isVerifying = false,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  // Image controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Verification panel state
  const [verifyDecision, setVerifyDecision] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifierNotes, setVerifierNotes] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState<string | null>(null);

  // Determine metadata
  const docId = doc?.id;
  const resolvedTitle = doc?.documentName || title || 'Document Preview';
  const resolvedFileName = doc?.fileName || fileName || 'document';
  const resolvedFileType = (doc?.fileType || resolvedFileName.split('.').pop() || '').toLowerCase();
  const resolvedDownloadUrl = docId ? `/api/v1/student-docs/${docId}/download` : downloadUrl || '#';

  const isPdf = resolvedFileType === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(resolvedFileType);
  const isDocx = ['docx', 'doc'].includes(resolvedFileType);

  // Fetch document securely via authenticated Axios call
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const fetchDocument = async () => {
      if (!isOpen) {
        setBlobUrl(null);
        return;
      }

      let fetchEndpoint: string | null = null;
      if (docId) {
        fetchEndpoint = `/student-docs/${docId}/view`;
      } else if (previewUrl) {
        fetchEndpoint = previewUrl.startsWith('/api/v1')
          ? previewUrl.replace('/api/v1', '')
          : previewUrl;
      }

      if (!fetchEndpoint) return;

      setIsLoadingFile(true);
      setFileLoadError(null);
      setZoom(1);
      setRotation(0);
      setVerifySuccessMsg(null);

      // Pre-fill notes based on existing notes or default
      if (doc?.verificationStatus === 'REJECTED') {
        setVerifyDecision('REJECTED');
        setVerifierNotes(doc?.verifierNotes || '');
      } else {
        setVerifyDecision('VERIFIED');
        setVerifierNotes(doc?.verifierNotes || 'Document verified with institutional records.');
      }

      try {
        const res = await api.get(fetchEndpoint, { responseType: 'blob' });
        if (active) {
          createdUrl = URL.createObjectURL(res.data);
          setBlobUrl(createdUrl);
        }
      } catch (err: any) {
        console.error('Error fetching document blob:', err);
        if (active) {
          setFileLoadError(
            'Unable to preview document inline. The file may be restricted or corrupted.'
          );
        }
      } finally {
        if (active) {
          setIsLoadingFile(false);
        }
      }
    };

    fetchDocument();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, docId, previewUrl]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 3.0));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDecisionSelect = (action: 'VERIFIED' | 'REJECTED') => {
    setVerifyDecision(action);
    if (action === 'VERIFIED') {
      setVerifierNotes('Document verified with institutional records.');
    } else {
      setVerifierNotes('Document rejected: Please upload a clear, legible copy.');
    }
  };

  const handleExecuteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId || !onVerify) return;

    setIsSubmittingVerify(true);
    try {
      await onVerify(docId, verifyDecision, verifierNotes.trim());
      setVerifySuccessMsg(
        verifyDecision === 'VERIFIED'
          ? 'Document approved and marked as VERIFIED!'
          : 'Document rejected. Student will be prompted to re-upload.'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      subtitle={
        doc?.student?.fullName
          ? `Student: ${doc.student.fullName} (${doc.student.prn || 'No USN'}) • File: ${resolvedFileName}`
          : subtitle || `File: ${resolvedFileName}`
      }
      maxWidth="3xl"
    >
      <div className="space-y-4 text-left">
        {/* Top Status & Action Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {doc?.verificationStatus && (
              <Badge
                variant={
                  doc.verificationStatus === 'VERIFIED'
                    ? 'emerald'
                    : doc.verificationStatus === 'REJECTED'
                    ? 'rose'
                    : 'amber'
                }
                size="xs"
              >
                {doc.verificationStatus === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {doc.verificationStatus === 'REJECTED' && <AlertCircle className="w-3 h-3 mr-1" />}
                {doc.verificationStatus === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                {doc.verificationStatus}
              </Badge>
            )}

            {doc?.category && (
              <Badge variant="indigo" size="xs">
                {doc.category.replace(/_/g, ' ')}
              </Badge>
            )}

            {doc?.status && (
              <Badge
                variant={
                  doc.status === 'AVAILABLE'
                    ? 'purple'
                    : doc.status === 'EXPIRED'
                    ? 'rose'
                    : 'blue'
                }
                size="xs"
              >
                Status: {doc.status}
              </Badge>
            )}

            {typeof similarityScore === 'number' && (
              <Badge variant={similarityScore > 20 ? 'rose' : 'emerald'} size="xs">
                Similarity: {similarityScore}%
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isImage && blobUrl && (
              <div className="hidden sm:flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Reset View"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-400 px-1">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            )}

            <a
              href={resolvedDownloadUrl}
              download={resolvedFileName}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary" size="xs" leftIcon={<Download className="w-3.5 h-3.5" />}>
                Download
              </Button>
            </a>
          </div>
        </div>

        {/* Previous Verifier Notes if present */}
        {doc?.verifierNotes && !verifySuccessMsg && (
          <div
            className={`p-3 rounded-2xl border text-xs font-medium space-y-1 ${
              doc.verificationStatus === 'REJECTED'
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Current Review Feedback:</span>
            </div>
            <p className="text-[11px] leading-relaxed pl-5">{doc.verifierNotes}</p>
          </div>
        )}

        {/* Verification Success Toast Banner inside modal */}
        {verifySuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{verifySuccessMsg}</span>
          </div>
        )}

        {/* Document In-Browser Viewport */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900/5 dark:bg-slate-950 min-h-[380px] max-h-[65vh] flex items-center justify-center relative">
          {isLoadingFile ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Retrieving document preview...
              </p>
            </div>
          ) : fileLoadError ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {fileLoadError}
              </p>
              <a href={resolvedDownloadUrl} download={resolvedFileName}>
                <Button variant="primary" size="xs" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download Instead
                </Button>
              </a>
            </div>
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              title={resolvedTitle}
              className="w-full h-[60vh] rounded-2xl border-0 bg-white"
            />
          ) : isImage && blobUrl ? (
            <div className="w-full h-[60vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={blobUrl}
                alt={resolvedTitle}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[56vh] max-w-full object-contain rounded-xl shadow-lg select-none"
              />
            </div>
          ) : isDocx ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Microsoft Word Document (.docx)
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                DOCX format can be downloaded and opened with Microsoft Word or Google Docs.
              </p>
              <a href={resolvedDownloadUrl} download={resolvedFileName}>
                <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Download & Inspect DOCX
                </Button>
              </a>
            </div>
          ) : (
            <div className="text-center p-8 space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Document ready for verification
              </p>
              <a href={resolvedDownloadUrl} download={resolvedFileName}>
                <Button variant="primary" size="xs" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download Document
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Staff Verification & Review Section */}
        {canVerify && onVerify && docId && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Student Section Document Review & Verification
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                Review inside portal without downloading
              </span>
            </div>

            <form onSubmit={handleExecuteVerification} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDecisionSelect('VERIFIED')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                    verifyDecision === 'VERIFIED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Document
                </button>

                <button
                  type="button"
                  onClick={() => handleDecisionSelect('REJECTED')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                    verifyDecision === 'REJECTED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" /> Reject / Request Re-upload
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Staff Remarks / Institutional Notes
                </label>
                <textarea
                  rows={2}
                  value={verifierNotes}
                  onChange={(e) => setVerifierNotes(e.target.value)}
                  placeholder="Enter verification notes or feedback for student..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant={verifyDecision === 'VERIFIED' ? 'primary' : 'danger'}
                  size="xs"
                  isLoading={isSubmittingVerify || isVerifying}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {verifyDecision === 'VERIFIED' ? 'Confirm & Approve' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
};
