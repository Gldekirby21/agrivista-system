"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  User,
  Info,
} from "lucide-react";

interface PhotoVerificationDetailProps {
  record: any;
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
}

export const PhotoVerificationDetail: React.FC<PhotoVerificationDetailProps> = ({
  record: initialRecord,
  userRole,
}) => {
  const [record, setRecord] = useState(initialRecord);
  const [verifying, setVerifying] = useState(false);
  const [assessingAi, setAssessingAi] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(record.systemReviewStatus || "REVIEWED");
  const [reviewNotes, setReviewNotes] = useState(record.systemReviewNotes || "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isStaff = userRole === "OMAG_STAFF";
  const basePath = isStaff ? "/staff/photo-verification" : "/head/photo-verification";

  const handleRunVerification = async () => {
    setVerifying(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/photo-verification/${record.id}/verify`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to execute deterministic verification");
      }
      const updated = await res.json();
      setRecord((prev: any) => ({ ...prev, ...updated }));
      setMessage({ type: "success", text: "Deterministic verification re-evaluated successfully." });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Verification failed." });
    } finally {
      setVerifying(false);
    }
  };

  const handleRunAiAssessment = async () => {
    setAssessingAi(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/photo-verification/${record.id}/ai-assess`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate AI assessment");
      }
      const updated = await res.json();
      setRecord((prev: any) => ({ ...prev, ...updated }));
      setMessage({ type: "success", text: "Gemini 2.5 Flash advisory assessment generated." });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "AI assessment failed." });
    } finally {
      setAssessingAi(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      setMessage({ type: "error", text: "Review notes are required." });
      return;
    }

    setSubmittingReview(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/photo-verification/${record.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemReviewStatus: reviewStatus,
          systemReviewNotes: reviewNotes.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }
      const updated = await res.json();
      setRecord((prev: any) => ({
        ...prev,
        systemReviewStatus: updated.systemReviewStatus,
        systemReviewNotes: updated.systemReviewNotes,
      }));
      setMessage({ type: "success", text: "Municipal system review recorded." });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to submit review." });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> ACCEPTED (Within Tolerance)
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-950/80 border border-amber-700 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> REQUIRES REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-red-950/80 border border-red-700 text-red-300">
            <XCircle className="w-4 h-4 text-red-400" /> REJECTED (Outside Tolerance)
          </span>
        );
      case "NOT_ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300">
            <XCircle className="w-4 h-4 text-rose-400" /> NOT ACCEPTED (Missing GPS)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" /> PENDING VERIFICATION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Verification List
        </Link>
        <div className="flex items-center gap-3">
          {getStatusBadge(record.verificationStatus)}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 text-xs font-medium rounded-xl border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-red-950/80 border-red-800 text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Left = Photo & EXIF; Right = Deterministic, AI, Review, Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo & Raw EXIF Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Photo File Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Submitted Photograph Record</span>
            </div>

            <div className="aspect-4/3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="text-center p-6 text-slate-500">
                <Camera className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">{record.originalFileName}</p>
                <p className="text-[11px] text-slate-600 font-mono mt-1">
                  {(record.fileSizeBytes / 1024).toFixed(1)} KB — {record.mimeType}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-semibold text-white text-right">
                  {record.farmer?.firstName} {record.farmer?.lastName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">RSBSA ID:</span>
                <span className="font-mono text-emerald-400 text-right">
                  {record.farmer?.rsbsaNumber || record.farmer?.farmerCode || "Not Assigned"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Farm / Barangay:</span>
                <span className="font-medium text-slate-200 text-right">
                  {record.farm?.farmName || "Farm"} ({record.farm?.barangay})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Parcel Number:</span>
                <span className="font-mono text-emerald-400 text-right">
                  {record.parcel?.parcelNumber} ({record.parcel?.areaHa} ha)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Uploaded Date:</span>
                <span className="text-slate-300 text-right">
                  {new Date(record.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Raw Extracted EXIF Metadata */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Extracted EXIF Metadata (Camera Audit)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Photo Latitude:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {record.photoLatitude !== null ? record.photoLatitude.toFixed(6) : "Not Embedded"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Photo Longitude:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {record.photoLongitude !== null ? record.photoLongitude.toFixed(6) : "Not Embedded"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Photo Altitude:</span>
                <span className="font-mono text-slate-300">
                  {record.photoAltitude !== null ? `${record.photoAltitude}m` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">EXIF Timestamp:</span>
                <span className="font-medium text-slate-300">
                  {record.photoTimestamp
                    ? new Date(record.photoTimestamp).toLocaleString()
                    : "Missing / Not Embedded"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Camera Device:</span>
                <span className="font-medium text-slate-300">
                  {[record.deviceMake, record.deviceModel].filter(Boolean).join(" ") || "Unspecified"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg text-[11px] text-slate-400">
              🟢 <strong>OMAG CONFIRMED:</strong> Photo GPS and date/time metadata are essential elements. Missing EXIF tags are classified as "Not accepted".
            </div>
          </div>
        </div>

        {/* Right Column: Deterministic Evidence, AI Advisory, Review, Audit Trail */}
        <div className="lg:col-span-8 space-y-6">
          {/* Panel 1: Deterministic Verification Evidence (Authoritative) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Deterministic Verification Evidence (Authoritative)</span>
              </div>
              {isStaff && (
                <button
                  onClick={handleRunVerification}
                  disabled={verifying}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
                  Re-Calculate
                </button>
              )}
            </div>

            {/* Coordinates Comparison Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Photo Embedded Coordinates
                </p>
                {record.photoLatitude !== null && record.photoLongitude !== null ? (
                  <p className="text-sm font-mono font-bold text-white">
                    {record.photoLatitude.toFixed(6)}, {record.photoLongitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-rose-400">GPS Missing in EXIF</p>
                )}
                <p className="text-[11px] text-slate-500">From camera hardware sensor</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Registered Parcel Centroid
                </p>
                {record.registeredLatitude !== null && record.registeredLongitude !== null ? (
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {record.registeredLatitude.toFixed(6)}, {record.registeredLongitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-amber-400">No Reference Centroid GPS</p>
                )}
                <p className="text-[11px] text-slate-500">From municipal cadastral registry</p>
              </div>
            </div>

            {/* Haversine Distance & Tolerance Comparison */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Calculated Great-Circle Distance (Haversine)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-bold text-white">
                    {record.calculatedDistanceMeters !== null
                      ? `${record.calculatedDistanceMeters.toFixed(1)} m`
                      : "N/A"}
                  </span>
                  <span className="text-xs text-slate-400">
                    (Configured System Tolerance: {record.thresholdMeters} m)
                  </span>
                </div>
              </div>
              <div>{getStatusBadge(record.verificationStatus)}</div>
            </div>

            {/* Verification Notes */}
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-300">Deterministic Engine Audit Findings:</p>
              <p className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-300 leading-relaxed">
                {record.verificationNotes || "No verification notes recorded."}
              </p>
            </div>

            <p className="text-[11px] text-amber-400/90 italic">
              🟡 Proposed System Design: Haversine distance is calculated by backend code. The 500m threshold is a configurable parameter (🔴 PENDING OMAG CONFIRMATION).
            </p>
          </div>

          {/* Panel 2: AI-Assisted Interpretation (Gemini 2.5 Flash Advisory) */}
          <div className="bg-slate-900 border border-purple-900/60 rounded-xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-300">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>AI Advisory Interpretation (Gemini 2.5 Flash — Advisory Layer)</span>
              </div>
              {isStaff && (
                <button
                  onClick={handleRunAiAssessment}
                  disabled={assessingAi}
                  className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold rounded-lg border border-purple-700 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${assessingAi ? "animate-spin" : ""}`} />
                  {record.aiAssessment ? "Re-Run AI Advisory" : "Generate AI Advisory"}
                </button>
              )}
            </div>

            {/* Conflict Warning Banner if AI Conflict Flag is True */}
            {record.aiConflict && (
              <div className="p-4 bg-amber-950/80 border border-amber-600 rounded-lg flex items-start gap-3 text-amber-200 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300 uppercase tracking-wider">
                    AI Conflict Safeguard Triggered
                  </p>
                  <p className="mt-1">
                    AI advisory recommendation differed from the authoritative deterministic engine. Under municipal audit rules, the deterministic verification result is strictly authoritative and cannot be overridden by AI.
                  </p>
                </div>
              </div>
            )}

            {record.aiAssessment ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      AI Consistency Assessment
                    </span>
                    <span className="text-sm font-bold text-purple-300 mt-1 block">
                      {record.aiAssessment}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      AI Advisory Recommendation
                    </span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {record.aiRecommendation || "N/A"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Human Review Required
                    </span>
                    <span
                      className={`text-sm font-bold mt-1 block ${
                        record.aiReviewRequired ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {record.aiReviewRequired ? "YES (Manual Inspection)" : "NO (Clean Match)"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-300 mb-1">AI Explanation & Summary:</p>
                  <p className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 leading-relaxed">
                    {record.aiExplanation || "No explanation recorded."}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-300 mb-1">AI Suggested Audit Note:</p>
                  <p className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono">
                    {record.aiAuditNote || "No audit note generated."}
                  </p>
                </div>

                <p className="text-[10px] text-slate-500 font-mono">
                  Model: {record.aiModelUsed || "gemini-2.5-flash"} | Assessed:{" "}
                  {record.aiAssessedAt ? new Date(record.aiAssessedAt).toLocaleString() : "N/A"}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-lg">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">AI Advisory Interpretation has not been generated</p>
                <p className="text-[11px] text-slate-600">
                  {isStaff
                    ? "Click 'Generate AI Advisory' to run Gemini 2.5 Flash interpretation on pre-computed evidence."
                    : "No AI interpretation recorded for this record yet."}
                </p>
              </div>
            )}

            <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-lg text-[11px] text-purple-300/90 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
              <span>
                <strong>CRITICAL SAFETY RULE:</strong> Gemini 2.5 Flash serves solely as an advisory interpretation layer. Gemini does NOT calculate GPS distances, invent EXIF metadata, or override deterministic verification.
              </span>
            </div>
          </div>

          {/* Panel 3: Municipal System Review & Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-emerald-400" />
              <span>Municipal Internal System Review</span>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    System Review Action Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="REVIEWED">REVIEWED (Internal Confirmation)</option>
                    <option value="CONFIRMED">CONFIRMED (Municipal Verification Passed)</option>
                    <option value="REJECTED">REJECTED (Municipal Invalidation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Current Review Officer
                  </label>
                  <p className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium">
                    {userRole}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Review & Audit Notes *
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record municipal review observations, parcel lot corroboration, or field technician notes..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 italic">
                  Notice: Internal system review only. Does NOT constitute official PCIC claim approval.
                </p>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {submittingReview ? "Saving Review..." : "Record System Review"}
                </button>
              </div>
            </form>
          </div>

          {/* Panel 4: Immutable Audit Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Immutable System Audit Trail</span>
            </div>

            {record.auditLogs && record.auditLogs.length > 0 ? (
              <div className="divide-y divide-slate-800 text-xs">
                {record.auditLogs.map((log: any) => (
                  <div key={log.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 uppercase font-mono">
                        [{log.action}]
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Executed by:{" "}
                      <span className="font-semibold text-white">
                        {log.user?.fullName || log.userId || "System"}
                      </span>{" "}
                      ({log.roleSnapshot || log.user?.role || "SYSTEM"})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No audit log entries recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
