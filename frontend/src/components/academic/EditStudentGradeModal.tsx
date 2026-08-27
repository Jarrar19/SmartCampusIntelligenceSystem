import React, { useState } from 'react';
import { Award, CheckCircle2, Percent, Edit3, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface EditStudentGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: number;
  courseCode: string;
  student: {
    id: number;
    fullName: string;
    email: string;
    prn?: string;
    attendance?: number;
    marks?: number;
    grade?: string;
  };
}

export const EditStudentGradeModal: React.FC<EditStudentGradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  courseCode,
  student,
}) => {
  const { success, error } = useToast();

  const [marks, setMarks] = useState<number | string>(student.marks ?? 82);
  const [grade, setGrade] = useState<string>(student.grade ?? 'A');
  const [attendance, setAttendance] = useState<number | string>(student.attendance ?? 88);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/courses/${courseId}/students/${student.id}/grade`, {
        marks: Number(marks),
        grade,
        attendance: Number(attendance),
      });

      if (res.data.success) {
        success(`Marks (${marks}/100) and Grade (${grade}) updated for ${student.fullName}!`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to update student grade');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student Grade & Performance"
      subtitle={`Course: ${courseCode} • Student: ${student.fullName} (${student.prn || student.email})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {student.fullName}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              PRN: {student.prn || 'N/A'} • {student.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Internal / Exam Marks (out of 100)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            isRequired
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Letter Grade <span className="text-rose-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              <option value="A+">A+ (Outstanding - 90%+)</option>
              <option value="A">A (Excellent - 80-89%)</option>
              <option value="B+">B+ (Very Good - 70-79%)</option>
              <option value="B">B (Good - 60-69%)</option>
              <option value="C">C (Satisfactory - 50-59%)</option>
              <option value="P">P (Pass - 40-49%)</option>
              <option value="F">F (Fail - Below 40%)</option>
            </select>
          </div>
        </div>

        <Input
          label="Attendance Percentage (%)"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={attendance}
          onChange={(e) => setAttendance(e.target.value)}
          isRequired
        />

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Award className="w-3.5 h-3.5" />}
          >
            Save Grade & Marks
          </Button>
        </div>
      </form>
    </Modal>
  );
};
