import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffYieldLossView } from "@/features/yield-loss/components/StaffYieldLossView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Crop Yield & Loss Prediction | OMAG Polomolok",
  description: "ML-based crop yield and economic loss prediction for field operations and agricultural planning.",
};

export default async function StaffPredictionsPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Yield & Loss Prediction"
        subtitle="Estimate projected yield, crop reduction, and potential economic loss using machine learning."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffYieldLossView />
        </div>
      </main>
    </div>
  );
}
