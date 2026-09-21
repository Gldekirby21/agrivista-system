import React from "react";
import { Header } from "@/components/layout/header/Header";
import { PhotoVerificationNewForm } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photo Verification Submission | OMAG Polomolok",
  description: "Register crop damage photographs and verify EXIF GPS coordinates against registered farm parcels.",
};

export default async function StaffPhotoVerificationNewPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Photo Verification Submission"
        subtitle="Submit field photos and perform deterministic GPS geofence and timestamp verification."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <PhotoVerificationNewForm userRole="OMAG_STAFF" />
        </div>
      </main>
    </div>
  );
}
