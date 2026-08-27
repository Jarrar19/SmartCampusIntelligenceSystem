import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { api, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ResourceCategory } from '../../types';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId?: number;
}

export const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courseId,
}) => {
  const { user, config } = useAuth();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('NOTES');
  const [subjectCode, setSubjectCode] = useState('');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState<number>(user?.semester || 6);
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = user?.role === 'STUDENT';

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
      if (courseId) formData.append('courseId', String(courseId));
      if (subjectCode) formData.append('subjectCode', subjectCode.trim());
      if (department) formData.append('department', department);
      if (semester) formData.append('semester', String(semester));
      if (tags) formData.append('tags', tags.trim());
      formData.append('file', selectedFile);

      const res = await api.post('/resources', formData);

      if (res.data.success) {
        success(res.data.message);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Academic Resource"
      subtitle={isStudent ? "Student contributions enter faculty review before public publishing." : "Faculty uploads are immediately published to the resource library."}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isStudent && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/90 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed font-semibold">
              <strong>Peer Quality Moderation:</strong> Student uploads (PYQs, study guides, notes) are reviewed by course faculty to ensure academic integrity before becoming visible to all students.
            </p>
          </div>
        )}

        <Input
          label="Resource Title"
          placeholder="e.g. CS301 End Semester 2025 Solved Question Paper"
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
            placeholder="Brief notes on what chapters or concepts this document covers..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
          />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="e.g. pyq, endsem, trees, graphs, 2025"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {/* File Picker */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Select Document <span className="text-rose-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-3xl p-6 text-center cursor-pointer transition bg-slate-50/60 dark:bg-slate-800/40">
            <input
              type="file"
              required
              id="file-upload"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".pdf,.docx,.pptx,.xlsx,.txt,.zip"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-9 h-9 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
              {selectedFile ? (
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click or drag file to upload (PDF, DOCX, PPTX, ZIP)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Max allowed size: {config?.maxUploadSizeMb || 25} MB
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
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
            Submit Resource
          </Button>
        </div>
      </form>
    </Modal>
  );
};
