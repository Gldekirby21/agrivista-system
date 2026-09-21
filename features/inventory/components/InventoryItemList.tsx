"use client";

import React from "react";
import { Search, Filter, Plus, Send, AlertTriangle, CheckCircle, Package, Edit3, Trash2, Download } from "lucide-react";
import { InventoryItemDTO } from "../types";

interface InventoryItemListProps {
  items: InventoryItemDTO[];
  loading: boolean;
  categoryFilter: string;
  searchTerm: string;
  onCategoryChange: (cat: string) => void;
  onSearchChange: (search: string) => void;
  onOpenReceiveBatch: (itemId: number) => void;
  onOpenDistribute: (itemId: number) => void;
  onEditItem?: (item: InventoryItemDTO) => void;
  onArchiveItem?: (item: InventoryItemDTO) => void;
  userRole?: "OMAG_HEAD" | "OMAG_STAFF";
}

export const InventoryItemList: React.FC<InventoryItemListProps> = ({
  items,
  loading,
  categoryFilter,
  searchTerm,
  onCategoryChange,
  onSearchChange,
  onOpenReceiveBatch,
  onOpenDistribute,
  onEditItem,
  onArchiveItem,
  userRole = "OMAG_STAFF",
}) => {
  const exportCsv = () => {
    if (items.length === 0) return;
    const headers = ["Item Code", "Commodity Name", "Category", "Available Stock", "Unit", "Total Received", "Distributed", "Reorder Level", "Status"];
    const rows = items.map((i) => [
      `"${i.itemCode}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.totalRemaining,
      `"${i.unit}"`,
      i.totalReceived,
      i.totalDistributed,
      i.reorderLevel,
      `"${i.totalRemaining <= 0 ? "Out of Stock" : i.isLowStock ? "Low Stock" : "In Stock"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OMAG_Inventory_Catalog_Report_${new Date().toISOString().split("T")[0]}.csv`);
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
            name="inventoryItemSearch"
            placeholder="Search by commodity name, code, description..."
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
            name="inventoryCategoryFilter"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            suppressHydrationWarning
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            <option value="FERTILIZER">Fertilizers Only</option>
            <option value="SEEDS">Seeds Only</option>
          </select>

          <button
            onClick={exportCsv}
            disabled={items.length === 0}
            title="Export Inventory Report (CSV)"
            className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Export Report
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Commodity Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Available Stock</th>
                <th className="px-4 py-3 text-right">Total Received</th>
                <th className="px-4 py-3 text-right">Distributed</th>
                <th className="px-4 py-3 text-right">Reorder Alert</th>
                <th className="px-4 py-3">Status</th>
                {userRole === "OMAG_STAFF" && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={userRole === "OMAG_STAFF" ? 9 : 8} className="px-4 py-8 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={userRole === "OMAG_STAFF" ? 9 : 8} className="px-4 py-8 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No inventory catalog items found matching criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isDepleted = item.totalRemaining <= 0;
                  const isLow = item.isLowStock && !isDepleted;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.itemCode}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.category === "FERTILIZER"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {item.totalRemaining} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {item.totalReceived} <span className="text-[11px] text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {item.totalDistributed} <span className="text-[11px] text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{item.reorderLevel}</td>
                      <td className="px-4 py-3">
                        {isDepleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>
                      {userRole === "OMAG_STAFF" && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => onOpenReceiveBatch(item.id)}
                              title="Receive New Batch"
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded font-medium text-[11px] flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3 text-emerald-600" />
                              Receive
                            </button>
                            <button
                              onClick={() => onOpenDistribute(item.id)}
                              disabled={item.totalRemaining <= 0}
                              title="Distribute Stock (FIFO)"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] disabled:opacity-40 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Distribute
                            </button>
                            <button
                              onClick={() => onEditItem?.(item)}
                              title="Edit Catalog Item"
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded font-medium text-[11px] flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              Edit
                            </button>
                            <button
                              onClick={() => onArchiveItem?.(item)}
                              title="Archive Catalog Item"
                              className="px-2 py-1 text-red-700 hover:bg-red-50 border border-red-200 rounded font-medium text-[11px] flex items-center gap-1"
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
