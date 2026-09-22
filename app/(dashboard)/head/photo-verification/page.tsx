import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadPhotoVerificationView } from "@/features/photo-verification/components/HeadPhotoVerificationView";
import { getCropLossCaseVerifications } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Crop-Loss Case & Photo Verification Oversight | OMAG Polomolok",
  description: "Executive oversight of farm photograph metadata, deterministic distance validation, and Gemini AI advisory assessments.",
};

export default async function HeadPhotoVerificationPage() {
  await requireRole(["OMAG_HEAD"]);
  const result = await getCropLossCaseVerifications({ page: 1, limit: 50, userRole: "OMAG_HEAD" });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Crop-Loss Case Verification & Photo Audit Oversight"
        subtitle="Executive oversight of consolidated crop-loss cases, multi-photo cadastral geofence audits, and PCIC claim monitoring."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <HeadPhotoVerificationView
            initialItems={result.items}
            totalCount={result.pagination.total}
          />
        </div>
      </main>
    </div>
  );
}
