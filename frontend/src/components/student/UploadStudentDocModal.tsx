import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Calendar, Tag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../context/ToastContext';
import { api, extractErrorMessage } from '../../services/api';

interface UploadStudentDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
  initialCategory?: string;
}

export const UploadStudentDocModal: React.FC<UploadStudentDocModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
  initialCategory = 'ADMISSION_RENEWAL',
}) => {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documentName, setDocumentName] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const categories = [
    { id: 'ADMISSION_RENEWAL', label: 'Admission & Renewal' },
    { id: 'SCHOLARSHIPS', label: 'Scholarships' },
    { id: 'ACADEMIC_RECORDS', label: 'Academic Records' },
    { id: 'IDENTITY_DOCUMENTS', label: 'Identity Documents' },
    { id: 'CERTIFICATES', label: 'Certificates' },
    { id: 'OTHER_DOCUMENTS', label: 'Other Documents' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
    if (!ext || !allowed.includes(ext)) {
      error(`Unsupported file type .${ext}. Allowed: PDF, DOCX, PNG, JPG, WEBP.`);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      error('File size exceeds maximum 25MB limit.');
      return;
    }
    setSelectedFile(file);
    if (!documentName.trim()) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setDocumentName(cleanTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName.trim()) {
      error('Document name is required');
      return;
    }
    if (!selectedFile) {
      error('Please select or drop a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('documentName', documentName.trim());
      formData.append('category', category);
      if (expiryDate) formData.append('expiryDate', expiryDate);
      if (notes.trim()) formData.append('notes', notes.trim());
      formData.append('file', selectedFile);

      const res = await api.post('/student-docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        success('Document uploaded to your vault successfully!');
        onUploaded();
        handleClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to upload document');
      error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setDocumentName('');
    setCategory(initialCategory);
    setExpiryDate('');
    setNotes('');
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Document to Vault"
      subtitle="Store essential college records securely for renewal, scholarship, and examinations"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* File Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
            dragActive
              ? 'border-brand-500 bg-brand-500/10'
              : selectedFile
              ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />

          {selectedFile ? (
            <div className="flex items-center justify-between gap-3 text-left">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-10 h-10 text-brand-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Click to browse or drag & drop file here
              </p>
              <p className="text-[11px] text-slate-400">
                Supports PDF, DOCX, PNG, JPG, WEBP (Max 25MB)
              </p>
            </div>
          )}
        </div>

        {/* Document Name */}
        <Input
          label="Document Title / Name"
          placeholder="e.g. Admission Renewal Fee Receipt 2026-27"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          isRequired
        />

        {/* Category Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-500" />
            Document Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expiry Date (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Validity / Expiration Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-medium focus:outline-none"
          />
          <p className="text-[10px] text-slate-400">
            For certificates with validity periods (e.g., Caste Validity, Income Certificate, Passport).
          </p>
        </div>

        {/* Notes / Remarks */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Notes / Reference Details (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Application No., Transaction Reference, or Issuing Authority"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full glass-input rounded-2xl p-3 text-xs font-medium focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="tricolor"
            size="sm"
            isLoading={isUploading}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Upload to Vault
          </Button>
        </div>
      </form>
    </Modal>
  );
};
