import React from "react";
import {
  Users,
  MapPin,
  TrendingUp,
  Camera,
  Boxes,
  FileCheck2,
  FileText,
  Activity,
  FolderOpen,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

export const StaffOverview: React.FC = () => {
  const operations = [
    {
      id: "beneficiary-rsbsa",
      title: "Beneficiary / RSBSA",
      icon: Users,
      badge: "Objective 1",
      description: "Beneficiary registration, demographic records, and RSBSA profile intake.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 1",
    },
    {
      id: "farm-parcel",
      title: "Farm / Parcel",
      icon: MapPin,
      badge: "Objective 1 & 2",
      description: "Farm tract mapping, cadastral parcel boundaries, and GPS coordinates.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 1 & 2",
    },
    {
      id: "crop",
      title: "Crop",
      icon: TrendingUp,
      badge: "Objective 3",
      description: "Crop variety tracking, commodity planting schedules, and harvest records.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 3",
    },
    {
      id: "photo-verification",
      title: "Photo Verification",
      icon: Camera,
      badge: "Objective 2",
      description: "Geotagged field inspection photo intake and EXIF coordinate verification.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 2",
    },
    {
      id: "inventory",
      title: "Inventory",
      icon: Boxes,
      badge: "Objective 4",
      description: "FIFO commodity release slips, seed bag distribution, and fertilizer logs.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 4",
    },
    {
      id: "pcic-monitoring",
      title: "PCIC Monitoring",
      icon: FileCheck2,
      badge: "Objective 6",
      description: "Field damage report filing and PCIC insurance docket documentation.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Objective 6",
    },
    {
      id: "reports",
      title: "Reports",
      icon: FileText,
      badge: "Reporting",
      description: "Barangay field distribution tallies and operational summary sheets.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Reporting Module",
    },
    {
      id: "activity",
      title: "Activity",
      icon: Activity,
      badge: "Operations",
      description: "Field action audit log and technician activity stream overview.",
      placeholderMessage: "No data available",
      statusNotice: "Module available in Operations Stream",
    },
  ];

  return (
    <section aria-labelledby="staff-operations-heading" className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 id="staff-operations-heading" className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Field Operations &amp; Modules
        </h2>
        <span className="text-[11px] text-slate-500">
          Phase 2 Dashboard Shell — Navigation Placeholders Only
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <Card key={op.id} className="flex flex-col justify-between border-slate-200">
              <div>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700 shrink-0">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xs font-bold text-slate-800 leading-tight truncate">
                      {op.title}
                    </CardTitle>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {op.badge}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    {op.description}
                  </p>

                  {/* Clean, Basic Empty State Placeholder */}
                  <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
                    <FolderOpen className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {op.placeholderMessage}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {op.statusNotice}
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

