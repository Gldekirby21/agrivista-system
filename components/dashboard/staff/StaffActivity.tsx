import React from "react";
import { Activity, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { prisma } from "@/lib/database/prisma";
import { formatDate } from "@/lib/utils";

export const StaffActivity: React.FC = async () => {
  let auditLogs: Array<{
    id: string;
    action: string;
    module: string;
    timestamp: Date;
    roleSnapshot: string | null;
  }> = [];

  try {
    auditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        action: true,
        module: true,
        timestamp: true,
        roleSnapshot: true,
      },
    });
  } catch (error) {
    console.error("Database audit log notice in StaffActivity:", error);
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-700" aria-hidden="true" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Recent Field & Operations Activity
          </CardTitle>
        </div>
        <Badge variant="neutral" size="sm">
          Field Operations
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {auditLogs.length > 0 ? (
          <ul className="divide-y divide-slate-100" role="list">
            {auditLogs.map((log) => (
              <li key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                    {log.module}
                  </span>
                  <span>Logged by {log.roleSnapshot || "Staff"}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <Clock className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              No Field Operations Recorded
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 max-w-xs mx-auto">
              Beneficiary intakes, parcel plot verifications, and commodity releases will be logged here in real time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
