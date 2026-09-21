import React from "react";
import { Header } from "@/components/layout/header/Header";
import { PhotoVerificationNewForm } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New AI Metadata Verification Audit | OMAG Polomolok",
  description: "Register and verify raw farm photographs with EXIF GPS against cadastral parcels.",
};

export default async function HeadPhotoVerificationNewPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="AI Metadata Verification"
        subtitle="Intake & Audit Oversight Desk"
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <PhotoVerificationNewForm userRole="OMAG_HEAD" />
        </div>
      </main>
    </div>
  );
}
