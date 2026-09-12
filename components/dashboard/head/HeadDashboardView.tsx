import React from "react";
import { Badge } from "@/components/common/Badge";
import { HeadSummaryCards } from "./HeadSummaryCards";
import { HeadOverview } from "./HeadOverview";
import { HeadActivity } from "./HeadActivity";
import { HeadQuickActions } from "./HeadQuickActions";

export const HeadDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Basic Clean Municipal Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">OMAG_HEAD</Badge>
              <Badge variant="neutral">Executive Oversight</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Executive oversight dashboard shell. Monitoring municipal agricultural operations, resource allocations, and administrative records.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
            <span className="text-xs font-semibold text-slate-700">Role: OMAG_HEAD</span>
            <span className="text-[11px] text-slate-500">Municipality of Polomolok</span>
          </div>
        </div>

        {/* Source-of-Truth & Data Disclaimer Banner */}
        <div className="mt-4 rounded border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <p className="font-semibold">Notice: Synthetic Demonstration Data — Not Actual OMAG Records</p>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Administrative workflows and unconfirmed specifications are marked as PROPOSED SYSTEM DESIGN / PENDING OMAG CONFIRMATION.
          </p>
        </div>
      </div>

      {/* 1. Summary KPI Metrics Cards */}
      <HeadSummaryCards />

      {/* 2. Structured Domain Oversight Modules */}
      <HeadOverview />

      {/* 3. Operational Activity Stream & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeadActivity />
        <HeadQuickActions />
      </div>
    </div>
  );
};

