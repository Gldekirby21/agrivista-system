"use client";

import React, { useState } from "react";
import {
  Sprout,
  Calendar,
  Layers,
  AlertCircle,
  Save,
  Trash2,
  ShieldCheck,
  Check,
  Wheat,
  Activity,
} from "lucide-react";
import { COMMON_CROP_TYPES } from "../types";
import { cn } from "@/lib/utils/cn";

export interface CropFormProps {
  parcelId: number;
  parcelNumber: string;
  defaultAreaHa?: number;
  onSuccess: (crop: any) => void;
  onCancel: () => void;
}

export const CropForm: React.FC<CropFormProps> = ({
  parcelId,
  parcelNumber,
  defaultAreaHa = 1.0,
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cropType: "Corn",
    variety: "NK8840 Hybrid",
    category: "Primary",
    plantedAreaHa: defaultAreaHa.toString(),
    plantingDate: new Date().toISOString().split("T")[0],
    expectedHarvestDate: "",
    season: "Wet",
    year: new Date().getFullYear().toString(),
    status: "Standing",
    remarks: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/rsbsa/parcels/${parcelId}/crops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parcelId,
          plantedAreaHa: parseFloat(formData.plantedAreaHa),
          year: parseInt(formData.year, 10),
          expectedHarvestDate: formData.expectedHarvestDate ? formData.expectedHarvestDate : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record crop planting.");
      }

      onSuccess(data.crop);
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred while saving the crop record.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-800 animate-in fade-in shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Target Parcel Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
            LOT
          </div>
          <div>
            <span className="font-semibold text-emerald-950">Target Land Parcel:</span>{" "}
            <strong>Parcel {parcelNumber}</strong> (ID: #{parcelId})
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5" /> Seasonal Planting Entry
        </span>
      </div>

      {/* SECTION 1: CROP & COMMODITY DETAILS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0 shadow-2xs">
              <Sprout className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Crop &amp; Cultivar Identification
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select from confirmed RSBSA agricultural commodities or type custom commodity.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {/* Crop Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Crop / Commodity Type <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="pl-3.5 text-slate-400">
                <Wheat className="h-4 w-4" />
              </span>
              <input
                list="crop-suggestions"
                name="cropType"
                required
                value={formData.cropType}
                onChange={handleChange}
                placeholder="e.g. Corn, Rice, Pineapple, Papaya"
                className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
              />
              <datalist id="crop-suggestions">
                {COMMON_CROP_TYPES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Variety / Cultivar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Cultivar / Seed Variety
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="text"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                placeholder="e.g. NK8840 Hybrid, RC222, MD-2"
                className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Planted Area */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Planted Area (Hectares) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="number"
                step="0.01"
                name="plantedAreaHa"
                required
                value={formData.plantedAreaHa}
                onChange={handleChange}
                className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-900 outline-none"
              />
              <span className="pr-3.5 text-xs font-bold text-slate-400">ha</span>
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Cropping Season
            </label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
            >
              <option value="Wet">Wet Season</option>
              <option value="Dry">Dry Season</option>
              <option value="Unspecified">Year-round / Unspecified</option>
            </select>
          </div>

          {/* Cropping Year */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Cropping Year
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: TIMING & STANDING STATUS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0 shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Planting Schedule &amp; Field Status
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Key dates for yield estimation and crop insurance validation.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Planting Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Planting Date <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="pl-3.5 text-slate-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                name="plantingDate"
                required
                value={formData.plantingDate}
                onChange={handleChange}
                className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-medium text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Expected Harvest */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Expected Harvest Date
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="pl-3.5 text-slate-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                name="expectedHarvestDate"
                value={formData.expectedHarvestDate}
                onChange={handleChange}
                className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-medium text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Standing Status Selector Buttons */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Active Field Status
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { key: "Standing", label: "Standing (Active Growth)", desc: "Currently planted & growing" },
              { key: "Harvested", label: "Harvested", desc: "Crop harvest completed" },
              { key: "Damaged", label: "Calamity / Damaged", desc: "Pest / flood / drought impaired" },
            ].map((st) => (
              <div
                key={st.key}
                onClick={() => setFormData({ ...formData, status: st.key })}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer select-none",
                  formData.status === st.key
                    ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{st.label}</span>
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      formData.status === st.key
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {formData.status === st.key && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 -mx-5 -mb-5 md:-mx-6 md:-mb-6 px-5 md:px-6 py-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs md:text-sm px-7 py-2.5 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? "Saving Record..." : "Save Crop Record"}</span>
          </button>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium pl-1">
            Polomolok Agricultural Registry
          </span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Discard & Close"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
