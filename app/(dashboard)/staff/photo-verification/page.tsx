import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffPhotoVerificationView } from "@/features/photo-verification/components/StaffPhotoVerificationView";
import { getPhotoVerifications } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photo & GPS Verification | OMAG Polomolok",
  description: "AI-assisted metadata verification and audit tracking for submitted farm photographs.",
};

export default async function StaffPhotoVerificationPage() {
  await requireRole(["OMAG_STAFF"]);
  const result = await getPhotoVerifications({ page: 1, limit: 50 });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Photo Metadata Verification"
        subtitle="Deterministic GPS distance calculation and AI advisory interpretation for farm photos."
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
