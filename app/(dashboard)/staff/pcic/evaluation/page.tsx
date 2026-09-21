import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffEvaluationView } from "@/features/pcic/components/StaffEvaluationView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Crop-Loss Case Management | OMAG Polomolok",
  description:
    "Manage crop-loss cases, field damage assessments, and verified photo records for OMAG Polomolok.",
};

export default async function StaffEvaluationPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Crop-Loss Case Management"
        subtitle="Manage crop-loss cases, field damage assessments, and verified photo records."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffEvaluationView />
        </div>
      </main>
    </div>
  );
}
