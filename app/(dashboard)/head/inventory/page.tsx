import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadInventoryView } from "@/features/inventory/components/HeadInventoryView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory Oversight & Auditing | OMAG Polomolok",
  description: "Executive monitoring of agricultural commodities, batch status, and resource distribution logs.",
};

export default async function HeadInventoryPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Inventory Oversight & Auditing"
        subtitle="Executive oversight of municipal fertilizer and seed stocks, lot longevity, and distribution audit trails."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <HeadInventoryView />
        </div>
      </main>
    </div>
  );
}
