"use client";

import React, { useState, useEffect } from "react";
import { CALAMITY_TYPES, CalamityType } from "../types";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialContext?: {
    farmerId?: number;
    parcelId?: number;
    cropId?: number;
    photoVerificationId?: string;
  };
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialContext,
}) => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | "">(
    initialContext?.farmerId || ""
  );
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<number | "">(
    initialContext?.parcelId || ""
  );
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number | "">(
    initialContext?.cropId || ""
  );

  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [calamityType, setCalamityType] = useState<CalamityType>("Typhoon");
  const [reportedDamagePercent, setReportedDamagePercent] = useState<number>(50);
  const [reportedAffectedAreaHa, setReportedAffectedAreaHa] = useState<number>(1.0);
  const [narrativeDescription, setNarrativeDescription] = useState<string>("");
  const [insurancePolicyNo, setInsurancePolicyNo] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch farmers on open
  useEffect(() => {
    if (!isOpen) return;
    async function loadFarmers() {
      try {
        const res = await fetch("/api/beneficiaries?limit=100");
        if (res.ok) {
          const data = await res.json();
          setFarmers(data.items || []);
        }
      } catch (err) {
        console.error("Failed to load farmers for PCIC case", err);
      }
    }
    loadFarmers();
  }, [isOpen]);

  // When farmer changes, fetch farmer dossier to populate parcels and crops
  useEffect(() => {
    if (!selectedFarmerId) {
      setParcels([]);
      setCrops([]);
      setSelectedParcelId("");
      setSelectedCropId("");
      return;
    }

    async function loadFarmerDossier() {
      try {
        const res = await fetch(`/api/beneficiaries/${selectedFarmerId}`);
        if (res.ok) {
          const data = await res.json();
          const extractedParcels: any[] = [];
          const extractedCrops: any[] = [];

          if (data.farms && Array.isArray(data.farms)) {
            for (const farm of data.farms) {
              if (farm.parcels && Array.isArray(farm.parcels)) {
                for (const parcel of farm.parcels) {
                  extractedParcels.push({
                    id: parcel.id,
                    parcelNumber: parcel.parcelNumber,
                    areaHa: parcel.areaHa,
                    farmName: farm.farmName || `Farm #${farm.id}`,
                  });
                  if (parcel.crops && Array.isArray(parcel.crops)) {
                    for (const crop of parcel.crops) {
                      extractedCrops.push({
                        id: crop.id,
                        parcelId: parcel.id,
                        cropType: crop.cropType,
                        variety: crop.variety,
                        plantedAreaHa: crop.plantedAreaHa,
                      });
                    }
                  }
                }
              }
            }
          }

          setParcels(extractedParcels);
          setCrops(extractedCrops);

          if (initialContext?.parcelId && extractedParcels.some((p) => p.id === initialContext.parcelId)) {
            setSelectedParcelId(initialContext.parcelId);
          } else if (extractedParcels.length > 0) {
            setSelectedParcelId(extractedParcels[0].id);
          }

          if (initialContext?.cropId && extractedCrops.some((c) => c.id === initialContext.cropId)) {
            setSelectedCropId(initialContext.cropId);
            const matchedCrop = extractedCrops.find((c) => c.id === initialContext.cropId);
            if (matchedCrop?.plantedAreaHa) {
              setReportedAffectedAreaHa(matchedCrop.plantedAreaHa);
            }
          } else if (extractedCrops.length > 0) {
            setSelectedCropId(extractedCrops[0].id);
            setReportedAffectedAreaHa(extractedCrops[0].plantedAreaHa || 1.0);
          }
        }
      } catch (err) {
        console.error("Failed to load farmer farms and crops", err);
      }
    }
    loadFarmerDossier();
  }, [selectedFarmerId, initialContext?.parcelId, initialContext?.cropId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFarmerId || !selectedParcelId || !selectedCropId) {
      setError("Please select a registered Farmer, Farm Parcel, and Crop.");
      return;
    }

    if (reportedDamagePercent < 0 || reportedDamagePercent > 100) {
      setError("Damage percentage must be between 0% and 100%.");
      return;
    }

    if (reportedAffectedAreaHa <= 0) {
      setError("Reported affected area must be greater than 0 ha.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pcic/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: Number(selectedFarmerId),
          parcelId: Number(selectedParcelId),
          cropId: Number(selectedCropId),
          incidentDate,
          calamityType,
          reportedDamagePercent: Number(reportedDamagePercent),
          reportedAffectedAreaHa: Number(reportedAffectedAreaHa),
          narrativeDescription: narrativeDescription || undefined,
          insurancePolicyNo: insurancePolicyNo || undefined,
          remarks: remarks || "[Demonstration Record — not an official PCIC claim]",
          photoVerificationId: initialContext?.photoVerificationId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create PCIC monitoring case");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-2xl my-8 overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Record Crop-Loss Incident & Open PCIC Case
            </h3>
            <p className="text-[11px] text-slate-500">
              Captures reported damage for OMAG monitoring docket and priority ranking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {initialContext?.photoVerificationId && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="font-bold">📷 Connected Photo Verification Intake</span>
              <span className="font-mono text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                Photo ID: {initialContext.photoVerificationId.slice(0, 8)}...
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">Auto-linked upon creation</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Statutory Disclaimer */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold block">Advisory & Monitoring Boundary:</span>
            This record establishes an internal municipal monitoring docket for coordination with the PCIC focal person and adjuster. It does <strong>NOT</strong> constitute official PCIC insurance claim adjudication or payment guarantee.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Farmer Selection */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Registered Beneficiary / Farmer *
              </label>
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(Number(e.target.value) || "")}
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Select Farmer --</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.firstName} {f.lastName} ({f.barangay}) {f.rsbsaNumber ? `— ${f.rsbsaNumber}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Farm Parcel Selection */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Affected Farm Parcel *
              </label>
              <select
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(Number(e.target.value) || "")}
                required
                disabled={!selectedFarmerId || parcels.length === 0}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
              >
                <option value="">
                  {selectedFarmerId
                    ? parcels.length > 0
                      ? "-- Select Parcel --"
                      : "No parcels registered"
                    : "-- Select Farmer First --"}
                </option>
                {parcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    Parcel {p.parcelNumber} ({p.areaHa} ha) — {p.farmName}
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Selection */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Standing Crop *
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => {
                  const cId = Number(e.target.value) || "";
                  setSelectedCropId(cId);
                  const found = crops.find((c) => c.id === cId);
                  if (found) setReportedAffectedAreaHa(found.plantedAreaHa || 1.0);
                }}
                required
                disabled={!selectedFarmerId || crops.length === 0}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
              >
                <option value="">
                  {selectedFarmerId
                    ? crops.length > 0
                      ? "-- Select Crop --"
                      : "No standing crops found"
                    : "-- Select Farmer First --"}
                </option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cropType} {c.variety ? `(${c.variety})` : ""} — {c.plantedAreaHa} ha
                  </option>
                ))}
              </select>
            </div>

            {/* Calamity Type */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Calamity / Cause of Damage *
              </label>
              <select
                value={calamityType}
                onChange={(e) => setCalamityType(e.target.value as CalamityType)}
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500"
              >
                {CALAMITY_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Date */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Incident / Report Date * (Earlier date = higher priority)
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Reported Damage % */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reported Damage Severity (%) * (0–100%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={reportedDamagePercent}
                onChange={(e) => setReportedDamagePercent(parseFloat(e.target.value) || 0)}
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Affected Area (ha) */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reported Affected Area (ha) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={reportedAffectedAreaHa}
                onChange={(e) => setReportedAffectedAreaHa(parseFloat(e.target.value) || 0.1)}
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Insurance Policy Number */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                PCIC Insurance Policy / Coverage No. (Optional)
              </label>
              <input
                type="text"
                value={insurancePolicyNo}
                onChange={(e) => setInsurancePolicyNo(e.target.value)}
                placeholder="e.g. PCIC-CIC-2026-00412"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Narrative Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Field Damage Narrative / Incident Notes
            </label>
            <textarea
              rows={2}
              value={narrativeDescription}
              onChange={(e) => setNarrativeDescription(e.target.value)}
              placeholder="Describe physical damage observed (e.g. lodging of corn stalks due to strong gale-force winds)..."
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Initial Remarks */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Focal Person Coordination Notes / Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Farmer notified OMAG within 24h. Awaiting PCIC adjuster field schedule."
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? "Recording Case..." : "Register PCIC Monitoring Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
