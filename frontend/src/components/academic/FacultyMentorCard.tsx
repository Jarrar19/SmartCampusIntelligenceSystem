import React from 'react';
import { UserCheck, MessageSquare, Calendar, ShieldCheck, Mail, Sparkles, ChevronRight } from 'lucide-react';
import { User } from '../../types';
import { Button } from '../common/Button';

interface FacultyMentorCardProps {
  user: User;
  onOpenChat?: (mentorName: string) => void;
}

export const FacultyMentorCard: React.FC<FacultyMentorCardProps> = ({ user, onOpenChat }) => {
  const mentorName = user.tgMentorName || 'Prof. Sarah Jenkins';
  const mentorDept = user.department || 'Artificial Intelligence & Machine Learning';

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header Tag */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Teacher Guardian (TG) Mentor
          </span>
          <span className="text-xs font-bold text-slate-400">
            Term 2026–27
          </span>
        </div>

        {/* Mentor Info */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
            {mentorName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {mentorName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Academic Advisor • {mentorDept}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                ● Office Hours: Tue/Thu 3–5 PM
              </span>
            </div>
          </div>
        </div>

        {/* Description / Advising note */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          Your designated Teacher Guardian oversees your academic standing, project milestones, and career mentoring throughout the academic session.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5 flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenChat?.(mentorName)}
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          Message Mentor
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(`mailto:faculty1@sbjit.edu.in?subject=TG Advising Request - PRN ${user.prn || ''}`)}
          leftIcon={<Mail className="w-3.5 h-3.5" />}
        >
          Email
        </Button>
      </div>
    </div>
  );
};
