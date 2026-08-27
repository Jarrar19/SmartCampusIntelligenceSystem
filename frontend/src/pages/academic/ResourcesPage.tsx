import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Download, ThumbsUp, Bookmark, 
  Plus, Filter, Tag, Clock, User, CheckCircle2, Sparkles,
  BookOpen, Eye, Award, Check
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Resource, ResourceCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';
import { ResourceUploadModal } from '../../components/academic/ResourceUploadModal';

export const ResourcesPage: React.FC = () => {
  const { user, config } = useAuth();
  const { success, error } = useToast();

  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'views'>('newest');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [myUploadsOnly, setMyUploadsOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (sortBy) params.append('sort', sortBy);
      if (bookmarkedOnly) params.append('bookmarkedOnly', 'true');
      if (myUploadsOnly) params.append('myUploads', 'true');

      const res = await api.get(`/resources?${params.toString()}`);
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (err) {
      error('Failed to load academic resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [search, categoryFilter, semesterFilter, sortBy, bookmarkedOnly, myUploadsOnly]);

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await api.get(`/resources/${resource.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? { ...r, downloadsCount: r.downloadsCount + 1 } : r))
      );
      success(`Downloading ${resource.fileName}`);
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Download failed');
      error(msg);
    }
  };

  const handleToggleRating = async (resource: Resource) => {
    try {
      const res = await api.post(`/resources/${resource.id}/rating`);
      if (res.data.success) {
        success(res.data.message);
        setResources((prev) =>
          prev.map((r) => {
            if (r.id === resource.id) {
              const diff = res.data.rated ? 1 : -1;
              return {
                ...r,
                helpfulCount: Math.max(0, (r.helpfulCount || 0) + diff),
                userRating: res.data.rated,
              };
            }
            return r;
          })
        );
      }
    } catch (err) {
      error('Failed to update rating');
    }
  };

  const handleToggleBookmark = async (resource: Resource) => {
    try {
      const res = await api.post(`/resources/${resource.id}/bookmark`);
      if (res.data.success) {
        success(res.data.message);
        setResources((prev) =>
          prev.map((r) =>
            r.id === resource.id ? { ...r, isBookmarked: res.data.bookmarked } : r
          )
        );
      }
    } catch (err) {
      error('Failed to update bookmark');
    }
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: '', label: 'All Categories' },
    { id: 'NOTES', label: 'Lecture Notes' },
    { id: 'PYQ', label: 'Previous Exam Papers' },
    { id: 'ASSIGNMENT_REF', label: 'Assignment Ref' },
    { id: 'REFERENCE_MATERIAL', label: 'Textbook Reference' },
    { id: 'STUDENT_GUIDE', label: 'Study Guides' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Notes, PYQs & Study Library</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Faculty-moderated repository of verified lecture slides, university past exam papers, and peer study notes.
          </p>
        </div>

        <Button
          variant="emerald"
          size="sm"
          onClick={() => setShowUploadModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Upload Notes / PYQ
        </Button>
      </div>

      {/* Search & Multi-Filter Drawer Panel */}
      <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by topic, keyword, subject code (e.g. CS501)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-2xl text-xs font-medium pl-10 pr-4 py-2.5 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="glass-input rounded-2xl text-xs font-bold px-3 py-2.5 focus:outline-none"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input rounded-2xl text-xs font-bold px-3 py-2.5 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="downloads">Most Downloaded</option>
              <option value="views">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Saved Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/40 dark:border-white/10">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer active:scale-95 ${
                  categoryFilter === cat.id
                    ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-white/30 backdrop-blur-xl'
                    : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-700/60 backdrop-blur-md'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                bookmarkedOnly
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-white/30'
                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-700/60 backdrop-blur-md'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Bookmarks</span>
            </button>

            <button
              onClick={() => setMyUploadsOnly(!myUploadsOnly)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                myUploadsOnly
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-black shadow-lg shadow-indigo-500/30 border border-white/30'
                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-700/60 backdrop-blur-md'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Uploads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Study Resources Found"
          description="Try adjusting your category filter, semester, or search query. You can also upload the first document for this subject!"
          actionText="Upload Study Material"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <div
              key={res.id}
              className="p-6 rounded-3xl glass-panel glass-panel-hover border border-white/70 dark:border-white/15 flex flex-col justify-between space-y-4 shadow-lg backdrop-blur-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={res.category === 'PYQ' ? 'amber' : 'emerald'} size="xs">
                    {res.category}
                  </Badge>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleBookmark(res)}
                      className={`p-1.5 rounded-xl transition cursor-pointer active:scale-90 ${
                        res.isBookmarked
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={res.isBookmarked ? 'Remove Bookmark' : 'Bookmark for later'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                  {res.description || res.fileName}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>By {res.uploader?.fullName || 'Campus Peer'}</span>
                  <span>{res.subjectCode ? `${res.subjectCode} • ` : ''}Sem {res.semester || 6}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleToggleRating(res)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                      res.userRating
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${res.userRating ? 'fill-current' : ''}`} />
                    <span>{res.helpfulCount || 0}</span>
                  </button>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleDownload(res)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download ({res.downloadsCount})
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ResourceUploadModal
          isOpen={true}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchResources();
          }}
        />
      )}
    </div>
  );
};
