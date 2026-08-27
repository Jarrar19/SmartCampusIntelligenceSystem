import React from 'react';
import { UserCheck, MessageSquare, Mail } from 'lucide-react';
import { User } from '../../types';
import { Button } from '../common/Button';

interface FacultyMentorCardProps {
  user: User;
  onOpenChat?: (mentorName?: string) => void;
}

export const FacultyMentorCard: React.FC<FacultyMentorCardProps> = ({ user, onOpenChat }) => {
  const mentorName = user.tgMentorName || 'Prof. Bhushan Manjrekar';
  const mentorDept = user.department || 'Artificial Intelligence & Machine Learning';
  const mentorEmail = 'bhushanmanjrekar@sbjit.edu.in';

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-white/12 space-y-5 shadow-xl relative overflow-hidden flex flex-col justify-between backdrop-blur-2xl">
      <div className="space-y-4">
        {/* Header Tag */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <UserCheck className="w-3.5 h-3.5" /> Teacher Guardian (TG) Mentor
          </span>
          <span className="text-xs font-bold text-[#94A3A8]">
            Term 2026–27
          </span>
        </div>

        {/* Mentor Info */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0 border border-emerald-400/30">
            {mentorName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-base font-black text-[#ECFDF5] leading-tight">
              {mentorName}
            </h4>
            <p className="text-xs text-[#94A3A8] font-medium">
              Academic Advisor • {mentorDept}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                ● Office Hours: Tue/Thu 3–5 PM
              </span>
            </div>
          </div>
        </div>

        {/* Description / Advising note */}
        <p className="text-xs text-[#94A3A8] leading-relaxed font-medium">
          Your designated Teacher Guardian oversees your academic standing, project milestones, and career mentoring throughout the academic session.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-white/10 flex items-center gap-2.5 flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenChat?.(mentorName)}
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
        >
          Message Mentor
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => window.open(`mailto:${mentorEmail}?subject=TG Advising Request - PRN ${user.prn || ''}`)}
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          className="bg-white/10 hover:bg-white/20 text-[#ECFDF5] border border-white/15 backdrop-blur-md"
        >
          Email
        </Button>
      </div>
    </div>
  );
};

