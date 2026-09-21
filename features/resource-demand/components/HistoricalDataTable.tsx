"use client";

import React, { useState, useEffect } from "react";
import {
  HistoricalAgriculturalDataDTO,
  POLOMOLOK_BARANGAYS,
  SUPPORTED_CROPS,
  SEASONS,
} from "../types";
import { Search, Filter, Edit2, Archive, AlertCircle, RefreshCw } from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";

interface HistoricalDataTableProps {
  isStaff?: boolean;
  onEdit?: (record: HistoricalAgriculturalDataDTO) => void;
  onRefreshTrigger?: number;
}

export const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({
  isStaff = false,
  onEdit,
  onRefreshTrigger = 0,
}) => {
  const [records, setRecords] = useState<HistoricalAgriculturalDataDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Archive modal
  const [recordToArchive, setRecordToArchive] = useState<HistoricalAgriculturalDataDTO | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        status: statusFilter,
      });
      if (search.trim()) params.append("search", search.trim());
      if (selectedBarangay) params.append("barangay", selectedBarangay);
      if (selectedCrop) params.append("cropType", selectedCrop);
      if (selectedSeason) params.append("season", selectedSeason);

      const res = await fetch(`/api/resource-demand/historical?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load historical data (HTTP ${res.status})`);
      }
      const data = await res.json();
      setRecords(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load historical records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, statusFilter, selectedBarangay, selectedCrop, selectedSeason, onRefreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleConfirmArchive = async () => {
    if (!recordToArchive) return;
    setArchiveLoading(true);
    try {
      const res = await fetch(`/api/resource-demand/historical/${recordToArchive.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to archive record");
      }
      setRecordToArchive(null);
      fetchRecords();
    } catch (err: any) {
      alert(`Archive failed: ${err.message}`);
    } finally {
      setArchiveLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="historicalSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search barangay, crop, soil..."
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                suppressHydrationWarning
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              name="filterBarangay"
              value={selectedBarangay}
              onChange={(e) => { setSelectedBarangay(e.target.value); setPage(1); }}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              suppressHydrationWarning
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700"
            >
              <option value="">All Barangays</option>
              {POLOMOLOK_BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              name="filterCrop"
              value={selectedCrop}
              onChange={(e) => { setSelectedCrop(e.target.value); setPage(1); }}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              suppressHydrationWarning
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700"
            >
              <option value="">All Crops</option>
              {SUPPORTED_CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              name="filterSeason"
              value={selectedSeason}
              onChange={(e) => { setSelectedSeason(e.target.value); setPage(1); }}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              suppressHydrationWarning
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700"
            >
              <option value="">All Seasons</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              name="filterStatus"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              suppressHydrationWarning
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
            >
              <option value="ACTIVE">Active Records</option>
              <option value="ARCHIVED">Archived Records</option>
              <option value="ALL">All Statuses</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setSelectedBarangay("");
                setSelectedCrop("");
                setSelectedSeason("");
                setStatusFilter("ACTIVE");
                setPage(1);
              }}
              title="Reset Filters"
              className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
          <span>
            Showing <strong className="text-slate-800">{records.length}</strong> of{" "}
            <strong className="text-slate-800">{totalCount}</strong> historical agricultural entries
          </span>
          <span className="text-[11px] text-amber-700 font-medium">
            Scope: Multi-Year Historical Records (2020–2025)
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Year / Season</th>
                <th className="py-3 px-3">Barangay</th>
                <th className="py-3 px-3">Crop Type</th>
                <th className="py-3 px-3">Planted / Harvested</th>
                <th className="py-3 px-3">Production (t)</th>
                <th className="py-3 px-3">Avg Yield (t/ha)</th>
                <th className="py-3 px-3">Seed Used (kg)</th>
                <th className="py-3 px-3">Fertilizer (bags)</th>
                <th className="py-3 px-3">Soil / Calamity</th>
                <th className="py-3 px-3 text-center">Status</th>
                {isStaff && <th className="py-3 px-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={isStaff ? 11 : 10} className="py-8 text-center text-slate-400">
                    Loading historical agricultural data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={isStaff ? 11 : 10} className="py-8 text-center text-slate-400">
                    No historical records found matching filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {r.year} <span className="text-slate-500 font-normal">({r.season})</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{r.barangay}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {r.cropType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">{r.plantedAreaHa} ha</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-600">{r.harvestedAreaHa} ha</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{r.productionTons}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.averageYieldTonsHa}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700">
                      {r.seedUsageKg !== null && r.seedUsageKg !== undefined ? `${r.seedUsageKg} kg` : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">
                      {r.fertilizerUsageBags !== null && r.fertilizerUsageBags !== undefined
                        ? `${r.fertilizerUsageBags} bags`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-[11px] text-slate-600">{r.soilType || "Unspecified"}</div>
                      {r.calamityOccurrences > 0 && (
                        <span className="text-[10px] text-red-600 font-semibold">
                          {r.calamityOccurrences} calamity
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    {isStaff && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onEdit && r.status === "ACTIVE" && (
                            <button
                              onClick={() => onEdit(r)}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {r.status === "ACTIVE" && (
                            <button
                              onClick={() => setRecordToArchive(r)}
                              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Archive Record"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 text-slate-700"
            >
              Previous
            </button>
            <span className="text-slate-600 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 text-slate-700"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={recordToArchive !== null}
        title="Archive Historical Agricultural Record"
        message={`Are you sure you want to soft-archive record #${recordToArchive?.id} (${recordToArchive?.year} ${recordToArchive?.season} — ${recordToArchive?.cropType} in ${recordToArchive?.barangay})? The record will be preserved in the audit trail but excluded from active analytical calculations.`}
        confirmText="Archive Record"
        variant="danger"
        isLoading={archiveLoading}
        onConfirm={handleConfirmArchive}
        onClose={() => setRecordToArchive(null)}
      />
    </div>
  );
};
