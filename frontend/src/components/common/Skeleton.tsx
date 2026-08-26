import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div>
      </div>
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full mb-4"></div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-8"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800/60">
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
      <td className="p-4"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div></td>
    </tr>
  );
};
