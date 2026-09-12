import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffYieldLossView } from "@/features/yield-loss/components/StaffYieldLossView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Yield & Loss Prediction | OMAG Polomolok",
  description: "Machine-learning-based crop yield and economic loss estimation for agricultural planning.",
};

export default async function StaffPredictionsPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Crop Yield & Loss Analytics"
        subtitle="Machine learning regression model for projected yield reduction and potential economic loss."
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
