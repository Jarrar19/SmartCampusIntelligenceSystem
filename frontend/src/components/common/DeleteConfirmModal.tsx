import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Delete Permanently',
  isDeleting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Please review this action before proceeding."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">{description}</p>
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-2xl transition shadow-md shadow-rose-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isDeleting ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
