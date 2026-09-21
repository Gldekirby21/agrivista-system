"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PcicClaimDTO, PriorityLevel, ClaimStatus, CROP_STAGES } from "../types";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  User,
  MapPin,
  Sprout,
  Shield,
  PhoneCall,
  History,
  X,
  Calendar,
  AlertCircle,
  Camera,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  XCircle,
  Link2,
  Pencil,
  Save,
  ClipboardList,
} from "lucide-react";

interface CaseDetailModalProps {
  claimId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
  isStaff?: boolean;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  claimId,
  isOpen,
  onClose,
  onStatusUpdated,
  isStaff = false,
}) => {
  const [claim, setClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Inline assessment form state
  const [showAssessmentForm, setShowAssessmentForm] = useState<boolean>(false);
  const [assessedDamagePercent, setAssessedDamagePercent] = useState<number>(0);
  const [assessedAreaHa, setAssessedAreaHa] = useState<number>(0);
  const [cropStage, setCropStage] = useState<string>("Vegetative");
  const [assessorNotes, setAssessorNotes] = useState<string>("");
  const [assessmentSaving, setAssessmentSaving] = useState<boolean>(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  const loadClaimDossier = async () => {
    if (!claimId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pcic/claims/${claimId}`);
      if (!res.ok) {
        throw new Error(`Failed to load claim dossier (${res.status})`);
      }
      const data = await res.json();
      setClaim(data);
      // Pre-fill assessment form if existing values
      if (data?.report?.assessment) {
        setAssessedDamagePercent(data.report.assessment.assessedDamagePercent ?? 0);
        setAssessedAreaHa(data.report.assessment.assessedAreaHa ?? 0);
        setCropStage(data.report.assessment.cropStage ?? "Vegetative");
        setAssessorNotes(data.report.assessment.assessorNotes ?? "");
      } else {
        // Seed from reported values as starting reference
        setAssessedDamagePercent(data?.report?.reportedDamagePercent ?? 0);
        setAssessedAreaHa(data?.report?.reportedAffectedAreaHa ?? 0);
        setCropStage("Vegetative");
        setAssessorNotes("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load claim details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !claimId) {
      setClaim(null);
      setShowAssessmentForm(false);
      setAssessmentError(null);
      return;
    }
    loadClaimDossier();
  }, [isOpen, claimId]);

  if (!isOpen) return null;

  const getPriorityBadge = (level?: PriorityLevel | null, rank?: number | null) => {
    if (!level) return <span className="text-slate-400 text-xs">—</span>;
    const rankText = rank ? `Rank #${rank}` : "";
    switch (level) {
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            {rankText ? `${rankText} (High Severity)` : "HIGH"}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            {rankText ? `${rankText} (Medium Severity)` : "MEDIUM"}
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {rankText ? `${rankText} (Low Severity)` : "LOW"}
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      case "FOR_REVIEW":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">For Review</span>;
      case "REVIEWED":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">Reviewed</span>;
      case "COORDINATED_WITH_PCIC":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Coordinated w/ PCIC</span>;
      case "REQUIRES_CORRECTION":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">Requires Correction</span>;
      case "DRAFT":
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACCEPTED
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> REQUIRES REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-900 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" /> REJECTED
          </span>
        );
      case "NOT_ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" /> NOT ACCEPTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> PENDING
          </span>
        );
    }
  };

  const formula = claim?.priorityScore?.formulaBreakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-3xl my-8 overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-base">
                {claim?.claimNumber || "PCIC Monitoring Case"}
              </span>
              {claim && getStatusBadge(claim.claimStatus)}
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Incident Report #{claim?.report?.reportNumber} | Registered:{" "}
              {claim?.filingDate ? new Date(claim.filingDate).toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {claim && (
              <Link
                href={`${isStaff ? "/staff" : "/head"}/photo-verification/${claim.report?.id || claim.reportId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-200" />
                <span>View Photos &amp; Verification</span>
                <ExternalLink className="h-3 w-3 text-emerald-200 opacity-80" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              Loading PCIC claim dossier...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !claim ? null : (
            <>
              {/* Statutory Non-Approval Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <Shield className="h-4 w-4 text-amber-700 shrink-0" />
                  Statutory PCIC Boundary & Advisory Notice:
                </div>
                This case record is an <strong>internal municipal monitoring tool</strong> maintained by OMAG to track crop-loss incidents and coordinate with the PCIC focal person and adjuster. It does <strong>NOT</strong> constitute official PCIC insurance approval, adjuster loss assessment, or claim payment authorization.
              </div>

              {/* Priority & Ranking Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Deterministic Priority Ranking
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      🟡 PROPOSED SYSTEM DESIGN
                    </span>
                  </div>
                  <div>
                    {getPriorityBadge(claim.priorityScore?.priorityLevel, claim.priorityScore?.rankPosition)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Composite Score
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      {claim.priorityScore?.score ? claim.priorityScore.score.toFixed(1) : "—"} / 100
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Damage Basis
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formula?.damageBasis === "ASSESSED" ? "Field Assessment" : "Reported Damage"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Applicable Severity
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      {formula?.applicableDamagePercent ? `${formula.applicableDamagePercent.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Date Aging Factor
                    </span>
                    <span className="font-mono text-slate-800 font-medium">
                      {formula?.daysElapsed !== undefined ? `${formula.daysElapsed} days ago` : "—"}
                    </span>
                  </div>
                </div>

                {formula?.explanation && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-mono">
                    {formula.explanation}
                  </div>
                )}
              </div>

              {/* Farmer & Farm Parcel Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Farmer Info */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">
                    <User className="h-4 w-4 text-slate-600" />
                    Beneficiary / RSBSA Profile
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <span className="text-slate-400">Full Name:</span>{" "}
                      <strong className="text-slate-900">
                        {claim.report?.farmer?.firstName} {claim.report?.farmer?.lastName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">RSBSA Number:</span>{" "}
                      <span className="font-mono font-medium text-slate-800">
                        {claim.report?.farmer?.rsbsaNumber || "Not recorded"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Barangay:</span>{" "}
                      <span className="text-slate-800 font-medium">
                        {claim.report?.farmer?.barangay}, Polomolok
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Contact Number:</span>{" "}
                      <span className="text-slate-800 font-mono">
                        {claim.report?.farmer?.contactNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Farm Parcel & Crop Info */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">
                    <Sprout className="h-4 w-4 text-emerald-600" />
                    Parcel & Standing Crop
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>
                      <span className="text-slate-400">Parcel Number:</span>{" "}
                      <strong className="text-slate-900 font-mono">
                        Parcel {claim.report?.parcel?.parcelNumber} ({claim.report?.parcel?.areaHa} ha)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Crop:</span>{" "}
                      <strong className="text-slate-900">
                        {claim.report?.crop?.cropType}{" "}
                        {claim.report?.crop?.variety ? `(${claim.report?.crop?.variety})` : ""}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Planted Area:</span>{" "}
                      <span className="font-mono text-slate-800">
                        {claim.report?.crop?.plantedAreaHa} ha
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Policy / Coverage:</span>{" "}
                      <span className="font-mono text-slate-800">
                        {claim.insurancePolicyNo || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reported vs Assessed Damage Comparison */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>Damage Severity Information</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Separated per 🔴 Pending OMAG Confirmation)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Reported Damage */}
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-1">
                    <div className="font-semibold text-blue-900 text-[11px] flex items-center justify-between">
                      <span>Reported by Farmer</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                        Initial Report
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-blue-950">
                      {claim.report?.reportedDamagePercent?.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-blue-800 space-y-0.5">
                      <div>Affected Area: {claim.report?.reportedAffectedAreaHa} ha</div>
                      <div>Calamity: {claim.report?.calamityType}</div>
                      <div>Incident Date: {new Date(claim.report?.incidentDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Assessed Damage */}
                  <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-3 space-y-1">
                    <div className="font-semibold text-purple-900 text-[11px] flex items-center justify-between">
                      <span>Field Assessment</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          OMAG Evaluation
                        </span>
                        {isStaff && claim.report?.assessment && !showAssessmentForm && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAssessmentForm(true)}
                              className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this field assessment? Priority ranking will revert to using reported damage.")) {
                                  try {
                                    const res = await fetch(`/api/pcic/claims/${claimId}/assessment`, { method: "DELETE" });
                                    if (res.ok) {
                                      await loadClaimDossier();
                                      onStatusUpdated?.();
                                    } else {
                                      const errData = await res.json();
                                      alert(errData.error || "Failed to delete assessment");
                                    }
                                  } catch (e: any) {
                                    alert(e.message || "Error deleting assessment");
                                  }
                                }
                              }}
                              className="flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {claim.report?.assessment && !showAssessmentForm ? (
                      <>
                        <div className="text-xl font-bold font-mono text-purple-950">
                          {claim.report.assessment.assessedDamagePercent?.toFixed(1)}%
                        </div>
                        <div className="text-[11px] text-purple-800 space-y-0.5">
                          <div>Assessed Area: {claim.report.assessment.assessedAreaHa} ha</div>
                          <div>Crop Stage: {claim.report.assessment.cropStage}</div>
                          <div>
                            Assessed Date:{" "}
                            {new Date(claim.report.assessment.assessedAt).toLocaleDateString()}
                          </div>
                          {claim.report.assessment.assessorNotes && (
                            <div className="text-[10px] text-purple-700 italic mt-1">
                              Notes: {claim.report.assessment.assessorNotes}
                            </div>
                          )}
                        </div>
                      </>
                    ) : isStaff && showAssessmentForm ? (
                      /* Inline Assessment Form */
                      <div className="space-y-2 pt-1">
                        {assessmentError && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {assessmentError}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                              Assessed Damage (%)*
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={assessedDamagePercent}
                              onChange={(e) => setAssessedDamagePercent(parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-purple-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                              Assessed Area (ha)*
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={assessedAreaHa}
                              onChange={(e) => setAssessedAreaHa(parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                            Crop Stage*
                          </label>
                          <select
                            value={cropStage}
                            onChange={(e) => setCropStage(e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-purple-500"
                          >
                            {CROP_STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                            Assessment Notes
                          </label>
                          <textarea
                            rows={2}
                            value={assessorNotes}
                            onChange={(e) => setAssessorNotes(e.target.value)}
                            placeholder="Field observations, crop damage description..."
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500 bg-white resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={assessmentSaving}
                            onClick={async () => {
                              setAssessmentError(null);
                              if (assessedDamagePercent < 0 || assessedDamagePercent > 100) {
                                setAssessmentError("Assessed Damage must be 0–100%.");
                                return;
                              }
                              if (assessedAreaHa <= 0) {
                                setAssessmentError("Assessed Area must be greater than 0.");
                                return;
                              }
                              setAssessmentSaving(true);
                              try {
                                const res = await fetch(`/api/pcic/claims/${claimId}/assessment`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    assessedDamagePercent,
                                    assessedAreaHa,
                                    cropStage,
                                    assessorNotes: assessorNotes || null,
                                  }),
                                });
                                if (!res.ok) {
                                  const errData = await res.json();
                                  throw new Error(errData.error || "Failed to save assessment");
                                }
                                setShowAssessmentForm(false);
                                await loadClaimDossier();
                                onStatusUpdated?.();
                              } catch (err: any) {
                                setAssessmentError(err.message || "Failed to save assessment");
                              } finally {
                                setAssessmentSaving(false);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold disabled:opacity-50 transition-colors"
                          >
                            <Save className="h-3 w-3" />
                            {assessmentSaving ? "Saving..." : "Save Assessment"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAssessmentForm(false);
                              setAssessmentError(null);
                            }}
                            className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 text-[11px] font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : isStaff && !claim.report?.assessment ? (
                      /* No Assessment Yet — Staff Prompt */
                      <div className="py-2 space-y-2">
                        <p className="text-slate-400 text-[11px] italic">
                          No field assessment recorded yet. Priority is calculated using reported damage.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAssessmentForm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold transition-colors"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Add Field Assessment
                        </button>
                      </div>
                    ) : (
                      <div className="py-3 text-slate-400 text-xs italic">
                        No field assessment recorded yet. Priority is calculated using reported damage.
                      </div>
                    )}
                  </div>
                </div>

                {claim.report?.narrativeDescription && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-800 block mb-0.5">Farmer Incident Narrative:</strong>
                    {claim.report.narrativeDescription}
                  </div>
                )}
              </div>

              {/* Connected Field Photos & AI Metadata Verification (Objective #2) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-700" />
                    <span className="font-bold text-slate-900 text-xs">
                      Connected Field Photos &amp; AI Metadata Verification (Objective #2)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {claim.report?.photoVerifications?.length || 0} attached
                    </span>
                  </div>
                  {claim.report?.photoVerifications && claim.report.photoVerifications.length > 0 && (
                    <Link
                      href={`${isStaff ? "/staff" : "/head"}/photo-verification/${claim.report?.id || claim.reportId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <span>Open Full Dossier</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {claim.report?.photoVerifications && claim.report.photoVerifications.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {claim.report.photoVerifications.map((photo: any) => (
                      <div
                        key={photo.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 flex gap-3 items-start"
                      >
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                          <img
                            src={`/api/photo-verification/${photo.id}/image`}
                            alt={photo.originalFileName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes("default-field-photo.jpg")) {
                                target.src = "/assets/default-field-photo.jpg";
                              }
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 text-[11px] truncate" title={photo.originalFileName}>
                              {photo.originalFileName}
                            </span>
                            {getVerificationBadge(photo.verificationStatus)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {photo.photoTimestamp
                              ? new Date(photo.photoTimestamp).toLocaleDateString()
                              : "No timestamp"}
                            {" • "}
                            {photo.calculatedDistanceMeters !== null
                              ? `${photo.calculatedDistanceMeters.toFixed(1)}m to centroid`
                              : "No GPS"}
                          </div>
                          {photo.aiAssessment && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-700">
                              <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span className="truncate">AI: {photo.aiAssessment} ({photo.aiConfidence || "ADVISORY"})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-center space-y-2">
                    <p className="text-[11px]">No geotagged field photos have been connected to this claim yet.</p>
                    {isStaff && (
                      <Link
                        href="/staff/photo-verification/new"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-2xs transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Intake Field Photo for this Parcel</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Coordination & Adjuster Follow-Up Notes */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-emerald-700" />
                  Coordination & Adjuster Follow-up Notes
                </div>
                {claim.remarks ? (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {claim.remarks}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic py-2">
                    No coordination or follow-up notes recorded yet.
                  </p>
                )}
              </div>

              {/* Activity & Audit Trail - Consolidated to Activity / Audit Logs */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <History className="h-4 w-4 text-emerald-700" />
                    <span>Activity &amp; Audit Trail</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {claim.auditLogs?.length || 0} Events
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>Track evaluation notes, endorsements, and status revisions in the central log.</span>
                  <Link
                    href={`${isStaff ? "/staff" : "/head"}/audit?module=PCIC_CLAIM&recordId=${claim.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <span>Inspect Logs</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {claim && (
              <Link
                href={`${isStaff ? "/staff" : "/head"}/photo-verification/${claim.report?.id || claim.reportId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-200" />
                <span>View Field Photos &amp; Verification Dossier</span>
                <ExternalLink className="h-3 w-3 text-emerald-200 opacity-80" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStaff && claim && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Are you sure you want to permanently delete claim case ${claim.claimNumber}? This will delete the claim, report, assessments, and update cohort priority scores.`)) {
                    try {
                      const res = await fetch(`/api/pcic/claims/${claimId}`, { method: "DELETE" });
                      if (res.ok) {
                        onClose();
                        onStatusUpdated?.();
                      } else {
                        const errData = await res.json();
                        alert(errData.error || "Failed to delete claim case");
                      }
                    } catch (e: any) {
                      alert(e.message || "Error deleting claim case");
                    }
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold text-xs cursor-pointer"
              >
                Delete Case
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
