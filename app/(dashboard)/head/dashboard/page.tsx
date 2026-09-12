import React from "react";
import { Header } from "@/components/layout/header/Header";
import { HeadDashboardView } from "@/components/dashboard/head/HeadDashboardView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Head Dashboard | OMAG Polomolok",
  description: "Executive agricultural administration and analytics dashboard for OMAG Head.",
};

/**
 * Thin composition page for OMAG Head Dashboard
 */
export default function HeadDashboardPage() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Executive Agricultural Oversight Dashboard"
        subtitle="Office of the Municipal Agriculturist — Municipality of Polomolok"
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <HeadDashboardView />
        </div>
      </main>
    </div>
  );
}
