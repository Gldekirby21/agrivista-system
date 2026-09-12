"use client";

import React from "react";
import {
  Menu,
  Search,
  SlidersHorizontal,
  Bell,
  Sprout,
  X,
  MapPin,
} from "lucide-react";
import { UserRole } from "@/types";
import { useLayout } from "../LayoutContext";
import { cn } from "@/lib/utils/cn";

export interface GmailTopBarProps {
  userFullName?: string;
  role?: UserRole;
}

export const GmailTopBar: React.FC<GmailTopBarProps> = ({
  userFullName = "OMAG Official",
  role = "OMAG_STAFF",
}) => {
  const { isSidebarCollapsed, toggleSidebar, searchQuery, setSearchQuery, headerInfo } = useLayout();
  const isHead = role === "OMAG_HEAD";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between bg-[#f6f8fc] pl-0 pr-4 md:pr-6 select-none shrink-0 gap-2 md:gap-4">
      {/* 1. Left: Hamburger Toggle & AgriVista Logo — Exact Match with Sidebar Width */}
      <div
        className={cn(
          "flex items-center shrink-0 transition-all duration-300 ease-in-out pl-3 pr-2",
          isSidebarCollapsed ? "w-[76px] justify-center" : "w-64 gap-3"
        )}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle Main Menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200/80 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 outline-none active:scale-95 shrink-0"
          title="Main Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-base font-bold tracking-tight text-slate-800 leading-none truncate">
                AgriVista
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 leading-tight mt-0.5 truncate">
                OMAG Polomolok
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Page Title & Subtitle (Aligned precisely with Main Content Card's left border) */}
      <div className="hidden md:flex flex-col min-w-0 max-w-xs lg:max-w-sm xl:max-w-md border-l border-slate-200/80 pl-4 pr-2 py-0.5">
        <h2 className="text-sm font-bold text-slate-900 truncate leading-tight tracking-tight">
          {headerInfo.title}
        </h2>
        {headerInfo.subtitle && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate leading-tight mt-0.5">
            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="truncate">{headerInfo.subtitle}</span>
          </div>
        )}
      </div>

      {/* 3. Center: Gmail-style Pill Search Bar */}
      <div className="flex-1 max-w-lg lg:max-w-xl min-w-0">
        <div className="relative flex h-10 md:h-11 w-full items-center rounded-full bg-[#eaf1fb] hover:bg-[#e2ecf8] focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-slate-300 transition-all px-4 gap-2.5 text-slate-700">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, beneficiaries, RSBSA, parcels..."
            className="w-full bg-transparent text-xs md:text-sm font-medium text-slate-900 placeholder-slate-500 outline-none truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 transition-colors shrink-0"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 transition-colors shrink-0"
            title="Search options / filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Right: Notification Bell & Profile Avatar */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200/80 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 outline-none"
          title="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" aria-hidden="true" />
        </button>

        {/* User Avatar Circle */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-xs ring-2 ring-emerald-200 shadow-xs select-none cursor-pointer hover:opacity-90 transition-opacity"
          title={`${userFullName} (${role})`}
        >
          {getInitials(userFullName)}
        </div>
      </div>
    </header>
  );
};
