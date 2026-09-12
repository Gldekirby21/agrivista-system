import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffRSBSAView } from "@/features/rsbsa/components/StaffRSBSAView";
import { getFarmers } from "@/features/rsbsa/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "RSBSA Intake & Records | OMAG Polomolok",
  description: "Field operational intake for farmer records, parcels, and crop cycles.",
};

export default async function StaffRSBSAPage() {
  const farmersResult = await getFarmers({ page: 1, limit: 15 });

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Operational Records & Intake Desk"
        subtitle="Office of the Municipal Agriculturist — Polomolok Agricultural Operations"
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffRSBSAView
            initialFarmers={farmersResult.items}
            pagination={farmersResult.pagination}
          />
        </div>
      </main>
    </div>
  );
}
