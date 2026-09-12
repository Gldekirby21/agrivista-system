import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { BeneficiaryDetails } from "@/features/rsbsa/components/BeneficiaryDetails";
import { getBeneficiaryById } from "@/features/rsbsa/lib/beneficiaryQueries";
import { requireRole } from "@/lib/auth/session";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Beneficiary Record & Dossier | OMAG Polomolok",
  description: "Detailed beneficiary agricultural profile, farms, parcels, crops, and land documents.",
};

export default async function StaffBeneficiaryDetailPage({ params }: Props) {
  await requireRole(["OMAG_STAFF"]);
  const { id } = await params;
  const beneficiaryId = parseInt(id, 10);

  if (isNaN(beneficiaryId)) {
    notFound();
  }

  const beneficiary = await getBeneficiaryById(beneficiaryId);

  if (!beneficiary) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Beneficiary Agricultural Dossier"
        subtitle={`RSBSA Record for ${beneficiary.firstName} ${beneficiary.lastName}`}
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <BeneficiaryDetails
            beneficiary={beneficiary}
            isStaff={true}
            baseBackHref="/staff/beneficiaries"
          />
        </div>
      </main>
    </div>
  );
}
