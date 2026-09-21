"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SubmenuItem {
  label: string;
  href: string;
  badge?: string;
  isActive: boolean;
}

export interface NavGroupProps {
  id: string;
  numberTag?: string;
  label: string;
  icon: LucideIcon;
  items: SubmenuItem[];
  isExpanded: boolean;
  onToggle: () => void;
  isSidebarCollapsed: boolean;
  onExpandSidebar?: () => void;
}

export const NavGroup: React.FC<NavGroupProps> = ({
  id,
  numberTag,
  label,
  icon: Icon,
  items,
  isExpanded,
  onToggle,
  isSidebarCollapsed,
  onExpandSidebar,
}) => {
  const isAnyChildActive = items.some((item) => item.isActive);

  if (isSidebarCollapsed) {
    return (
      <div className="relative group/collapsed flex justify-center py-0.5">
        <button
          type="button"
          onClick={onExpandSidebar || onToggle}
          title={`${numberTag ? `${numberTag} ` : ""}${label}\n${items.map((i) => `• ${i.label}`).join("\n")}`}
          aria-label={`${numberTag ? `${numberTag} ` : ""}${label}`}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
            isAnyChildActive
              ? "bg-emerald-100 text-emerald-900 font-bold shadow-xs border border-emerald-300/60"
              : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 select-none">
      {/* Objective Group Header (Accordion Toggle) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold tracking-tight transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
          isAnyChildActive
            ? "bg-emerald-50/80 text-emerald-950 font-bold border border-emerald-200/80"
            : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {numberTag && (
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold shrink-0",
                isAnyChildActive
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-700"
              )}
            >
              {numberTag}
            </span>
          )}
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isAnyChildActive ? "text-emerald-700" : "text-slate-500"
            )}
          />
          <span className="truncate text-left text-xs tracking-tight">{label}</span>
        </div>

        <div className="flex items-center shrink-0 text-slate-400">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Expandable Submenu Items */}
      {isExpanded && (
        <div className="pl-6 pr-1 space-y-0.5 pt-0.5 pb-1 border-l-2 border-slate-200/80 ml-5 transition-all">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer",
                item.isActive
                  ? "bg-emerald-100 text-emerald-950 font-bold shadow-2xs border border-emerald-300/60"
                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 font-medium"
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[9px] font-semibold shrink-0 ml-1.5",
                    item.isActive
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-slate-200/80 text-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
