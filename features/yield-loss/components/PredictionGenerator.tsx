"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  AlertCircle,
  Wheat,
  MapPin,
  Calendar,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  User,
  ShieldCheck,
  TrendingDown,
  Scale,
  ArrowRight,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CropOption {
  id: number;
  cropType: string;
  variety: string | null;
  season: string;
  year: number;
  plantedAreaHa: number;
  recordedYieldPerHa: number | null;
  historicalYieldTons: number | null;
  parcel: {
    id: number;
    parcelNumber: string;
    soilType: string | null;
    farm: {
      id: number;
      farmName: string | null;
      barangay: string;
      farmer: {
        id: number;
        firstName: string;
        lastName: string;
        rsbsaNumber: string | null;
      };
    };
  };
  damageReports?: Array<{
    id: number;
    reportNumber: string;
    incidentDate: string;
    calamityType: string;
    reportedDamagePercent: number;
    reportedAffectedAreaHa: number;
    narrativeDescription?: string | null;
    assessment?: {
      id: string;
      assessedDamagePercent: number;
      assessedAreaHa: number;
      cropStage: string;
      assessorNotes?: string | null;
    } | null;
  }>;
}

interface PredictionGeneratorProps {
  onSuccess?: (prediction: any) => void;
  onViewHistory?: () => void;
}

export const PredictionGenerator: React.FC<PredictionGeneratorProps> = ({
  onSuccess,
  onViewHistory,
}) => {
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Cascading Relational Selection State
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | "">("");
  const [selectedParcelId, setSelectedParcelId] = useState<number | "">("");
  const [selectedCropId, setSelectedCropId] = useState<number | "">("");

  // 2. Current Prediction Scenario State (Only these are editable by Staff)
  const [scenarioData, setScenarioData] = useState({
    assessedDamagePercent: "0",
    cropUnitPricePhpKg: "21.0",
    reportId: null as number | null,
    priceSource: "OMAG Price Monitoring Reference (Municipal Standard Rate)",
  });

  // 3. Generated Prediction Result State
  const [result, setResult] = useState<{
    id: string;
    cropType: string;
    modelName: string;
    modelVersion: string;
    algorithm: string;
    predictionTimestamp: string;
    farmerName: string;
    farmName: string;
    parcelNumber: string;
    barangay: string;
    plantedAreaHa: number;
    predictedYieldTonsHa: number;
    projectedNormalProductionTons: number;
    assessedDamagePercent: number;
    reportedDamagePercent: number | null;
    predictedRemainingProductionTons: number;
    estimatedCropLossTons: number;
    estimatedCropLossKg: number;
    cropUnitPricePhpKg: number | null;
    priceSource: string;
    estimatedEconomicLossPhp: number | null;
  } | null>(null);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    setLoadingCrops(true);
    try {
      const res = await fetch("/api/crops");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setCrops(list);
      }
    } catch (e) {
      console.error("Failed to load crops:", e);
    } finally {
      setLoadingCrops(false);
    }
  };

  // 1. Unique Registered Farmers who have active crops
  const availableFarmers = useMemo(() => {
    const map = new Map<number, { id: number; name: string; rsbsa: string | null }>();
    crops.forEach((c) => {
      const farmer = c.parcel?.farm?.farmer;
      if (farmer && !map.has(farmer.id)) {
        map.set(farmer.id, {
          id: farmer.id,
          name: `${farmer.firstName} ${farmer.lastName}`,
          rsbsa: farmer.rsbsaNumber,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [crops]);

  // 2. Available Parcels for Selected Farmer
  const availableParcels = useMemo(() => {
    if (!selectedFarmerId) return [];
    const map = new Map<
      number,
      { id: number; parcelNumber: string; farmName: string | null; barangay: string; soilType: string | null }
    >();
    crops.forEach((c) => {
      const farmer = c.parcel?.farm?.farmer;
      const farm = c.parcel?.farm;
      const parcel = c.parcel;
      if (farmer && farmer.id === Number(selectedFarmerId) && parcel && !map.has(parcel.id)) {
        map.set(parcel.id, {
          id: parcel.id,
          parcelNumber: parcel.parcelNumber,
          farmName: farm?.farmName || "Unnamed Farm",
          barangay: farm?.barangay || "Polomolok",
          soilType: parcel.soilType,
        });
      }
    });
    return Array.from(map.values());
  }, [crops, selectedFarmerId]);

  // 3. Available Crops for Selected Parcel
  const availableCrops = useMemo(() => {
    if (!selectedParcelId) return [];
    return crops.filter((c) => c.parcel?.id === Number(selectedParcelId));
  }, [crops, selectedParcelId]);

  // Handle Cascading Step 1: Farmer Selection
  const handleFarmerChange = (farmerId: number | "") => {
    setSelectedFarmerId(farmerId);
    setSelectedParcelId("");
    setSelectedCropId("");
    setResult(null);

    // Auto-select parcel if only 1 exists
    if (farmerId) {
      const farmerCrops = crops.filter((c) => c.parcel?.farm?.farmer?.id === Number(farmerId));
      const parcelIds = Array.from(new Set(farmerCrops.map((c) => c.parcel?.id).filter(Boolean)));
      if (parcelIds.length === 1) {
        handleParcelChange(parcelIds[0] as number);
      }
    }
  };

  // Handle Cascading Step 2: Parcel Selection
  const handleParcelChange = (parcelId: number | "") => {
    setSelectedParcelId(parcelId);
    setSelectedCropId("");
    setResult(null);

    // Auto-select crop if only 1 exists
    if (parcelId) {
      const parcelCrops = crops.filter((c) => c.parcel?.id === Number(parcelId));
      if (parcelCrops.length === 1) {
        handleCropChange(parcelCrops[0].id);
      }
    }
  };

  // Handle Cascading Step 3: Standing Crop Selection & Auto-load
  const handleCropChange = (cropId: number | "") => {
    setSelectedCropId(cropId);
    setResult(null);
    if (!cropId) return;

    const crop = crops.find((c) => c.id === Number(cropId));
    if (crop) {
      const defaultPrice =
        crop.cropType.toLowerCase().includes("corn")
          ? "21.0"
          : crop.cropType.toLowerCase().includes("rice")
          ? "23.5"
          : crop.cropType.toLowerCase().includes("pineapple")
          ? "35.0"
          : crop.cropType.toLowerCase().includes("banana")
          ? "18.0"
          : "20.0";

      // Inspect registered damage reports and formal assessments
      const damageReport = crop.damageReports && crop.damageReports.length > 0 ? crop.damageReports[0] : null;
      const formalAssessment = damageReport?.assessment || null;

      setScenarioData({
        reportId: damageReport ? damageReport.id : null,
        // If a formal technical assessment exists, lock to its registered assessedDamagePercent
        assessedDamagePercent: formalAssessment ? formalAssessment.assessedDamagePercent.toString() : "0",
        cropUnitPricePhpKg: defaultPrice,
        priceSource: `OMAG Price Monitoring Reference (${crop.cropType} Municipal Standard Rate)`,
      });
    }
  };

  // Selected crop entity for read-only agricultural information presentation
  const selectedCrop = useMemo(() => {
    if (!selectedCropId) return null;
    return crops.find((c) => c.id === Number(selectedCropId)) || null;
  }, [crops, selectedCropId]);

  // Inspect damage report and formal assessment on selected crop
  const linkedDamageReport = useMemo(() => {
    if (!selectedCrop || !selectedCrop.damageReports || selectedCrop.damageReports.length === 0) {
      return null;
    }
    return selectedCrop.damageReports[0];
  }, [selectedCrop]);

  const hasFormalAssessment = Boolean(linkedDamageReport?.assessment);

  // Authoritative read-only values
  const registeredFarmerName = selectedCrop?.parcel?.farm?.farmer
    ? `${selectedCrop.parcel.farm.farmer.firstName} ${selectedCrop.parcel.farm.farmer.lastName}`
    : "—";
  const registeredRsbsa = selectedCrop?.parcel?.farm?.farmer?.rsbsaNumber || "—";
  const registeredFarmName = selectedCrop?.parcel?.farm?.farmName || "—";
  const registeredParcelNumber = selectedCrop?.parcel?.parcelNumber || "—";
  const registeredCropType = selectedCrop?.cropType || "—";
  const registeredVariety = selectedCrop?.variety || "Standard Variety";
  const registeredBarangay = selectedCrop?.parcel?.farm?.barangay || "—";
  const registeredSeason = selectedCrop ? `${selectedCrop.season} Season` : "—";
  const registeredSoilType = selectedCrop?.parcel?.soilType || "Volcanic Loam";
  const registeredPlantedArea = selectedCrop?.plantedAreaHa ? `${selectedCrop.plantedAreaHa.toFixed(2)} ha` : "—";
  const registeredHistoricalYield = selectedCrop?.recordedYieldPerHa
    ? `${selectedCrop.recordedYieldPerHa.toFixed(2)} t/ha`
    : selectedCrop?.historicalYieldTons
    ? `${selectedCrop.historicalYieldTons.toFixed(2)} t/ha`
    : "4.20 t/ha (Municipal Median Baseline)";
  const registeredCalamityOccurrences = "0 events (Municipal Historical Record)";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropId || !selectedCrop) {
      setError("Please select a registered standing crop record before generating prediction.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Validate OMAG Head approval if this crop is linked to a damage report
      if (linkedDamageReport && (linkedDamageReport as any).pcicClaim?.headApprovalStatus !== "APPROVED") {
        throw new Error(
          `Crop-loss case (Report #${linkedDamageReport.reportNumber}) requires OMAG Head approval before prediction can be processed. Current status: ${(linkedDamageReport as any).pcicClaim?.headApprovalStatus || "PENDING"}.`
        );
      }

      // Validate farmgate price if provided
      let priceVal: number | undefined = undefined;
      if (scenarioData.cropUnitPricePhpKg && scenarioData.cropUnitPricePhpKg.trim() !== "") {
        priceVal = parseFloat(scenarioData.cropUnitPricePhpKg);
        if (isNaN(priceVal) || priceVal <= 0) {
          throw new Error("Farmgate price must be greater than zero when supplied.");
        }
      }

      // Validate assessed damage percentage
      let damageVal = parseFloat(scenarioData.assessedDamagePercent);
      if (isNaN(damageVal) || damageVal < 0 || damageVal > 100) {
        throw new Error("Assessed damage percentage must be between 0 and 100%.");
      }

      // In accordance with security/data-integrity rule:
      // Client submits selected cropId, optional reportId, and current scenario inputs.
      // Authoritative agricultural data (cropType, barangay, season, soilType, plantedAreaHa)
      // are strictly retrieved server-side from PostgreSQL!
      const payload = {
        cropId: Number(selectedCropId),
        ...(scenarioData.reportId ? { reportId: scenarioData.reportId } : {}),
        calamityDamagePercent: damageVal,
        cropUnitPricePhpKg: priceVal,
      };

      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute machine learning prediction.");
      }

      const normalTotal = data.projectedNormalYieldTons || 0;
      const remainingTotal = data.predictedRemainingYieldTons || 0;
      const reductionTons = Math.max(0, normalTotal - remainingTotal);
      const lossKg = Math.round(reductionTons * 1000);
      const plantedAreaNum = selectedCrop.plantedAreaHa || 1.0;
      const predictedYieldPerHa = plantedAreaNum > 0 ? normalTotal / plantedAreaNum : 0;
      const assessedDamageNum = data.predictedYieldReductionPercent ?? damageVal;

      setResult({
        id: data.id,
        cropType: data.crop?.cropType || selectedCrop.cropType,
        modelName: data.model?.modelName || "CROP_YIELD_PREDICTOR",
        modelVersion: data.model?.modelVersion || "v1.1.0",
        algorithm: data.model?.algorithm || "RandomForestRegressor",
        predictionTimestamp: data.predictionTimestamp || new Date().toISOString(),
        farmerName: registeredFarmerName,
        farmName: registeredFarmName,
        parcelNumber: registeredParcelNumber,
        barangay: registeredBarangay,
        plantedAreaHa: plantedAreaNum,
        predictedYieldTonsHa: predictedYieldPerHa,
        projectedNormalProductionTons: normalTotal,
        assessedDamagePercent: assessedDamageNum,
        reportedDamagePercent: linkedDamageReport?.reportedDamagePercent || null,
        predictedRemainingProductionTons: remainingTotal,
        estimatedCropLossTons: reductionTons,
        estimatedCropLossKg: lossKg,
        cropUnitPricePhpKg: priceVal || null,
        priceSource: scenarioData.priceSource,
        estimatedEconomicLossPhp: data.estimatedEconomicLossPhp,
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CASCADING SELECTION OF EXISTING AGRICULTURAL RECORDS               */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <Wheat className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Select Existing Agricultural Record
                </h2>
                <p className="text-xs text-slate-500">
                  Select the registered RSBSA farmer, farm parcel, and standing crop to auto-load agricultural conditions.
                </p>
              </div>
            </div>
            {selectedCrop && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Standing Crop Linked
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1.1: Farmer Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Select Farmer *
              </label>
              <select
                value={selectedFarmerId}
                onChange={(e) => handleFarmerChange(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingCrops || submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                required
              >
                <option value="">-- Choose RSBSA Farmer --</option>
                {availableFarmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.rsbsa ? `(RSBSA: ${f.rsbsa})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 1.2: Farm / Parcel Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Select Farm / Parcel *
              </label>
              <select
                value={selectedParcelId}
                onChange={(e) => handleParcelChange(e.target.value ? Number(e.target.value) : "")}
                disabled={!selectedFarmerId || submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">
                  {!selectedFarmerId ? "-- Select Farmer First --" : "-- Choose Farm / Parcel --"}
                </option>
                {availableParcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.farmName} — {p.parcelNumber} (Brgy. {p.barangay})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 1.3: Standing Crop Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                3. Select Standing Crop *
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => handleCropChange(e.target.value ? Number(e.target.value) : "")}
                disabled={!selectedParcelId || submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer disabled:opacity-50"
                required
              >
                <option value="">
                  {!selectedParcelId ? "-- Select Parcel First --" : "-- Choose Standing Crop --"}
                </option>
                {availableCrops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cropType} {c.variety ? `(${c.variety})` : ""} — {c.season} Season ({c.plantedAreaHa} ha)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION A — REGISTERED AGRICULTURAL INFORMATION (READ-ONLY / NON-EDITABLE) */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800 shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Registered Agricultural Information
                </h2>
                <p className="text-xs text-slate-500">
                  Authoritative records retrieved from RSBSA and municipal agricultural database (Display-Only / Non-Editable).
                </p>
              </div>
            </div>

            {selectedCrop && (
              <a
                href="/staff/crops"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shrink-0"
              >
                <span>View Agricultural Record</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {!selectedCrop ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Wheat className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No Agricultural Record Selected</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Select a Farmer, Farm Parcel, and Standing Crop above to auto-load registered conditions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {/* Field 1: Farmer Name */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Farmer
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {registeredFarmerName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                  RSBSA: {registeredRsbsa}
                </span>
              </div>

              {/* Field 2: Farm */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Farm
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {registeredFarmName}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  Municipal Registered Farm
                </span>
              </div>

              {/* Field 3: Farm Parcel */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Farm Parcel
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {registeredParcelNumber}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  Parcel Reference ID
                </span>
              </div>

              {/* Field 4: Crop Type & Variety */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Crop Type & Variety
                </span>
                <span className="text-xs font-bold text-emerald-800 block truncate">
                  {registeredCropType}
                </span>
                <span className="text-[10px] text-slate-600 block truncate mt-0.5">
                  {registeredVariety}
                </span>
              </div>

              {/* Field 5: Barangay */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Barangay
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {registeredBarangay}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  Polomolok Municipality
                </span>
              </div>

              {/* Field 6: Season */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Season
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {registeredSeason}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  Cropping Cycle
                </span>
              </div>

              {/* Field 7: Soil Type */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Soil Type
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {registeredSoilType}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  Parcel Soil Profile
                </span>
              </div>

              {/* Field 8: Planted Area (Authoritative Crop.plantedAreaHa) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Planted Area (Crop.plantedAreaHa)
                </span>
                <span className="text-sm font-black text-emerald-950 font-mono block">
                  {registeredPlantedArea}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                  Authoritative Planted Area
                </span>
              </div>

              {/* Field 9: Historical Yield */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Historical Yield / Baseline
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono block">
                  {registeredHistoricalYield}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Pre-calamity Production Baseline
                </span>
              </div>

              {/* Field 10: Calamity Occurrences */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Calamity Occurrences
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono block">
                  {registeredCalamityOccurrences}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ML Historical Shock Feature
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION B — CURRENT PREDICTION SCENARIO (EDITABLE BY STAFF)               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card B.1: Crop Damage Assessment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Current Crop Damage Assessment
                </h2>
                <p className="text-xs text-slate-500">
                  Assessed damage scenario used for deterministic yield reduction and loss calculation.
                </p>
              </div>
            </div>

            {/* Damage Report Status Banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  {linkedDamageReport ? `Damage Incident: ${linkedDamageReport.reportNumber}` : "Damage Report Status"}
                </span>
                {hasFormalAssessment ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <FileCheck2 className="h-3 w-3" />
                    Formal Assessment Registered
                  </span>
                ) : linkedDamageReport ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    Reported Only (Pending Formal Assessment)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">No Damage Incident Linked</span>
                )}
              </div>

              {linkedDamageReport && (
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Reported Incident Date:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(linkedDamageReport.incidentDate).toLocaleDateString()} ({linkedDamageReport.calamityType})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Farmer Reported Damage:</span>
                    <span className="font-mono font-bold text-amber-800">
                      {linkedDamageReport.reportedDamagePercent}% (Farmer Declaration)
                    </span>
                  </div>
                </div>
              )}

              {linkedDamageReport?.assessment && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-[11px] text-emerald-900">
                  <span className="font-bold">Field Assessment: </span>
                  {linkedDamageReport.assessment.assessedDamagePercent}% assessed severity • {linkedDamageReport.assessment.cropStage} stage ({linkedDamageReport.assessment.assessedAreaHa} ha evaluated).
                </div>
              )}

              {/* OMAG Head Approval Gate Status */}
              {linkedDamageReport && (
                <div className="rounded-lg border p-2.5 text-[11px] space-y-1 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">OMAG Head Approval Gate:</span>
                    {(linkedDamageReport as any).pcicClaim?.headApprovalStatus === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        <CheckCircle className="h-3 w-3" /> Approved for Prediction
                      </span>
                    ) : (linkedDamageReport as any).pcicClaim?.headApprovalStatus === "REJECTED" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded">
                        <XCircle className="h-3 w-3" /> Rejected by Head
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        <Clock className="h-3 w-3" /> Pending Head Approval
                      </span>
                    )}
                  </div>
                  {(linkedDamageReport as any).pcicClaim?.headApprovalStatus !== "APPROVED" && (
                    <p className="text-[10px] text-amber-800 italic">
                      ⚠️ Case is not yet approved by OMAG Head. Prediction generation is gated.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Assessed Damage Input or Locked Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assessed Damage (%) *
              </label>

              {hasFormalAssessment ? (
                // When formal assessment exists, lock to registered DamageAssessment value (Cannot overwrite!)
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/50 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-700" />
                      <span className="text-sm font-black font-mono text-emerald-900">
                        {scenarioData.assessedDamagePercent}%
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">
                      Locked to DamageAssessment
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Staff cannot manually alter this value because a formal technical field assessment is registered.
                  </p>
                </div>
              ) : (
                // When no formal assessment exists, allow staff to input damage scenario (0–100%)
                <div>
                  <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={scenarioData.assessedDamagePercent}
                      onChange={(e) => setScenarioData((prev) => ({ ...prev, assessedDamagePercent: e.target.value }))}
                      placeholder="0"
                      disabled={!selectedCropId || submitting}
                      className="w-full bg-transparent px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none disabled:opacity-50"
                      required
                    />
                    <span className="pr-3 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter damage scenario percentage (0–100%). Used for deterministic loss calculation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card B.2: Farmgate Price */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Farmgate Price
                </h2>
                <p className="text-xs text-slate-500">
                  Applicable commodity valuation benchmark for economic loss estimation.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Farmgate Price (₱ / kg)
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span className="pl-3 text-slate-500 text-xs font-bold">₱</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={scenarioData.cropUnitPricePhpKg}
                    onChange={(e) => setScenarioData((prev) => ({ ...prev, cropUnitPricePhpKg: e.target.value }))}
                    placeholder="21.00"
                    disabled={!selectedCropId || submitting}
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs font-semibold text-slate-900 outline-none disabled:opacity-50"
                  />
                  <span className="pr-3 text-xs font-bold text-slate-400">/kg</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Price Source / Provenance:</span>
                <span className="text-slate-700 font-medium block">{scenarioData.priceSource}</span>
                <span className="text-[11px] text-slate-400 block italic pt-1">
                  Formula: Estimated Economic Loss (PHP) = Estimated Crop Loss (kg) × Farmgate Price (PHP/kg)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PREDICTION ACTION BAR                                                     */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Workflow:</span>
            <span>Select Record → Auto-Load Conditions (Read-Only) → Enter Current Scenario → Generate</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onViewHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
              >
                View Prediction History
              </button>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedCropId ||
                Boolean(linkedDamageReport && (linkedDamageReport as any)?.pcicClaim?.headApprovalStatus !== "APPROVED")
              }
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing ML Prediction...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* SECTION 10: PREDICTION RESULT DISPLAY                                     */}
      {/* ========================================================================= */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-b from-emerald-50/40 via-white to-white p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-bold">
                  PREDICTION COMPLETE
                </span>
                <span className="text-xs font-mono text-slate-500">Record ID: {result.id}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Prediction Results — {result.cropType}
              </h3>
              <p className="text-xs text-slate-600">
                Farmer: <span className="font-semibold text-slate-800">{result.farmerName}</span> • Farm:{" "}
                <span className="font-semibold text-slate-800">{result.farmName}</span> (Parcel {result.parcelNumber}, Brgy. {result.barangay}) • Planted Area:{" "}
                <span className="font-semibold text-slate-800">{result.plantedAreaHa} ha</span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
              <div>Model: <span className="font-semibold text-slate-700">{result.modelName}</span> (<span className="font-mono font-bold text-emerald-800">{result.modelVersion}</span>)</div>
              <div>Algorithm: <span className="font-semibold text-slate-700">{result.algorithm}</span></div>
              <div>Timestamp: {new Date(result.predictionTimestamp).toLocaleTimeString()} ({new Date(result.predictionTimestamp).toLocaleDateString()})</div>
            </div>
          </div>

          {/* Core Prediction & Deterministic Calculation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Predicted Yield (ML Model Output) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">1. Predicted Yield</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-slate-900 font-mono">
                  {result.predictedYieldTonsHa.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">t/ha</span>
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                  ML model regression output
                </p>
              </div>
            </div>

            {/* Card 2: Projected Normal Production */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">2. Projected Normal Production</span>
                <Wheat className="h-4 w-4 text-teal-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-teal-900 font-mono">
                  {result.projectedNormalProductionTons.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">tons</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {result.predictedYieldTonsHa.toFixed(2)} t/ha × {result.plantedAreaHa} ha
                </p>
              </div>
            </div>

            {/* Card 3: Estimated Crop Loss */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">3. Estimated Crop Loss</span>
                <Scale className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-red-800 font-mono">
                  {result.estimatedCropLossKg.toLocaleString("en-US")}{" "}
                  <span className="text-xs font-normal text-slate-500">kg</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {result.estimatedCropLossTons.toFixed(2)} tons ({result.assessedDamagePercent}% damage)
                </p>
              </div>
            </div>

            {/* Card 4: Predicted Remaining Production */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">4. Predicted Remaining Production</span>
                <TrendingDown className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-slate-900 font-mono">
                  {result.predictedRemainingProductionTons.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">tons</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Normal ({result.projectedNormalProductionTons.toFixed(2)}t) - Loss ({result.estimatedCropLossTons.toFixed(2)}t)
                </p>
              </div>
            </div>
          </div>

          {/* Prominent Estimated Economic Loss Card */}
          <div className="rounded-2xl border-2 border-emerald-300 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                Estimated Economic Loss
              </span>
              <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                {result.estimatedEconomicLossPhp !== null ? (
                  `₱${result.estimatedEconomicLossPhp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  "Price Unavailable"
                )}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Calculation: Estimated Crop Loss ({result.estimatedCropLossKg.toLocaleString()} kg) × Farmgate Price (₱{result.cropUnitPricePhpKg?.toFixed(2) || "0.00"}/kg)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-white font-semibold text-slate-700">
                Farmgate Price: ₱{result.cropUnitPricePhpKg?.toFixed(2) || "—"}/kg
              </span>
              <span className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-500">
                Source: {result.priceSource}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
