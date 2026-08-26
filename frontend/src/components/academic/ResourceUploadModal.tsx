import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
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
  const [department, setDepartment] = useState(user?.department || '');
  const [semester, setSemester] = useState<number>(user?.semester || 1);
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

      const res = await api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        success(res.data.message);
        onSuccess();
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setTags('');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Resource upload failed');
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
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              <strong>Peer Quality Moderation:</strong> Student uploads (PYQs, study guides, notes) are reviewed by course faculty to ensure academic integrity before becoming visible to all students.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Resource Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CS301 End Semester 2024 Solved Question Paper"
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="NOTES">Lecture Notes</option>
              <option value="PYQ">Previous Year Questions (PYQ)</option>
              <option value="STUDENT_GUIDE">Student Study Guide</option>
              <option value="ASSIGNMENT_REF">Assignment Reference</option>
              <option value="REFERENCE_MATERIAL">Reference Material</option>
              <option value="OTHER">Other Academic Resource</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Subject Code</label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS301, EE201"
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="">Select Department</option>
              {config?.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(parseInt(e.target.value, 10))}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Description & Topics Covered
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief notes on what chapters or concepts this document covers..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. pyq, endsem, trees, graphs, 2024"
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        {/* File Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Document *</label>
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
                  <p className="text-[10px] text-slate-400 mt-1">
                    Max allowed size: {config?.maxUploadSizeMb || 25} MB
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Action Buttons */}
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
            {isSubmitting ? 'Uploading...' : 'Submit Resource'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
