import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/common/ModulePlaceholder";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Reports & Operational Summaries | OMAG Polomolok",
  description: "Field distribution summaries and barangay agricultural records.",
};

export default async function StaffReportsPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <ModulePlaceholder
      title="Operational Reports"
      subtitle="Field reports, beneficiary rosters, and inventory dispatch summaries."
      moduleName="Field & Operational Reports"
      targetPhase="Phase 9"
      icon={FileText}
      role="OMAG_STAFF"
      description="The Operations Reports desk allows field technicians and staff officers to generate batch issuance receipts, RSBSA verification rosters, and damaged crop submission tables."
      featuresList={[
        "Beneficiary Dispatch Slips & Acknowledgments",
        "Barangay-Specific RSBSA Farmer Rosters",
        "Field Photo Inspection Status Lists",
        "Batch Viability & Expiration Watchlists",
      ]}
    />
  );
}
