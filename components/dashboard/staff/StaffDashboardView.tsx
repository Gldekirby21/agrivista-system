import React from "react";
import { Badge } from "@/components/common/Badge";
import { StaffSummaryCards } from "./StaffSummaryCards";
import { StaffOverview } from "./StaffOverview";
import { StaffActivity } from "./StaffActivity";
import { StaffQuickActions } from "./StaffQuickActions";

export const StaffDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Basic Clean Municipal Operations Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">OMAG_STAFF</Badge>
              <Badge variant="neutral">Operations Desk</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Operational dashboard shell. Field data handling, beneficiary intake, parcel registration, and monitoring.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
            <span className="text-xs font-semibold text-slate-700">Role: OMAG_STAFF</span>
            <span className="text-[11px] text-slate-500">Municipality of Polomolok</span>
          </div>
        </div>

        {/* Source-of-Truth & Data Disclaimer Banner */}
        <div className="mt-4 rounded border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <p className="font-semibold">Notice: Synthetic Demonstration Data — Not Actual OMAG Records</p>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Field workflows and operational procedures are marked as PROPOSED SYSTEM DESIGN / PENDING OMAG CONFIRMATION.
          </p>
        </div>
      </div>

      {/* 1. Operational Summary KPI Cards */}
      <StaffSummaryCards />

      {/* 2. Structured Field Operations Modules */}
      <StaffOverview />

      {/* 3. Operational Activity Trail & Field Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaffActivity />
        <StaffQuickActions />
      </div>
    </div>
  );
};
