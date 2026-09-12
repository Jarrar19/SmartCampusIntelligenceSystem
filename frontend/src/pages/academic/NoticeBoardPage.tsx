import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Calendar, MapPin, Clock, 
  Trash2, AlertTriangle, ShieldCheck, Tag, Sparkles, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CreateNoticeModal } from '../../components/academic/CreateNoticeModal';
import { api, extractErrorMessage } from '../../services/api';

export const NoticeBoardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const canCreateNotice = ['FACULTY', 'HOD', 'ADMIN'].includes(user?.role || '');

  // Fetch active notices
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      let url = '/notices';
      const params: string[] = [];
      if (selectedCategory !== 'ALL') params.push(`category=${selectedCategory}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      if (res.data.success) {
        setNotices(res.data.data);
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to load notices');
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory]);

  // Update live clock every minute for live expiration countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleDeleteNotice = async (noticeId: number) => {
    if (!window.confirm('Are you sure you want to remove this notice?')) return;
    try {
      const res = await api.delete(`/notices/${noticeId}`);
      if (res.data.success) {
        success('Notice deleted successfully.');
        setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to delete notice');
      error(msg);
    }
  };

  const getExpirationCountdown = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr);
    const diffMs = expiresAt.getTime() - currentTime.getTime();

    if (diffMs <= 0) return 'Self-deleting now...';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Self-deletes in ${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `Self-deletes in ${hours}h ${mins}m`;
    }
    return `Self-deletes in ${mins} mins`;
  };

  const categories = [
    { id: 'ALL', label: 'All Notices' },
    { id: 'ACADEMIC', label: 'Academic & Classes' },
    { id: 'EXAM', label: 'Exams & Results' },
    { id: 'EVENT', label: 'Campus Events' },
    { id: 'EMERGENCY', label: 'Urgent Notices' },
    { id: 'CULTURAL', label: 'Cultural & Clubs' },
    { id: 'SPORTS', label: 'Sports & Athletics' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-amber-300 text-xs font-black">
              <Megaphone className="w-3.5 h-3.5" />
              <span>LIVE CAMPUS BULLETIN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campus Notice Board
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              Official announcements, event schedules, and examination updates. Notices automatically self-delete upon expiration.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchNotices}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            {canCreateNotice && (
              <Button
                variant="tricolor"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Post New Notice
              </Button>
            )}
          </div>
        </div>

        {/* Decorative Grid SVG */}
        <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2 w-full lg:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchNotices();
              }}
              className="w-full glass-input rounded-2xl pl-9 pr-3.5 py-2 text-xs font-medium focus:outline-none"
            />
          </div>
          <Button variant="primary" size="sm" onClick={fetchNotices}>
            Search
          </Button>
        </div>
      </div>

      {/* Notices Grid */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-xs font-black text-slate-600 dark:text-slate-400">
            Fetching active campus notices...
          </p>
        </div>
      ) : notices.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            No active notices found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {selectedCategory !== 'ALL' || searchQuery
              ? 'Try adjusting your search query or category filter.'
              : 'There are currently no active notices on the board.'}
          </p>
          {canCreateNotice && (
            <Button
              variant="primary"
              size="xs"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Post the First Notice
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notices.map((notice) => {
            const isUrgent = notice.priority === 'URGENT';
            const isHigh = notice.priority === 'HIGH';
            const isMyNotice = notice.authorId === user?.id;
            const canDelete = isMyNotice || ['HOD', 'ADMIN'].includes(user?.role || '');

            return (
              <div
                key={notice.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between space-y-4 relative ${
                  isUrgent
                    ? 'border-rose-500/80 dark:border-rose-600/80 ring-2 ring-rose-500/20'
                    : isHigh
                    ? 'border-amber-500/70 dark:border-amber-600/70'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Strip: Badges & Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant={
                          notice.category === 'ACADEMIC'
                            ? 'indigo'
                            : notice.category === 'EVENT'
                            ? 'emerald'
                            : notice.category === 'EMERGENCY'
                            ? 'rose'
                            : notice.category === 'EXAM'
                            ? 'amber'
                            : 'purple'
                        }
                        size="xs"
                      >
                        {notice.category}
                      </Badge>

                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                      {isHigh && (
                        <Badge variant="amber" size="xs">
                          High Priority
                        </Badge>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                      {notice.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line line-clamp-6 leading-relaxed">
                      {notice.content}
                    </p>
                  </div>
                </div>

                {/* Event Metadata & Auto-Expire Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  {(notice.eventDate || notice.location) && (
                    <div className="space-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {notice.eventDate && (
                        <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {new Date(notice.eventDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                      {notice.location && (
                        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                          <span>{notice.location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Author & Countdown */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center space-x-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                        {notice.author?.fullName?.charAt(0) || 'F'}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block leading-none">
                          {notice.author?.fullName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold capitalize">
                          {notice.author?.role?.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 font-black text-[10px] flex items-center space-x-1 flex-shrink-0"
                      title={`Expires on ${new Date(notice.expiresAt).toLocaleString()}`}
                    >
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{getExpirationCountdown(notice.expiresAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Notice Modal */}
      {showCreateModal && (
        <CreateNoticeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onNoticeCreated={fetchNotices}
        />
      )}
    </div>
  );
};
