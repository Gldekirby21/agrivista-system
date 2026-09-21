import React from "react";
import { Header } from "@/components/layout/header/Header";
import { BeneficiaryIntakeForm } from "@/features/rsbsa/components/BeneficiaryIntakeForm";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Beneficiary Registration Intake | OMAG Head Review",
  description: "Executive intake form for enrolling farmer beneficiary profiles, landholdings, parcels, and crop baselines.",
};

export default async function HeadNewBeneficiaryPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Beneficiary & Landholding Intake"
        subtitle="Executive administrative intake for registered producers, landholdings, standing crops, and supporting documents."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <BeneficiaryIntakeForm
            baseHref="/head/beneficiaries"
            userRole="OMAG_HEAD"
          />
        </div>
      </main>
    </div>
  );
}
