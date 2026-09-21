import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 p-6 md:p-8 animate-in fade-in duration-150">
      {/* 1. Loading Top Bar Indicator */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-slate-200/80 animate-pulse" />
          <div className="h-4 w-96 rounded-md bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
          <span>Loading module data...</span>
        </div>
      </div>

      {/* 2. Metric KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-slate-100 animate-pulse" />
            </div>
            <div className="h-7 w-16 rounded bg-slate-200/80 animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* 3. Main Content Panel Skeleton */}
      <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-44 rounded bg-slate-200/80 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-8 w-28 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Shimmer Rows */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center gap-4 py-3 px-3 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <div className="h-4 w-12 rounded bg-slate-200 animate-pulse shrink-0" />
              <div className="h-4 w-32 rounded bg-slate-200/80 animate-pulse" />
              <div className="h-4 w-24 rounded bg-slate-200/60 animate-pulse hidden sm:block" />
              <div className="h-4 w-20 rounded bg-slate-200/60 animate-pulse ml-auto" />
              <div className="h-6 w-16 rounded-full bg-slate-200 animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
