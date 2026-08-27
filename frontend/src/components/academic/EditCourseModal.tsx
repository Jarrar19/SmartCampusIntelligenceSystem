import React, { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Course } from '../../types';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCourse: Course) => void;
  course: Course;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  course,
}) => {
  const { success, error } = useToast();

  const [courseCode, setCourseCode] = useState(course.courseCode);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');
  const [department, setDepartment] = useState(course.department);
  const [semester, setSemester] = useState(course.semester);
  const [academicYear, setAcademicYear] = useState(course.academicYear || '2026-2027');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setCourseCode(course.courseCode);
      setTitle(course.title);
      setDescription(course.description || '');
      setDepartment(course.department);
      setSemester(course.semester);
      setAcademicYear(course.academicYear || '2026-2027');
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseCode.trim()) {
      error('Please fill in required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.patch(`/courses/${course.id}`, {
        courseCode: courseCode.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        department,
        semester: Number(semester),
        academicYear,
      });

      if (res.data.success) {
        success('Course updated successfully!');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Course: ${course.courseCode}`}
      subtitle="Update syllabus description, course metadata, and academic semester details."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Course Code"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            isRequired
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Semester <span className="text-rose-500">*</span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          isRequired
        />

        <Input
          label="Academic Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          isRequired
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Description & Syllabus Overview
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Course syllabus, requirements, and reference textbooks..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
