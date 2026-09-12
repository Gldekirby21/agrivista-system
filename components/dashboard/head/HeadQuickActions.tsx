import React from "react";
import { Download, FileSearch, Shield, Settings, SlidersHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Button } from "@/components/ui/Button";

export const HeadQuickActions: React.FC = () => {
  const actions = [
    {
      id: "action-export-rsbsa",
      title: "Export Beneficiary Masterlist",
      description: "Generate official municipal summary of enrolled beneficiaries.",
      icon: Download,
      phase: "Objective 1",
    },
    {
      id: "action-review-claims",
      title: "Calamity Review Docket",
      description: "Review pending PCIC crop loss reports and damage estimates.",
      icon: FileSearch,
      phase: "Objective 6",
    },
    {
      id: "action-audit-logs",
      title: "Inspect System Audit Trail",
      description: "Inspect tamper-evident logs of administrative actions.",
      icon: Shield,
      phase: "Coming Soon",
    },
    {
      id: "action-config",
      title: "Municipal System Parameters",
      description: "Configure barangay boundaries, thresholds, and crop seasons.",
      icon: Settings,
      phase: "Coming Soon",
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
            <div
              key={act.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-[11px] h-7 px-2.5 opacity-80 cursor-not-allowed"
                disabled
                aria-label={`${act.title} (${act.phase})`}
              >
                {act.phase}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
