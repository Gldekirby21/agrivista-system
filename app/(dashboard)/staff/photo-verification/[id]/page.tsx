import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { PhotoVerificationDetail } from "@/features/photo-verification/components/PhotoVerificationDetail";
import { getPhotoVerificationById } from "@/features/photo-verification";
import { requireRole } from "@/lib/auth/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photo Verification Dossier | OMAG Polomolok",
  description: "Detailed photo metadata, deterministic evidence, and AI advisory interpretation.",
};

export default async function StaffPhotoVerificationDetailPage({ params }: PageProps) {
  await requireRole(["OMAG_STAFF"]);
  const { id } = await params;
  const record = await getPhotoVerificationById(id);

  if (!record) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Photo Verification Dossier"
        subtitle={`Audit Record ID: ${record.id}`}
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <PhotoVerificationDetail record={record} userRole="OMAG_STAFF" />
        </div>
      </main>
    </div>
  );
}
