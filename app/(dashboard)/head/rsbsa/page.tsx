import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadRSBSAView } from "@/features/rsbsa/components/HeadRSBSAView";
import { getFarmers, getRSBSASummaryStats } from "@/features/rsbsa/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "RSBSA Oversight | OMAG Polomolok",
  description: "Executive census oversight and parcel landholdings review.",
};

export default async function HeadRSBSAPage() {
  const [farmersResult, summaryStats] = await Promise.all([
    getFarmers({ page: 1, limit: 15 }),
    getRSBSASummaryStats(),
  ]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Registry & Landholding Oversight"
        subtitle="Office of the Municipal Agriculturist — Polomolok Administrative Headquarters"
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <HeadRSBSAView
            initialFarmers={farmersResult.items}
            pagination={farmersResult.pagination}
            summaryStats={summaryStats}
          />
        </div>
      </main>
    </div>
  );
}
