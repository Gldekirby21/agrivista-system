"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { PcicClaimListItemDTO, CALAMITY_TYPES, CROP_STAGES } from "../types";
import { CaseDetailModal } from "./CaseDetailModal";
import { CreateCaseModal } from "./CreateCaseModal";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Camera,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";

function StaffEvaluationContent() {
  const [claims, setClaims] = useState<PcicClaimListItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [calamityFilter, setCalamityFilter] = useState<string>("");
  const [evalFilter, setEvalFilter] = useState<string>("");

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Inline Assessment Modal State
  const [assessingClaim, setAssessingClaim] = useState<PcicClaimListItemDTO | null>(null);
  const [modalAssessedDamage, setModalAssessedDamage] = useState<number>(0);
  const [modalAssessedArea, setModalAssessedArea] = useState<number>(1);
  const [modalCropStage, setModalCropStage] = useState<string>("Vegetative");
  const [modalNotes, setModalNotes] = useState<string>("");
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.append("search", search);
      if (calamityFilter) params.append("calamityType", calamityFilter);

      const res = await fetch(`/api/pcic/claims?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.items || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch PCIC claims for evaluation", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, calamityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  const handleOpenAssessmentModal = (claim: PcicClaimListItemDTO) => {
    setAssessingClaim(claim);
    setModalAssessedDamage(
      claim.assessedDamagePercent !== null && claim.assessedDamagePercent !== undefined
        ? Number(claim.assessedDamagePercent)
        : Number(claim.reportedDamagePercent || 0)
    );
    setModalAssessedArea(
      claim.reportedAffectedAreaHa !== null && claim.reportedAffectedAreaHa !== undefined
        ? Number(claim.reportedAffectedAreaHa)
        : 1
    );
    setModalCropStage(claim.cropStage || "Vegetative");
    setModalNotes("");
    setModalError(null);
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessingClaim) return;
    setModalError(null);

    if (modalAssessedDamage < 0 || modalAssessedDamage > 100) {
      setModalError("Assessed Damage must be between 0% and 100%.");
      return;
    }
    if (modalAssessedArea <= 0) {
      setModalError("Assessed Area must be greater than 0 ha.");
      return;
    }

    setModalSaving(true);
    try {
      const res = await fetch(`/api/pcic/claims/${assessingClaim.id}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessedDamagePercent: modalAssessedDamage,
          assessedAreaHa: modalAssessedArea,
          cropStage: modalCropStage,
          assessorNotes: modalNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save assessment");
      }

      setAssessingClaim(null);
      fetchClaims();
    } catch (err: any) {
      setModalError(err.message || "Failed to save assessment");
    } finally {
      setModalSaving(false);
    }
  };

  const filteredClaims = evalFilter === "evaluated"
    ? claims.filter((c) => c.assessedDamagePercent !== null && c.assessedDamagePercent !== undefined)
    : evalFilter === "pending"
    ? claims.filter((c) => c.assessedDamagePercent === null || c.assessedDamagePercent === undefined)
    : claims;

  const evaluatedCount = claims.filter((c) => c.assessedDamagePercent !== null && c.assessedDamagePercent !== undefined).length;

  return (
    <div className="space-y-5 text-xs">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-purple-700 shrink-0" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Crop-Loss Case Management
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold text-[11px]">
                Case Docket &amp; Evaluation
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Manage crop-loss cases, field damage assessments, and verified photo records for OMAG Polomolok.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-purple-700">{evaluatedCount}</p>
              <p className="text-[10px] text-slate-500">of {claims.length} Evaluated</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
              title="Record / Evaluate new crop-loss case"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Evaluate</span>
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Statutory Boundary Notice:</span> Field damage assessments recorded here are OMAG internal evaluations. They do <strong>NOT</strong> replace official PCIC adjuster assessments or constitute indemnity payment guarantees.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case #, farmer, crop, barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-purple-500"
              suppressHydrationWarning
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer">
            Search
          </button>
        </form>

        <select
          value={calamityFilter}
          onChange={(e) => { setCalamityFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500 cursor-pointer"
          suppressHydrationWarning
        >
          <option value="">Calamity: All</option>
          {CALAMITY_TYPES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={evalFilter}
          onChange={(e) => setEvalFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500 cursor-pointer"
          suppressHydrationWarning
        >
          <option value="">Status: All</option>
          <option value="evaluated">Evaluated</option>
          <option value="pending">Pending Evaluation</option>
        </select>

        {(search || calamityFilter || evalFilter) && (
          <button
            onClick={() => { setSearch(""); setCalamityFilter(""); setEvalFilter(""); setPage(1); }}
            className="text-slate-500 hover:text-slate-800 text-xs underline px-1 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Case Management Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Case / Report #</th>
                <th className="py-3 px-4">Farmer</th>
                <th className="py-3 px-4">Barangay</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4 text-center">Reported Damage</th>
                <th className="py-3 px-4 text-center">Affected Area</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading crop-loss case records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No crop-loss cases found.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const hasAssessment =
                    claim.assessedDamagePercent !== null &&
                    claim.assessedDamagePercent !== undefined;
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Case / Report # */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/staff/photo-verification/${claim.reportId}`}
                          className="text-slate-900 hover:text-purple-700 hover:underline transition-colors block"
                          title="Click to view consolidated case dossier"
                        >
                          {claim.reportNumber || `REP-${claim.reportId}`}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Claim #{claim.claimNumber}
                        </div>
                      </td>

                      {/* Farmer (Clickable link to consolidated case dossier) */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/staff/photo-verification/${claim.reportId}`}
                          className="font-bold text-purple-700 hover:text-purple-900 hover:underline transition-colors block text-xs"
                          title="Click to view consolidated case dossier"
                        >
                          {claim.farmerName}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {claim.farmerRsbsa ? `RSBSA: ${claim.farmerRsbsa}` : "No RSBSA"}
                        </div>
                      </td>

                      {/* Barangay */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {claim.barangay}
                      </td>

                      {/* Crop */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{claim.cropType}</div>
                        <div className="text-[10px] text-slate-500">
                          Parcel {claim.parcelNumber ?? "—"}
                        </div>
                      </td>

                      {/* Reported Damage % */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {claim.reportedDamagePercent}%
                        </span>
                      </td>

                      {/* Affected Area */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-semibold text-slate-700">
                          {claim.reportedAffectedAreaHa !== null && claim.reportedAffectedAreaHa !== undefined
                            ? `${Number(claim.reportedAffectedAreaHa).toFixed(2)} ha`
                            : "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {hasAssessment ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Evaluated ({claim.assessedDamagePercent}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" /> Pending Evaluation
                          </span>
                        )}
                      </td>

                      {/* Action: [ Assessment ] + [ Photo Verified ] + Delete */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Assessment Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => handleOpenAssessmentModal(claim)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-semibold text-[11px] transition-colors cursor-pointer"
                            title={hasAssessment ? "Update Field Assessment" : "Perform Field Assessment"}
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Assessment</span>
                          </button>

                          {/* Photo Verified Navigation -> Photo submission page */}
                          <Link
                            href={`/staff/photo-verification/new?damageReportId=${claim.reportId}${claim.farmerId ? `&farmerId=${claim.farmerId}` : ""}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Submit / upload photo to verify if farmer image is authentic"
                          >
                            <Camera className="h-3 w-3" />
                            <span>Photo Verified</span>
                          </Link>

                          {/* Delete Claim Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to permanently delete case ${claim.reportNumber || claim.claimNumber} (${claim.farmerName})?`)) {
                                try {
                                  const res = await fetch(`/api/pcic/claims/${claim.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    fetchClaims();
                                  } else {
                                    const errData = await res.json();
                                    alert(errData.error || "Failed to delete claim");
                                  }
                                } catch (e: any) {
                                  alert(e.message || "Error deleting claim");
                                }
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Delete Case ${claim.claimNumber}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Assessment Modal (Inline) */}
      {assessingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Field Damage Assessment
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Case #{assessingClaim.reportNumber || assessingClaim.claimNumber} • {assessingClaim.farmerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssessingClaim(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Read-Only Reference Data */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Farmer / Barangay</span>
                  <span className="font-bold text-slate-800">{assessingClaim.farmerName}</span>
                  <span className="text-slate-500 block">{assessingClaim.barangay}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Crop / Calamity</span>
                  <span className="font-bold text-slate-800">{assessingClaim.cropType}</span>
                  <span className="text-slate-500 block">{assessingClaim.calamityType}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 col-span-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-amber-800 font-semibold block text-[10px] uppercase">Reported Damage %</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {assessingClaim.reportedDamagePercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-semibold block text-[10px] uppercase">Reported Affected Area</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {assessingClaim.reportedAffectedAreaHa !== null && assessingClaim.reportedAffectedAreaHa !== undefined
                        ? `${Number(assessingClaim.reportedAffectedAreaHa).toFixed(2)} ha`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Assessed Damage (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={modalAssessedDamage}
                      onChange={(e) => setModalAssessedDamage(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Assessed Area (ha) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={modalAssessedArea}
                      onChange={(e) => setModalAssessedArea(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ha
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Crop Stage during Inspection <span className="text-red-500">*</span>
                </label>
                <select
                  value={modalCropStage}
                  onChange={(e) => setModalCropStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                >
                  {CROP_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Assessment Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record specific crop damage symptoms, flood duration, field verification findings..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssessingClaim(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{modalSaving ? "Saving..." : "Save Assessment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Claim Modal if needed */}
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

      {/* Evaluate / Add Crop-Loss Case Modal */}
      <CreateCaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchClaims();
        }}
      />
    </div>
  );
}

export const StaffEvaluationView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading Crop-Loss Case Management...</span>
        </div>
      }
    >
      <StaffEvaluationContent />
    </Suspense>
  );
};
