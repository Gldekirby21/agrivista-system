import { Header } from "@/components/layout/header/Header";
import { requireRole } from "@/lib/auth/session";
import { BeneficiaryIntakeForm } from "@/features/rsbsa/components/BeneficiaryIntakeForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Beneficiary Registration Intake | OMAG Polomolok",
  description: "Comprehensive agricultural intake form for registering farmer profile, farm landholding, parcel plots, crops, and land documents.",
};

export default async function StaffNewBeneficiaryPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="New RSBSA Beneficiary Intake"
        subtitle="Centralized registration of farmer profiles, farm landholdings, parcels, standing crops, and land titles."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <BeneficiaryIntakeForm
            baseHref="/staff/beneficiaries"
            userRole="OMAG_STAFF"
          />
        </div>
      </main>
    </div>
  );
}
