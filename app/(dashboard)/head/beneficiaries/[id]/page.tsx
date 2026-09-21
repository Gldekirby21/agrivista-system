import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { BeneficiaryDetails } from "@/features/rsbsa/components/BeneficiaryDetails";
import { getBeneficiaryById } from "@/features/rsbsa/lib/beneficiaryQueries";
import { requireRole } from "@/lib/auth/session";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Beneficiary Record | OMAG Polomolok",
  description: "Executive review of beneficiary profile, farm parcels, and supporting land documents.",
};

export default async function HeadBeneficiaryDetailPage({ params }: Props) {
  await requireRole(["OMAG_HEAD"]);
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
        title="Beneficiary Review & Landholding Dossier"
        subtitle={`RSBSA Record for ${beneficiary.firstName} ${beneficiary.lastName}`}
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-4 md:p-5">
        <div className="max-w-7xl mx-auto space-y-4">
          <BeneficiaryDetails
            beneficiary={beneficiary}
            isStaff={false}
            baseBackHref="/head/beneficiaries"
          />
        </div>
      </main>
    </div>
  );
}
