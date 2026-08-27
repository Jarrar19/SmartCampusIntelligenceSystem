import React, { useState } from 'react';
import { Award, CheckCircle2, Megaphone, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface PublishResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PublishResultsModal: React.FC<PublishResultsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [title, setTitle] = useState('CAE-I Examination Results — Session 2026-27 (ODD)');
  const [academicSession, setAcademicSession] = useState('Session 2026-27 (ODD)');
  const [department, setDepartment] = useState('Department of Emerging Technologies CSE (AI&ML)');
  const [examType, setExamType] = useState('CAE-I Examination');
  const [message, setMessage] = useState('The Continuous Assessment Examination (CAE-I) results for Session 2026-27 (ODD) have been officially published by the Head of Department. Click below to view your score breakdown.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Please specify an examination result title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/results/publish', {
        title: title.trim(),
        academicSession,
        department,
        examType,
        message: message.trim(),
      });

      if (res.data.success) {
        success('Result notification successfully published to student portal!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to publish exam results');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Official Exam Results (HoD Action)"
      subtitle="Broadcast examination results notification to student dashboards"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed font-semibold">
            <strong>HoD Authorization Required:</strong> Publishing will post a high-priority <strong>“Results Are Out”</strong> notification card on all student dashboards and grant immediate access to scorecards.
          </p>
        </div>

        <Input
          label="Result Notification Title"
          placeholder="e.g. CAE-I Examination Results — Session 2026-27 (ODD)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          isRequired
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Academic Session / Term"
            placeholder="e.g. Session 2026-27 (ODD)"
            value={academicSession}
            onChange={(e) => setAcademicSession(e.target.value)}
          />

          <Input
            label="Exam Type"
            placeholder="e.g. CAE-I Examination"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Target Academic Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
          >
            <option value="Department of Emerging Technologies CSE (AI&ML)">Department of Emerging Technologies CSE (AI&ML)</option>
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Telecom">Electronics & Telecom</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            HoD Announcement Message to Students
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Instructional message to display on student dashboard..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Megaphone className="w-3.5 h-3.5" />}
          >
            Publish Results Notification
          </Button>
        </div>
      </form>
    </Modal>
  );
};
