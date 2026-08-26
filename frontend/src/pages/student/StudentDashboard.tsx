import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckSquare, FileText, ShoppingBag, 
  Clock, Upload, Plus, AlertCircle, ShieldCheck, ArrowRight,
  Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Course, Assignment, MarketplaceProduct } from '../../types';
import { CampusHeroCanvas } from '../../components/common/CampusHeroCanvas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CardSkeleton, StatWidgetSkeleton, ListRowSkeleton } from '../../components/common/Skeleton';

interface StudentDashboardProps {
  onNavigate: (tab: string, courseId?: number) => void;
  onOpenUploadResource: () => void;
  onOpenCreateProduct: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenUploadResource,
  onOpenCreateProduct,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, coursesRes, productsRes] = await Promise.all([
          api.get('/users/dashboard-stats').catch(() => ({ data: { success: false, data: {} } })),
          api.get('/courses?myOnly=true').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/marketplace/products?limit=3').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (productsRes.data.success) setMarketplaceProducts(productsRes.data.data.slice(0, 3));

        if (coursesRes.data.success) {
          const coursesList = coursesRes.data.data;
          setEnrolledCourses(coursesList);

          const allAssignments: Assignment[] = [];
          for (const course of coursesList) {
            try {
              const detailRes = await api.get(`/courses/${course.id}`);
              if (detailRes.data.success && detailRes.data.data.assignments) {
                const courseInfo = { id: course.id, courseCode: course.courseCode, title: course.title, facultyId: course.facultyId };
                const mapped = detailRes.data.data.assignments.map((a: any) => ({
                  ...a,
                  course: a.course || courseInfo,
                }));
                allAssignments.push(...mapped);
              }
            } catch (e) {}
          }
          // Sort chronologically by due date
          allAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          setAssignments(allAssignments.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
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

  const getDueDateStatus = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime();
    const now = new Date().getTime();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) return { label: 'Past due', variant: 'rose' as const };
    if (diffHours <= 24) return { label: 'Due today', variant: 'rose' as const };
    if (diffHours <= 72) return { label: 'Due soon', variant: 'amber' as const };
    return { 
      label: `Due ${new Date(dueDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, 
      variant: 'indigo' as const 
    };
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Student';

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
      
      {/* 1. Hero Banner with Ambient Geometry Canvas */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <CampusHeroCanvas />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                {formattedDate}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Semester {user?.semester || 6} • {user?.department || 'Engineering'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, <span className="text-gradient">{firstName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {assignments.length > 0 
                ? `You have ${assignments.length} task${assignments.length > 1 ? 's' : ''} scheduled on your academic calendar.` 
                : `You're all caught up on your coursework for today. Explore notes and PYQs below.`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenUploadResource}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload Notes
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCreateProduct}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              List Item
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Enrolled Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.enrolledCoursesCount ?? enrolledCourses.length}</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1">
              <span>View catalog</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 border border-indigo-100 dark:border-indigo-800">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('assignments')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Tasks Due</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{assignments.length}</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <span>View submissions</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('resources')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Shared Notes</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.myResourcesCount ?? 0}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>Explore hub</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('marketplace')}
          className="p-5 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 cursor-pointer flex items-center justify-between shadow-2xs"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Marketplace</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{marketplaceProducts.length}</h3>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <span>Browse items</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Tasks & Course Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* Upcoming Tasks Section */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Upcoming Coursework Tasks</span>
              </h2>
              {assignments.length > 0 && (
                <button
                  onClick={() => onNavigate('assignments')}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  View all ({assignments.length})
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-black text-slate-900 dark:text-white">All Caught Up!</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No assignments due right now. Enjoy your free time or explore study materials.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const status = getDueDateStatus(a.dueDate);
                  return (
                    <div
                      key={a.id}
                      className="p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 transition shadow-2xs"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                            {a.course?.courseCode || 'Coursework'}
                          </span>
                          <Badge variant={status.variant} size="sm" dot>
                            {status.label}
                          </Badge>
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                          {a.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Max {a.maxMarks} marks
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onNavigate('assignments')}
                        className="flex-shrink-0"
                      >
                        Submit
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Enrolled Courses Grid */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>My Active Courses</span>
              </h2>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Browse catalog
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-black text-slate-900 dark:text-white">Not enrolled in any courses yet</p>
                <button
                  onClick={() => onNavigate('courses')}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Join your first course hub
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrolledCourses.map((course) => {
                  const taskCount = course.assignmentsCount ?? 0;
                  const progressPct = taskCount > 0 ? Math.min(100, Math.max(35, 100 - taskCount * 15)) : 100;

                  return (
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
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {course.faculty?.fullName || 'Faculty Member'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                          <span>Progress</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {taskCount} assignment{taskCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => onNavigate('courses', course.id)}
                            className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Open Hub</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-7">
          
          {/* Quick Access Tools */}
          <section className="space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Campus Shortcuts</span>
            </h2>

            <div className="space-y-2.5">
              <button
                onClick={onOpenUploadResource}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Upload Notes & PYQs</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Contribute study materials to academic hub</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onOpenCreateProduct}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">List Item for Sale</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sell textbooks, uniforms, and campus gear</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className="w-full p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">Security & Audit Log</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Inspect login history and session audit trail</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </section>

          {/* Campus Marketplace Spotlight */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-rose-500" />
                <span>Marketplace Spotlight</span>
              </h2>
              <button
                onClick={() => onNavigate('marketplace')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {marketplaceProducts.length === 0 ? (
              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-black text-slate-900 dark:text-white">No active listings</p>
                <p className="text-[11px] text-slate-500">Be the first to list an item for your peers.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {marketplaceProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onNavigate('marketplace')}
                    className="p-4 rounded-3xl glass-panel glass-panel-hover border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 cursor-pointer shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="rose" size="sm">
                          {prod.category}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400">
                          {prod.condition}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {prod.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        Seller: {prod.seller?.fullName?.split(' ')[0] || 'Student'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        ₹{prod.price}
                      </p>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                        Inspect
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};
