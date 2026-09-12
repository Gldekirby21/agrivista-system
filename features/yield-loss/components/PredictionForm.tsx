"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Wheat,
  MapPin,
  Calendar,
  DollarSign,
  Layers,
  Save,
  Trash2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { cn } from "@/lib/utils/cn";

interface CropOption {
  id: number;
  cropType: string;
  variety: string | null;
  season: string;
  year: number;
  plantedAreaHa: number;
  recordedYieldPerHa: number | null;
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
}

interface PredictionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (prediction: any) => void;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cropType: "Corn",
    barangay: "Poblacion",
    season: "Wet",
    soilType: "Volcanic Loam",
    plantedAreaHa: "1.0",
    baselineYieldTonsHa: "4.5",
    calamityDamagePercent: "0",
    cropUnitPricePhpKg: "18.0",
    calamityOccurrences: "0",
  });

  useEffect(() => {
    if (isOpen) {
      fetchCrops();
    }
  }, [isOpen]);

  const fetchCrops = async () => {
    setLoadingCrops(true);
    try {
      const res = await fetch("/api/rsbsa/crops");
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

  const handleCropSelect = (cropId: number | "") => {
    setSelectedCropId(cropId);
    if (!cropId) return;

    const crop = crops.find((c) => c.id === cropId);
    if (crop) {
      setFormData((prev) => ({
        ...prev,
        cropType: crop.cropType,
        barangay: crop.parcel?.farm?.barangay || "Poblacion",
        season: crop.season || "Wet",
        soilType: crop.parcel?.soilType || "Volcanic Loam",
        plantedAreaHa: crop.plantedAreaHa.toString(),
        baselineYieldTonsHa: (crop.recordedYieldPerHa || 4.5).toString(),
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropId) {
      setError("Please select a registered crop planting record.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        cropId: Number(selectedCropId),
        cropType: formData.cropType,
        barangay: formData.barangay,
        season: formData.season,
        soilType: formData.soilType,
        plantedAreaHa: parseFloat(formData.plantedAreaHa),
        baselineYieldTonsHa: formData.baselineYieldTonsHa ? parseFloat(formData.baselineYieldTonsHa) : undefined,
        calamityDamagePercent: formData.calamityDamagePercent ? parseFloat(formData.calamityDamagePercent) : undefined,
        cropUnitPricePhpKg: formData.cropUnitPricePhpKg ? parseFloat(formData.cropUnitPricePhpKg) : undefined,
        calamityOccurrences: parseInt(formData.calamityOccurrences, 10) || 0,
      };

      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute prediction");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during ML prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ML Crop Yield & Loss Prediction Analysis"
      subtitle="RandomForest regression model for estimating projected yield reduction and potential economic loss."
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs font-semibold text-red-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* 3-Column x 2-Row Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
          {/* DIV 1: TARGET CROP & PLOT SELECTION (Row 1, Cols 1-2) */}
          <div className="lg:col-span-2 lg:row-start-1 lg:col-start-1 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <Wheat className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                    Target Crop Record Linkage
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Select a standing crop planting registered under OMAG masterlist.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                RSBSA Validated
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Select Registered Crop Planting *
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => handleCropSelect(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingCrops || submitting}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                required
              >
                <option value="">-- Choose Standing Crop from Registry --</option>
                {crops.map((c) => {
                  const farmerName = c.parcel?.farm?.farmer
                    ? `${c.parcel.farm.farmer.firstName} ${c.parcel.farm.farmer.lastName}`
                    : "Farmer";
                  const brgy = c.parcel?.farm?.barangay || "Polomolok";
                  return (
                    <option key={c.id} value={c.id}>
                      {c.cropType} ({c.variety || "Standard"}) — Brgy. {brgy} • {farmerName} [{c.plantedAreaHa} ha]
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Planted Area (Hectares) *
                </label>
                <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <input
                    type="number"
                    step="0.01"
                    name="plantedAreaHa"
                    required
                    value={formData.plantedAreaHa}
                    onChange={handleChange}
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  />
                  <span className="pr-2.5 text-[10px] font-bold text-slate-400">ha</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Baseline Normal Yield (Tons/Ha)
                </label>
                <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <input
                    type="number"
                    step="0.1"
                    name="baselineYieldTonsHa"
                    value={formData.baselineYieldTonsHa}
                    onChange={handleChange}
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  />
                  <span className="pr-2.5 text-[10px] font-bold text-slate-400">t/ha</span>
                </div>
              </div>
            </div>
          </div>

          {/* DIV 3: GEOGRAPHIC & SOIL LOCATION (Row 1, Col 3) */}
          <div className="lg:col-span-1 lg:row-start-1 lg:col-start-3 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                    Location &amp; Soil Type
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Spatial features.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Barangay Location
                </label>
                <input
                  type="text"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Soil Classification
                </label>
                <input
                  type="text"
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* DIV 2: CALAMITY & DAMAGE SCENARIO (Row 2, Cols 1-2) */}
          <div className="lg:col-span-2 lg:row-start-2 lg:col-start-1 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800 shrink-0">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                    Yield Reduction &amp; Calamity Impact Parameters
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Optional damage scenario variables for estimating loss reduction.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Calamity Occurrences
                </label>
                <input
                  type="number"
                  min="0"
                  name="calamityOccurrences"
                  value={formData.calamityOccurrences}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Assessed Damage (%)
                </label>
                <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    name="calamityDamagePercent"
                    value={formData.calamityDamagePercent}
                    onChange={handleChange}
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  />
                  <span className="pr-2.5 text-[10px] font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Cropping Season
                </label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                >
                  <option value="Wet">Wet Season</option>
                  <option value="Dry">Dry Season</option>
                </select>
              </div>
            </div>
          </div>

          {/* DIV 4: ECONOMIC VALUATION (Row 2, Col 3) */}
          <div className="lg:col-span-1 lg:row-start-2 lg:col-start-3 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-800 shrink-0">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                    Economic Loss Valuation
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Market price benchmark.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Crop Farmgate Price (₱/kg)
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="pl-2.5 text-slate-400 text-xs font-bold">₱</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="cropUnitPricePhpKg"
                  value={formData.cropUnitPricePhpKg}
                  onChange={handleChange}
                  placeholder="e.g. 18.00"
                  className="w-full bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                />
                <span className="pr-2 text-[10px] text-slate-400 font-medium">/kg</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Optional: Leave blank if price data is unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Toolbar */}
        <div className="sticky bottom-0 -mx-4 -mb-4 md:-mx-5 md:-mb-5 px-4 md:px-5 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={submitting || !selectedCropId}
              className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs px-5 py-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{submitting ? "Running ML Model..." : "Generate ML Prediction"}</span>
            </button>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium pl-1">
              RandomForest Tabular Regression
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Discard & Close"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
