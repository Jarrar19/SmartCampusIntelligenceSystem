import React, { useState } from 'react';
import { CheckSquare, Calendar, Award, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: number;
  courseCode: string;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  courseCode,
}) => {
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [dueDate, setDueDate] = useState('');
  const [allowLate, setAllowLate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) {
      error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/assignments', {
        courseId,
        title: title.trim(),
        description: description.trim(),
        maxMarks: Number(maxMarks),
        dueDate: new Date(dueDate).toISOString(),
        allowLate,
      });

      if (res.data.success) {
        success('Assignment created and published to enrolled students!');
        onSuccess();
        onClose();
        setTitle('');
        setDescription('');
        setDueDate('');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Assignment creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Assignment (${courseCode})`}
      subtitle="Publish coursework tasks with due dates and rubric parameters."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Assignment Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lab 3: Red-Black Tree Implementation & Benchmark"
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Instructions & Problem Statement *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify problem constraints, submission format, and grading rubric..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Max Marks *
            </label>
            <input
              type="number"
              required
              min={1}
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Due Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2.5 pt-1">
          <input
            type="checkbox"
            id="allow-late"
            checked={allowLate}
            onChange={(e) => setAllowLate(e.target.checked)}
            className="w-4 h-4 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 bg-white dark:bg-slate-800 cursor-pointer"
          />
          <label htmlFor="allow-late" className="text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer">
            Allow late submissions (marked automatically with late flag)
          </label>
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
            {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
