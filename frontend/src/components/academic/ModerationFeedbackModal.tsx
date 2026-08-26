import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ModerationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  subtitle: string;
  actionText: string;
  isProcessing?: boolean;
}

export const ModerationFeedbackModal: React.FC<ModerationFeedbackModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  actionText,
  isProcessing = false,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setValidationError('Please provide at least 5 characters of constructive feedback.');
      return;
    }
    setValidationError(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Constructive Moderator Feedback *
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="Explain why this upload is rejected or what specific corrections are requested..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
          {validationError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-2xl transition shadow-md shadow-rose-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isProcessing ? 'Submitting...' : actionText}
          </button>
        </div>
      </form>
    </Modal>
  );
};
