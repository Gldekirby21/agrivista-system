import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadResourceDemandView } from "@/features/resource-demand/components/HeadResourceDemandView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Resource Demand Oversight | OMAG Polomolok",
  description: "Executive oversight for agricultural resource demand forecasting and model evaluation.",
};

export default async function HeadResourceDemandPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Resource Demand Modeling Oversight"
        subtitle="Executive oversight of municipal seed and fertilizer forecasts, model accuracy, and historical trends."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <HeadResourceDemandView />
        </div>
      </main>
    </div>
  );
}
