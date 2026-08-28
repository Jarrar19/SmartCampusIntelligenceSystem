import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, FileText, Download, ShieldCheck, Sparkles, X, AlertCircle, Search } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { api, extractErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface StudentMarksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentMarksheetModal: React.FC<StudentMarksheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { error, success } = useToast();
  const [resultData, setResultData] = useState<any>(null);
  const [selectedUsn, setSelectedUsn] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [showManualLookup, setShowManualLookup] = useState(false);

  const fetchResult = async (usn?: string) => {
    setIsLoading(true);
    try {
      const url = usn ? `/results/my-result?usn=${encodeURIComponent(usn)}` : '/results/my-result';
      const res = await api.get(url);
      if (res.data.success) {
        setResultData(res.data.data);
        if (res.data.data.usnNo) setSelectedUsn(res.data.data.usnNo);
      }
    } catch (err) {
      error('Failed to load official exam marksheet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchResult();
    }
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official CAE-I Examination Marksheet"
      subtitle="Institutional Scorecard • Session 2026-27 (ODD)"
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-xs font-black text-slate-700 dark:text-slate-300">
            Auto-detecting your verified credentials & loading scorecard...
          </p>
        </div>
      ) : !resultData ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Result statement not available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-5 text-left">
          
          {/* Automated Student Authentication Status Bar */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <span>Auto-Authenticated:</span>
                  <span className="text-slate-900 dark:text-white">{resultData.studentName}</span>
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  Roll No. / USN: <span className="font-black text-amber-600 dark:text-amber-400">{resultData.usnNo}</span> • Verified Record
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowManualLookup(!showManualLookup)}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <Search className="w-3 h-3" />
              {showManualLookup ? 'Hide Roll No. Switcher' : 'Switch / Search Roll No.'}
            </button>
          </div>

          {/* Optional Manual Roll No. Lookup Bar (Collapsible for Staff or Custom USN Search) */}
          {showManualLookup && (
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in-up">
              <div className="flex items-center space-x-2 flex-1">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">Select Student USN:</span>
                {resultData.allUsns && resultData.allUsns.length > 0 ? (
                  <select
                    value={selectedUsn || resultData.usnNo || ''}
                    onChange={(e) => {
                      setSelectedUsn(e.target.value);
                      fetchResult(e.target.value);
                    }}
                    className="glass-input rounded-xl px-3 py-1 font-black text-xs text-brand-600 dark:text-brand-400 focus:outline-none cursor-pointer flex-1"
                  >
                    {resultData.allUsns.map((u: any) => (
                      <option key={u.usn} value={u.usn}>
                        {u.usn} — {u.studentName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      placeholder="e.g. CM23001"
                      value={selectedUsn || resultData.usnNo || ''}
                      onChange={(e) => setSelectedUsn(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedUsn.trim()) {
                          fetchResult(selectedUsn.trim());
                        }
                      }}
                      className="w-28 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-brand-600 dark:text-brand-400 focus:outline-none"
                    />
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        if (selectedUsn.trim()) fetchResult(selectedUsn.trim());
                      }}
                      leftIcon={<Search className="w-3 h-3" />}
                    >
                      Load
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Institutional Marksheet Header */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white shadow-md border border-brand-700/50 space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  OFFICIAL STATEMENT OF MARKS
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {resultData.institute}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {resultData.department}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED BY HOD
                </span>
              </div>
            </div>

            {/* Student & Exam Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs relative z-10">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Student Name</span>
                <span className="font-black text-white truncate block">{resultData.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">USN / PRN</span>
                <span className="font-black text-amber-300 block">{resultData.usnNo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Examination</span>
                <span className="font-black text-white block">CAE-I (ODD)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Result Status</span>
                <span className="font-black text-emerald-400 block">{resultData.overallGrade}</span>
              </div>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <span>Subject Name & Course Module</span>
              <div className="flex items-center space-x-6">
                <span>Score</span>
                <span>Max</span>
                <span>Status</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white/80 dark:bg-slate-900/60">
              {resultData.subjects.map((sub: any, idx: number) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div className="space-y-0.5 max-w-[240px] sm:max-w-xs">
                    <p className="font-black text-slate-900 dark:text-white truncate">
                      {sub.subjectName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {sub.headerFull}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 font-bold">
                    <span className="text-xs font-black text-slate-900 dark:text-white w-8 text-right">
                      {sub.marksObtained}
                    </span>
                    <span className="text-[11px] text-slate-400 w-8 text-right">
                      / {sub.maxMarks}
                    </span>
                    <span className="w-16 text-right">
                      <Badge
                        variant={sub.status === 'PASS' ? 'emerald' : sub.status === 'ABSENT' ? 'rose' : 'slate'}
                        size="xs"
                      >
                        {sub.status}
                      </Badge>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Footer */}
            <div className="bg-slate-100/90 dark:bg-slate-800/90 px-4 py-3 flex items-center justify-between text-xs font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
              <span>Overall Total & Aggregate Percentage</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                  {resultData.totalObtained} / {resultData.totalMax}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-brand-600 text-white text-xs font-black">
                  {resultData.percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">
              Published by HoD • Department of Emerging Technologies
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Print / Download Statement
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
