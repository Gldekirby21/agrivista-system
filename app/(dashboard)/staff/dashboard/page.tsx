import React from "react";
import { Header } from "@/components/layout/header/Header";
import { StaffDashboardView } from "@/components/dashboard/staff/StaffDashboardView";

export const metadata = {
  title: "Staff Dashboard | OMAG Polomolok",
  description: "Field operations and record verification dashboard for OMAG Staff.",
};

/**
 * Thin composition page for OMAG Staff Dashboard
 */
export default function StaffDashboardPage() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Agricultural Operations & Analytics Dashboard"
        subtitle="Office of the Municipal Agriculturist — Municipality of Polomolok"
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaffDashboardView />
        </div>
      </main>
    </div>
  );
}
