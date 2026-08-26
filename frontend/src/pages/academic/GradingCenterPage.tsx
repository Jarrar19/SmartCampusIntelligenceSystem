import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Award, Download, Clock, User, 
  CheckCircle, AlertCircle, BookOpen, Plus, Sparkles 
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Submission, Assignment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ListRowSkeleton } from '../../components/common/Skeleton';
import { GradingModal } from '../../components/academic/GradingModal';


interface GradingCenterPageProps {
  onNavigate?: (tab: string, courseId?: number) => void;
}



export const GradingCenterPage: React.FC<GradingCenterPageProps> = ({ onNavigate }) => {
  const { error } = useToast();

  const [submissions, setSubmissions] = useState<Array<{ submission: Submission; assignment: Assignment }>>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ submission: Submission; assignment: Assignment } | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/assignments/faculty/submissions');
      if (res.data.success) {
        setSubmissions(res.data.data);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filtered = submissions.filter((item) => {
    if (filter === 'pending') return item.submission.status !== 'GRADED';
    if (filter === 'graded') return item.submission.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Assignment Grading & Evaluation Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Evaluate student deliverables, assign rubrics and marks, and provide qualitative mentorship feedback.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              filter === 'pending'
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Awaiting Evaluation
          </button>
          <button
            onClick={() => setFilter('graded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              filter === 'graded'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Graded
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              filter === 'all'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Submissions
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      ) : filtered.length === 0 ? (

        <EmptyState
          icon={CheckSquare}
          title={`No ${filter === 'pending' ? 'Pending' : filter === 'graded' ? 'Graded' : ''} Submissions`}
          description={
            filter === 'pending'
              ? "When enrolled students submit deliverables to your course assignments, their submissions will appear here for you to evaluate and grade."
              : "No graded submissions found under this filter."
          }
          actionText={onNavigate ? "Go to Course Management" : undefined}
          onAction={onNavigate ? () => onNavigate('courses') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(({ submission, assignment }) => (
            <div
              key={submission.id}
              className="p-6 rounded-3xl glass-panel glass-panel-hover flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-brand-500" />
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-indigo-50 dark:bg-brand-500/10 px-3 py-1 rounded-xl border border-indigo-100 dark:border-brand-500/20 shadow-2xs">
                    {assignment.course?.courseCode || 'Course'}
                  </span>
                  <span className="text-xs text-slate-900 dark:text-slate-200 font-extrabold">{assignment.title}</span>
                  {submission.status === 'GRADED' ? (
                    <Badge variant="emerald">
                      Graded: {submission.marksAwarded}/{assignment.maxMarks}
                    </Badge>
                  ) : (
                    <Badge variant="amber">Needs Grading</Badge>
                  )}
                  {submission.isLate && <Badge variant="rose">Late</Badge>}
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Student: <strong className="text-slate-800 dark:text-slate-200">{submission.student?.fullName}</strong> ({submission.student?.email})</span>
                  </div>
                  <span>•</span>
                  <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                </div>

                {submission.submissionText && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/40 font-medium">
                    "{submission.submissionText}"
                  </p>
                )}

                {submission.facultyFeedback && (
                  <p className="text-xs text-brand-700 dark:text-indigo-300 font-medium">
                    <strong>Your Feedback:</strong> "{submission.facultyFeedback}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedItem({ submission, assignment })}
                  className="px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/25 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Award className="w-4 h-4" />
                  <span>{submission.status === 'GRADED' ? 'Edit Evaluation' : 'Grade Submission'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <GradingModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={fetchSubmissions}
          submission={selectedItem.submission}
          maxMarks={selectedItem.assignment.maxMarks}
        />
      )}
    </div>
  );
};
