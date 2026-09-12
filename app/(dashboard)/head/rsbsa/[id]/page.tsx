import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { FarmerDetails } from "@/features/rsbsa/components/FarmerDetails";
import { getFarmerById } from "@/features/rsbsa/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Farmer Profile | OMAG Polomolok",
  description: "Executive review of farmer profile, landholdings, crops, and documents.",
};

export default async function HeadFarmerDetailPage({
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
        title="RSBSA Farmer Profile Review"
        subtitle={`Reviewing records for ${farmer.lastName}, ${farmer.firstName} — Polomolok Agricultural Oversight`}
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <FarmerDetails farmer={farmer} isStaff={false} baseBackHref="/head/rsbsa" />
        </div>
      </main>
    </div>
  );
}
