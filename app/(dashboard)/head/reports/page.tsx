import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/common/ModulePlaceholder";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Reports & Production Summaries | OMAG Polomolok",
  description: "Municipal agricultural reporting, inventory distribution reconciliations, and production analytics.",
};

export default async function HeadReportsPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <ModulePlaceholder
      title="Reports & Analytics"
      subtitle="Executive municipal agricultural reports, inventory audits, and production summaries."
      moduleName="Municipal Reports & Analytics"
      targetPhase="Phase 9"
      icon={FileText}
      role="OMAG_HEAD"
      description="The Reports module aggregates agricultural production, beneficiary distribution records, crop calamity dossiers, and seasonal yield metrics into printable and exportable executive summaries for municipal governance."
      featuresList={[
        "Seasonal RSBSA Production Summaries",
        "Fertilizer & Seed Distribution Reconciliation Reports",
        "PCIC Calamity & Crop Loss Dossiers",
        "Barangay-Level Agricultural Yield Comparisons",
        "CSV & PDF Document Export Formats",
        "Scheduled Executive Briefing Summaries",
      ]}
    />
  );
}
