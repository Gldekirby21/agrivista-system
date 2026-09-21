"use client";

import React from "react";
import { Search, Calendar, Download } from "lucide-react";
import { DistributionRecordDTO } from "../types";

interface DistributionListProps {
  distributions: DistributionRecordDTO[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

export const DistributionList: React.FC<DistributionListProps> = ({
  distributions,
  loading,
  searchTerm,
  onSearchChange,
}) => {
  const exportCsv = () => {
    if (distributions.length === 0) return;
    const headers = [
      "Distribution Date",
      "Commodity Name",
      "Item Code",
      "Batch Number",
      "Released Qty",
      "Unit",
      "Beneficiary Last Name",
      "Beneficiary First Name",
      "RSBSA Number",
      "Barangay",
      "Released By",
      "Purpose / Reference",
    ];
    const rows = distributions.map((d) => [
      `"${new Date(d.distributionDate).toISOString()}"`,
      `"${(d.batch?.item?.name || "").replace(/"/g, '""')}"`,
      `"${d.batch?.item?.itemCode || ""}"`,
      `"${d.batch?.batchNumber || d.batchId}"`,
      d.quantityDistributed,
      `"${d.unit}"`,
      `"${(d.farmer?.lastName || "Barangay Pool").replace(/"/g, '""')}"`,
      `"${(d.farmer?.firstName || (d.barangay ? `Brgy. ${d.barangay}` : "")).replace(/"/g, '""')}"`,
      `"${d.farmer?.rsbsaNumber || d.requestId || ""}"`,
      `"${(d.barangay || d.farmer?.barangay || "Polomolok").replace(/"/g, '""')}"`,
      `"${(d.releasedBy?.fullName || "").replace(/"/g, '""')}"`,
      `"${(d.purpose || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OMAG_Distribution_Ledger_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            name="distributionSearch"
            placeholder="Search by beneficiary name, purpose, voucher ref, batch #..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            suppressHydrationWarning
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={exportCsv}
          disabled={distributions.length === 0}
          title="Export Distribution Report (CSV)"
          className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          Export Distribution Report
        </button>
      </div>

      {/* Distribution History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Distribution Date</th>
                <th className="px-4 py-3">Commodity Item</th>
                <th className="px-4 py-3">Batch #</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Released Qty</th>
                <th className="px-4 py-3">Beneficiary (RSBSA)</th>
                <th className="px-4 py-3">Barangay</th>
                <th className="px-4 py-3">Released By</th>
                <th className="px-4 py-3">Purpose / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading distribution ledger records...
                  </td>
                </tr>
              ) : distributions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No distribution transactions recorded yet.
                  </td>
                </tr>
              ) : (
                distributions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1 font-medium" suppressHydrationWarning>
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(d.distributionDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400" suppressHydrationWarning>
                        {new Date(d.distributionDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {d.batch?.item?.name || "Unknown Item"}
                      </div>
                      <div className="text-[10px] text-slate-500">{d.batch?.item?.itemCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {d.batch?.batchNumber || d.batchId.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {d.quantityDistributed} <span className="text-[11px] font-normal text-slate-500">{d.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      {d.farmer ? (
                        <div>
                          <span className="font-semibold text-slate-900">
                            {d.farmer.lastName}, {d.farmer.firstName}
                          </span>
                          {d.farmer.rsbsaNumber && (
                            <span className="block text-[10px] font-mono text-slate-500">
                              {d.farmer.rsbsaNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Barangay Pool Release
                          </span>
                          {d.requestId && (
                            <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                              Req: {d.requestId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {d.barangay ? `Brgy. ${d.barangay}` : d.farmer?.barangay ? `Brgy. ${d.farmer.barangay}` : "Polomolok"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">
                        {d.releasedBy?.fullName || "Staff Officer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{d.purpose || "Resource Distribution Program"}</div>
                      {d.remarks && <div className="text-[10px] text-slate-400 italic">{d.remarks}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
