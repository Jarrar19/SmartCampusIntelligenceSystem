import React, { useState } from 'react';
import { User, ShieldCheck, Save, Edit3, Award, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, extractErrorMessage } from '../../services/api';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [prn, setPrn] = useState(user?.prn || '');
  const [department, setDepartment] = useState(user?.department || 'Department of Emerging Technologies CSE (AI&ML)');
  const [semester, setSemester] = useState<number>(user?.semester || 6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = user?.role === 'STUDENT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('Full Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.patch('/users/profile', {
        fullName: fullName.trim(),
        prn: isStudent ? prn.trim().toUpperCase() : undefined,
        department,
        semester: isStudent ? Number(semester) : undefined,
      });

      if (res.data.success) {
        updateUser(res.data.data);
        success('Profile credentials & Roll No. / USN updated successfully!');
        onClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to update profile details');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile Credentials"
      subtitle="Update your official campus name, Roll No. / USN, and department"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md">
            {fullName.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
              {user?.email}
            </h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {user?.role} ACCOUNT • {user?.isVerified ? 'VERIFIED' : 'PENDING'}
            </p>
          </div>
        </div>

        <Input
          label="Full Legal Name"
          placeholder="e.g. RAJ RAVINDRA URKUNDE"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          isRequired
        />

        {isStudent && (
          <Input
            label="Roll No. / USN (University Seat Number)"
            placeholder="e.g. CM23001"
            value={prn}
            onChange={(e) => setPrn(e.target.value.toUpperCase())}
            leftIcon={<Award className="w-4 h-4 text-amber-500" />}
            isRequired
          />
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Academic Department
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

        {isStudent && (
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Current Semester
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
        )}

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Profile Credentials
          </Button>
        </div>
      </form>
    </Modal>
  );
};
