import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffMonitoringView } from "@/features/pcic/components/StaffMonitoringView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Claim Monitoring | OMAG Polomolok",
  description:
    "Track PCIC adjuster coordination, insurance policy registration, and crop-loss claim lifecycle status for OMAG Polomolok municipal monitoring.",
};

export default async function StaffMonitoringPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Claim Monitoring"
        subtitle="Track PCIC coordination, policy registration, and claim lifecycle status for all affected farmers."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffMonitoringView />
        </div>
      </main>
    </div>
  );
}
