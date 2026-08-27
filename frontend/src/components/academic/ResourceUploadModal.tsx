import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Check, BookOpen } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { api, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ResourceCategory, Course } from '../../types';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId?: number;
  preselectedCourse?: Course | null;
}

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  preselectedCourse,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('NOTES');
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(courseId || preselectedCourse?.id);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [subjectCode, setSubjectCode] = useState(preselectedCourse?.courseCode || '');
  const [department, setDepartment] = useState(preselectedCourse?.department || user?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState<number>(preselectedCourse?.semester || user?.semester || 6);
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  // Fetch available courses when modal opens
  useEffect(() => {
    if (isOpen) {
      api.get('/courses')
        .then((res) => {
          if (res.data.success) {
            setCoursesList(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Sync props if courseId or preselectedCourse changes
  useEffect(() => {
    const targetCourseId = courseId || preselectedCourse?.id;
    if (targetCourseId) {
      setSelectedCourseId(targetCourseId);
    }
    if (preselectedCourse) {
      setSubjectCode(preselectedCourse.courseCode);
      setDepartment(preselectedCourse.department);
      setSemester(preselectedCourse.semester);
    }
  }, [courseId, preselectedCourse]);

  const handleCourseChange = (cId: number) => {
    setSelectedCourseId(cId);
    const found = coursesList.find((c) => c.id === cId);
    if (found) {
      setSubjectCode(found.courseCode);
      setDepartment(found.department);
      setSemester(found.semester);
      if (!title) {
        setTitle(`Lecture Notes - ${found.courseCode} (${found.title})`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) {
      error('Please provide a title and select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      
      const targetCourseId = selectedCourseId || courseId;
      if (targetCourseId) formData.append('courseId', String(targetCourseId));
      if (subjectCode) formData.append('subjectCode', subjectCode.trim());
      if (department) formData.append('department', department);
      if (semester) formData.append('semester', String(semester));
      if (tags) formData.append('tags', tags.trim());
      formData.append('file', selectedFile);

      const res = await api.post('/resources', formData);

      if (res.data.success) {
        success(res.data.message || 'Resource uploaded successfully!');
        onSuccess();
        onClose();
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setTags('');
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Resource upload failed');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCourseObj = coursesList.find((c) => c.id === (selectedCourseId || courseId)) || preselectedCourse;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFaculty ? "Add Notes & Study Material" : "Upload Academic Resource"}
      subtitle={isStudent ? "Student contributions enter faculty review before public publishing." : "Faculty notes are immediately published to enrolled students."}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isFaculty && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <p className="leading-relaxed font-semibold">
              <strong>Faculty Instant Publishing:</strong> Notes and study materials uploaded by faculty members are automatically published and accessible by all students in <strong>{activeCourseObj ? activeCourseObj.title : 'the selected subject'}</strong>.
            </p>
          </div>
        )}

        {isStudent && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/90 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed font-semibold">
              <strong>Peer Quality Moderation:</strong> Student uploads (PYQs, study guides, notes) are reviewed by course faculty to ensure academic integrity before becoming visible to all students.
            </p>
          </div>
        )}

        {/* Target Subject / Course Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
            <span>Target Subject / Course</span>
            {activeCourseObj && (
              <span className="text-[10px] text-emerald-400 font-bold">
                Selected: {activeCourseObj.courseCode}
              </span>
            )}
          </label>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => handleCourseChange(Number(e.target.value))}
            className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
          >
            <option value="">-- General Repository (No Specific Course) --</option>
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} • {c.title} (Sem {c.semester})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Resource Title"
          placeholder="e.g. CS301 Unit 3 Graph Theory & Trees Lecture Notes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          isRequired
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              <option value="NOTES">Lecture Notes</option>
              <option value="PYQ">Previous Year Questions (PYQ)</option>
              <option value="STUDENT_GUIDE">Student Study Guide</option>
              <option value="ASSIGNMENT_REF">Assignment Reference</option>
              <option value="REFERENCE_MATERIAL">Reference Material</option>
              <option value="OTHER">Other Academic Resource</option>
            </select>
          </div>

          <Input
            label="Subject Code"
            placeholder="e.g. CS301, EE201"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Telecom">Electronics & Telecom</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(parseInt(e.target.value, 10))}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Description & Topics Covered
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of chapters, formulas, or module topics included..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
          />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="e.g. notes, unit3, trees, graphs, 2026"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {/* File Picker */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Attach Document File <span className="text-rose-500">*</span>
          </label>
          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-2xl p-4 text-center transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg"
              required
            />
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span className="truncate">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Click or drag PDF, Office docs, or slides here
                </p>
                <p className="text-[10px] text-slate-400">Maximum file size: 50MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            {isFaculty ? "Publish Notes" : "Upload Resource"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
