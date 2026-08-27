import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckSquare, FileText, ShoppingBag, 
  Clock, Upload, Plus, AlertCircle, ShieldCheck, ArrowRight,
  Sparkles, CheckCircle2, ChevronRight, Award, Calendar, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Course, Assignment, MarketplaceProduct } from '../../types';
import { CampusHeroCanvas } from '../../components/common/CampusHeroCanvas';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatWidgetSkeleton, CardSkeleton, ListRowSkeleton } from '../../components/common/Skeleton';
import { SubmissionModal } from '../../components/academic/SubmissionModal';
import { ProductDetailModal } from '../../components/marketplace/ProductDetailModal';
import { CgpaProgressionChart } from '../../components/academic/CgpaProgressionChart';
import { FacultyMentorCard } from '../../components/academic/FacultyMentorCard';

interface StudentDashboardProps {
  onNavigate: (tab: string, courseId?: number) => void;
  onOpenUploadResource: () => void;
  onOpenCreateProduct: () => void;
  onOpenChat?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenUploadResource,
  onOpenCreateProduct,
  onOpenChat,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected modals
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [viewingProduct, setViewingProduct] = useState<MarketplaceProduct | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, coursesRes, productsRes] = await Promise.all([
        api.get('/users/dashboard-stats').catch(() => ({ data: { success: false, data: {} } })),
        api.get('/courses?myOnly=true').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/marketplace/products?limit=4').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (productsRes.data.success) setMarketplaceProducts(productsRes.data.data.slice(0, 4));

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
  };

  useEffect(() => {
    fetchDashboardData();
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

  const pendingAssignmentsCount = assignments.filter(a => !a.submissions || a.submissions.length === 0).length;

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
              {user?.prn && (
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  PRN: {user.prn}
                </span>
              )}
              {user?.sem1Cgpa && (
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  CGPA: {user.sem1Cgpa.toFixed(2)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, <span className="text-gradient">{firstName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {pendingAssignmentsCount > 0 
                ? `You have ${pendingAssignmentsCount} pending course deliverable${pendingAssignmentsCount > 1 ? 's' : ''} on your timeline. Stay on track!`
                : 'All your academic submissions are currently up to date. Explore peer study notes or the campus market!'}
            </p>
          </div>

          {/* Quick Action Shortcuts with Tricolor Accents */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="saffron"
              size="sm"
              onClick={onOpenUploadResource}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Upload Notes
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={onOpenCreateProduct}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              List Item
            </Button>
            <Button
              variant="navy"
              size="sm"
              onClick={() => onNavigate('courses')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              My Courses
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Metric Stat Cards with Tricolor Theme Harmony */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enrolled Courses - Chakra Navy */}
        <div 
          onClick={() => onNavigate('courses')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Enrolled Courses</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {enrolledCourses.length || stats.enrolledCoursesCount || 0}
            </span>
            <Badge variant="navy" size="xs">Active</Badge>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Current Academic Term
          </p>
        </div>

        {/* Pending Assignments - Saffron */}
        <div 
          onClick={() => onNavigate('assignments')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Tasks</span>
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {pendingAssignmentsCount}
            </span>
            <Badge variant={pendingAssignmentsCount > 0 ? 'saffron' : 'emerald'} size="xs" dot>
              {pendingAssignmentsCount > 0 ? 'Action Req' : 'Clear'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Due across your courses
          </p>
        </div>

        {/* Available Notes & PYQs - India Green */}
        <div 
          onClick={() => onNavigate('resources')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Notes & PYQs</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.resourcesCount || '140+'}
            </span>
            <Badge variant="emerald" size="xs">Verified</Badge>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Faculty moderated catalog
          </p>
        </div>

        {/* Marketplace Listings - Clean White/Slate with Chakra Blue badge */}
        <div 
          onClick={() => onNavigate('marketplace')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-200 dark:border-slate-800 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Campus Marketplace</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.activeListingsCount || marketplaceProducts.length || '65+'}
            </span>
            <Badge variant="tricolor" size="xs">₹0 Exchange</Badge>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
            Peer student circular market
          </p>
        </div>

      </div>

      {/* 2.5. Academic Intelligence & CGPA Trajectory Curve */}
      {user && <CgpaProgressionChart user={user} />}

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Deadlines Timeline & Enrolled Courses (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Assignment Timeline Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Deliverables & Due Dates Timeline
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Priority ordered course deadlines
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No upcoming assignments due at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const status = getDueDateStatus(assignment.dueDate);
                  const isSubmitted = assignment.submissions && assignment.submissions.length > 0;
                  const submission = isSubmitted ? assignment.submissions![0] : null;

                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-300 dark:hover:border-brand-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800/80">
                            {assignment.course?.courseCode || 'COURSE'}
                          </span>
                          <Badge variant={isSubmitted ? 'emerald' : status.variant} size="xs" dot>
                            {isSubmitted ? (submission?.status === 'GRADED' ? `Graded (${submission.marksAwarded}/${assignment.maxMarks})` : 'Submitted') : status.label}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-bold">
                            Max: {assignment.maxMarks} Marks
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                          {assignment.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {assignment.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                        <Button
                          variant={isSubmitted ? 'outline' : 'primary'}
                          size="xs"
                          onClick={() => setSubmittingAssignment(assignment)}
                        >
                          {isSubmitted ? 'View / Resubmit' : 'Submit Task'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enrolled Courses Grid */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    My Enrolled Academic Courses
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Access stream discussions, lecture resources, and marks
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>All Courses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No course enrollments found.</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">Browse the catalog to join your academic classes.</p>
                <Button variant="primary" size="xs" onClick={() => onNavigate('courses')}>
                  Explore Catalog
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {enrolledCourses.map((course) => (
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
                      Faculty: {course.faculty?.fullName || 'Faculty Instructor'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>{course.assignmentsCount || 0} Tasks • {course.resourcesCount || 0} Docs</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Faculty Mentor (TG) & Quick Actions & Marketplace (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Teacher Guardian (TG) Mentor Card */}
          {user && <FacultyMentorCard user={user} onOpenChat={onOpenChat} />}

          {/* Quick Actions Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 bg-gradient-to-br from-indigo-500/5 via-transparent to-brand-500/5">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Campus Quick Actions
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenUploadResource}
                className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 text-left transition cursor-pointer group shadow-2xs"
              >
                <Upload className="w-4 h-4 text-brand-600 dark:text-brand-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-900 dark:text-white">Upload Notes</p>
                <p className="text-[10px] text-slate-500">Share study materials</p>
              </button>

              <button
                onClick={onOpenCreateProduct}
                className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 text-left transition cursor-pointer group shadow-2xs"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black text-slate-900 dark:text-white">Sell Item</p>
                <p className="text-[10px] text-slate-500">Books & equipment</p>
              </button>
            </div>
          </div>

          {/* Marketplace Highlights Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Marketplace Highlights
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Verified student deals on campus
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('marketplace')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Browse</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {marketplaceProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <p className="text-xs font-bold">No active marketplace listings.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {marketplaceProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => setViewingProduct(prod)}
                    className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-500 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {prod.price === 0 ? 'FREE' : `₹${prod.price}`}
                        </span>
                        <Badge variant="slate" size="xs">
                          {prod.category}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {prod.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {prod.seller?.fullName || 'Student'} • {prod.condition}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Modals for direct interaction */}
      {submittingAssignment && (
        <SubmissionModal
          isOpen={true}
          onClose={() => setSubmittingAssignment(null)}
          assignment={submittingAssignment}
          onSuccess={() => {
            setSubmittingAssignment(null);
            fetchDashboardData();
          }}
        />
      )}

      {viewingProduct && (
        <ProductDetailModal
          isOpen={true}
          onClose={() => setViewingProduct(null)}
          product={viewingProduct}
          onRefresh={() => fetchDashboardData()}
        />
      )}
    </div>
  );
};
