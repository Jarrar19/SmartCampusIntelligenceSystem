import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckSquare, Inbox, Users, Plus, FileText, 
  ShieldCheck, ChevronRight, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Course, Resource } from '../../types';
import { CampusHeroCanvas } from '../../components/common/CampusHeroCanvas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatWidgetSkeleton, CardSkeleton, ListRowSkeleton } from '../../components/common/Skeleton';

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
                Faculty Cockpit • {user?.department || 'Engineering'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, <span className="text-gradient">{facultyName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {pendingResources.length > 0 
                ? `You have ${pendingResources.length} student submission${pendingResources.length > 1 ? 's' : ''} awaiting moderation in your academic queue.`
                : `All student uploads and class notices are currently up to date.`}
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
              Review Queue ({pendingResources.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('grading')}
              leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            >
              Grading Center
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Faculty KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Instructed Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.coursesTaughtCount ?? courses.length}</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1">
              <span>Manage portals</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-indigo-800">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('moderation')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Awaiting Review</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pendingModerationCount ?? pendingResources.length}</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <span>Inspect queue</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('grading')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pending Grading</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.pendingSubmissionsToGrade ?? 0}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>Evaluate submissions</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Enrolled Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalStudentsEnrolled ?? 0}</h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
              <span>View rosters</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-indigo-800">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Course Management & Moderation Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* Active Course Portals */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>My Instructed Courses</span>
              </h2>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Manage courses ({courses.length})
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-black text-slate-900 dark:text-white">No courses created yet</p>
                <button
                  onClick={onOpenCreateCourse}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Create your first course portal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                          {course.courseCode}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Sem {course.semester}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                        {course.description || 'No syllabus overview provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{course.enrolledCount ?? 0} students • {course.assignmentsCount ?? 0} tasks</span>
                      <button
                        onClick={() => onNavigate('courses', course.id)}
                        className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-7">
          
          {/* Moderation Snapshot */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-500" />
                <span>Pending Moderation Queue</span>
              </h2>
              <button
                onClick={() => onNavigate('moderation')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View full queue
              </button>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
              {pendingResources.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Moderation Queue Clear</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All student uploads have been verified and approved.</p>
                </div>
              ) : (
                pendingResources.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="amber" size="sm" dot>
                          {r.category}
                        </Badge>
                        <span className="text-[10px] text-slate-400 truncate">
                          By {r.uploader?.fullName || 'Student'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {r.title}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onNavigate('moderation')}
                      className="flex-shrink-0"
                    >
                      Review
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Shortcuts */}
          <section className="space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Faculty Utilities</span>
            </h2>

            <div className="space-y-2.5">
              <button
                onClick={onOpenCreateCourse}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Create New Course Portal</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Publish syllabus and class schedule</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('grading')}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Evaluation & Grading Center</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Grade assignment submissions & provide feedback</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Security & Audit Logs</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Review campus security logs and authentication events</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
