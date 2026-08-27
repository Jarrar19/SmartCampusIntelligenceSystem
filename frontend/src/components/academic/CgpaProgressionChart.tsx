import React, { useState } from 'react';
import { TrendingUp, Award, CheckCircle, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { User } from '../../types';

interface CgpaProgressionChartProps {
  user: User;
}

export const CgpaProgressionChart: React.FC<CgpaProgressionChartProps> = ({ user }) => {
  const semestersData = [
    { sem: 'Sem 1', gpa: user.sem1Cgpa ?? null },
    { sem: 'Sem 2', gpa: user.sem2Cgpa ?? null },
    { sem: 'Sem 3', gpa: user.sem3Cgpa ?? null },
    { sem: 'Sem 4', gpa: user.sem4Cgpa ?? null },
    { sem: 'Sem 5', gpa: user.sem5Cgpa ?? null },
    { sem: 'Sem 6', gpa: user.sem6Cgpa ?? null },
  ].filter(d => d.gpa !== null) as { sem: string; gpa: number }[];

  const [hoveredPoint, setHoveredPoint] = useState<{ sem: string; gpa: number } | null>(null);

  if (semestersData.length === 0) {
    return null;
  }

  const latestGpa = semestersData[semestersData.length - 1]?.gpa || 0;
  const prevGpa = semestersData.length > 1 ? semestersData[semestersData.length - 2]?.gpa : latestGpa;
  const growthDelta = latestGpa - (prevGpa || latestGpa);

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 50;
  const paddingY = 30;

  const minGpa = 4.0;
  const maxGpa = 10.0;

  const points = semestersData.map((d, index) => {
    const x = paddingX + (index / Math.max(1, semestersData.length - 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - ((d.gpa - minGpa) / (maxGpa - minGpa)) * (svgHeight - 2 * paddingY);
    return { ...d, x, y };
  });

  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Academic Performance & CGPA Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Semester-by-semester academic progression curve recorded in institutional master records.
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-2xl bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-left">
            <div className="text-[10px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400">Current CGPA</div>
            <div className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              {latestGpa.toFixed(2)}
              {growthDelta !== 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                  growthDelta >= 0 ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80' : 'text-rose-600 bg-rose-100 dark:bg-rose-950/80'
                }`}>
                  {growthDelta >= 0 ? `+${growthDelta.toFixed(2)}` : growthDelta.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {user.tenthPercentage && (
            <div className="px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">10th Grade</div>
              <div className="text-xs font-black text-slate-700 dark:text-slate-200">{user.tenthPercentage}%</div>
            </div>
          )}

          {user.twelfthPercentage && (
            <div className="px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">12th Grade</div>
              <div className="text-xs font-black text-slate-700 dark:text-slate-200">{user.twelfthPercentage}%</div>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-48 overflow-visible"
        >
          <defs>
            <linearGradient id="cgpaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[5, 6, 7, 8, 9].map((val) => {
            const y = svgHeight - paddingY - ((val - minGpa) / (maxGpa - minGpa)) * (svgHeight - 2 * paddingY);
            return (
              <g key={val}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={svgWidth - paddingX + 10}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800/60"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 25}
                  y={y + 3}
                  className="text-[10px] fill-slate-400 font-bold"
                >
                  {val}.0
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#cgpaGradient)" />

          {/* Smooth Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredPoint?.sem === p.sem;
            return (
              <g
                key={p.sem}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer group"
              >
                {/* Outer Glow Ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 8 : 5}
                  className="fill-white dark:fill-slate-900 stroke-indigo-600 transition-all"
                  strokeWidth={isHovered ? 3 : 2}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4 : 2.5}
                  className="fill-indigo-600"
                />

                {/* Score Pill on top */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="text-[11px] font-black fill-slate-800 dark:fill-slate-100 transition-transform"
                >
                  {p.gpa.toFixed(2)}
                </text>

                {/* Semester Label bottom */}
                <text
                  x={p.x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-slate-500 dark:fill-slate-400"
                >
                  {p.sem}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Academic Standing</div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">
              {latestGpa >= 7.5 ? 'First Class with Distinction' : latestGpa >= 6.0 ? 'First Class' : 'Second Class'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Backlog Status</div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">
              {user.backlogs ? user.backlogs : 'Zero Backlogs (Clear)'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Internship / Industry Experience</div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1">
              {user.internships ? user.internships : 'Capstone Project in Progress'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
