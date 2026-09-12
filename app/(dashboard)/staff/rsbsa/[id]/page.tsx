import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { FarmerDetails } from "@/features/rsbsa/components/FarmerDetails";
import { getFarmerById } from "@/features/rsbsa/lib/queries";

export const metadata = {
  title: "Farmer Workspace | OMAG Polomolok",
  description: "Operational management of farmer profile, landholdings, parcels, crops, and documents.",
};

export default async function StaffFarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farmerId = parseInt(id, 10);
  if (isNaN(farmerId)) {
    notFound();
  }

  const farmer = await getFarmerById(farmerId);
  if (!farmer) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Farmer Management Workspace"
        subtitle={`Managing records for ${farmer.lastName}, ${farmer.firstName} — Polomolok Agricultural Operations`}
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <FarmerDetails farmer={farmer} isStaff={true} baseBackHref="/staff/rsbsa" />
        </div>
      </main>
    </div>
  );
}
