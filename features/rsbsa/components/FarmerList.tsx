"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Eye, User, MapPin, Sprout } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { FarmerListItem, POLOMOLOK_BARANGAYS } from "../types";

export interface FarmerListProps {
  initialFarmers: FarmerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isStaff?: boolean;
  baseHref?: string;
  onFilterChange?: (search: string, barangay: string, page: number) => void;
}

export const FarmerList: React.FC<FarmerListProps> = ({
  initialFarmers,
  pagination,
  isStaff = false,
  baseHref = "/staff/rsbsa",
  onFilterChange,
}) => {
  const [search, setSearch] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(pagination.page);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    onFilterChange?.(search, selectedBarangay, 1);
  };

  const handleBarangayChange = (b: string) => {
    setSelectedBarangay(b);
    setCurrentPage(1);
    onFilterChange?.(search, b, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      onFilterChange?.(search, selectedBarangay, newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by farmer name, RSBSA ID, or category..."
            className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none"
            aria-label="Search RSBSA farmers"
          />
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <label htmlFor="barangay-select" className="sr-only">
              Filter by Barangay
            </label>
            <select
              id="barangay-select"
              value={selectedBarangay}
              onChange={(e) => handleBarangayChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-medium text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Barangays (Polomolok)</option>
              {POLOMOLOK_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={handleSearchSubmit}>
            <Filter className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Filter
          </Button>

          {isStaff && (
            <Link
              href={baseHref.startsWith("/head") ? "/head/beneficiaries/new" : "/staff/beneficiaries/new"}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Register Farmer
            </Link>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Farmer Name &amp; Profile
                </th>
                <th scope="col" className="px-4 py-3">
                  RSBSA Number
                </th>
                <th scope="col" className="px-4 py-3">
                  Barangay
                </th>
                <th scope="col" className="px-4 py-3">
                  Landholdings
                </th>
                <th scope="col" className="px-4 py-3">
                  Latest Recorded Crops
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialFarmers.length > 0 ? (
                initialFarmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0 font-bold text-xs">
                          <User className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {farmer.lastName}, {farmer.firstName} {farmer.middleName ? `${farmer.middleName[0]}.` : ""}{" "}
                            {farmer.extensionName || ""}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {farmer.farmerCode || "Agricultural Producer"}
                            {farmer.isSenior && " • Senior"}
                            {farmer.is4ps && " • 4Ps"}
                            {farmer.isIp && " • IP"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                      {farmer.rsbsaNumber ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200 font-semibold">
                          {farmer.rsbsaNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span>Brgy. {farmer.barangay}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900">{farmer.totalHectares} ha</span>
                        <p className="text-[10px] text-slate-400">
                          {farmer.farmCount} farm{farmer.farmCount !== 1 ? "s" : ""} • {farmer.parcelCount} parcel{farmer.parcelCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {farmer.activeCrops.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {farmer.activeCrops.map((crop) => (
                            <Badge key={crop} variant="success" size="sm">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No crops recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`${baseHref}/${farmer.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Sprout className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                    <p className="mt-2 text-xs font-semibold text-slate-700">No RSBSA Records Found</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      No registered farmer profiles matched the selected criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{initialFarmers.length}</strong> of{" "}
            <strong className="text-slate-800">{pagination.total}</strong> records
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span className="px-2 text-xs font-semibold text-slate-700">
              Page {currentPage} of {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              aria-label="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};
