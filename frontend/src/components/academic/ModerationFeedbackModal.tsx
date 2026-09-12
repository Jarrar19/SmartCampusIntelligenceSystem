import React, { useState } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Resource } from '../../types';

interface ModerationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (reason: string) => Promise<void> | void;
  onSubmit?: (reason: string) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  actionText?: string;
  resource?: Resource;
  resourceTitle?: string;
  status?: 'REJECTED' | 'CHANGES_REQUESTED';
  isProcessing?: boolean;
  isSubmitting?: boolean;
}

export const ModerationFeedbackModal: React.FC<ModerationFeedbackModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSubmit,
  title,
  subtitle = 'Provide constructive moderator feedback to the student uploader.',
  actionText,
  resource,
  resourceTitle,
  status,
  isProcessing = false,
  isSubmitting = false,
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
    if (onSubmit) {
      await onSubmit(reason.trim());
    } else if (onConfirm) {
      await onConfirm(reason.trim());
    }
    setReason('');
  };

  const loading = isProcessing || isSubmitting;
  const resolvedTitle = title || (
    resourceTitle
      ? `${status === 'CHANGES_REQUESTED' ? 'Request Changes' : 'Reject Resource'}: ${resourceTitle}`
      : (resource ? `Moderation Decision: ${resource.title}` : 'Reject Resource Upload')
  );
  const resolvedActionText = actionText || (
    status === 'CHANGES_REQUESTED' ? 'Send Request' : 'Confirm Rejection'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      subtitle={subtitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Constructive Moderator Feedback <span className="text-rose-500">*</span>
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
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
          />
          {validationError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{validationError}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            isLoading={loading}
          >
            {resolvedActionText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
