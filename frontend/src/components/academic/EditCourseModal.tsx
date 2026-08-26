import React, { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { Modal } from '../common/Modal';
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
  const [academicYear, setAcademicYear] = useState(course.academicYear || '2025-2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setCourseCode(course.courseCode);
      setTitle(course.title);
      setDescription(course.description || '');
      setDepartment(course.department);
      setSemester(course.semester);
      setAcademicYear(course.academicYear || '2025-2026');
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Course Code *
            </label>
            <input
              type="text"
              required
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS501"
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Semester *
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Course Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Software Engineering & Cloud Architectures"
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Department *
          </label>
          <input
            type="text"
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Description & Syllabus Overview
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Course syllabus, requirements, and reference textbooks..."
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
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
