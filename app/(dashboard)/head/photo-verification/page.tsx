import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadPhotoVerificationView } from "@/features/photo-verification/components/HeadPhotoVerificationView";
import { getPhotoVerifications } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "Photo Verification Oversight | OMAG Polomolok",
  description: "Executive oversight of farm photograph metadata, deterministic distance validation, and AI advisory assessments.",
};

export default async function HeadPhotoVerificationPage() {
  await requireRole(["OMAG_HEAD"]);
  const result = await getPhotoVerifications({ page: 1, limit: 50 });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Photo Verification & Metadata Oversight"
        subtitle="Executive inspection of GPS match fidelity, EXIF camera timestamps, and AI advisory reviews."
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
