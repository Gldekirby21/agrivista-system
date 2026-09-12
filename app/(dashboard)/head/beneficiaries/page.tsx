import React from "react";
import { Header } from "@/components/layout/header/Header";
import { BeneficiaryList } from "@/features/rsbsa/components/BeneficiaryList";
import { getBeneficiaries } from "@/features/rsbsa/lib/beneficiaryQueries";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "RSBSA Beneficiaries Review | OMAG Polomolok",
  description: "Administrative oversight of RSBSA beneficiaries, farm landholdings, and crop cycles.",
};

export default async function HeadBeneficiariesPage() {
  await requireRole(["OMAG_HEAD"]);
  const result = await getBeneficiaries({ page: 1, limit: 50 });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Beneficiaries Directory & Review"
        subtitle="Executive oversight of registered agricultural producers, landholdings, and production baselines."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <BeneficiaryList
            initialBeneficiaries={result.items}
            totalCount={result.pagination.total}
            userRole="OMAG_HEAD"
          />
        </div>
      </main>
    </div>
  );
}
