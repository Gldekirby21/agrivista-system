import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadResourceDemandView } from "@/features/resource-demand/components/HeadResourceDemandView";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Historical Crop Yield & Purchase Modeling | OMAG Polomolok",
  description: "Executive oversight for historical crop yield records and purchase modeling estimates.",
};

export default async function HeadResourceDemandPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Historical Crop Yield & Purchase Modeling"
        subtitle="Executive oversight of historical crop production data, estimated resource requirements, and modeling results."
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
