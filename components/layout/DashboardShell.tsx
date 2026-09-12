"use client";

import React from "react";
import { LayoutProvider } from "./LayoutContext";
import { GmailTopBar } from "./header/GmailTopBar";
import { Sidebar } from "./sidebar/Sidebar";
import { UserRole } from "@/types";

interface DashboardShellProps {
  currentRole?: UserRole;
  userFullName?: string;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  currentRole = "OMAG_STAFF",
  userFullName = "OMAG Official",
  children,
}) => {
  return (
    <LayoutProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f6f8fc]">
        {/* 1. Full-Width Gmail-Style Top Header Bar */}
        <GmailTopBar userFullName={userFullName} role={currentRole} />

        {/* 2. Workspace Body: Left Sidebar + Gmail Rounded Canvas Card */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Collapsible Left Navigation Sidebar */}
          <Sidebar currentRole={currentRole} userFullName={userFullName} />

          {/* Elevated Gmail Main Content Card */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden rounded-2xl md:rounded-3xl bg-white border border-slate-200/80 shadow-xs mr-2 md:mr-4 mb-2 md:mb-4">
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </LayoutProvider>
  );
};
