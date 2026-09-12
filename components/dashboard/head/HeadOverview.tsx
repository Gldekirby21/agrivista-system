import React from "react";
import {
  Users,
  MapPin,
  TrendingUp,
  FileCheck2,
  Boxes,
  LineChart,
  ShieldAlert,
  FileText,
  FolderOpen,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

export const HeadOverview: React.FC = () => {
  const sections = [
    {
      id: "beneficiary-rsbsa",
      title: "Beneficiary / RSBSA",
      icon: Users,
      badge: "Objective 1",
      description: "Centralized municipal beneficiary registry and masterlist.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 1",
    },
    {
      id: "farm-parcel",
      title: "Farm / Parcel",
      icon: MapPin,
      badge: "Objective 1 & 2",
      description: "Cadastral landholdings, polygon boundaries, and parcel centroids.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 1 & 2",
    },
    {
      id: "crop-production",
      title: "Crop / Production",
      icon: TrendingUp,
      badge: "Objective 3",
      description: "Production yields, crop cycles, and commodity harvest tracking.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 3",
    },
    {
      id: "crop-loss-pcic",
      title: "Crop Loss / PCIC",
      icon: FileCheck2,
      badge: "Objective 6",
      description: "Calamity damage verification and PCIC crop insurance indemnity review.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 6",
    },
    {
      id: "inventory",
      title: "Inventory",
      icon: Boxes,
      badge: "Objective 4",
      description: "Municipal agricultural warehouse stock, seed batches, and fertilizer lots.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 4",
    },
    {
      id: "resource-forecast",
      title: "Resource Forecast",
      icon: LineChart,
      badge: "Objective 5",
      description: "Predictive resource requirements and seasonal input demand modeling.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 5",
    },
    {
      id: "audit-logs",
      title: "Audit Logs",
      icon: ShieldAlert,
      badge: "Administration",
      description: "Immutable administrative action log and access audit trail.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective Governance",
    },
    {
      id: "reports",
      title: "Reports",
      icon: FileText,
      badge: "Reporting",
      description: "Consolidated executive summary reports, analytics, and exports.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Reporting Module",
    },
  ];

  return (
    <section aria-labelledby="head-overview-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 id="head-overview-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Executive Domain Oversight Modules
        </h2>
        <span className="text-[11px] text-slate-500">
          Phase 2 Dashboard Shell — Navigation Placeholders Only
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Card key={sec.id} className="flex flex-col justify-between border-slate-200">
              <div>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700 shrink-0">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xs font-bold text-slate-800 leading-tight truncate">
                      {sec.title}
                    </CardTitle>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {sec.badge}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {sec.description}
                  </p>

                  {/* Clean, Basic Empty State Placeholder */}
                  <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
                    <FolderOpen className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {sec.placeholderMessage}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {sec.statusNotice}
                    </p>
                  </div>
                </CardContent>
              </div>

              <div className="px-5 pb-3 pt-1 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Info className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="truncate">Placeholder — Proposed System Design</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

