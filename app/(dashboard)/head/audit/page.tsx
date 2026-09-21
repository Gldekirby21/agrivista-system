import React, { Suspense } from "react";
import { Header } from "@/components/layout/header/Header";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activity & System Audit Logs | OMAG Polomolok",
  description: "Immutable municipal system audit trail, security events, and record mutation ledger.",
};

export default async function HeadAuditLogsPage() {
  await requireRole(["OMAG_HEAD"]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Activity & Audit Logs"
        subtitle="Executive inspection of system mutations, authentication logs, and data security events across all municipal modules."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <Suspense fallback={<div className="text-xs text-slate-400 p-8 text-center">Loading audit log view...</div>}>
            <AuditLogViewer defaultRole="OMAG_HEAD" />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
