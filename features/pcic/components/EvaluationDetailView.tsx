"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Sprout,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  FileText,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { CROP_STAGES } from "../types";

interface EvaluationDetailViewProps {
  claim: any;
  userRole: "OMAG_STAFF" | "OMAG_HEAD";
}

export const EvaluationDetailView: React.FC<EvaluationDetailViewProps> = ({
  claim,
  userRole,
}) => {
  const router = useRouter();

  const report = claim.report;
  const farmer = report?.farmer;
  const farm = report?.parcel?.farm;
  const parcel = report?.parcel;
  const crop = report?.crop;
  const existingAssessment = report?.assessment;
  const photoVerifications: any[] = report?.photoVerifications || [];

  // Evaluation Form State
  const [assessedDamagePercent, setAssessedDamagePercent] = useState<number>(
    existingAssessment?.assessedDamagePercent ?? report?.reportedDamagePercent ?? 0
  );
  const [assessedAreaHa, setAssessedAreaHa] = useState<number>(
    existingAssessment?.assessedAreaHa ?? report?.reportedAffectedAreaHa ?? parcel?.areaHa ?? 1
  );
  const [cropStage, setCropStage] = useState<string>(
    existingAssessment?.cropStage ?? "Vegetative"
  );
  const [assessorNotes, setAssessorNotes] = useState<string>(
    existingAssessment?.assessorNotes ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (assessedDamagePercent < 0 || assessedDamagePercent > 100) {
      setErrorMessage("Assessed Damage must be between 0% and 100%.");
      return;
    }
    if (assessedAreaHa <= 0) {
      setErrorMessage("Assessed Area must be greater than 0 ha.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pcic/claims/${claim.id}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessedDamagePercent,
          assessedAreaHa,
          cropStage,
          assessorNotes: assessorNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save assessment");
      }

      setSuccessMessage("Field damage assessment successfully recorded.");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!confirm("Are you sure you want to remove this field assessment?")) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/pcic/claims/${claim.id}/assessment`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete assessment");
      }

      setSuccessMessage("Field assessment removed.");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete assessment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-xs">
      {/* Navigation and Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/staff/pcic/evaluation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Crop-Loss Case Management</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Crop-Loss Case Details
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200">
              Report #{report?.reportNumber || `REP-${report?.id}`}
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            Registered on {new Date(report?.createdAt || Date.now()).toLocaleDateString("en-PH", { dateStyle: "long" })} • Incident: {report?.incidentDate ? new Date(report.incidentDate).toLocaleDateString() : "—"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {existingAssessment && userRole === "OMAG_STAFF" && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteAssessment}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-700 font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>{deleting ? "Deleting..." : "Delete Assessment"}</span>
            </button>
          )}

          <Link
            href={`/staff/photo-verification/new?damageReportId=${report?.id}${farmer?.id ? `&farmerId=${farmer.id}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold shadow-2xs transition-colors"
            title="Upload photo to verify if farmer image is authentic"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Upload Photo to Verify</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-2.5 font-medium shadow-2xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 flex items-center gap-2.5 font-medium shadow-2xs">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Grid of Case Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sections A, B, C */}
        <div className="lg:col-span-6 space-y-5">
          {/* A. FARMER INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-700" />
                <span>A. Farmer Information</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                {farmer?.rsbsaNumber ? `RSBSA: ${farmer.rsbsaNumber}` : "No RSBSA"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Farmer Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {farmer ? `${farmer.firstName} ${farmer.middleName ? farmer.middleName + " " : ""}${farmer.lastName}${farmer.extensionName ? " " + farmer.extensionName : ""}` : "Registered Farmer"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Barangay / Municipality</span>
                <span className="font-semibold text-slate-800">
                  {farmer?.barangay || farm?.barangay || "Polomolok"}, {farmer?.municipality || "Polomolok"}
                </span>
                <span className="text-slate-500 text-[11px] block">{farmer?.province || "South Cotabato"}</span>
              </div>

              <div className="col-span-2 sm:col-span-1 border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Contact Number
                </span>
                <span className="font-mono text-slate-800 font-medium">
                  {farmer?.contactNumber || "Not recorded"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </span>
                <span className="text-slate-800 font-medium truncate block">
                  {farmer?.email || "Not recorded"}
                </span>
              </div>
            </div>
          </div>

          {/* B. FARM / CROP INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sprout className="h-4 w-4 text-emerald-700" />
                <span>B. Farm &amp; Crop Context</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Authoritative Land Record
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Farm / Holding</span>
                <span className="font-bold text-slate-800">
                  {farm?.farmName || `Farm #${farm?.id || "—"}`}
                </span>
                <span className="text-slate-500 text-[11px] block">Tenure: {farm?.tenureType || "Owned"}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Farm Parcel</span>
                <span className="font-mono font-bold text-slate-800">
                  Parcel {parcel?.parcelNumber || "—"}
                </span>
                <span className="text-slate-500 text-[11px] block">Total Area: {Number(parcel?.areaHa || farm?.totalAreaHa || 1).toFixed(2)} ha</span>
              </div>

              <div className="border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Standing Crop</span>
                <span className="font-bold text-slate-800 text-sm">
                  {crop?.cropType || "Crop"}
                </span>
                <span className="text-slate-500 text-[11px] block">{crop?.variety || "Standard Variety"}</span>
              </div>

              <div className="border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Planted Area &amp; Season</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {Number(crop?.plantedAreaHa || parcel?.areaHa || 1).toFixed(2)} ha
                </span>
                <span className="text-slate-500 text-[11px] block">{crop?.season || "Regular"} Season</span>
              </div>
            </div>
          </div>

          {/* C. CROP-LOSS REPORT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-700" />
                <span>C. Crop-Loss Incident Declaration</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Status: {report?.status || "SUBMITTED"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Report Number</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {report?.reportNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Incident Date</span>
                <span className="font-semibold text-slate-800">
                  {report?.incidentDate ? new Date(report.incidentDate).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "—"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Calamity / Peril Type</span>
                <span className="font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded inline-block text-xs">
                  {report?.calamityType}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Farmer Reported Damage</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black font-mono text-amber-900">
                    {report?.reportedDamagePercent}%
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    over {Number(report?.reportedAffectedAreaHa || 0).toFixed(2)} ha
                  </span>
                </div>
              </div>

              {report?.narrativeDescription && (
                <div className="col-span-2 border-t border-slate-100 pt-2">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Narrative Description</span>
                  <p className="text-slate-700 text-xs mt-0.5 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    &ldquo;{report.narrativeDescription}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sections D & E */}
        <div className="lg:col-span-6 space-y-5">
          {/* D. EVALUATION / ASSESSMENT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-700" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    D. Evaluation / Assessment
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Official OMAG technical evaluation
                  </p>
                </div>
              </div>
              {existingAssessment ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Evaluated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                  <Clock className="h-3 w-3" /> Pending Evaluation
                </span>
              )}
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Assessed Damage Percent */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Assessed Damage (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={assessedDamagePercent}
                      onChange={(e) => setAssessedDamagePercent(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                </div>

                {/* Assessed Area */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Assessed Area (ha) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={assessedAreaHa}
                      onChange={(e) => setAssessedAreaHa(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ha
                    </span>
                  </div>
                </div>
              </div>

              {/* Crop Stage */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Crop Stage during Inspection <span className="text-red-500">*</span>
                </label>
                <select
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white"
                >
                  {CROP_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Assessor Notes */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Assessment Notes &amp; Findings
                </label>
                <textarea
                  rows={3}
                  value={assessorNotes}
                  onChange={(e) => setAssessorNotes(e.target.value)}
                  placeholder="Record specific crop loss symptoms, pest/disease progression, flood levels, or field inspection findings..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:border-purple-600 focus:ring-1 focus:ring-purple-600 bg-white resize-none"
                />
              </div>

              {existingAssessment?.assessedAt && (
                <p className="text-[11px] text-slate-400">
                  Last assessed: {new Date(existingAssessment.assessedAt).toLocaleString()}
                </p>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving Assessment..." : "Save Field Assessment"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* E. PHOTO VERIFICATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Camera className="h-4 w-4 text-purple-700" />
                <span>E. Field Photographs &amp; Geofence Verification</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {photoVerifications.length} Photo Record{photoVerifications.length === 1 ? "" : "s"}
              </span>
            </div>

            {photoVerifications.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <Camera className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium">No verified field photos submitted yet for this case.</p>
                <Link
                  href={`/staff/photo-verification/new?damageReportId=${report?.id}${farmer?.id ? `&farmerId=${farmer.id}` : ""}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 transition-colors"
                >
                  Upload Photo to Verify
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {photoVerifications.map((pv, idx) => (
                  <div
                    key={pv.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[200px]">
                        {pv.originalFileName || `Photo #${idx + 1}`}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          pv.verificationStatus === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : pv.verificationStatus === "REJECTED"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {pv.verificationStatus || "REVIEW"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">GPS Location</span>
                        <span className="font-mono text-slate-700">
                          {pv.photoLatitude && pv.photoLongitude
                            ? `${pv.photoLatitude.toFixed(5)}, ${pv.photoLongitude.toFixed(5)}`
                            : "GPS Missing"}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Status: {pv.gpsStatus || "—"}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Distance to Parcel</span>
                        <span className="font-mono font-bold text-slate-800">
                          {pv.calculatedDistanceMeters !== null && pv.calculatedDistanceMeters !== undefined
                            ? `${pv.calculatedDistanceMeters.toFixed(1)} m`
                            : "—"}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Threshold: {pv.thresholdMeters || 500}m
                        </span>
                      </div>
                    </div>

                    {pv.aiAssessment && (
                      <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-indigo-900">
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          <span>AI Advisory: {pv.aiAssessment} ({pv.aiRecommendation || "REVIEW"})</span>
                        </div>
                        {pv.aiExplanation && (
                          <p className="text-indigo-800 italic">{pv.aiExplanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
