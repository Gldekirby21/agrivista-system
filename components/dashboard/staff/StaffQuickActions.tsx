import React from "react";
import Link from "next/link";
import { UserPlus, Camera, PackagePlus, FilePlus2, SlidersHorizontal, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";

export const StaffQuickActions: React.FC = () => {
  const actions = [
    {
      id: "action-enroll-farmer",
      title: "Enroll Beneficiary (RSBSA)",
      description: "Open beneficiary roster & register verified farmer profiles.",
      icon: UserPlus,
      href: "/staff/beneficiaries",
      badge: "Objective 1",
    },
    {
      id: "action-upload-photo",
      title: "Upload Verification Photo",
      description: "Submit geotagged farm photos for GPS and metadata validation.",
      icon: Camera,
      href: "/staff/photo-verification",
      badge: "Objective 2",
    },
    {
      id: "action-issue-stock",
      title: "Issue FIFO Commodity",
      description: "Record warehouse distribution slips using oldest active batch.",
      icon: PackagePlus,
      href: "/staff/inventory?tab=distribute",
      badge: "Objective 4",
    },
    {
      id: "action-file-damage",
      title: "File Field Damage Report",
      description: "Document calamity impact, AI scan photo evidence, and evaluate farmer claim.",
      icon: FilePlus2,
      href: "/staff/photo-verification/new",
      badge: "Objective 6",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-700" aria-hidden="true" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Operational Quick Actions
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.id}
              href={act.href}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-200 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-sky-900 truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                  {act.badge}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};
