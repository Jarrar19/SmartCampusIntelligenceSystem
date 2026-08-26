import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckSquare, FileText, ShoppingBag, 
  Clock, Upload, Plus, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Course, Assignment, MarketplaceProduct } from '../../types';

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

    if (diffHours < 0) return { label: 'Past due', isUrgent: true };
    if (diffHours <= 24) return { label: 'Due today', isUrgent: true };
    if (diffHours <= 72) return { label: 'Due soon', isUrgent: false };
    return { label: `Due ${new Date(dueDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, isUrgent: false };
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Student';

  return (
    <div className="space-y-7 text-slate-900 dark:text-slate-100 max-w-[1400px] mx-auto pb-10">
      
      {/* 1. Calm, Student-Centered Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {formattedDate} • Semester {user?.semester || 6} ({user?.department || 'Engineering'})
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-normal">
            {assignments.length > 0 
              ? `You have ${assignments.length} task${assignments.length > 1 ? 's' : ''} coming up.` 
              : `You are all caught up on your coursework for today.`}
          </p>
        </div>

        {/* Quiet Quick Action Links */}
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <button
            onClick={onOpenUploadResource}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Upload Notes</span>
          </button>
          <button
            onClick={onOpenCreateProduct}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>List Item</span>
          </button>
        </div>
      </div>

      {/* 2. Reworked Contextual Summary Bar (Bordered inline indicators instead of floating equal KPI cards) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium py-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{stats.enrolledCoursesCount ?? enrolledCourses.length}</span>
          <span>Enrolled Courses</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{assignments.length}</span>
          <span>Tasks Due Soon</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{stats.myResourcesCount ?? 0}</span>
          <span>Shared Notes</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white">{marketplaceProducts.length}</span>
          <span>Campus Market Items</span>
        </div>
      </div>

      {/* 3. Asymmetric 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-1">
        
        {/* Left Column (Main Academic Focus: 7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section: Needs Attention / Priority Deadlines */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Needs Attention
              </h2>
              {assignments.length > 0 && (
                <button
                  onClick={() => onNavigate('assignments')}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  View all tasks
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs">
                No tasks due right now. You are all caught up!
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignments.map((a) => {
                  const status = getDueDateStatus(a.dueDate);
                  return (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {a.course?.courseCode || 'Task'}
                          </span>
                          <span className={`text-[11px] font-medium ${status.isUrgent ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {a.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Due {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Max {a.maxMarks} marks
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('assignments')}
                        className="flex-shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-1 cursor-pointer"
                      >
                        View task
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section: Your Courses */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Courses
              </h2>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Browse catalog
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs">
                You are not enrolled in any courses yet. <button onClick={() => onNavigate('courses')} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer">Explore available courses</button>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {enrolledCourses.map((course) => {
                  const taskCount = course.assignmentsCount ?? 0;
                  const progressPct = taskCount > 0 ? Math.min(100, Math.max(35, 100 - taskCount * 15)) : 100;

                  return (
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {course.faculty?.fullName || 'Faculty Member'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Course progress</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-[11px] text-slate-400">
                            {taskCount} task{taskCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => onNavigate('courses', course.id)}
                            className="font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                          >
                            Open course
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

        {/* Right Column (Secondary Focus: 5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section: What's Happening (Replaces AI "Smart Insights") */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              What's Happening
            </h2>

            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              {assignments.length > 0 && (
                <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                    Upcoming Deadline
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {assignments[0].title} ({assignments[0].course?.courseCode})
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Due {new Date(assignments[0].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <button
                    onClick={() => onNavigate('assignments')}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-0.5 inline-block cursor-pointer"
                  >
                    View assignments
                  </button>
                </div>
              )}

              <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Academic Materials
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {enrolledCourses.length} active courses for Semester {user?.semester || 6}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Access lecture notes, syllabus breakdown and past year questions.
                </p>
                <button
                  onClick={() => onNavigate('resources')}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-0.5 inline-block cursor-pointer"
                >
                  Browse notes & PYQs
                </button>
              </div>

              {marketplaceProducts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Campus Marketplace
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {marketplaceProducts.length} new items listed recently by students
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Textbooks, lab coats and tools traded directly on campus.
                  </p>
                  <button
                    onClick={() => onNavigate('marketplace')}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-0.5 inline-block cursor-pointer"
                  >
                    Browse marketplace
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Section: Quick Access Tools */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <button
                onClick={onOpenUploadResource}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Upload Notes or PYQ</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Upload</span>
              </button>

              <button
                onClick={onOpenCreateProduct}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">List Item in Campus Market</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">List item</span>
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className="w-full p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Security & Audit Activity</span>
                </div>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">View log</span>
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* 4. Full-Width Horizontal Section: Campus Marketplace */}
      <section className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Campus Marketplace
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Student-to-student textbook and gear listings
            </p>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
          >
            View marketplace
          </button>
        </div>

        {marketplaceProducts.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs">
            No marketplace items listed yet. <button onClick={onOpenCreateProduct} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer">List an item for sale</button>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {marketplaceProducts.map((product) => (
              <div
                key={product.id}
                className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{product.price}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {product.description || 'No description.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Seller: {product.seller?.fullName?.split(' ')[0] || 'Student'}</span>
                  <button
                    onClick={() => onNavigate('marketplace')}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    View item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

