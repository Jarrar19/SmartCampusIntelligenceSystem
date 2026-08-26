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
import { EmptyState } from '../../components/common/EmptyState';
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

  const filteredAssignments = assignments.filter((a) => {
    const sub = a.submissions?.[0];
    if (filter === 'pending') return !sub;
    if (filter === 'submitted') return sub && sub.status !== 'GRADED';
    if (filter === 'graded') return sub && sub.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
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

      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Assignments Found"
          description="You're all caught up! No assignments found under this filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssignments.map((a) => {
            const sub = a.submissions?.[0];
            const isPastDue = new Date() > new Date(a.dueDate);

            return (
              <div
                key={a.id}
                className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 to-indigo-500" />
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-indigo-50 dark:bg-brand-500/10 px-3 py-1 rounded-xl border border-indigo-100 dark:border-brand-500/20 shadow-2xs">
                      {a.course?.courseCode || 'Course Task'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Max Marks: {a.maxMarks}
                    </span>
                    {sub ? (
                      sub.status === 'GRADED' ? (
                        <Badge variant="emerald">
                          Graded: {sub.marksAwarded}/{a.maxMarks}
                        </Badge>
                      ) : (
                        <Badge variant="blue">Submitted (Awaiting Grade)</Badge>
                      )
                    ) : isPastDue ? (
                      <Badge variant="rose">Past Deadline</Badge>
                    ) : (
                      <Badge variant="amber">Due Soon</Badge>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white">{a.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl whitespace-pre-wrap font-medium">
                    {a.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 font-semibold">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(a.dueDate).toLocaleDateString()} at {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {sub && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()} {sub.isLate ? '(Late)' : ''}
                      </span>
                    )}
                  </div>

                  {sub?.facultyFeedback && (
                    <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-300 text-xs mt-2 shadow-2xs">
                      <p className="font-extrabold flex items-center gap-1.5 mb-1 text-brand-700 dark:text-brand-300">
                        <Award className="w-4 h-4 text-brand-600 dark:text-indigo-400" />
                        <span>Faculty Evaluation Feedback:</span>
                      </p>
                      <p className="italic text-slate-700 dark:text-slate-200 font-medium">"{sub.facultyFeedback}"</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer shadow-sm active:scale-95 ${
                      sub
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        : 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/25'
                    }`}
                  >
                    {sub ? 'View / Update' : 'Turn In Work'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAssignment && (
        <SubmissionModal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={fetchAssignments}
          assignment={selectedAssignment}
          existingSubmission={selectedAssignment.submissions?.[0]}
        />
      )}
    </div>
  );
};
