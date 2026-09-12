"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  MapPin,
  TrendingUp,
  Boxes,
  LineChart,
  FileCheck2,
  FileText,
  ShieldAlert,
  LogOut,
  Camera,
  Plus,
  Layers,
} from "lucide-react";
import { NavItem } from "../navigation/NavItem";
import { UserRole } from "@/types";
import { useLayout } from "../LayoutContext";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/common/Modal";
import { BeneficiaryForm } from "@/features/rsbsa/components/BeneficiaryForm";

export interface SidebarProps {
  currentRole?: UserRole;
  userFullName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole = "OMAG_STAFF",
  userFullName = "OMAG Official",
}) => {
  const isHead = currentRole === "OMAG_HEAD";
  const { isSidebarCollapsed } = useLayout();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      window.location.href = "/login";
    }
  };

  const composeHref = isHead ? "/head/beneficiaries" : "/staff/beneficiaries/new";
  const composeLabel = isHead ? "Directory Intake" : "New Registration";

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 h-full bg-[#f6f8fc] select-none transition-all duration-300 ease-in-out py-2 pl-3 pr-2",
        isSidebarCollapsed ? "w-[76px]" : "w-64"
      )}
      aria-label="Main Navigation"
    >
      {/* 1. Gmail-style Compose / Floating Action Button */}
      <div className="pb-4 pt-1">
        <button
          type="button"
          onClick={() => setIsComposeModalOpen(true)}
          title={isSidebarCollapsed ? composeLabel : undefined}
          className={cn(
            "flex items-center justify-center rounded-2xl bg-white border border-slate-200/80 text-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-98 group cursor-pointer",
            isSidebarCollapsed
              ? "h-12 w-12 mx-auto"
              : "px-5 py-3.5 gap-3 w-fit"
          )}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 stroke-[3]" aria-hidden="true" />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-sm font-semibold text-slate-900 tracking-tight whitespace-nowrap">
              {composeLabel}
            </span>
          )}
        </button>
      </div>

      {/* 2. Navigation Items (Gmail-style Pill Menu) */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Sidebar Menu">
        {!isSidebarCollapsed && (
          <div className="px-4 pb-1 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isHead ? "Executive Oversight" : "Operations"}
            </span>
          </div>
        )}

        {isHead ? (
          <>
            <NavItem href="/head/dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavItem href="/head/beneficiaries" label="Beneficiaries / RSBSA" icon={Users} badge="Active" />
            <NavItem href="/head/verification" label="Photo Verification" icon={Camera} badge="Objective 2" />
            <NavItem href="/head/parcels" label="Farm & Parcels" icon={MapPin} badge="Objective 1" disabled />
            <NavItem href="/head/predictions" label="Yield & Loss Prediction" icon={TrendingUp} badge="Objective 3" />
            <NavItem href="/head/inventory" label="Inventory" icon={Boxes} badge="Objective 4" disabled />
            <NavItem href="/head/forecasts" label="Resource Forecast" icon={LineChart} badge="Objective 5" disabled />
            <NavItem href="/head/pcic" label="PCIC Monitoring" icon={FileCheck2} badge="Objective 6" disabled />
            <NavItem href="/head/reports" label="Reports" icon={FileText} badge="Coming Soon" disabled />
            <NavItem href="/head/audit" label="Audit Logs" icon={ShieldAlert} badge="Coming Soon" disabled />
          </>
        ) : (
          <>
            <NavItem href="/staff/dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavItem href="/staff/beneficiaries" label="Beneficiaries / RSBSA" icon={Users} badge="Active" />
            <NavItem href="/staff/verification" label="Photo Verification" icon={Camera} badge="Objective 2" />
            <NavItem href="/staff/parcels" label="Farm & Parcels" icon={MapPin} badge="Objective 1" disabled />
            <NavItem href="/staff/predictions" label="Yield & Loss Prediction" icon={TrendingUp} badge="Objective 3" />
            <NavItem href="/staff/inventory" label="Inventory" icon={Boxes} badge="Objective 4" disabled />
            <NavItem href="/staff/pcic" label="PCIC Monitoring" icon={FileCheck2} badge="Objective 6" disabled />
            <NavItem href="/staff/reports" label="Reports" icon={FileText} badge="Coming Soon" disabled />
          </>
        )}
      </nav>

      {/* 3. Bottom Profile & System Status Rail */}
      <div className="pt-2 border-t border-slate-200/80">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/70 border border-slate-200/60 shadow-xs">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">{userFullName}</p>
              <p className="text-[11px] text-emerald-700 font-semibold truncate">{currentRole}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 outline-none shrink-0"
              title="Sign Out of Municipal System"
              aria-label="Sign Out"
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="rounded-full p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 outline-none"
              title="Sign Out"
              aria-label="Sign Out"
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Registration Modal Triggered from Floating Compose Button */}
      <Modal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        title="Beneficiary Registration Intake"
        subtitle="Enroll a farmer beneficiary with verified RSBSA identifiers and sector attributes."
        size="4xl"
      >
        <BeneficiaryForm
          onSuccess={() => {
            setIsComposeModalOpen(false);
            window.location.href = "/staff/beneficiaries";
          }}
          onCancel={() => setIsComposeModalOpen(false)}
        />
      </Modal>
    </aside>
  );
};
