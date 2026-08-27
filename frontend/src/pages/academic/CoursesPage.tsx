import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Users, FileText, CheckSquare, 
  Download, Clock, ArrowLeft, Send, Sparkles, CheckCircle2, X,
  ExternalLink, ChevronRight, User, AlertCircle, Edit3, Trash2,
  Calendar, Layers, ShieldCheck, ArrowRight
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Course, Announcement, Resource, Assignment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { CreateAssignmentModal } from '../../components/academic/CreateAssignmentModal';
import { SubmissionModal } from '../../components/academic/SubmissionModal';
import { ResourceUploadModal } from '../../components/academic/ResourceUploadModal';
import { EditCourseModal } from '../../components/academic/EditCourseModal';
import { EditAssignmentModal } from '../../components/academic/EditAssignmentModal';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';
import { CardSkeleton, CourseHeaderSkeleton } from '../../components/common/Skeleton';

interface CoursesPageProps {
  initialCourseId?: number;
  onSelectCourse?: (id?: number) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ initialCourseId, onSelectCourse }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'announcements' | 'resources' | 'assignments' | 'students'>('announcements');
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [courseTypeFilter, setCourseTypeFilter] = useState<string>('');
  const [myCoursesOnly, setMyCoursesOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
  const [showUploadResourceModal, setShowUploadResourceModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);

  // New Course Form
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState(user?.department || 'Computer Science & Engineering');
  const [newSem, setNewSem] = useState(6);
  const [newType, setNewType] = useState<'THEORY' | 'LAB' | 'PROJECT'>('THEORY');
  const [newCredits, setNewCredits] = useState(3);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (courseTypeFilter) params.append('courseType', courseTypeFilter);
      if (myCoursesOnly) params.append('myOnly', 'true');

      const res = await api.get(`/courses?${params.toString()}`);
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      error('Failed to load courses catalog');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/courses/${id}`);
      if (res.data.success) {
        setSelectedCourse(res.data.data);
      }
    } catch (err: any) {
      error('Failed to load course workspace details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCourseId) {
      fetchCourseDetail(initialCourseId);
    } else {
      fetchCourses();
    }
  }, [initialCourseId, searchQuery, semesterFilter, courseTypeFilter, myCoursesOnly]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    onSelectCourse?.(course.id);
    fetchCourseDetail(course.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setSelectedCourse(null);
    onSelectCourse?.(undefined);
    fetchCourses();
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newTitle.trim()) {
      error('Please provide both course code and title.');
      return;
    }

    setIsCreatingCourse(true);
    try {
      const res = await api.post('/courses', {
        courseCode: newCourseCode.trim().toUpperCase(),
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        department: newDept,
        semester: Number(newSem),
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
      error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    setIsDeletingCourse(true);
    try {
      const res = await api.delete(`/courses/${selectedCourse.id}`);
      if (res.data.success) {
        success('Course deleted successfully!');
        setShowDeleteCourseModal(false);
        setSelectedCourse(null);
        onSelectCourse?.(undefined);
        fetchCourses();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const handleEnrollToggle = async () => {
    if (!selectedCourse) return;
    try {
      if (selectedCourse.isEnrolled) {
        const res = await api.delete(`/courses/${selectedCourse.id}/unenroll`);
        if (res.data.success) {
          success('Unenrolled from course');
          fetchCourseDetail(selectedCourse.id);
        }
      } else {
        const res = await api.post(`/courses/${selectedCourse.id}/enroll`);
        if (res.data.success) {
          success('Successfully enrolled in course!');
          fetchCourseDetail(selectedCourse.id);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Action failed');
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
        success('Announcement posted to class stream!');
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

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment || !selectedCourse) return;
    setIsDeletingAssignment(true);
    try {
      const res = await api.delete(`/assignments/${deletingAssignment.id}`);
      if (res.data.success) {
        success('Assignment deleted successfully!');
        setDeletingAssignment(null);
        fetchCourseDetail(selectedCourse.id);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete assignment');
    } finally {
      setIsDeletingAssignment(false);
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
      success(`Downloading ${resource.fileName}`);
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Download failed');
      error(msg);
    }
  };

  const handleExportRosterCsv = async () => {
    if (!selectedCourse) return;
    try {
      const res = await api.get(`/courses/${selectedCourse.id}/roster`);
      if (!res.data.success || !res.data.data.students) {
        error('Could not fetch complete course roster for export');
        return;
      }
      const students = res.data.data.students;
      const headers = ['Sr No', 'PRN', 'Student Name', 'Email', 'Department', 'Semester', '10th %', '12th %', 'Sem 1 CGPA', 'Enrolled Date'];
      const rows = students.map((s: any, idx: number) => [
        idx + 1,
        `"${s.prn || 'N/A'}"`,
        `"${s.fullName || ''}"`,
        `"${s.email || ''}"`,
        `"${s.department || ''}"`,
        s.semester || '',
        s.tenthPercentage || '',
        s.twelfthPercentage || '',
        s.sem1Cgpa || '',
        new Date(s.enrolledAt).toLocaleDateString(),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Class_Roster_${selectedCourse.courseCode}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success(`Exported ${students.length} students to CSV`);
    } catch (err: any) {
      error('Failed to export roster');
    }
  };

  // ----------------------------------------------------
  // RENDER 1: COURSE WORKSPACE / DETAIL VIEW
  // ----------------------------------------------------
  if (selectedCourse) {
    const isOwnerOrAdmin = selectedCourse.facultyId === user?.id || user?.role === 'ADMIN';

    return (
      <div className="space-y-6 animate-fade-in-up">
        {/* Back navigation & Action Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToCatalog}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-black text-brand-600 dark:text-brand-400 hover:text-brand-500 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Courses</span>
          </button>

          <div className="flex items-center space-x-2">
            {!isFaculty && (
              <Button
                variant={selectedCourse.isEnrolled ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleEnrollToggle}
              >
                {selectedCourse.isEnrolled ? 'Unenroll' : 'Enroll in Course'}
              </Button>
            )}

            {isOwnerOrAdmin && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEditCourseModal(true)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteCourseModal(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Course Header Banner */}
        <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm bg-gradient-to-r from-brand-600/5 via-indigo-600/5 to-purple-600/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                  {selectedCourse.courseCode}
                </span>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  selectedCourse.courseType === 'LAB'
                    ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800'
                    : selectedCourse.courseType === 'PROJECT'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800'
                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800'
                }`}>
                  {selectedCourse.courseType === 'LAB' ? '🔬 Practical Lab' : selectedCourse.courseType === 'PROJECT' ? '🚀 Capstone Project' : '📘 Theory Course'} • {selectedCourse.credits || 3} Credits
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Semester {selectedCourse.semester} • {selectedCourse.department}
                </span>
                {selectedCourse.isEnrolled && (
                  <Badge variant="emerald" size="xs" dot>
                    Enrolled
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedCourse.title}
              </h1>

              {selectedCourse.description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedCourse.description}
                </p>
              )}

              <div className="pt-2 flex items-center space-x-4 text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                <span>Instructor: {selectedCourse.faculty?.fullName || 'Faculty Member'}</span>
                <span>•</span>
                <span>{selectedCourse.enrolledCount || 0} Students Enrolled</span>
                <span>•</span>
                <span>Term: {selectedCourse.academicYear || '2026-27'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'announcements', label: 'Stream & Announcements', icon: Sparkles, count: selectedCourse.announcements?.length },
            { id: 'resources', label: 'Class Resources', icon: FileText, count: selectedCourse.resources?.length },
            { id: 'assignments', label: 'Assignments', icon: CheckSquare, count: selectedCourse.assignments?.length },
            { id: 'students', label: 'People / Enrolled', icon: Users, count: selectedCourse.enrolledCount },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.25 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANNOUNCEMENTS / STREAM */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Faculty Announcement Poster */}
            {isOwnerOrAdmin && (
              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Post Class Announcement</span>
                </h3>
                <form onSubmit={handlePostAnnouncement} className="space-y-3">
                  <Input
                    placeholder="Announcement Title (e.g., Midterm Exam Schedule)"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    isRequired
                  />
                  <textarea
                    placeholder="Write your announcement message or important notice for enrolled students..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    rows={3}
                    className="w-full glass-input rounded-2xl text-xs sm:text-sm font-medium px-4 py-2.5 focus:outline-none"
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isPostingAnn}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Publish Announcement
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Announcement Stream List */}
            <div className="space-y-4">
              {!selectedCourse.announcements || selectedCourse.announcements.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No Announcements Yet"
                  description="The instructor has not published any class announcements for this course yet."
                />
              ) : (
                selectedCourse.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {ann.author?.fullName?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {ann.author?.fullName || 'Faculty Instructor'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="indigo" size="xs">
                        Class Notice
                      </Badge>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {ann.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Course Learning Materials & Notes
                </h3>
                <p className="text-xs text-slate-500">
                  Download syllabus documents, lecture presentations, and reference guides.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUploadResourceModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Upload Resource
              </Button>
            </div>

            {!selectedCourse.resources || selectedCourse.resources.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Course Resources Found"
                description="Upload lecture slides, homework reference sheets, or syllabus notes to share with your peers."
                actionText="Upload Resource"
                onAction={() => setShowUploadResourceModal(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCourse.resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="indigo" size="xs">
                        {res.category}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400">
                        {res.downloadsCount} Downloads
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                      {res.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {res.description || res.fileName}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        By {res.uploader?.fullName || 'Member'}
                      </span>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleDownloadResource(res)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Course Deliverables & Tasks
                </h3>
                <p className="text-xs text-slate-500">
                  Track upcoming homework, submit lab reports, and view faculty marks.
                </p>
              </div>
              {isOwnerOrAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateAssignmentModal(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create Assignment
                </Button>
              )}
            </div>

            {!selectedCourse.assignments || selectedCourse.assignments.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No Assignments Posted"
                description="No upcoming homework or projects have been assigned for this course yet."
              />
            ) : (
              <div className="space-y-4">
                {selectedCourse.assignments.map((assignment) => {
                  const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
                  const mySub = isSubmitted ? assignment.submissions![0] : null;

                  return (
                    <div
                      key={assignment.id}
                      className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="indigo" size="xs">
                            Max {assignment.maxMarks} Marks
                          </Badge>
                          <Badge variant={isSubmitted ? 'emerald' : 'amber'} size="xs" dot>
                            {isSubmitted ? (mySub?.status === 'GRADED' ? `Graded: ${mySub.marksAwarded}/${assignment.maxMarks}` : 'Submitted') : 'Pending Submission'}
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {assignment.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {assignment.description}
                      </p>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          {isOwnerOrAdmin && (
                            <>
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => setEditingAssignment(assignment)}
                                leftIcon={<Edit3 className="w-3 h-3" />}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => setDeletingAssignment(assignment)}
                                leftIcon={<Trash2 className="w-3 h-3" />}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>

                        {!isFaculty && (
                          <Button
                            variant={isSubmitted ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => setSubmittingAssignment(assignment)}
                          >
                            {isSubmitted ? 'View / Resubmit' : 'Submit Assignment'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STUDENTS / PEOPLE */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Enrolled Students & Class Roster
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedCourse.enrollments?.length || selectedCourse.enrolledCount || 0} active students enrolled in this curriculum section
                </p>
              </div>

              {isOwnerOrAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportRosterCsv}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export Class List (CSV)
                </Button>
              )}
            </div>

            {!selectedCourse.enrollments || selectedCourse.enrollments.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Enrolled Students"
                description="Students who enroll in this course will appear in this roster."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {selectedCourse.enrollments.map((enr, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 flex items-center space-x-3 shadow-2xs hover:border-brand-300 dark:hover:border-brand-700 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {enr.student.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {enr.student.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {enr.student.email}
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[9px] font-bold text-slate-400">
                          {enr.student.department || 'Student'}
                        </span>
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                          Sem {enr.student.semester || 6}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Course Action Modals */}
        {showEditCourseModal && selectedCourse && (
          <EditCourseModal
            isOpen={true}
            onClose={() => setShowEditCourseModal(false)}
            course={selectedCourse}
            onSuccess={() => {
              setShowEditCourseModal(false);
              fetchCourseDetail(selectedCourse.id);
            }}
          />
        )}

        {showDeleteCourseModal && selectedCourse && (
          <DeleteConfirmModal
            isOpen={true}
            onClose={() => setShowDeleteCourseModal(false)}
            onConfirm={handleDeleteCourse}
            title={`Delete Course "${selectedCourse.courseCode}"?`}
            description="Are you sure you want to permanently delete this course? All associated assignments, stream notices, and enrollments will be deleted."
            isDeleting={isDeletingCourse}
          />
        )}

        {showCreateAssignmentModal && selectedCourse && (
          <CreateAssignmentModal
            isOpen={true}
            onClose={() => setShowCreateAssignmentModal(false)}
            courseId={selectedCourse.id}
            onSuccess={() => {
              setShowCreateAssignmentModal(false);
              fetchCourseDetail(selectedCourse.id);
            }}
          />
        )}

        {editingAssignment && (
          <EditAssignmentModal
            isOpen={true}
            onClose={() => setEditingAssignment(null)}
            assignment={editingAssignment}
            onSuccess={() => {
              setEditingAssignment(null);
              fetchCourseDetail(selectedCourse.id);
            }}
          />
        )}

        {deletingAssignment && (
          <DeleteConfirmModal
            isOpen={true}
            onClose={() => setDeletingAssignment(null)}
            onConfirm={handleDeleteAssignment}
            title={`Delete Assignment "${deletingAssignment.title}"?`}
            description="Are you sure you want to remove this assignment deliverable?"
            isDeleting={isDeletingAssignment}
          />
        )}

        {submittingAssignment && (
          <SubmissionModal
            isOpen={true}
            onClose={() => setSubmittingAssignment(null)}
            assignment={submittingAssignment}
            onSuccess={() => {
              setSubmittingAssignment(null);
              fetchCourseDetail(selectedCourse.id);
            }}
          />
        )}

        {showUploadResourceModal && (
          <ResourceUploadModal
            isOpen={true}
            onClose={() => setShowUploadResourceModal(false)}
            courseId={selectedCourse.id}
            onSuccess={() => {
              setShowUploadResourceModal(false);
              fetchCourseDetail(selectedCourse.id);
            }}
          />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER 2: COURSES DIRECTORY / CATALOG
  // ----------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Academic Courses & Curriculum Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore syllabus courses, join classroom streams, access lecture notes, and submit homework tasks.
          </p>
        </div>

        {isFaculty && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateCourseModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Course
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by course name, subject code (e.g. CS301)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-2xl text-xs font-medium pl-10 pr-4 py-2.5 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Course Type Filter */}
          <select
            value={courseTypeFilter}
            onChange={(e) => setCourseTypeFilter(e.target.value)}
            className="glass-input rounded-2xl text-xs font-bold px-3 py-2.5 focus:outline-none"
          >
            <option value="">All Types (Theory, Labs, Projects)</option>
            <option value="THEORY">📘 Core Theory</option>
            <option value="LAB">🔬 Practical Labs</option>
            <option value="PROJECT">🚀 Capstone Projects</option>
          </select>

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

          <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMyCoursesOnly(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                myCoursesOnly
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isFaculty ? 'My Teaching Courses' : 'My Enrolled Courses'}
            </button>
            <button
              onClick={() => setMyCoursesOnly(false)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                !myCoursesOnly
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Campus Courses
            </button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Courses Found"
          description="No courses match your filter parameters. Try adjusting your search query or semester."
          actionText={isFaculty ? 'Create New Course' : undefined}
          onAction={isFaculty ? () => setShowCreateCourseModal(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className={`p-6 rounded-3xl glass-panel glass-panel-hover border flex flex-col justify-between space-y-4 cursor-pointer group shadow-sm transition-all ${
                course.isEnrolled
                  ? 'border-indigo-300/80 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-1 rounded-xl border border-brand-200 dark:border-brand-800">
                      {course.courseCode}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                      course.courseType === 'LAB' 
                        ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800'
                        : course.courseType === 'PROJECT'
                        ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800'
                        : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {course.courseType === 'LAB' ? '🔬 Lab' : course.courseType === 'PROJECT' ? '🚀 Project' : '📘 Theory'} • {course.credits || 3} Cr
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {course.isEnrolled ? (
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {isFaculty ? 'Instructor' : 'Enrolled'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {isFaculty ? 'Other Faculty' : 'Catalog'}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Sem {course.semester}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                  {course.description || `Academic course curriculum for ${course.department}.`}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <span>Instructor: {course.faculty?.fullName || 'Faculty'}</span>
                  <span>{course.enrolledCount || 0} Students</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2 text-[11px] font-black text-slate-400">
                    <span>{course.assignmentsCount || 0} Tasks</span>
                    <span>•</span>
                    <span>{course.resourcesCount || 0} Docs</span>
                  </div>

                  <span className="inline-flex items-center text-xs font-black text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                    Enter Class <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Course */}
      {showCreateCourseModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateCourseModal(false)}
          title="Create New Academic Course"
          subtitle="Set up a new curriculum course with syllabus announcements and assignments."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Course Code"
                placeholder="e.g. CS401"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                isRequired
              />
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                  Target Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newSem}
                  onChange={(e) => setNewSem(Number(e.target.value))}
                  className="w-full glass-input rounded-2xl text-xs font-medium px-4 py-2.5 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Course Title"
              placeholder="e.g. Distributed Cloud Systems & Microservices"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              isRequired
            />

            <Input
              label="Academic Department"
              placeholder="Computer Science & Engineering"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              isRequired
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                Course Description (Optional)
              </label>
              <textarea
                placeholder="Overview of topics, syllabus goals, and grading rubrics..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full glass-input rounded-2xl text-xs font-medium px-4 py-2.5 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateCourseModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isCreatingCourse}
              >
                Create Course
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
