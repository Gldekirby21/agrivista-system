import React, { Suspense } from "react";
import { Header } from "@/components/layout/header/Header";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operational Activity & Audit Trail | OMAG Polomolok",
  description: "Session activity, personal operational transaction records, and field verification events.",
};

export default async function StaffAuditLogsPage() {
  await requireRole(["OMAG_STAFF"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Activity / Audit Logs"
        subtitle="Operational record of field verifications, stock allocations, and transactions registered by OMAG station."
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <Suspense fallback={<div className="text-xs text-slate-400 p-8 text-center">Loading audit log view...</div>}>
            <AuditLogViewer defaultRole="OMAG_STAFF" />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
