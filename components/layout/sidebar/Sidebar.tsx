"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Camera,
  TrendingUp,
  Boxes,
  LineChart,
  FileText,
  ShieldAlert,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { NavGroup, SubmenuItem } from "../navigation/NavGroup";
import { UserRole } from "@/types";
import { useLayout } from "../LayoutContext";
import { cn } from "@/lib/utils/cn";
import { ConfirmModal } from "@/components/common/ConfirmModal";

export interface SidebarProps {
  currentRole?: UserRole;
  userFullName?: string;
}

function SidebarContent({
  currentRole = "OMAG_STAFF",
  userFullName = "OMAG Official",
}: SidebarProps) {
  const isHead = currentRole === "OMAG_HEAD";
  const base = isHead ? "/head" : "/staff";
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  // Manage expanded state for navigation groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    records: true,
    photo: false,
    historical: false,
    predictions: false,
    inventory: false,
    pcic: false,
    reports: false,
    "01": true,
    "02": false,
    "03": false,
    "04": false,
    "05": false,
    "06": false,
    agricultural_records: true,
    croploss_management: true,
    resource_management: false,
  });

  // Modal states
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Auto-expand the objective group containing the current active route
  useEffect(() => {
    let activeGroupId: string | null = null;

    if (
      pathname.includes("/beneficiaries") ||
      pathname.includes("/crops") ||
      pathname.includes("/parcels") ||
      pathname.includes("/rsbsa")
    ) {
      activeGroupId = isHead ? "records" : "agricultural_records";
    } else if (
      pathname.includes("/photo-verification") ||
      pathname.includes("/verification") ||
      pathname.includes("/pcic") ||
      pathname.includes("/predictions")
    ) {
      activeGroupId = isHead
        ? pathname.includes("/predictions")
          ? "predictions"
          : pathname.includes("/pcic")
          ? "pcic"
          : "photo"
        : "croploss_management";
    } else if (pathname.includes("/inventory")) {
      activeGroupId = isHead ? "inventory" : "resource_management";
    } else if (pathname.includes("/resource-demand") || pathname.includes("/forecasts")) {
      activeGroupId = isHead ? "historical" : "resource_management";
    } else if (pathname.includes("/reports")) {
      activeGroupId = "reports";
    }

    if (activeGroupId) {
      setExpandedGroups((prev) => ({
        ...prev,
        [activeGroupId as string]: true,
      }));
    }
  }, [pathname, isHead]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      window.location.href = "/login";
    }
  };

  // Helper to determine whether a submenu item is active
  const checkSubmenuActive = (itemHref: string) => {
    const [itemPath, itemQuery] = itemHref.split("?");

    if (itemQuery) {
      if (pathname !== itemPath) return false;
      const qParams = new URLSearchParams(itemQuery);
      let matchAll = true;
      qParams.forEach((val, key) => {
        const currentVal = searchParams?.get(key);
        if (currentVal !== val) {
          // Allow default active submenus when query param is absent
          const isDefaultInventoryCatalog =
            !currentVal && key === "tab" && val === "catalog" && itemPath.endsWith("/inventory");
          if (!isDefaultInventoryCatalog) {
            matchAll = false;
          }
        }
      });
      return matchAll;
    }

    // Exact match for direct route
    if (pathname === itemPath) {
      const hasViewParam =
        searchParams?.has("view") ||
        searchParams?.has("tab") ||
        searchParams?.has("filter");
      return !hasViewParam;
    }

    // Subpath matching (e.g. /photo-verification/[id] for records list)
    if (pathname.startsWith(`${itemPath}/`)) {
      // Exclude distinct sub-routes like /new from activating the parent listing item
      if (
        itemPath === `${base}/photo-verification` &&
        pathname === `${base}/photo-verification/new`
      ) {
        return false;
      }
      if (
        itemPath === `${base}/beneficiaries` &&
        pathname === `${base}/beneficiaries/new`
      ) {
        return false;
      }
      // /staff/pcic sub-pages are independent — each has its own sidebar item
      if (itemPath === `${base}/pcic`) {
        return false;
      }
      return true;
    }

    return false;
  };

  // ==========================================
  // OMAG HEAD SPECIFIC MENU ITEMS (Authoritative)
  // ==========================================
  const headAgriculturalItems: SubmenuItem[] = [
    {
      label: "View Farmers / RSBSA",
      href: "/head/beneficiaries",
      isActive: checkSubmenuActive("/head/beneficiaries"),
    },
    {
      label: "View Farms",
      href: "/head/beneficiaries?view=farms",
      isActive: checkSubmenuActive("/head/beneficiaries?view=farms"),
    },
    {
      label: "View Farm Parcels",
      href: "/head/beneficiaries?view=parcels",
      isActive: checkSubmenuActive("/head/beneficiaries?view=parcels"),
    },
    {
      label: "View Crops",
      href: "/head/beneficiaries?view=crops",
      isActive: checkSubmenuActive("/head/beneficiaries?view=crops"),
    },
    {
      label: "View Land Documents",
      href: "/head/beneficiaries?view=documents",
      isActive: checkSubmenuActive("/head/beneficiaries?view=documents"),
    },
  ];

  const headPhotoItems: SubmenuItem[] = [
    {
      label: "Photo Verification & Reviews",
      href: "/head/photo-verification",
      isActive: checkSubmenuActive("/head/photo-verification"),
    },
  ];

  const headHistoricalItems: SubmenuItem[] = [
    {
      label: "1. Historical Crop Production",
      href: "/head/resource-demand?tab=historical",
      isActive: checkSubmenuActive("/head/resource-demand?tab=historical"),
    },
    {
      label: "2. Estimated Requirements",
      href: "/head/resource-demand?tab=forecast",
      isActive: checkSubmenuActive("/head/resource-demand?tab=forecast"),
    },
    {
      label: "3. Results & History",
      href: "/head/resource-demand?tab=history",
      isActive: checkSubmenuActive("/head/resource-demand?tab=history"),
    },
  ];

  const headPcicItems: SubmenuItem[] = [
    {
      label: "Crop-Loss Claims Monitoring",
      href: "/head/pcic",
      isActive: checkSubmenuActive("/head/pcic"),
    },
  ];

  const headPredictionItems: SubmenuItem[] = [
    {
      label: "Crop Yield & Loss Prediction",
      href: "/head/predictions",
      isActive: checkSubmenuActive("/head/predictions"),
    },
  ];

  const headInventoryItems: SubmenuItem[] = [
    {
      label: "View Fertilizer Inventory",
      href: "/head/inventory?tab=catalog&category=FERTILIZER",
      isActive: checkSubmenuActive("/head/inventory?tab=catalog&category=FERTILIZER"),
    },
    {
      label: "View Seed Inventory",
      href: "/head/inventory?tab=catalog&category=SEED",
      isActive: checkSubmenuActive("/head/inventory?tab=catalog&category=SEED"),
    },
    {
      label: "Distribution Requests",
      href: "/head/inventory?tab=requests",
      isActive: checkSubmenuActive("/head/inventory?tab=requests"),
    },
    {
      label: "View Distribution Records",
      href: "/head/inventory?tab=distributions",
      isActive: checkSubmenuActive("/head/inventory?tab=distributions"),
    },
  ];

  const headReportsItems: SubmenuItem[] = [
    {
      label: "Agricultural Reports",
      href: "/head/reports?tab=agricultural",
      isActive: checkSubmenuActive("/head/reports?tab=agricultural"),
    },
    {
      label: "Production & Yield Reports",
      href: "/head/reports?tab=production",
      isActive: checkSubmenuActive("/head/reports?tab=production"),
    },
    {
      label: "Inventory Reports",
      href: "/head/reports?tab=inventory",
      isActive: checkSubmenuActive("/head/reports?tab=inventory"),
    },
    {
      label: "PCIC Reports",
      href: "/head/reports?tab=pcic",
      isActive: checkSubmenuActive("/head/reports?tab=pcic"),
    },
  ];

  // ==========================================
  // OMAG STAFF SPECIFIC MENU ITEMS (Authoritative)
  // ==========================================
  const staffAgriculturalItems: SubmenuItem[] = [
    {
      label: "Manage Farmers / RSBSA",
      href: "/staff/beneficiaries",
      isActive: checkSubmenuActive("/staff/beneficiaries"),
    },
    {
      label: "Manage Farms",
      href: "/staff/beneficiaries?view=farms",
      isActive: checkSubmenuActive("/staff/beneficiaries?view=farms"),
    },
    {
      label: "Manage Farm Parcels",
      href: "/staff/beneficiaries?view=parcels",
      isActive: checkSubmenuActive("/staff/beneficiaries?view=parcels"),
    },
    {
      label: "Manage Crops",
      href: "/staff/beneficiaries?view=crops",
      isActive: checkSubmenuActive("/staff/beneficiaries?view=crops"),
    },
    {
      label: "Manage Land Documents",
      href: "/staff/beneficiaries?view=documents",
      isActive: checkSubmenuActive("/staff/beneficiaries?view=documents"),
    },
  ];

  const staffCropLossItems: SubmenuItem[] = [
    {
      label: "Crop-Loss Case Management",
      href: "/staff/pcic/evaluation",
      isActive: checkSubmenuActive("/staff/pcic/evaluation"),
    },
    {
      label: "Yield & Loss Prediction",
      href: "/staff/predictions",
      isActive: checkSubmenuActive("/staff/predictions"),
    },
    {
      label: "Priority Ranking",
      href: "/staff/pcic/ranking",
      isActive: checkSubmenuActive("/staff/pcic/ranking"),
    },
    {
      label: "Claim Monitoring",
      href: "/staff/pcic/monitoring",
      isActive: checkSubmenuActive("/staff/pcic/monitoring"),
    },
  ];


  const staffInventoryItems: SubmenuItem[] = [
    {
      label: "Manage Inventory Items",
      href: "/staff/inventory?tab=catalog",
      isActive: checkSubmenuActive("/staff/inventory?tab=catalog"),
    },
    {
      label: "Manage Inventory Batches",
      href: "/staff/inventory?tab=batches",
      isActive: checkSubmenuActive("/staff/inventory?tab=batches"),
    },
    {
      label: "FIFO Distribution",
      href: "/staff/inventory?tab=distribute",
      isActive: checkSubmenuActive("/staff/inventory?tab=distribute"),
    },
    {
      label: "Distribution Records",
      href: "/staff/inventory?tab=distributions",
      isActive: checkSubmenuActive("/staff/inventory?tab=distributions"),
    },
  ];

  const composeLabel = isHead ? "Directory Intake" : "New Registration";
  const isDashboardActive = pathname === `${base}/dashboard`;
  const isPhotoVerificationActive =
    pathname.startsWith(`${base}/photo-verification`) ||
    pathname.startsWith(`${base}/verification`);
  const isReportsActive = pathname.startsWith(`${base}/reports`);
  const isAuditActive = pathname.startsWith(`${base}/audit`);
  const isSettingsActive = pathname.startsWith(`${base}/settings`);

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 h-full bg-[#f4f7f4] select-none transition-all duration-300 ease-in-out py-2 pl-3 pr-2 border-r border-slate-200/80",
        isSidebarCollapsed ? "w-[76px]" : "w-64"
      )}
      aria-label="Main Navigation"
    >
      {/* 1. Quick Action / Registration Trigger - Staff Only */}
      {!isHead && (
        <div className="pb-3 pt-1">
          <Link
            href="/staff/beneficiaries/new"
            title={isSidebarCollapsed ? composeLabel : undefined}
            aria-label={composeLabel}
            className={cn(
              "flex items-center justify-center rounded-2xl bg-white border border-slate-200/90 text-slate-800 shadow-xs hover:shadow-md hover:bg-slate-50 transition-all active:scale-98 group cursor-pointer",
              isSidebarCollapsed ? "h-11 w-11 mx-auto" : "px-4 py-2.5 gap-2.5 w-full"
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Plus className="h-4 w-4 stroke-[3]" aria-hidden="true" />
            </div>
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {composeLabel}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* 2. Structured Navigation Tree */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar text-xs"
        aria-label="Sidebar Menu"
      >
        {isHead ? (
          <>
            {/* 1. Dashboard */}
            <Link
              href="/head/dashboard"
              prefetch={false}
              title={isSidebarCollapsed ? "Dashboard" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                isDashboardActive
                  ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs border border-emerald-300/60"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <LayoutDashboard
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isDashboardActive ? "text-emerald-800" : "text-slate-600"
                )}
              />
              {!isSidebarCollapsed && <span className="truncate">Dashboard</span>}
            </Link>

            {/* 2. Agricultural Records */}
            <NavGroup
              id="records"
              label="Agricultural Records"
              icon={Users}
              items={headAgriculturalItems}
              isExpanded={expandedGroups["records"] || false}
              onToggle={() => toggleGroup("records")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 3. Photo Verification */}
            <NavGroup
              id="photo"
              label="Photo Verification"
              icon={Camera}
              items={headPhotoItems}
              isExpanded={expandedGroups["photo"] || false}
              onToggle={() => toggleGroup("photo")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 4. Historical Crop Yield & Purchase Modeling */}
            <NavGroup
              id="historical"
              label="Historical Crop Yield & Purchase Modeling"
              icon={LineChart}
              items={headHistoricalItems}
              isExpanded={expandedGroups["historical"] || false}
              onToggle={() => toggleGroup("historical")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 5. Crop Yield & Loss Prediction */}
            <NavGroup
              id="predictions"
              label="Crop Yield & Loss Prediction"
              icon={TrendingUp}
              items={headPredictionItems}
              isExpanded={expandedGroups["predictions"] || false}
              onToggle={() => toggleGroup("predictions")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 6. Inventory Monitoring */}
            <NavGroup
              id="inventory"
              label="Inventory Monitoring"
              icon={Boxes}
              items={headInventoryItems}
              isExpanded={expandedGroups["inventory"] || false}
              onToggle={() => toggleGroup("inventory")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 7. PCIC Crop-Loss Claims Monitoring */}
            <NavGroup
              id="pcic"
              label="PCIC Claims Monitoring"
              icon={ShieldAlert}
              items={headPcicItems}
              isExpanded={expandedGroups["pcic"] || false}
              onToggle={() => toggleGroup("pcic")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 8. Reports */}
            <NavGroup
              id="reports"
              label="Reports"
              icon={FileText}
              items={headReportsItems}
              isExpanded={expandedGroups["reports"] || false}
              onToggle={() => toggleGroup("reports")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* 9. Activity / Audit Logs */}
            <Link
              href="/head/audit"
              prefetch={false}
              title={isSidebarCollapsed ? "Activity / Audit Logs" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                isAuditActive
                  ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs border border-emerald-300/60"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <ShieldAlert
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isAuditActive ? "text-emerald-800" : "text-slate-600"
                )}
              />
              {!isSidebarCollapsed && <span className="truncate">Activity / Audit Logs</span>}
            </Link>

            {/* 10. Settings */}
            <Link
              href="/head/settings"
              prefetch={false}
              title={isSidebarCollapsed ? "Settings" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                isSettingsActive
                  ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs border border-emerald-300/60"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isSettingsActive ? "text-emerald-800" : "text-slate-600"
                )}
              />
              {!isSidebarCollapsed && <span className="truncate">Settings</span>}
            </Link>

            {/* 11. Logout */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title={isSidebarCollapsed ? "Logout" : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-left cursor-pointer",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                "text-slate-700 hover:bg-red-50 hover:text-red-700"
              )}
            >
              <LogOut
                className="h-4 w-4 shrink-0 transition-colors text-slate-600"
              />
              {!isSidebarCollapsed && <span className="truncate">Logout</span>}
            </button>
          </>
        ) : (
          /* Staff Navigation — Authoritative Functional/Module Structure */
          <>
            {/* AGRICULTURAL RECORDS */}
            <NavGroup
              id="agricultural_records"
              label="AGRICULTURAL RECORDS"
              icon={Users}
              items={staffAgriculturalItems}
              isExpanded={expandedGroups["agricultural_records"] !== false}
              onToggle={() => toggleGroup("agricultural_records")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* CROP-LOSS MANAGEMENT */}
            <NavGroup
              id="croploss_management"
              label="CROP-LOSS MANAGEMENT"
              icon={ShieldAlert}
              items={staffCropLossItems}
              isExpanded={expandedGroups["croploss_management"] !== false}
              onToggle={() => toggleGroup("croploss_management")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* RESOURCE MANAGEMENT */}
            <NavGroup
              id="resource_management"
              label="RESOURCE MANAGEMENT"
              icon={Boxes}
              items={staffInventoryItems}
              isExpanded={expandedGroups["resource_management"] || false}
              onToggle={() => toggleGroup("resource_management")}
              isSidebarCollapsed={isSidebarCollapsed}
              onExpandSidebar={toggleSidebar}
            />

            {/* Cross-Cutting Modules Section */}
            {!isSidebarCollapsed && (
              <div className="px-3 pt-3 pb-1 border-t border-slate-200/70 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  General Operations
                </span>
              </div>
            )}

            {/* Reports */}
            <Link
              href="/staff/reports"
              prefetch={false}
              title={isSidebarCollapsed ? "Reports" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                isReportsActive
                  ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs border border-emerald-300/60"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <FileText
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isReportsActive ? "text-emerald-800" : "text-slate-600"
                )}
              />
              {!isSidebarCollapsed && <span className="truncate">Reports</span>}
            </Link>

            {/* Activity / Audit Logs */}
            <Link
              href="/staff/audit"
              prefetch={false}
              title={isSidebarCollapsed ? "Activity / Audit Logs" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                isAuditActive
                  ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs border border-emerald-300/60"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <ShieldAlert
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isAuditActive ? "text-emerald-800" : "text-slate-600"
                )}
              />
              {!isSidebarCollapsed && <span className="truncate">Activity / Audit Logs</span>}
            </Link>

            {/* Settings */}
            <Link
              href="/staff/settings"
              prefetch={false}
              title={isSidebarCollapsed ? "Settings" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                isSidebarCollapsed ? "justify-center w-11 h-11 mx-auto px-0" : "",
                isSettingsActive
                  ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-xs border border-emerald-300/60"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
              )}
            >
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isSettingsActive ? "text-emerald-800" : "text-slate-600"
                )}
              />
              {!isSidebarCollapsed && <span className="truncate">Settings</span>}
            </Link>
          </>
        )}
      </nav>

      {/* 3. Bottom User Profile & Sign Out Rail */}
      <div className="pt-2 border-t border-slate-200/80">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/80 border border-slate-200/70 shadow-2xs">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">{userFullName}</p>
              <p className="text-[11px] text-emerald-700 font-semibold truncate">{currentRole}</p>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 outline-none shrink-0 cursor-pointer"
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
              onClick={() => setIsLogoutModalOpen(true)}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 outline-none cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>


      {/* Standardized Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out Confirmation"
        subtitle="End municipal administration session"
        message="Are you sure you want to sign out? Your session token will be revoked and this event will be logged in the municipal audit trail."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </aside>
  );
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <Suspense fallback={<aside className="w-64 bg-[#f4f7f4] border-r border-slate-200/80 shrink-0 h-full" />}>
      <SidebarContent {...props} />
    </Suspense>
  );
};
