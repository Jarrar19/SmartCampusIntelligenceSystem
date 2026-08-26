import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Download, ThumbsUp, Bookmark, 
  Plus, Filter, Tag, Clock, User, CheckCircle2, Sparkles,
  BookOpen, Eye, Award
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Resource, ResourceCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ResourceUploadModal } from '../../components/academic/ResourceUploadModal';

interface ResourcesPageProps {
  onOpenUpload?: () => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = () => {
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
      setResources(prev =>
        prev.map(r => (r.id === resource.id ? { ...r, downloadsCount: r.downloadsCount + 1 } : r))
      );
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
        setResources(prev =>
          prev.map(r => {
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
      error('Rating failed');
    }
  };

  const handleToggleBookmark = async (resource: Resource) => {
    try {
      const res = await api.post(`/resources/${resource.id}/bookmark`);
      if (res.data.success) {
        success(res.data.message);
        setResources(prev =>
          prev.map(r =>
            r.id === resource.id ? { ...r, isBookmarked: res.data.bookmarked } : r
          )
        );
      }
    } catch (err) {
      error('Bookmark failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Academic Resource Hub & PYQ Library</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Faculty lecture slides, handwritten notes, previous year question papers, and verified study guides.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25 flex items-center gap-2 transition flex-shrink-0 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Notes / PYQ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources by title, subject code, or topic tags..."
              className="w-full glass-input rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="NOTES">Lecture Notes</option>
              <option value="PYQ">Past Exam Papers (PYQ)</option>
              <option value="STUDENT_GUIDE">Student Study Guides</option>
              <option value="ASSIGNMENT_REF">Assignment Reference</option>
              <option value="REFERENCE_MATERIAL">Reference Material</option>
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="downloads">Most Downloaded</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-wider">Quick Filters:</span>
          <button
            onClick={() => {
              setCategoryFilter(categoryFilter === 'PYQ' ? '' : 'PYQ');
            }}
            className={`px-3.5 py-1.5 rounded-xl transition font-extrabold text-xs cursor-pointer active:scale-95 ${
              categoryFilter === 'PYQ'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Past Exam Papers (PYQs)
          </button>
          <button
            onClick={() => {
              setBookmarkedOnly(!bookmarkedOnly);
              setMyUploadsOnly(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition font-extrabold text-xs cursor-pointer active:scale-95 ${
              bookmarkedOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Saved Bookmarks
          </button>
          <button
            onClick={() => {
              setMyUploadsOnly(!myUploadsOnly);
              setBookmarkedOnly(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition font-extrabold text-xs cursor-pointer active:scale-95 ${
              myUploadsOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Uploads
          </button>
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading resources library...</div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Academic Resources Found"
          description="Try modifying search keywords or be the first to upload lecture notes / question papers."
          actionText="Upload Document"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-400 opacity-80" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={item.category === 'PYQ' ? 'indigo' : 'emerald'}>
                      {item.category}
                    </Badge>
                    {item.subjectCode && (
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {item.subjectCode}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleBookmark(item)}
                    className={`p-2 rounded-xl transition cursor-pointer active:scale-90 ${
                      item.isBookmarked
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/15'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${item.isBookmarked ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1.5 line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3 font-medium">
                  {item.description || 'Verified institutional study material.'}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags?.split(',').map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60"
                    >
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="truncate max-w-[150px] font-semibold">By {item.uploader?.fullName || 'Contributor'} ({item.uploaderRole})</span>
                  <span>{(item.fileSize / 1024).toFixed(0)} KB</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleRating(item)}
                    className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      item.userRating
                        ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/40'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${item.userRating ? 'fill-brand-500' : ''}`} />
                    <span>{item.helpfulCount ?? 0}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(item)}
                    className="flex-1 py-2 px-3 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/25 transition cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ({item.downloadsCount})</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <ResourceUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchResources}
      />
    </div>
  );
};
