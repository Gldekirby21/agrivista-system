import React from "react";
import Link from "next/link";
import { Users, Camera, Boxes, FileSearch, SlidersHorizontal, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";

export const HeadQuickActions: React.FC = () => {
  const actions = [
    {
      id: "action-review-rsbsa",
      title: "Review Beneficiary Masterlist",
      description: "Inspect official municipal roster of enrolled RSBSA beneficiaries.",
      icon: Users,
      href: "/head/beneficiaries",
      badge: "Objective 1",
    },
    {
      id: "action-review-photos",
      title: "Review AI Metadata Verification Queue",
      description: "Inspect submitted field photographs, GPS tolerances, and Gemini AI advisories.",
      icon: Camera,
      href: "/head/photo-verification",
      badge: "Objective 2",
    },
    {
      id: "action-inspect-inventory",
      title: "Inspect FIFO Inventory Stocks",
      description: "Audit fertilizer lots, seed batches, and distribution records.",
      icon: Boxes,
      href: "/head/inventory",
      badge: "Objective 4",
    },
    {
      id: "action-review-claims",
      title: "Calamity & PCIC Review Docket",
      description: "Review pending PCIC crop loss reports, photo audits, and priority rankings.",
      icon: FileSearch,
      href: "/head/photo-verification",
      badge: "Objective 6",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-700" aria-hidden="true" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Administrative Quick Actions
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
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900 truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {act.badge}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};
