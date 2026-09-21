"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  PcicClaimListItemDTO,
  ClaimStatus,
  CALAMITY_TYPES,
} from "../types";
import { PcicCaseTable } from "./PcicCaseTable";
import { CreateCaseModal } from "./CreateCaseModal";
import { CaseDetailModal } from "./CaseDetailModal";
import { UpdateStatusModal } from "./UpdateStatusModal";
import { CoordinationModal } from "./CoordinationModal";
import {
  ShieldAlert,
  Plus,
  Search,
  FileCheck2,
} from "lucide-react";

function StaffPcicContent() {
  const [claims, setClaims] = useState<PcicClaimListItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [calamityFilter, setCalamityFilter] = useState<string>("");

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [statusClaim, setStatusClaim] = useState<PcicClaimListItemDTO | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [coordinationClaim, setCoordinationClaim] = useState<PcicClaimListItemDTO | null>(null);
  const [isCoordinationOpen, setIsCoordinationOpen] = useState<boolean>(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("claimStatus", statusFilter);
      if (priorityFilter) params.append("priorityLevel", priorityFilter);
      if (calamityFilter) params.append("calamityType", calamityFilter);

      const res = await fetch(`/api/pcic/claims?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.items || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch PCIC claims", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, statusFilter, priorityFilter, calamityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-6 w-6 text-emerald-700 shrink-0" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Manage Crop-Loss Claims
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                OMAG Operational Workspace
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Create, search, and manage PCIC crop-loss claim dockets. Use the sidebar to access Evaluation, Priority Ranking, or Claim Monitoring.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Open New Claim Case</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Statutory Boundary Notice:</span> This module is an internal municipal monitoring mechanism for OMAG focal persons to track crop-loss reports and prioritize cases for adjuster coordination. It does <strong>NOT</strong> constitute official PCIC insurance approval, adjuster assessment replacement, or indemnity payment guarantee.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by claim #, farmer name, RSBSA, or crop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            suppressHydrationWarning
          >
            <option value="">Status: All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="FOR_REVIEW">For Review</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="COORDINATED_WITH_PCIC">Coordinated w/ PCIC</option>
            <option value="REQUIRES_CORRECTION">Requires Correction</option>
            <option value="DRAFT">Draft</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            suppressHydrationWarning
          >
            <option value="">Priority: All</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={calamityFilter}
            onChange={(e) => { setCalamityFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            suppressHydrationWarning
          >
            <option value="">Calamity: All</option>
            {CALAMITY_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(search || statusFilter || priorityFilter || calamityFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPriorityFilter("");
                setCalamityFilter("");
                setPage(1);
              }}
              className="text-slate-500 hover:text-slate-800 text-xs underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <PcicCaseTable
        claims={claims}
        loading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSelectClaim={(id) => {
          setSelectedClaimId(id);
          setIsDetailOpen(true);
        }}
        onUpdateStatus={(claim) => {
          setStatusClaim(claim);
          setIsStatusOpen(true);
        }}
        onCoordination={(claim) => {
          setCoordinationClaim(claim);
          setIsCoordinationOpen(true);
        }}
        onEdit={(claim) => {
          setSelectedClaimId(claim.id);
          setIsDetailOpen(true);
        }}
      />

      {/* Modals */}
      <CreateCaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchClaims}
      />

      <CaseDetailModal
        claimId={selectedClaimId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClaimId(null);
        }}
        onStatusUpdated={fetchClaims}
        isStaff={true}
      />

      <UpdateStatusModal
        claim={statusClaim}
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setStatusClaim(null);
        }}
        onUpdated={fetchClaims}
      />

      <CoordinationModal
        claim={coordinationClaim}
        isOpen={isCoordinationOpen}
        onClose={() => {
          setIsCoordinationOpen(false);
          setCoordinationClaim(null);
        }}
        onUpdated={fetchClaims}
      />
    </div>
  );
}

export const StaffPcicView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading PCIC Claims Workspace...</span>
        </div>
      }
    >
      <StaffPcicContent />
    </Suspense>
  );
};
