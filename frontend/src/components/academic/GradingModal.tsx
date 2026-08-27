import React, { useState } from 'react';
import { Award, Download, MessageSquare, CheckCircle, Sparkles, Eye, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Submission, SubmissionStatus, Assignment } from '../../types';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  submission: Submission;
  assignment?: Assignment;
  maxMarks?: number;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  submission,
  assignment,
  maxMarks = assignment?.maxMarks || 100,
}) => {
  const { success, error } = useToast();

  const [marks, setMarks] = useState<number>(submission.marksAwarded ?? maxMarks);
  const [feedback, setFeedback] = useState(submission.facultyFeedback || '');
  const [status, setStatus] = useState<SubmissionStatus>(submission.status === 'RETURNED' ? 'RETURNED' : 'GRADED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (marks < 0 || marks > maxMarks) {
      error(`Marks must be between 0 and ${maxMarks}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.patch(`/assignments/submissions/${submission.id}/grade`, {
        marksAwarded: Number(marks),
        facultyFeedback: feedback.trim(),
        status,
      });

      if (res.data.success) {
        success('Submission successfully graded and notification sent to student!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Grading failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/assignments/submissions/${submission.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', submission.fileName || 'submission.pdf');
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Grade Submission — ${submission.student?.fullName || 'Student'}`}
        subtitle={`Submitted: ${new Date(submission.submittedAt).toLocaleDateString()} ${submission.isLate ? '(Late Submission)' : ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Similarity / Plagiarism Analysis Alert */}
          {submission.similarityScore !== undefined && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Peer Plagiarism & Similarity
                  </p>
                  {submission.matchedWithStudentName && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      High token overlap with {submission.matchedWithStudentName}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant={submission.similarityScore > 50 ? 'rose' : submission.similarityScore > 25 ? 'amber' : 'emerald'}
                size="xs"
                dot
              >
                {submission.similarityScore}% {submission.similarityScore <= 25 ? 'Original' : 'Overlap'}
              </Badge>
            </div>
          )}

          {/* Student Submission Text */}
          {submission.submissionText && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                Student Notes / Submission Text:
              </p>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed font-medium">
                {submission.submissionText}
              </p>
            </div>
          )}

          {/* File Attachment with In-Browser Preview Action */}
          {submission.fileName && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="truncate pr-2 flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{submission.fileName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {((submission.fileSize || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setShowPreviewModal(true)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="saffron"
                  size="xs"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Marks Awarded (Max: ${maxMarks})`}
              type="number"
              min={0}
              max={maxMarks}
              step={0.5}
              value={marks}
              onChange={(e) => setMarks(parseFloat(e.target.value))}
              isRequired
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Evaluation Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubmissionStatus)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="GRADED">GRADED</option>
                <option value="RETURNED">RETURNED FOR RESUBMISSION</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Faculty Feedback & Mentorship Comments
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write constructive evaluation notes, strengths, and areas for improvement..."
              className="w-full glass-input rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Evaluation
            </Button>
          </div>
        </form>
      </Modal>

      {/* In-Browser Document Previewer Modal */}
      {showPreviewModal && submission.fileName && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setShowPreviewModal(false)}
          title={`Submission — ${submission.student?.fullName || 'Student'}`}
          subtitle={assignment?.title || 'Assignment File'}
          previewUrl={`/assignments/submissions/${submission.id}/download?preview=true`}
          downloadUrl={`/assignments/submissions/${submission.id}/download`}
          fileName={submission.fileName}
          fileSize={submission.fileSize || undefined}
          similarityScore={submission.similarityScore}
        />
      )}
    </>
  );
};
