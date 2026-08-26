import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Users, FileText, CheckSquare, 
  Download, Clock, ArrowLeft, Send, Sparkles, CheckCircle2, X,
  ExternalLink, ChevronRight, User, AlertCircle
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Course, Announcement, Resource, Assignment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CreateAssignmentModal } from '../../components/academic/CreateAssignmentModal';
import { SubmissionModal } from '../../components/academic/SubmissionModal';
import { ResourceUploadModal } from '../../components/academic/ResourceUploadModal';

interface CoursesPageProps {
  initialCourseId?: number;
  onSelectCourse?: (id?: number) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ initialCourseId, onSelectCourse }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'announcements' | 'resources' | 'assignments' | 'students'>('announcements');
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showUploadResourceModal, setShowUploadResourceModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);

  // New Course Form
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState(user?.department || 'Computer Science & Engineering');
  const [newSem, setNewSem] = useState(6);

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      let url = '/courses';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseDetail = async (id: number) => {
    try {
      const res = await api.get(`/courses/${id}`);
      if (res.data.success) {
        setSelectedCourse(res.data.data);
      }
    } catch (err) {
      error('Failed to load course details');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, semesterFilter]);

  useEffect(() => {
    if (initialCourseId) {
      fetchCourseDetail(initialCourseId);
    }
  }, [initialCourseId]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/courses', {
        courseCode: newCourseCode.trim().toUpperCase(),
        title: newTitle.trim(),
        description: newDesc.trim(),
        department: newDept,
        semester: Number(newSem),
        academicYear: '2025-2026',
      });

      if (res.data.success) {
        success('Course created successfully!');
        setShowCreateCourseModal(false);
        setNewCourseCode('');
        setNewTitle('');
        setNewDesc('');
        fetchCourses();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Course creation failed');
    }
  };

  const handleEnrollToggle = async (course: Course) => {
    try {
      if (course.isEnrolled) {
        await api.delete(`/courses/${course.id}/unenroll`);
        success('Unenrolled from course');
      } else {
        await api.post(`/courses/${course.id}/enroll`);
        success('Enrolled in course successfully!');
      }
      fetchCourses();
      if (selectedCourse?.id === course.id) {
        fetchCourseDetail(course.id);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Enrollment action failed');
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !annTitle.trim() || !annContent.trim()) return;

    setIsPostingAnn(true);
    try {
      const res = await api.post(`/courses/${selectedCourse.id}/announcements`, {
        title: annTitle.trim(),
        content: annContent.trim(),
      });
      if (res.data.success) {
        success('Announcement broadcasted to enrolled students!');
        setAnnTitle('');
        setAnnContent('');
        fetchCourseDetail(selectedCourse.id);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setIsPostingAnn(false);
    }
  };

  const handleDownloadResource = async (resource: Resource) => {
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
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Download failed');
      error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Course Detail View */}
      {selectedCourse ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl p-6 sm:p-8 glass-panel relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-400" />
            <button
              onClick={() => {
                setSelectedCourse(null);
                onSelectCourse?.(undefined);
              }}
              className="mb-4 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Catalog</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs font-black text-brand-600 dark:text-brand-400 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-brand-500/15 border border-indigo-100 dark:border-brand-500/20 shadow-2xs">
                    {selectedCourse.courseCode}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Semester {selectedCourse.semester} • {selectedCourse.department}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedCourse.title}</h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  {selectedCourse.description || 'No detailed course description provided.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-indigo-300 font-semibold mt-3 p-2.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-slate-700/60 w-fit">
                  <User className="w-4 h-4 text-brand-600" />
                  <span>Lead Instructor: <strong>{selectedCourse.faculty?.fullName}</strong> ({selectedCourse.faculty?.email})</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                {!isFaculty && (
                  <button
                    onClick={() => handleEnrollToggle(selectedCourse)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95 ${
                      selectedCourse.isEnrolled
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700'
                        : 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/25'
                    }`}
                  >
                    {selectedCourse.isEnrolled ? 'Enrolled (Leave Course)' : 'Join Course Hub'}
                  </button>
                )}
                {isFaculty && selectedCourse.facultyId === user?.id && (
                  <>
                    <button
                      onClick={() => setShowCreateAssignmentModal(true)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Assignment</span>
                    </button>
                    <button
                      onClick={() => setShowUploadResourceModal(true)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-black text-brand-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload Material</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Course Tabs */}
            <div className="flex space-x-2 border-t border-slate-200/80 dark:border-slate-800 pt-4 mt-6 overflow-x-auto">
              {[
                { id: 'announcements', label: 'Announcements', count: selectedCourse.announcements?.length },
                { id: 'resources', label: 'Resources & PYQs', count: selectedCourse.resources?.length },
                { id: 'assignments', label: 'Assignments', count: selectedCourse.assignments?.length },
                { id: 'students', label: 'Class Roster', count: selectedCourse.enrollments?.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {/* Faculty Post Announcement Box */}
              {isFaculty && selectedCourse.facultyId === user?.id && (
                <form onSubmit={handlePostAnnouncement} className="p-6 rounded-3xl glass-panel space-y-3.5 shadow-sm">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Broadcast Classroom Announcement</span>
                  </h4>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement Title (e.g. Midterm Schedule, Lab 3 Guidelines)"
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                  />
                  <textarea
                    rows={2}
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Type details for all enrolled students..."
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPostingAnn}
                      className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {isPostingAnn ? 'Broadcasting...' : 'Publish Announcement'}
                    </button>
                  </div>
                </form>
              )}

              {selectedCourse.announcements?.length === 0 ? (
                <EmptyState icon={BookOpen} title="No Announcements" description="No notices have been published to this class yet." />
              ) : (
                selectedCourse.announcements?.map((a) => (
                  <div key={a.id} className="p-6 rounded-3xl glass-panel space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{a.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                    <p className="text-[10px] text-slate-400 font-bold pt-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-brand-600" />
                      <span>Posted by Instructor: {a.author?.fullName}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Course Materials & Lecture Notes</h3>
                <button
                  onClick={() => setShowUploadResourceModal(true)}
                  className="px-4 py-2 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 flex items-center gap-1.5 shadow-md shadow-brand-500/25 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Material</span>
                </button>
              </div>

              {selectedCourse.resources?.length === 0 ? (
                <EmptyState icon={FileText} title="No Materials Uploaded" description="Upload lecture notes, lecture slides, or PYQs for this course." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCourse.resources?.map((r) => (
                    <div key={r.id} className="p-5 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <Badge variant={r.category === 'PYQ' ? 'indigo' : 'emerald'}>{r.category}</Badge>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mb-1 line-clamp-1">{r.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {r.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[120px]">By {r.uploader?.fullName}</span>
                        <button
                          onClick={() => handleDownloadResource(r)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-white hover:bg-brand-600 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Active Assignments & Submissions</h3>
                {isFaculty && selectedCourse.facultyId === user?.id && (
                  <button
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="px-4 py-2 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 flex items-center gap-1.5 shadow-md shadow-brand-500/25 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Assignment</span>
                  </button>
                )}
              </div>

              {selectedCourse.assignments?.length === 0 ? (
                <EmptyState icon={CheckSquare} title="No Assignments" description="No assignments assigned for this course." />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {selectedCourse.assignments?.map((a) => {
                    const mySub = a.submissions?.[0];
                    return (
                      <div key={a.id} className="p-6 rounded-3xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{a.title}</span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
                              Max Marks: {a.maxMarks}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{a.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                              <Clock className="w-3.5 h-3.5" />
                              Due: {new Date(a.dueDate).toLocaleDateString()} at {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {mySub && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {mySub.status === 'GRADED' ? `Graded (${mySub.marksAwarded}/${a.maxMarks})` : 'Submitted'}
                              </span>
                            )}
                          </div>
                        </div>

                        {!isFaculty && (
                          <button
                            onClick={() => setSubmittingAssignment(a)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 cursor-pointer shadow-sm active:scale-95 ${
                              mySub
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                : 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/25'
                            }`}
                          >
                            {mySub ? 'View / Resubmit' : 'Turn In Work'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Class Roster ({selectedCourse.enrollments?.length || 0} Students)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {selectedCourse.enrollments?.map((e) => (
                  <div key={e.student.id} className="p-4 rounded-3xl glass-panel flex items-center space-x-3.5 shadow-2xs">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                      {e.student.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{e.student.fullName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-semibold">Sem {e.student.semester || 6} • {e.student.department || 'Student'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Course Catalog View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                <span>Academic Courses & Learning Hub</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Browse semester curriculum workspaces, join course classrooms, and access instructional syllabi.
              </p>
            </div>

            {isFaculty && (
              <button
                onClick={() => setShowCreateCourseModal(true)}
                className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25 flex items-center gap-1.5 transition cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Course Hub</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by code, title, or department..."
                className="w-full glass-input rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium"
              />
            </div>

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
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="text-center py-16 text-xs text-slate-400">Loading courses catalog...</div>
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No Courses Found" description="Try adjusting your search query or semester filter." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-400 opacity-80" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-brand-600 dark:text-brand-400 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-brand-500/15 border border-indigo-100 dark:border-brand-500/20 shadow-2xs">
                        {course.courseCode}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">Sem {course.semester}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                      {course.description || 'Comprehensive curriculum workspace.'}
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="truncate max-w-[140px] font-semibold">{course.faculty?.fullName || 'Faculty'}</span>
                      <span className="font-bold">{course.enrolledCount ?? 0} Enrolled</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-center cursor-pointer active:scale-95"
                      >
                        Enter Hub
                      </button>
                      {!isFaculty && (
                        <button
                          onClick={() => handleEnrollToggle(course)}
                          className={`py-2.5 px-4 rounded-2xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 ${
                            course.isEnrolled
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/25'
                          }`}
                        >
                          {course.isEnrolled ? 'Enrolled' : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faculty Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => setShowCreateCourseModal(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative glass-panel rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Create New Course Portal</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Establish a new classroom workspace for students.</p>
                </div>
                <button
                  onClick={() => setShowCreateCourseModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course Code *</label>
                    <input
                      type="text"
                      required
                      value={newCourseCode}
                      onChange={(e) => setNewCourseCode(e.target.value)}
                      placeholder="e.g. CS501"
                      className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Semester *</label>
                    <select
                      value={newSem}
                      onChange={(e) => setNewSem(Number(e.target.value))}
                      className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-bold cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Software Engineering & Cloud Architectures"
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description & Syllabus</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Course objectives, topics covered, and prerequisite knowledge..."
                    className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
                  />
                </div>

                <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateCourseModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-500 rounded-2xl shadow-md shadow-brand-500/25 cursor-pointer active:scale-95"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedCourse && (
        <>
          <CreateAssignmentModal
            isOpen={showCreateAssignmentModal}
            onClose={() => setShowCreateAssignmentModal(false)}
            onSuccess={() => fetchCourseDetail(selectedCourse.id)}
            courseId={selectedCourse.id}
            courseCode={selectedCourse.courseCode}
          />
          <ResourceUploadModal
            isOpen={showUploadResourceModal}
            onClose={() => setShowUploadResourceModal(false)}
            onSuccess={() => fetchCourseDetail(selectedCourse.id)}
            courseId={selectedCourse.id}
          />
        </>
      )}

      {submittingAssignment && (
        <SubmissionModal
          isOpen={!!submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSuccess={() => {
            if (selectedCourse) fetchCourseDetail(selectedCourse.id);
          }}
          assignment={submittingAssignment}
          existingSubmission={submittingAssignment.submissions?.[0]}
        />
      )}
    </div>
  );
};
