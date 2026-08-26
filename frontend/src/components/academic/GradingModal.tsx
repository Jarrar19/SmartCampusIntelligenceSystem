import React, { useState } from 'react';
import { Award, Download, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Submission, SubmissionStatus } from '../../types';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  submission: Submission;
  maxMarks: number;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  submission,
  maxMarks,
}) => {
  const { success, error } = useToast();

  const [marks, setMarks] = useState<number>(submission.marksAwarded ?? maxMarks);
  const [feedback, setFeedback] = useState(submission.facultyFeedback || '');
  const [status, setStatus] = useState<SubmissionStatus>(submission.status || 'GRADED');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Grade Submission — ${submission.student?.fullName}`}
      subtitle={`Submitted: ${new Date(submission.submittedAt).toLocaleDateString()} ${submission.isLate ? '(Late Submission)' : ''}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Submission Text */}
        {submission.submissionText && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Student Notes / Submission Links:</p>
            <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed font-medium">
              {submission.submissionText}
            </p>
          </div>
        )}

        {/* File Attachment */}
        {submission.fileName && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="truncate pr-2">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{submission.fileName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {((submission.fileSize || 0) / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-300 bg-indigo-50 dark:bg-brand-500/15 hover:bg-indigo-100 dark:hover:bg-brand-500/25 border border-indigo-200 dark:border-brand-500/30 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Marks Awarded (Max: {maxMarks}) *
            </label>
            <input
              type="number"
              required
              min={0}
              max={maxMarks}
              step={0.5}
              value={marks}
              onChange={(e) => setMarks(parseFloat(e.target.value))}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Submission Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubmissionStatus)}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="GRADED">GRADED</option>
              <option value="RETURNED">RETURNED FOR RESUBMISSION</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Faculty Feedback & Mentorship Comments
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write constructive evaluation notes, strengths, and areas for improvement..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-500 rounded-2xl transition shadow-md shadow-brand-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? 'Saving...' : 'Save Evaluation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
