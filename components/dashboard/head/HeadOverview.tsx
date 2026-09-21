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

export const HeadOverview: React.FC = () => {
  const sections = [
    {
      id: "objective-01",
      numberTag: "01",
      title: "Agricultural Records",
      href: "/head/beneficiaries",
      actionLabel: "View records",
      icon: Users,
      badge: "Objective 1",
      badgeVariant: "info" as const,
      description: "RSBSA farmer profiles, farm landholdings, cadastral parcels, crop commodities, and land documents.",
    },
    {
      id: "objective-02",
      numberTag: "02",
      title: "AI Metadata Verification",
      href: "/head/photo-verification",
      actionLabel: "Review submissions",
      icon: Camera,
      badge: "Objective 2",
      badgeVariant: "info" as const,
      description: "AI-assisted photograph metadata verification, deterministic GPS distance validation, and audit tracking.",
    },
    {
      id: "objective-03",
      numberTag: "03",
      title: "Yield & Loss Prediction",
      href: "/head/predictions",
      actionLabel: "Inspect predictions",
      icon: TrendingUp,
      badge: "Objective 3",
      badgeVariant: "info" as const,
      description: "Machine-learning-based crop yield forecasts and economic damage loss estimation.",
    },
    {
      id: "objective-04",
      numberTag: "04",
      title: "Inventory Management",
      href: "/head/inventory",
      actionLabel: "Inspect inventory",
      icon: Boxes,
      badge: "Objective 4",
      badgeVariant: "info" as const,
      description: "FIFO-based fertilizer and seeds inventory, batch viability horizons, and dispatch audit trails.",
    },
    {
      id: "objective-05",
      numberTag: "05",
      title: "Resource Demand",
      href: "/head/resource-demand",
      actionLabel: "Inspect demand models",
      icon: LineChart,
      badge: "Objective 5",
      badgeVariant: "info" as const,
      description: "Historical production modeling and predictive seed and fertilizer requirement forecasting.",
    },
    {
      id: "objective-06",
      numberTag: "06",
      title: "Verification & Claim Details",
      href: "/head/photo-verification",
      actionLabel: "Monitor verification & claims",
      icon: FileCheck2,
      badge: "Objective 6",
      badgeVariant: "info" as const,
      description: "Severity-ranked crop-loss claims, photo verification audits, and PCIC coordination monitoring.",
    },
    {
      id: "reports",
      numberTag: "—",
      title: "Reports & Analytics",
      href: "/head/reports",
      actionLabel: "View reports",
      icon: FileText,
      badge: "Phase 9",
      badgeVariant: "neutral" as const,
      description: "Executive agricultural production, calamity summaries, and municipal distribution reports.",
    },
    {
      id: "audit-logs",
      numberTag: "—",
      title: "Activity / Audit Logs",
      href: "/head/audit",
      actionLabel: "Inspect audit trail",
      icon: ShieldAlert,
      badge: "Phase 9",
      badgeVariant: "neutral" as const,
      description: "Immutable system action log, authentication events, and administrative mutation trail.",
    },
  ];

  return (
    <section aria-labelledby="head-overview-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 id="head-overview-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Executive Domain Oversight Modules (Objectives 01 – 06)
        </h2>
        <span className="text-[11px] text-slate-500">
          Direct navigation to municipal modules and analytics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.id} className="flex flex-col justify-between border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all">
              <div>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 shrink-0">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {sec.title}
                    </CardTitle>
                  </div>
                  <Badge variant={sec.badgeVariant} size="sm">
                    {sec.badge}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {sec.description}
                  </p>
                </CardContent>
              </div>

              <div className="px-5 pb-3.5 pt-2 border-t border-slate-100 mt-2">
                <Link
                  href={sec.href}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 transition-colors group"
                >
                  <span>{sec.actionLabel}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
