import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-1/4 shimmer" />
        <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-full w-16 shimmer" />
      </div>
      <div className="h-6 bg-slate-200/80 dark:bg-slate-800 rounded-xl w-3/4 shimmer" />
      <div className="space-y-2">
        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-full shimmer" />
        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-4/5 shimmer" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="h-7 bg-slate-200/80 dark:bg-slate-800 rounded-full w-7 shimmer" />
        <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-1/3 shimmer" />
      </div>
    </div>
  );
};

export const StatWidgetSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-1/3 shimmer" />
        <div className="h-9 w-9 bg-slate-200/80 dark:bg-slate-800 rounded-2xl shimmer" />
      </div>
      <div className="h-8 bg-slate-200/80 dark:bg-slate-800 rounded-xl w-1/2 shimmer" />
      <div className="h-3 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-2/3 shimmer" />
    </div>
  );
};

export const ListRowSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-3.5 flex-1">
        <div className="w-10 h-10 rounded-2xl bg-slate-200/80 dark:bg-slate-800 flex-shrink-0 shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-2/5 shimmer" />
          <div className="h-3 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-1/4 shimmer" />
        </div>
      </div>
      <div className="h-7 w-20 bg-slate-200/80 dark:bg-slate-800 rounded-xl shimmer" />
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/60">
      <td className="p-4"><div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded w-24 shimmer" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded w-48 shimmer" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded w-20 shimmer" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded w-16 shimmer" /></td>
      <td className="p-4"><div className="h-8 bg-slate-200/80 dark:bg-slate-800 rounded-xl w-24 shimmer" /></td>
    </tr>
  );
};

export const CourseHeaderSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-200/80 dark:bg-slate-800 rounded-full w-28 shimmer" />
          <div className="h-8 bg-slate-200/80 dark:bg-slate-800 rounded-xl w-3/4 shimmer" />
          <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-1/2 shimmer" />
        </div>
        <div className="h-10 w-32 bg-slate-200/80 dark:bg-slate-800 rounded-2xl shimmer" />
      </div>
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-3">
      <div className="h-48 bg-slate-200/80 dark:bg-slate-800 shimmer w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-full w-20 shimmer" />
          <div className="h-4 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-14 shimmer" />
        </div>
        <div className="h-5 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-3/4 shimmer" />
        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg w-1/2 shimmer" />
      </div>
    </div>
  );
};
