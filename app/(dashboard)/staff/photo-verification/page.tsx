import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffPhotoVerificationView } from "@/features/photo-verification/components/StaffPhotoVerificationView";
import { getCropLossCaseVerifications } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consolidated Crop-Loss Case Records | OMAG Polomolok",
  description: "View consolidated crop-loss cases with farmer, farm parcel, crop, damage report, evaluation, and photo records.",
};

export default async function StaffPhotoVerificationPage() {
  await requireRole(["OMAG_STAFF"]);
  const result = await getCropLossCaseVerifications({ page: 1, limit: 50 });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Consolidated Crop-Loss Case Records"
        subtitle="Consolidated records viewing farmer profiles, farm parcels, damage reports, assessments, and verified photo telemetry."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffPhotoVerificationView
            initialItems={result.items}
            totalCount={result.pagination.total}
          />
        </div>
      </main>
    </div>
  );
}
