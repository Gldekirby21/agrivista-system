import React from "react";
import Link from "next/link";
import {
  Users,
  Camera,
  TrendingUp,
  FileCheck2,
  Boxes,
  LineChart,
  ShieldAlert,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

export const StaffOverview: React.FC = () => {
  const operations = [
    {
      id: "objective-01",
      numberTag: "01",
      title: "Agricultural Records",
      href: "/staff/beneficiaries",
      actionLabel: "Manage records",
      icon: Users,
      badge: "Objective 1",
      badgeVariant: "info" as const,
      description: "Beneficiary intake, RSBSA registry, farm landholding profiles, cadastral parcels, and documents.",
    },
    {
      id: "objective-02",
      numberTag: "02",
      title: "AI Metadata Verification",
      href: "/staff/photo-verification",
      actionLabel: "Verify submissions",
      icon: Camera,
      badge: "Objective 2",
      badgeVariant: "info" as const,
      description: "Geotagged inspection photo uploads, EXIF timestamp validation, Gemini AI advisory, and GPS distance assessment.",
    },
    {
      id: "objective-03",
      numberTag: "03",
      title: "Yield & Loss Prediction",
      href: "/staff/predictions",
      actionLabel: "Run predictions",
      icon: TrendingUp,
      badge: "Objective 3",
      badgeVariant: "info" as const,
      description: "Predictive crop yield analysis, seasonal production metrics, and calamity loss calculations.",
    },
    {
      id: "objective-04",
      numberTag: "04",
      title: "Inventory Management",
      href: "/staff/inventory",
      actionLabel: "Manage stocks",
      icon: Boxes,
      badge: "Objective 4",
      badgeVariant: "info" as const,
      description: "FIFO commodity release slips, seed bag allocation, and fertilizer batch viability tracking.",
    },
    {
      id: "objective-05",
      numberTag: "05",
      title: "Resource Demand",
      href: "/staff/resource-demand",
      actionLabel: "Generate forecasts",
      icon: LineChart,
      badge: "Objective 5",
      badgeVariant: "info" as const,
      description: "Supervised ML input forecasting for seasonal seed quantities and fertilizer demand.",
    },
    {
      id: "objective-06",
      numberTag: "06",
      title: "Verification & Claim Details",
      href: "/staff/photo-verification",
      actionLabel: "View verification & claims",
      icon: FileCheck2,
      badge: "Objective 6",
      badgeVariant: "info" as const,
      description: "Field damage photo verification, deterministic cadastral checks, and integrated PCIC claim evaluation.",
    },
    {
      id: "reports",
      numberTag: "—",
      title: "Operational Reports",
      href: "/staff/reports",
      actionLabel: "View reports",
      icon: FileText,
      badge: "Phase 9",
      badgeVariant: "neutral" as const,
      description: "Barangay field distribution tallies, technician rosters, and dispatch receipts.",
    },
    {
      id: "activity",
      numberTag: "—",
      title: "Activity Trail",
      href: "/staff/audit",
      actionLabel: "View activity",
      icon: ShieldAlert,
      badge: "Phase 9",
      badgeVariant: "neutral" as const,
      description: "Personal submission history, stock issuance ledger, and operational log trail.",
    },
  ];

  return (
    <section aria-labelledby="staff-operations-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 id="staff-operations-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Field Operations &amp; Modules (Objectives 01 – 06)
        </h2>
        <span className="text-[11px] text-slate-500">
          Direct navigation to operational stations and desks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <Card key={op.id} className="flex flex-col justify-between border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all">
              <div>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-800 border border-sky-200/60 shrink-0">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {op.title}
                    </CardTitle>
                  </div>
                  <Badge variant={op.badgeVariant} size="sm">
                    {op.badge}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {op.description}
                  </p>
                </CardContent>
              </div>

              <div className="px-5 pb-3.5 pt-2 border-t border-slate-100 mt-2">
                <Link
                  href={op.href}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 hover:bg-sky-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300 transition-colors group"
                >
                  <span>{op.actionLabel}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-700 transition-colors" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
