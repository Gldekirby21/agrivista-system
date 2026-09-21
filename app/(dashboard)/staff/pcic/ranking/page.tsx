import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffRankingView } from "@/features/pcic/components/StaffRankingView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Priority Ranking | OMAG Polomolok",
  description:
    "Deterministic 70/30 weighted priority score ranking of crop-loss claims to prioritize PCIC adjuster coordination per barangay.",
};

export default async function StaffRankingPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Priority Ranking"
        subtitle="Barangay-based priority ranking to identify and prioritize high-severity crop-loss claims."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffRankingView />
        </div>
      </main>
    </div>
  );
}
