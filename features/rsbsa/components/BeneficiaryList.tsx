"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, Edit, Archive, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { BeneficiaryListItem } from "../lib/beneficiaryQueries";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/common/Modal";
import { BeneficiaryForm } from "./BeneficiaryForm";

const POLOMOLOK_BARANGAYS = [
  "ALL",
  "Bentung",
  "Cannery Site",
  "Crossing Pangi",
  "Glamang",
  "Kinilis",
  "Klinan 6",
  "Koronadal Proper",
  "Lam-caliaf",
  "Lapu",
  "Lumakil",
  "Maligo",
  "Magsaysay",
  "Pagalungan",
  "Poblacion",
  "Polo",
  "Rubber",
  "Silway 7",
  "Silway 8",
  "Sulit",
  "Sumbakil",
  "Upper Klinan",
];

interface BeneficiaryListProps {
  initialBeneficiaries: BeneficiaryListItem[];
  totalCount: number;
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({
  initialBeneficiaries,
  totalCount,
  userRole,
}) => {
  const router = useRouter();
  const isStaff = userRole === "OMAG_STAFF";

  const [search, setSearch] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);

  // Client-side quick filter for fast response
  const filtered = initialBeneficiaries.filter((item) => {
    const matchesSearch =
      search.trim() === "" ||
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (item.rsbsaNumber && item.rsbsaNumber.toLowerCase().includes(search.toLowerCase())) ||
      (item.farmerCode && item.farmerCode.toLowerCase().includes(search.toLowerCase())) ||
      item.barangay.toLowerCase().includes(search.toLowerCase());

    const matchesBarangay =
      selectedBarangay === "ALL" ||
      item.barangay.toLowerCase() === selectedBarangay.toLowerCase();

    const matchesStatus =
      selectedStatus === "ALL" ||
      item.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesBarangay && matchesStatus;
  });

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleArchive = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to archive beneficiary "${name}"? This record can be restored later.`)) {
      return;
    }

    setArchivingId(id);
    setArchiveError(null);
    setArchiveSuccess(null);

    try {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive beneficiary");
      }

      setArchiveSuccess(`Beneficiary "${name}" has been archived successfully.`);
      router.refresh();
    } catch (err: any) {
      setArchiveError(err?.message || "An error occurred while archiving.");
    } finally {
      setArchivingId(null);
    }
  };

  const basePath = isStaff ? "/staff/beneficiaries" : "/head/beneficiaries";

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by RSBSA ID, name, or barangay..."
                className="w-full rounded-md border border-slate-300 pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-label="Search Beneficiaries"
              />
            </div>

            {/* Barangay Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="rounded-md border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-label="Filter by Barangay"
              >
                {POLOMOLOK_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b === "ALL" ? "All Barangays" : b}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-label="Filter by Status"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Action Button for Staff */}
          {isStaff && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              className="text-xs h-8 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Add Beneficiary
            </Button>
          )}
        </div>

        {/* Notices */}
        {archiveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{archiveSuccess}</span>
          </div>
        )}
        {archiveError && (
          <div className="mt-3 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{archiveError}</span>
          </div>
        )}
      </div>

      {/* Beneficiary Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">RSBSA / Reg ID</th>
                <th scope="col" className="px-4 py-3">Beneficiary Name</th>
                <th scope="col" className="px-4 py-3">Barangay</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3">Sector</th>
                <th scope="col" className="px-4 py-3">Farm Area</th>
                <th scope="col" className="px-4 py-3">Crops</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-800">
                      {item.rsbsaNumber || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.barangay}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {item.contactNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.farmerCode || "Smallholder"}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {item.totalHectares > 0 ? `${item.totalHectares} ha` : "0 ha"}
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({item.parcelCount} {item.parcelCount === 1 ? "parcel" : "parcels"})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.activeCrops.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.activeCrops.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800 border border-emerald-200"
                            >
                              {c}
                            </span>
                          ))}
                          {item.activeCrops.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{item.activeCrops.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None logged</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={item.status === "Active" ? "success" : "neutral"}
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`${basePath}/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            title={isStaff ? "View & Manage Beneficiary" : "Review Beneficiary"}
                            aria-label={`View ${item.fullName}`}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                            {isStaff ? "Manage" : "Review"}
                          </Button>
                        </Link>

                        {isStaff && item.status !== "Archived" && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => handleArchive(item.id, item.fullName)}
                            disabled={archivingId === item.id}
                            title="Archive Beneficiary"
                            aria-label={`Archive ${item.fullName}`}
                          >
                            <Archive className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <p className="text-xs font-medium">No beneficiary records found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {search || selectedBarangay !== "ALL" || selectedStatus !== "ALL"
                        ? "Try clearing your search or filter parameters."
                        : "Use the Add Beneficiary button above to register the first agricultural beneficiary."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filtered.length}</strong> of{" "}
            <strong className="text-slate-700">{totalCount}</strong> recorded beneficiaries
          </span>
          <span className="text-[11px] text-amber-700">
            Synthetic Demonstration Data — Not Actual OMAG Records
          </span>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Beneficiary Registration Intake"
        subtitle="Enroll a farmer beneficiary with verified RSBSA identifiers and sector attributes."
        size="3xl"
      >
        <BeneficiaryForm
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsRegisterModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
