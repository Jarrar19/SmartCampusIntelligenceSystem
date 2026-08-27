import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckSquare, Inbox, Users, Plus, FileText, 
  ShieldCheck, ChevronRight, Sparkles, ArrowRight, Download, Check, X, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, extractErrorMessage } from '../../services/api';
import { Course, Resource } from '../../types';
import { CampusHeroCanvas } from '../../components/common/CampusHeroCanvas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatWidgetSkeleton, CardSkeleton, ListRowSkeleton } from '../../components/common/Skeleton';
import { ModerationFeedbackModal } from '../../components/academic/ModerationFeedbackModal';

interface FacultyDashboardProps {
  onNavigate: (tab: string, courseId?: number) => void;
  onOpenCreateCourse: () => void;
  onOpenUploadResource: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onNavigate,
  onOpenCreateCourse,
  onOpenUploadResource,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [stats, setStats] = useState<any>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedbackModalTarget, setFeedbackModalTarget] = useState<{
    resource: Resource;
    status: 'REJECTED' | 'CHANGES_REQUESTED';
  } | null>(null);

  const fetchFacultyData = async () => {
    try {
      const [statsRes, coursesRes, modRes] = await Promise.all([
        api.get('/users/dashboard-stats'),
        api.get('/courses?myOnly=true'),
        api.get('/resources/moderation-queue?status=PENDING_REVIEW'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.data);
      if (modRes.data.success) setPendingResources(modRes.data.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleQuickApprove = async (resourceId: number) => {
    setProcessingId(resourceId);
    try {
      const res = await api.patch(`/resources/${resourceId}/moderate`, {
        status: 'APPROVED',
      });
      if (res.data.success) {
        success('Resource approved and published to student repository!');
        setPendingResources((prev) => prev.filter((r) => r.id !== resourceId));
        fetchFacultyData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFeedbackSubmit = async (reason: string) => {
    if (!feedbackModalTarget) return;
    const { resource, status } = feedbackModalTarget;

    setProcessingId(resource.id);
    try {
      const res = await api.patch(`/resources/${resource.id}/moderate`, {
        status,
        rejectionReason: reason,
      });

      if (res.data.success) {
        success(res.data.message);
        setPendingResources((prev) => prev.filter((r) => r.id !== resource.id));
        setFeedbackModalTarget(null);
        fetchFacultyData();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setProcessingId(null);
    }
  };

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
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Download failed');
      error(msg);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const facultyName = user?.fullName || 'Faculty Member';

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        <div className="h-44 rounded-3xl glass-panel p-8 shimmer border border-slate-200/80 dark:border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidgetSkeleton />
          <StatWidgetSkeleton />
          <StatWidgetSkeleton />
          <StatWidgetSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);

  return (
    <div className="space-y-7 text-slate-900 dark:text-slate-100 max-w-[1400px] mx-auto pb-10 animate-fade-in-up">
      
      {/* 1. Hero Cockpit with Ambient Canvas */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <CampusHeroCanvas />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                {formattedDate}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Faculty Cockpit • {user?.department || 'Engineering Department'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, <span className="text-gradient">{facultyName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {pendingResources.length > 0 
                ? `You have ${pendingResources.length} student submission${pendingResources.length > 1 ? 's' : ''} awaiting review in your academic moderation queue.`
                : 'All student uploads and class submissions are currently reviewed and up to date.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateCourse}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Course
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('moderation')}
              leftIcon={<Inbox className="w-3.5 h-3.5" />}
            >
              Moderation ({pendingResources.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('grading')}
              leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            >
              Grading Center
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Courses */}
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Courses Instructed</span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {courses.length}
            </span>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Current Semester
          </p>
        </div>

        {/* Pending Moderation Queue */}
        <div 
          onClick={() => onNavigate('moderation')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {pendingResources.length}
            </span>
            <Badge variant={pendingResources.length > 0 ? 'amber' : 'emerald'} size="xs" dot>
              {pendingResources.length > 0 ? 'Queue' : 'Clear'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Student notes & PYQs
          </p>
        </div>

        {/* Total Enrolled Students */}
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Enrolled Students</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalStudents || stats.totalStudentsCount || 0}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Rosters</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Across your courses
          </p>
        </div>

        {/* Evaluation Tasks */}
        <div 
          onClick={() => onNavigate('grading')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Grading Center</span>
            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.pendingSubmissionsCount || 0}
            </span>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Submissions</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Awaiting assessment
          </p>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Pending Moderation & Teaching Courses (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Moderation Queue Preview Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Resource Moderation Queue
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Review and approve student-submitted notes & PYQs
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('moderation')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingResources.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Moderation Queue is Clean!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No student uploads awaiting review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge variant="amber" size="xs" dot>
                          {res.category}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          By {res.uploader?.fullName || 'Student'} (Sem {res.semester || 6})
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {res.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        File: {res.fileName} • {res.subjectCode || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleDownload(res)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Download File"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setFeedbackModalTarget({ resource: res, status: 'REJECTED' })}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="emerald"
                        size="xs"
                        isLoading={processingId === res.id}
                        onClick={() => handleQuickApprove(res.id)}
                        leftIcon={<Check className="w-3 h-3" />}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Teaching Courses */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Active Courses Instructed
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Publish assignments, post announcements, and manage resources
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No courses created yet.</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">Create your first course to begin teaching.</p>
                <Button variant="primary" size="xs" onClick={onOpenCreateCourse}>
                  Create Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => onNavigate('courses', course.id)}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-400 dark:hover:border-brand-500 transition cursor-pointer group shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800">
                        {course.courseCode}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Sem {course.semester}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {course.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {course.department} • Term: {course.academicYear || '2026-27'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>{course.enrolledCount || 0} Students • {course.assignmentsCount || 0} Tasks</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Faculty Actions & Grading Shortcuts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Action Center Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 bg-gradient-to-br from-indigo-500/5 via-transparent to-brand-500/5">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Faculty Workspace Shortcuts
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenCreateCourse}
                className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 text-left transition cursor-pointer group shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-900 dark:text-white">+ New Course</p>
                <p className="text-[10px] text-slate-500">Create curriculum</p>
              </button>

              <button
                onClick={onOpenUploadResource}
                className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 text-left transition cursor-pointer group shadow-2xs"
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-900 dark:text-white">+ Upload Doc</p>
                <p className="text-[10px] text-slate-500">Official syllabus/PYQ</p>
              </button>
            </div>
          </div>

          {/* Grading Evaluation Prompt */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Grading & Evaluation Center
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Review student code, project reports, and homework
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Evaluate pending student submissions, grade deliverables with rubrics, and provide feedback directly in the grading center.
            </p>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => onNavigate('grading')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Evaluation Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Moderation Feedback Modal */}
      {feedbackModalTarget && (
        <ModerationFeedbackModal
          isOpen={true}
          onClose={() => setFeedbackModalTarget(null)}
          resource={feedbackModalTarget.resource}
          status={feedbackModalTarget.status}
          onSubmit={handleFeedbackSubmit}
          isSubmitting={processingId === feedbackModalTarget.resource.id}
        />
      )}
    </div>
  );
};
