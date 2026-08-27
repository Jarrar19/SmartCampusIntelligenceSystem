import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Award, Download, Clock, User, 
  CheckCircle, AlertCircle, BookOpen, Plus, Sparkles,
  FileText
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Submission, Assignment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ListRowSkeleton } from '../../components/common/Skeleton';
import { GradingModal } from '../../components/academic/GradingModal';

interface GradingCenterPageProps {
  onNavigate?: (tab: string, courseId?: number) => void;
}

export const GradingCenterPage: React.FC<GradingCenterPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();

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

  const handleDownloadFile = async (submissionId: number, fileName: string) => {
    try {
      const response = await api.get(`/assignments/submissions/${submissionId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'submission.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success(`Downloading ${fileName}`);
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Download failed');
      error(msg);
    }
  };

  const filtered = submissions.filter((item) => {
    if (filter === 'pending') return item.submission.status !== 'GRADED';
    if (filter === 'graded') return item.submission.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Awaiting Evaluation
          </button>
          <button
            onClick={() => setFilter('graded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
              filter === 'graded'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Graded
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
              filter === 'all'
                ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Submissions
          </button>
        </div>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="space-y-3">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={
            filter === 'pending'
              ? 'All Student Submissions Graded!'
              : 'No Submissions Found'
          }
          description="Student submissions for your course assignments will appear here for rubric evaluation."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(({ submission, assignment }) => {
            const isGraded = submission.status === 'GRADED';

            return (
              <div
                key={submission.id}
                className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Badge variant={isGraded ? 'emerald' : 'amber'} size="xs" dot>
                      {isGraded ? `Graded: ${submission.marksAwarded}/${assignment.maxMarks}` : 'Awaiting Grade'}
                    </Badge>
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800">
                      {assignment.course?.courseCode || 'COURSE'}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {assignment.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 font-black text-xs flex items-center justify-center">
                      {submission.student?.fullName.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {submission.student?.fullName || 'Student'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {submission.student?.department || 'Student'} • Sem {submission.student?.semester || 6} • Submitted {new Date(submission.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {submission.submissionText && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 font-medium">
                      "{submission.submissionText}"
                    </p>
                  )}

                  {isGraded && submission.facultyFeedback && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 font-medium">
                      Feedback: "{submission.facultyFeedback}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                  {submission.filePath && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadFile(submission.id, submission.fileName || 'submission.pdf')}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download File
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedItem({ submission, assignment })}
                    leftIcon={<Award className="w-3.5 h-3.5" />}
                  >
                    {isGraded ? 'Update Grade' : 'Grade Submission'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading Modal */}
      {selectedItem && (
        <GradingModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          submission={selectedItem.submission}
          assignment={selectedItem.assignment}
          onSuccess={() => {
            setSelectedItem(null);
            fetchSubmissions();
          }}
        />
      )}
    </div>
  );
};
