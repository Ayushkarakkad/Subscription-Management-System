import React from "react";

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
      <div className="h-7 bg-slate-100 rounded-lg w-1/4 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-5 bg-slate-100 rounded w-1/6" />
            <div className="h-5 bg-slate-100 rounded w-2/6" />
            <div className="h-5 bg-slate-100 rounded w-1/6" />
            <div className="h-5 bg-slate-100 rounded w-1/6" />
            <div className="h-5 bg-slate-100 rounded w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-8 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/4" />
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return <TableSkeleton rows={count} />;
};

export default LoadingSkeleton;
