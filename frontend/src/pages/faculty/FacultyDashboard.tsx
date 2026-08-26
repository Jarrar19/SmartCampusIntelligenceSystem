import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckSquare, Inbox, Users, Plus, FileText, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Course, Resource } from '../../types';

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
  const [stats, setStats] = useState<any>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, coursesRes, modRes] = await Promise.all([
          api.get('/users/dashboard-stats'),
          api.get('/courses?myOnly=true'),
          api.get('/resources/moderation-queue?status=PENDING_REVIEW'),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (coursesRes.data.success) setCourses(coursesRes.data.data);
        if (modRes.data.success) setPendingResources(modRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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

  return (
    <div className="space-y-7 text-slate-900 dark:text-slate-100 max-w-[1400px] mx-auto pb-10">
      
      {/* 1. Calm, Professional Faculty Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {formattedDate} • Faculty Portal ({user?.department || 'Engineering'})
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {getGreeting()}, {facultyName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-normal">
            {pendingResources.length > 0 
              ? `You have ${pendingResources.length} student submission${pendingResources.length > 1 ? 's' : ''} awaiting moderation review.`
              : `All student uploads and submissions are currently up to date.`}
          </p>
        </div>

        {/* Quiet Faculty Actions */}
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <button
            onClick={onOpenCreateCourse}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Create Course</span>
          </button>
          <button
            onClick={() => onNavigate('moderation')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Inbox className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Review ({pendingResources.length})</span>
          </button>
          <button
            onClick={() => onNavigate('grading')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Grading Center</span>
          </button>
        </div>
      </div>

      {/* 2. Reworked Faculty Summary Bar (Bordered inline indicators instead of floating equal KPI cards) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium py-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{stats.coursesTaughtCount ?? courses.length}</span>
          <span>Instructed Courses</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-600 dark:text-amber-400 font-semibold">{stats.pendingModerationCount ?? pendingResources.length}</span>
          <span>Awaiting Review</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-semibold">{stats.pendingSubmissionsToGrade ?? 0}</span>
          <span>To Grade</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{stats.totalStudentsEnrolled ?? 0}</span>
          <span>Enrolled Students</span>
        </div>
      </div>

      {/* 3. Asymmetric 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-1">
        
        {/* Left Column (Primary Focus: 7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section: Active Course Portals */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Active Course Portals
              </h2>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Manage courses
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs">
                No active courses yet. <button onClick={onOpenCreateCourse} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer">Create a new course portal</button>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                          {course.courseCode}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Sem {course.semester}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {course.description || 'No syllabus description provided.'}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>{course.enrolledCount ?? 0} enrolled • {course.assignmentsCount ?? 0} tasks</span>
                      <button
                        onClick={() => onNavigate('courses', course.id)}
                        className="font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Open portal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (Secondary Focus: 5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section: Pending Review / Moderation Snapshot */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Moderation Queue
              </h2>
              <button
                onClick={() => onNavigate('moderation')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View full queue
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              {pendingResources.length === 0 ? (
                <div className="text-slate-500 text-xs py-2">
                  Moderation queue is clear. All student uploads have been reviewed.
                </div>
              ) : (
                pendingResources.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40">
                          {r.category}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          By {r.uploader?.fullName || 'Student'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {r.title}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate('moderation')}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex-shrink-0 pt-0.5"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section: Faculty Management Tools */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Faculty Tools
            </h2>

            <div className="space-y-2">
              <button
                onClick={onOpenCreateCourse}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Create New Course Portal</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">New</span>
              </button>

              <button
                onClick={() => onNavigate('grading')}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Grading & Evaluation Center</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Grade</span>
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Audit Trail & Security Logs</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">View log</span>
              </button>
            </div>
          </section>

        </div>
      </div>

    </div>
  );
};

