import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Clock, Award, CheckCircle2, 
  AlertCircle, Download, FileText, ArrowRight, Sparkles 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Assignment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ListRowSkeleton } from '../../components/common/Skeleton';
import { SubmissionModal } from '../../components/academic/SubmissionModal';

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const coursesRes = await api.get('/courses?myOnly=true');
      if (coursesRes.data.success) {
        const all: Assignment[] = [];
        for (const course of coursesRes.data.data) {
          try {
            const detailRes = await api.get(`/courses/${course.id}`);
            if (detailRes.data.success && detailRes.data.data.assignments) {
              const courseInfo = { id: course.id, courseCode: course.courseCode, title: course.title, facultyId: course.facultyId };
              const mapped = detailRes.data.data.assignments.map((a: any) => ({
                ...a,
                course: a.course || courseInfo,
              }));
              all.push(...mapped);
            }
          } catch (e) {}
        }
        all.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setAssignments(all);
      }
    } catch (err) {
      error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

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

  const filteredAssignments = assignments.filter((a) => {
    const sub = a.submissions?.[0];
    if (filter === 'pending') return !sub;
    if (filter === 'submitted') return sub && sub.status !== 'GRADED';
    if (filter === 'graded') return sub && sub.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>My Assignments & Course Deliverables</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track coursework deadlines, submit code or reports, and review faculty rubric marks.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'pending', label: 'Pending' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'graded', label: 'Graded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                filter === tab.id
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment List */}
      {isLoading ? (
        <div className="space-y-4">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={
            filter === 'pending'
              ? 'No Pending Deliverables!'
              : filter === 'graded'
              ? 'No Graded Tasks Yet'
              : 'No Assignments Found'
          }
          description={
            filter === 'pending'
              ? 'You have completed and submitted all required course assignments.'
              : 'Assignments for your enrolled courses will appear here.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const status = getDueDateStatus(assignment.dueDate);
            const mySubmission = assignment.submissions?.[0];
            const isSubmitted = !!mySubmission;
            const isGraded = mySubmission?.status === 'GRADED';

            return (
              <div
                key={assignment.id}
                className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-0.5 rounded-xl border border-brand-200 dark:border-brand-800">
                      {assignment.course?.courseCode || 'COURSE'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {assignment.course?.title}
                    </span>
                    <Badge variant={isGraded ? 'emerald' : isSubmitted ? 'indigo' : status.variant} size="xs" dot>
                      {isGraded ? 'Graded & Evaluated' : isSubmitted ? 'Submitted' : status.label}
                    </Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {assignment.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {assignment.description}
                  </p>

                  {/* Feedback block if graded */}
                  {isGraded && mySubmission && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>Marks Awarded: {mySubmission.marksAwarded} / {assignment.maxMarks}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Evaluated by Faculty
                        </span>
                      </div>
                      {mySubmission.facultyFeedback && (
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium pt-1">
                          "{mySubmission.facultyFeedback}"
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center space-x-4 text-xs font-bold text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Deadline: {new Date(assignment.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span>•</span>
                    <span>Max Marks: {assignment.maxMarks}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                  <Button
                    variant={isSubmitted ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    {isSubmitted ? 'View / Resubmit' : 'Submit Deliverable'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <SubmissionModal
          isOpen={true}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
          onSuccess={() => {
            setSelectedAssignment(null);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
};
