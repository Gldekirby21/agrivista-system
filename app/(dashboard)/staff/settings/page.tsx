import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/common/ModulePlaceholder";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Station Settings | OMAG Polomolok",
  description: "User preferences and operational station configuration.",
};

export default async function StaffSettingsPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <ModulePlaceholder
      title="Station Settings"
      subtitle="Operational preferences, default barangay filters, and notification settings."
      moduleName="Operations Station Settings"
      targetPhase="Phase 9"
      icon={Settings}
      role="OMAG_STAFF"
      description="The Staff Settings panel enables technicians and desk staff to configure workstation preferences, customize default filter views for barangay records, and manage personal display preferences."
      featuresList={[
        "Default Barangay Filter Preference",
        "Field Photo Upload Auto-Compression Settings",
        "Display Preferences & Table Density Controls",
        "Session Activity Notifications",
      ]}
    />
  );
}
