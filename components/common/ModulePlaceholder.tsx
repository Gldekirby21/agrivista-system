import React from "react";
import { Header } from "@/components/layout/header/Header";
import { Badge } from "@/components/common/Badge";
import { LucideIcon, ShieldCheck, Clock, Layers } from "lucide-react";
import { UserRole } from "@/types";

export interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  moduleName: string;
  targetPhase: string;
  icon: LucideIcon;
  description: string;
  featuresList: string[];
  role: UserRole;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  subtitle,
  moduleName,
  targetPhase,
  icon: Icon,
  description,
  featuresList,
  role,
}) => {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header title={title} subtitle={subtitle} role={role} />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {moduleName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Municipal Administrative & Analytics Architecture
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="warning">{targetPhase}</Badge>
                <Badge variant="neutral">System Shell Active</Badge>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {description}
            </p>

            {/* Audit Trail Note */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-950">Backend Audit Trail Active: </span>
                All system transactions, enrollments, distributions, predictions, and verification workflows continue to be captured in real-time in the immutable PostgreSQL database audit log. Visual aggregation interfaces will be rendered in {targetPhase}.
              </div>
            </div>
          </div>

          {/* Planned Features List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Scheduled Functional Components ({targetPhase})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featuresList.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-700 font-medium"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-300 text-[10px] font-bold text-slate-600 shrink-0">
                    {idx + 1}
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
