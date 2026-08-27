import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Award, Download, Clock, User, 
  CheckCircle, AlertCircle, BookOpen, Plus, Sparkles,
  FileText, Calendar, Edit3, Trash2
} from 'lucide-react';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Submission, Assignment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ListRowSkeleton } from '../../components/common/Skeleton';
import { GradingModal } from '../../components/academic/GradingModal';
import { CreateAssignmentModal } from '../../components/academic/CreateAssignmentModal';
import { EditAssignmentModal } from '../../components/academic/EditAssignmentModal';

interface GradingCenterPageProps {
  onNavigate?: (tab: string, courseId?: number) => void;
}

export const GradingCenterPage: React.FC<GradingCenterPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();

  const [mainView, setMainView] = useState<'submissions' | 'assignments'>('submissions');
  const [submissions, setSubmissions] = useState<Array<{ submission: Submission; assignment: Assignment }>>([]);
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ submission: Submission; assignment: Assignment } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

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

  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        const allAssignments: Assignment[] = [];
        res.data.data.forEach((course: any) => {
          if (course.assignments) {
            course.assignments.forEach((a: Assignment) => {
              allAssignments.push({
                ...a,
                courseCode: course.courseCode,
                courseTitle: course.title,
              });
            });
          }
        });
        setAssignmentsList(allAssignments);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchAssignments();
  }, []);

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await api.delete(`/assignments/${assignmentId}`);
      if (res.data.success) {
        success('Assignment deleted successfully!');
        fetchAssignments();
        fetchSubmissions();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#ECFDF5] tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>Assignment Grading & Evaluation Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3A8] mt-1">
            Create coursework tasks with time-limited deadlines, evaluate student submissions, and update due dates anytime.
          </p>
        </div>

        {/* Action Button: Create New Assignment */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
        >
          Create New Assignment
        </Button>
      </div>

      {/* Navigation View Switcher (Submissions vs Assignments) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-2 bg-[#0B2921]/80 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setMainView('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              mainView === 'submissions'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                : 'text-[#94A3A8] hover:text-[#ECFDF5]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Student Submissions ({submissions.length})</span>
          </button>
          <button
            onClick={() => setMainView('assignments')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              mainView === 'assignments'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                : 'text-[#94A3A8] hover:text-[#ECFDF5]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Published Assignments & Deadlines ({assignmentsList.length})</span>
          </button>
        </div>

        {/* Filter Tabs for Submissions view */}
        {mainView === 'submissions' && (
          <div className="flex items-center space-x-1 bg-[#0B2921]/80 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-[#94A3A8] hover:text-[#ECFDF5]'
              }`}
            >
              Awaiting Grade
            </button>
            <button
              onClick={() => setFilter('graded')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filter === 'graded'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#94A3A8] hover:text-[#ECFDF5]'
              }`}
            >
              Graded
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white/15 text-[#ECFDF5] shadow-xs'
                  : 'text-[#94A3A8] hover:text-[#ECFDF5]'
              }`}
            >
              All
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: Submissions List */}
      {mainView === 'submissions' && (
        isLoading ? (
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
                  className="p-6 rounded-3xl glass-panel border border-white/12 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 backdrop-blur-2xl"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <Badge variant={isGraded ? 'emerald' : 'amber'} size="xs" dot>
                        {isGraded ? `Graded: ${submission.marksAwarded}/${assignment.maxMarks}` : 'Awaiting Grade'}
                      </Badge>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                        {assignment.course?.courseCode || 'COURSE'}
                      </span>
                      <span className="text-xs font-bold text-[#ECFDF5]">
                        {assignment.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 pt-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                        {submission.student?.fullName.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-[#ECFDF5]">
                          {submission.student?.fullName || 'Student'}
                        </h4>
                        <p className="text-[10px] text-[#94A3A8]">
                          {submission.student?.department || 'Student'} • Sem {submission.student?.semester || 6} • Submitted {new Date(submission.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {submission.submissionText && (
                      <p className="text-xs text-[#ECFDF5]/90 bg-[#0B2921]/70 p-3 rounded-2xl border border-white/10 font-medium">
                        "{submission.submissionText}"
                      </p>
                    )}

                    {isGraded && submission.facultyFeedback && (
                      <p className="text-xs text-emerald-300 bg-emerald-950/50 p-3 rounded-2xl border border-emerald-500/40 font-medium">
                        Feedback: "{submission.facultyFeedback}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                    {submission.filePath && (
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleDownloadFile(submission.id, submission.fileName || 'submission.pdf')}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        className="bg-white/10 text-[#ECFDF5] border border-white/15"
                      >
                        Download File
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedItem({ submission, assignment })}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                      className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
                    >
                      {isGraded ? 'Update Grade' : 'Grade Submission'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW 2: Manage Assignments & Due Dates */}
      {mainView === 'assignments' && (
        isLoadingAssignments ? (
          <div className="space-y-3">
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        ) : assignmentsList.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Assignments Published Yet"
            description="Create your first assignment with a time-limited due date to issue coursework to your enrolled students."
            actionText="Create Assignment"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignmentsList.map((asgn) => {
              const dueDateObj = new Date(asgn.dueDate);
              const now = new Date();
              const isExpired = now > dueDateObj;
              const diffHours = Math.round((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60));
              const diffDays = Math.floor(diffHours / 24);

              return (
                <div
                  key={asgn.id}
                  className="p-6 rounded-3xl glass-panel border border-white/12 shadow-xl flex flex-col justify-between space-y-4 backdrop-blur-2xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30">
                        {asgn.courseCode || 'COURSE'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${
                        isExpired 
                          ? 'bg-rose-950/80 text-rose-400 border-rose-500/30'
                          : 'bg-teal-950/80 text-teal-300 border-teal-500/30'
                      }`}>
                        {isExpired 
                          ? '🔴 Deadline Expired' 
                          : diffDays > 0 
                            ? `🟢 ${diffDays} day${diffDays > 1 ? 's' : ''} remaining`
                            : `🟡 ${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-[#ECFDF5]">
                      {asgn.title}
                    </h3>

                    <p className="text-xs text-[#94A3A8] line-clamp-3 leading-relaxed">
                      {asgn.description}
                    </p>

                    <div className="p-3 rounded-2xl bg-[#0B2921]/80 border border-white/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[#94A3A8]">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" /> Time-Limited Deadline:
                        </span>
                        <span className="font-black text-[#ECFDF5]">
                          {dueDateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dueDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#94A3A8]">
                        <span className="font-bold">Max Marks:</span>
                        <span className="font-black text-[#ECFDF5]">{asgn.maxMarks} Marks</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit Due Date & Delete */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
                    <Button
                      variant="glass"
                      size="xs"
                      onClick={() => setEditingAssignment(asgn)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      className="bg-white/10 hover:bg-white/20 text-[#ECFDF5] border border-white/15"
                    >
                      Edit Due Date & Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDeleteAssignment(asgn.id)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-rose-400 hover:bg-rose-950/40"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
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

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchAssignments();
          fetchSubmissions();
        }}
      />

      {/* Edit Assignment & Due Date Modal */}
      {editingAssignment && (
        <EditAssignmentModal
          isOpen={true}
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSuccess={() => {
            setEditingAssignment(null);
            fetchAssignments();
            fetchSubmissions();
          }}
        />
      )}
    </div>
  );
};

