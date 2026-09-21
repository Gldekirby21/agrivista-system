import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/common/ModulePlaceholder";
import { Settings } from "lucide-react";

export const metadata = {
  title: "System & Municipal Settings | OMAG Polomolok",
  description: "System parameters, GPS tolerance configuration, and user preferences.",
};

export default async function HeadSettingsPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <ModulePlaceholder
      title="System Settings"
      subtitle="Executive configuration of system parameters, operational thresholds, and municipal baselines."
      moduleName="System Configuration & Thresholds"
      targetPhase="Phase 9"
      icon={Settings}
      role="OMAG_HEAD"
      description="The Settings panel centralizes municipal operational parameters. Configurable thresholds—such as the 500m photo GPS tolerance radius, FIFO batch expiration warning windows, and PCIC severity weighting factors—can be adjusted here to align with official OMAG ordinances."
      featuresList={[
        "Photo GPS Verification Radius Threshold (Default 500m)",
        "FIFO Inventory Warning Horizon (Days before viability expiry)",
        "PCIC Damage Severity vs Reporting Date Weighting Ratio (70/30)",
        "Municipal Season Dates & Production Cycle Calendars",
        "Barangay Boundary & Coordinate Master Configurations",
        "Security & Session Timeout Parameters",
      ]}
    />
  );
}
