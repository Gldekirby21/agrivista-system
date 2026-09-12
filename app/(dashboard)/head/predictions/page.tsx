import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadYieldLossView } from "@/features/yield-loss/components/HeadYieldLossView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Yield & Loss Prediction | OMAG Polomolok",
  description: "Machine-learning-based crop yield and economic loss estimation for agricultural planning.",
};

export default async function HeadPredictionsPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Crop Yield & Loss Analytics"
        subtitle="Executive oversight on municipal crop yield forecasts and economic damage estimations."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <HeadYieldLossView />
        </div>
      </main>
    </div>
  );
}
