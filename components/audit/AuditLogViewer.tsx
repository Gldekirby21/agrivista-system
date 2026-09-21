"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Layers,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  User,
  Database,
  Terminal,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpDown,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogItem {
  id: string;
  userId: string | null;
  roleSnapshot: string | null;
  action: string;
  module: string;
  recordId: string | null;
  previousValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  timestamp: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
  } | null;
}

interface AuditResponse {
  success: boolean;
  data: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const MODULES = [
  { id: "ALL", label: "All Modules" },
  { id: "CROP_PREDICTION", label: "Crop Prediction" },
  { id: "PHOTO_VERIFICATION", label: "Photo Verification" },
  { id: "PCIC_CLAIM", label: "PCIC Claims" },
  { id: "INVENTORY", label: "FIFO Inventory" },
  { id: "RSBSA", label: "RSBSA Registry" },
  { id: "RESOURCE_DEMAND", label: "Resource Demand" },
  { id: "AUTH", label: "Security & Auth" },
];

export function AuditLogViewer({ defaultRole }: { defaultRole?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialModule = searchParams.get("module") || "ALL";
  const initialSearch = searchParams.get("search") || "";
  const initialRecordId = searchParams.get("recordId") || "";

  const [selectedModule, setSelectedModule] = useState(initialModule);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [recordIdFilter, setRecordIdFilter] = useState(initialRecordId);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const [isPending, startTransition] = useTransition();

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedModule && selectedModule !== "ALL") params.set("module", selectedModule);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (recordIdFilter.trim()) params.set("recordId", recordIdFilter.trim());
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");

      const json: AuditResponse = await res.json();
      if (json.success) {
        setLogs(json.data);
        setTotalLogs(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error("Audit log error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedModule, page, limit, recordIdFilter]);

  // Sync URL query params if filtered from external links
  useEffect(() => {
    const qModule = searchParams.get("module");
    const qRecordId = searchParams.get("recordId");
    const qSearch = searchParams.get("search");

    if (qModule && qModule !== selectedModule) setSelectedModule(qModule);
    if (qRecordId && qRecordId !== recordIdFilter) setRecordIdFilter(qRecordId);
    if (qSearch && qSearch !== searchTerm) setSearchTerm(qSearch);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleClearFilters = () => {
    setSelectedModule("ALL");
    setSearchTerm("");
    setRecordIdFilter("");
    setPage(1);
    router.replace(pathname);
  };

  const getModuleBadgeColor = (mod: string) => {
    const m = (mod || "").toUpperCase();
    if (m.includes("PREDICT")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (m.includes("PHOTO")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (m.includes("PCIC")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (m.includes("INVENTORY")) return "bg-amber-50 text-amber-800 border-amber-200";
    if (m.includes("RSBSA")) return "bg-teal-50 text-teal-800 border-teal-200";
    if (m.includes("AUTH")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
    switch (role) {
      case "OMAG_HEAD":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "OMAG_STAFF":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Municipal Activity &amp; Audit Trail Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Centralized tamper-evident record of all system modifications, field evaluations, and user transactions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-emerald-600")} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* Search & Inputs */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, user name, email, or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Filter by Exact Record ID"
              value={recordIdFilter}
              onChange={(e) => {
                setRecordIdFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-colors font-mono"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Apply Filter
            </button>
            {(searchTerm || recordIdFilter || selectedModule !== "ALL") && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Module Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Module:
          </span>
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedModule(m.id);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-all border",
                selectedModule === m.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Database className="h-4 w-4 text-emerald-700" />
            <span>
              Showing {logs.length} of {totalLogs} registered audit transactions
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor (Role)</th>
                <th className="py-3 px-4">Target Record</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading municipal audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No audit logs found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try selecting a different module or clearing the search query.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md border text-[10px] font-bold font-mono uppercase tracking-wide",
                          getModuleBadgeColor(log.module)
                        )}
                      >
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap font-mono text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="font-medium text-slate-900">
                          {log.user?.fullName || log.userId || "System Service"}
                        </div>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 text-[9px] font-bold rounded border",
                            getRoleBadgeColor(log.roleSnapshot || log.user?.role)
                          )}
                        >
                          {log.roleSnapshot || log.user?.role || "SYSTEM"}
                        </span>
                      </div>
                      {log.user?.email && (
                        <span className="text-[10px] text-slate-400 block">{log.user.email}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {log.recordId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRecordIdFilter(log.recordId || "");
                            setPage(1);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors"
                          title="Click to isolate this record ID"
                        >
                          #{log.recordId}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="h-3 w-3 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page <span className="font-bold text-slate-800">{page}</span> of{" "}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5 inline mr-1" />
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Audit Transaction Event Inspector
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400">ID: {selectedLog.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Module</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.module}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Action</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Actor</span>
                  <span className="font-medium text-slate-800">
                    {selectedLog.user?.fullName || selectedLog.userId || "System"} (
                    {selectedLog.roleSnapshot || selectedLog.user?.role || "SYSTEM"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Record ID</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedLog.recordId || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Timestamp</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">IP Address</span>
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress || "Internal (127.0.0.1)"}</span>
                </div>
              </div>

              {/* State Changes */}
              {selectedLog.previousValues && Object.keys(selectedLog.previousValues).length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-amber-600" />
                    Previous State (Before Mutation):
                  </span>
                  <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40 scrollbar-thin">
                    {JSON.stringify(selectedLog.previousValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Committed Values / Payloads:
                  </span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 scrollbar-thin">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
