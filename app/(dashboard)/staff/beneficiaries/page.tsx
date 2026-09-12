import React from "react";
import { Header } from "@/components/layout/header/Header";
import { BeneficiaryList } from "@/features/rsbsa/components/BeneficiaryList";
import { getBeneficiaries } from "@/features/rsbsa/lib/beneficiaryQueries";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "RSBSA Beneficiaries | OMAG Polomolok",
  description: "Centralized Agricultural Information Management for RSBSA beneficiaries, farm parcels, crops, and land documents.",
};

export default async function StaffBeneficiariesPage() {
  await requireRole(["OMAG_STAFF"]);
  const result = await getBeneficiaries({ page: 1, limit: 50 });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Beneficiary & Agricultural Records"
        subtitle="Centralized management of verified beneficiaries, landholdings, standing crops, and tenure documents."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <BeneficiaryList
            initialBeneficiaries={result.items}
            totalCount={result.pagination.total}
            userRole="OMAG_STAFF"
          />
        </div>
      </main>
    </div>
  );
}
