"use client";

import React from "react";
import { Search, Filter, Calendar, MapPin, Edit3, Trash2, Download } from "lucide-react";
import { InventoryBatchDTO } from "../types";

interface BatchListProps {
  batches: InventoryBatchDTO[];
  loading: boolean;
  statusFilter: string;
  searchTerm: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onEditBatch?: (batch: InventoryBatchDTO) => void;
  onArchiveBatch?: (batch: InventoryBatchDTO) => void;
  userRole?: "OMAG_HEAD" | "OMAG_STAFF";
}

export const BatchList: React.FC<BatchListProps> = ({
  batches,
  loading,
  statusFilter,
  searchTerm,
  onStatusChange,
  onSearchChange,
  onEditBatch,
  onArchiveBatch,
  userRole = "OMAG_STAFF",
}) => {
  const exportCsv = () => {
    if (batches.length === 0) return;
    const headers = [
      "Batch Number",
      "Commodity Name",
      "Item Code",
      "Received Qty",
      "Remaining Qty",
      "Unit",
      "Date Received (FIFO)",
      "Expiry Date",
      "Viability Date",
      "Storage Location",
      "Supplier Source",
      "Status",
    ];
    const rows = batches.map((b) => [
      `"${b.batchNumber}"`,
      `"${(b.item?.name || "").replace(/"/g, '""')}"`,
      `"${b.item?.itemCode || ""}"`,
      b.receivedQuantity,
      b.remainingQuantity,
      `"${b.item?.unit || "units"}"`,
      `"${new Date(b.dateReceived).toISOString().split("T")[0]}"`,
      b.expiryDate ? `"${new Date(b.expiryDate).toISOString().split("T")[0]}"` : `""`,
      b.viabilityDate ? `"${new Date(b.viabilityDate).toISOString().split("T")[0]}"` : `""`,
      `"${(b.storageLocation || "").replace(/"/g, '""')}"`,
      `"${(b.supplierSource || "").replace(/"/g, '""')}"`,
      `"${b.status}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OMAG_Batch_Inventory_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            name="batchSearch"
            placeholder="Search by batch identifier, supplier source, storage location..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            name="batchStatusFilter"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            suppressHydrationWarning
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Low Stock">Low Stock Only</option>
            <option value="Depleted">Depleted Only</option>
            <option value="Expired">Expired</option>
            <option value="Archived">Archived</option>
          </select>

          <button
            onClick={exportCsv}
            disabled={batches.length === 0}
            title="Export Batch Report (CSV)"
            className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Export Batches
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Batch / Lot #</th>
                <th className="px-4 py-3">Commodity Item</th>
                <th className="px-4 py-3 text-right">Received Qty</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Remaining Qty</th>
                <th className="px-4 py-3">Received Date (FIFO Key)</th>
                <th className="px-4 py-3">Expiry / Viability</th>
                <th className="px-4 py-3">Storage Location</th>
                <th className="px-4 py-3">Status</th>
                {userRole === "OMAG_STAFF" && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={userRole === "OMAG_STAFF" ? 9 : 8} className="px-4 py-8 text-center text-slate-500">
                    Loading batch records...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={userRole === "OMAG_STAFF" ? 9 : 8} className="px-4 py-8 text-center text-slate-400">
                    No batches found matching criteria.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const unit = batch.item?.unit || "units";

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {batch.batchNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{batch.item?.name || "Unknown Item"}</div>
                        <div className="text-[11px] text-slate-500">Code: {batch.item?.itemCode}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {batch.receivedQuantity} <span className="text-[11px] text-slate-400">{unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {batch.remainingQuantity} <span className="text-[11px] font-normal text-slate-500">{unit}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1 font-medium" suppressHydrationWarning>
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          {new Date(batch.dateReceived).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {batch.expiryDate ? (
                          <div>
                            <span className="font-medium text-slate-700" suppressHydrationWarning>
                              {new Date(batch.expiryDate).toLocaleDateString()}
                            </span>
                            {batch.isExpired ? (
                              <span className="block text-[10px] font-bold text-red-600">Expired</span>
                            ) : batch.isExpiringSoon ? (
                              <span className="block text-[10px] font-bold text-amber-600">
                                Expires in {batch.daysUntilExpiry}d
                              </span>
                            ) : null}
                          </div>
                        ) : batch.viabilityDate ? (
                          <div>
                            <span className="font-medium text-slate-700">
                              {new Date(batch.viabilityDate).toLocaleDateString()}
                            </span>
                            <span className="block text-[10px] text-emerald-700 font-semibold">Seed Viability</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {batch.storageLocation ? (
                          <div className="flex items-center gap-1 truncate max-w-[160px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{batch.storageLocation}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            batch.status === "Depleted"
                              ? "bg-slate-200 text-slate-700"
                              : batch.status === "Low Stock"
                              ? "bg-amber-100 text-amber-800"
                              : batch.status === "Expired"
                              ? "bg-red-100 text-red-800"
                              : batch.status === "Archived"
                              ? "bg-slate-100 text-slate-500 border border-slate-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      {userRole === "OMAG_STAFF" && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditBatch?.(batch)}
                              title="Edit Batch Details"
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded font-medium text-[11px] flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              Edit
                            </button>
                            <button
                              onClick={() => onArchiveBatch?.(batch)}
                              disabled={batch.status === "Archived"}
                              title="Archive Batch"
                              className="px-2 py-1 text-red-700 hover:bg-red-50 border border-red-200 rounded font-medium text-[11px] disabled:opacity-40 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              Archive
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
