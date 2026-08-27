import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Assignment, Submission } from '../../types';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment: Assignment;
  existingSubmission?: Submission | null;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assignment,
  existingSubmission = assignment.submissions?.[0] || null,
}) => {
  const { success, error } = useToast();

  const [submissionText, setSubmissionText] = useState(existingSubmission?.submissionText || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dueDate = new Date(assignment.dueDate);
  const isPastDue = new Date() > dueDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim() && !selectedFile && !existingSubmission?.filePath) {
      error('Please write notes/code or attach a file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionText.trim()) formData.append('submissionText', submissionText.trim());
      if (selectedFile) formData.append('file', selectedFile);

      const res = await api.post(`/assignments/${assignment.id}/submit`, formData);

      if (res.data.success) {
        success(res.data.message);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Submission failed');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Assignment: ${assignment.title}`}
      subtitle={`Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isPastDue && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/90 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="font-bold">The deadline has passed. This deliverable will be recorded with a Late flag.</span>
          </div>
        )}

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Solution Notes / GitHub Repo Link / Summary
          </label>
          <textarea
            rows={4}
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Paste GitHub repository link, summary of results, or problem solution notes here..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-mono focus:outline-none"
          />
        </div>

        {/* Optional File Picker */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Upload Attachment (PDF, ZIP, DOCX, Code)
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-3xl p-5 text-center cursor-pointer transition bg-slate-50/60 dark:bg-slate-800/40">
            <input
              type="file"
              id="sub-file-upload"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="sub-file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-brand-600 dark:text-brand-400 mx-auto mb-1.5" />
              {selectedFile ? (
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              ) : existingSubmission?.fileName ? (
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Current file: <span className="font-bold text-brand-600 dark:text-brand-400">{existingSubmission.fileName}</span> (Click to replace)
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  Click or drag report or code archive
                </p>
              )}
            </label>
          </div>
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
            {existingSubmission ? 'Update Submission' : 'Turn In Deliverable'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
