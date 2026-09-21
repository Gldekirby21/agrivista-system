import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffInventoryView } from "@/features/inventory/components/StaffInventoryView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fertilizer & Seeds Inventory | OMAG Polomolok",
  description: "FIFO-based batch tracking, expiration monitoring, and resource distribution operations.",
};

export default async function StaffInventoryPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Fertilizer & Seeds Inventory"
        subtitle="FIFO-based batch tracking, longevity monitoring, and auditable agricultural resource distribution."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffInventoryView />
        </div>
      </main>
    </div>
  );
}
