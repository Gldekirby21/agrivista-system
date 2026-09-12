import React from "react";
import { Header } from "@/components/layout/header/Header";
import { BeneficiaryForm } from "@/features/rsbsa/components/BeneficiaryForm";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register Beneficiary | OMAG Polomolok",
  description: "Intake form for enrolling a new agricultural beneficiary in the RSBSA system.",
};

export default async function NewBeneficiaryPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Beneficiary Registration Intake"
        subtitle="Enroll a farmer beneficiary with verified RSBSA identifiers and sector attributes."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BeneficiaryForm />
        </div>
      </main>
    </div>
  );
}
