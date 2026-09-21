"use client";

import React, { useState, useEffect, Suspense } from "react";
import { PcicClaimListItemDTO, ClaimStatus } from "../types";
import { CaseDetailModal } from "./CaseDetailModal";
import { CoordinationModal } from "./CoordinationModal";
import { Activity, ShieldAlert } from "lucide-react";

function StaffMonitoringContent() {
  const [claims, setClaims] = useState<PcicClaimListItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [coordinationClaim, setCoordinationClaim] = useState<PcicClaimListItemDTO | null>(null);
  const [isCoordinationOpen, setIsCoordinationOpen] = useState<boolean>(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const res = await fetch(`/api/pcic/claims?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.items || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch monitoring claims", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page]);

  const coordinatedCount = claims.filter((c) => c.claimStatus === "COORDINATED_WITH_PCIC").length;
  const pendingCount = claims.filter((c) => c.claimStatus === "SUBMITTED" || c.claimStatus === "FOR_REVIEW").length;

  return (
    <div className="space-y-5 text-xs">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-700 shrink-0" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Claim Monitoring
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold text-[11px]">
                PCIC Coordination Desk
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Track OMAG coordination with PCIC adjusters, insurance policy registration, and claim lifecycle status for affected farmers.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Statutory Boundary Notice:</span> This module tracks internal OMAG coordination with PCIC focal persons. It does <strong>NOT</strong> constitute official PCIC insurance approval or indemnity payment guarantee.
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Total Registered Claims</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{claims.length}</p>
          <span className="text-[10px] text-slate-400">All filed cases this page</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Coordinated with PCIC</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{coordinatedCount}</p>
          <span className="text-[10px] text-emerald-600">Adjuster notified</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Under Review / Pending</span>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-amber-600">Awaiting coordination</span>
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Claim #</th>
                <th className="py-3 px-4">Farmer / Beneficiary</th>
                <th className="py-3 px-4">Barangay</th>
                <th className="py-3 px-4">Policy No.</th>
                <th className="py-3 px-4">Coordination Status</th>
                <th className="py-3 px-4">Filing Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading monitoring records...</span>
                    </div>
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No claims registered for monitoring.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {claim.claimNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {claim.farmerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{claim.barangay}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {claim.insurancePolicyNo || "Pending Assignment"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          claim.claimStatus === "COORDINATED_WITH_PCIC"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : claim.claimStatus === "FOR_REVIEW"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {claim.claimStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(claim.filingDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCoordinationClaim(claim);
                            setIsCoordinationOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[11px] cursor-pointer"
                        >
                          Coordination
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClaimId(claim.id);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px] cursor-pointer"
                        >
                          Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-[11px] text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold disabled:opacity-40 cursor-pointer hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold disabled:opacity-40 cursor-pointer hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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

export const StaffMonitoringView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading Claim Monitoring...</span>
        </div>
      }
    >
      <StaffMonitoringContent />
    </Suspense>
  );
};
