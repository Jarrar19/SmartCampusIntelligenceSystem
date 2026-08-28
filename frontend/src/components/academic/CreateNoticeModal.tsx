import React, { useState } from 'react';
import { Megaphone, Calendar, Clock, MapPin, AlertTriangle, Send, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../context/ToastContext';
import { api, extractErrorMessage } from '../../services/api';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeCreated: () => void;
}

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  isOpen,
  onClose,
  onNoticeCreated,
}) => {
  const { success, error } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Title and notice details are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/notices', {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        location: location.trim() || undefined,
        eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
        expiresInHours: Number(expiresInHours),
      });

      if (res.data.success) {
        success('Campus notice published successfully!');
        onNoticeCreated();
        onClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to publish notice');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Post Campus Notice / Event"
      subtitle="Publish an announcement for all students and faculty with auto-expiration"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Notice Title"
          placeholder="e.g. Mid-Semester Exam Schedule Released or Tech Fest Registration"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          leftIcon={<Megaphone className="w-4 h-4 text-brand-500" />}
          isRequired
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Notice Details & Announcement Body <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Write clear details, instructions, venue info, or links for students..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full glass-input rounded-2xl p-3.5 text-xs font-medium focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Notice Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              <option value="GENERAL">General Announcement</option>
              <option value="ACADEMIC">Academic & Classes</option>
              <option value="EVENT">Campus Event / Fest</option>
              <option value="EXAM">Examination & Timetable</option>
              <option value="EMERGENCY">Urgent / Emergency</option>
              <option value="CULTURAL">Cultural & Club Activities</option>
              <option value="SPORTS">Sports & Athletics</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none"
            >
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority (Highlighted)</option>
              <option value="URGENT">Urgent (Broadcast Notification)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Location / Venue (Optional)"
            placeholder="e.g. Main Auditorium A-102 or Online"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4 text-emerald-500" />}
          />

          <Input
            label="Event Date & Time (Optional)"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4 text-indigo-500" />}
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-black text-amber-800 dark:text-amber-300">
              Auto-Expiration / Self-Deletion Duration
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Select how long this notice remains visible. Once expired, it will automatically delete itself.
          </p>
          <select
            value={expiresInHours}
            onChange={(e) => setExpiresInHours(Number(e.target.value))}
            className="w-full glass-input rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
          >
            <option value={2}>Self-delete after 2 Hours</option>
            <option value={6}>Self-delete after 6 Hours</option>
            <option value={12}>Self-delete after 12 Hours</option>
            <option value={24}>Self-delete after 24 Hours (1 Day)</option>
            <option value={48}>Self-delete after 48 Hours (2 Days)</option>
            <option value={72}>Self-delete after 72 Hours (3 Days)</option>
            <option value={168}>Self-delete after 7 Days (1 Week)</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="tricolor"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Publish Campus Notice
          </Button>
        </div>
      </form>
    </Modal>
  );
};
