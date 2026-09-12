"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useLayout } from "../LayoutContext";

export interface NavItemProps {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  href,
  label,
  icon: Icon,
  badge,
  disabled = false,
}) => {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useLayout();
  const isActive = !disabled && (pathname === href || pathname.startsWith(`${href}/`));

  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-full px-3 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed opacity-60 select-none transition-all",
          isSidebarCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-4"
        )}
        title={`${label} (Planned Phase)`}
        aria-disabled="true"
      >
        {Icon && <Icon className="h-5 w-5 text-slate-400 shrink-0" />}
        {!isSidebarCollapsed && (
          <>
            <span className="flex-1 truncate text-xs">{label}</span>
            {badge && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {badge}
              </span>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      title={isSidebarCollapsed ? label : undefined}
      className={cn(
        "flex items-center gap-4 rounded-full py-2.5 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 select-none",
        isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "px-4",
        isActive
          ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs"
          : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 font-medium"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-emerald-800" : "text-slate-600"
          )}
        />
      )}
      {!isSidebarCollapsed && (
        <>
          <span className="flex-1 truncate tracking-tight">{label}</span>
          {badge && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                isActive
                  ? "bg-emerald-200/80 text-emerald-900"
                  : "bg-slate-200 text-slate-700"
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
};
