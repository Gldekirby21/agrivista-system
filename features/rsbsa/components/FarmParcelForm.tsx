"use client";

import React, { useState } from "react";
import {
  MapPin,
  Layers,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Save,
  Trash2,
  TreePine,
  ShieldCheck,
  Check,
  Globe2,
} from "lucide-react";
import { POLOMOLOK_BARANGAYS, TENURE_TYPES } from "../types";
import { cn } from "@/lib/utils/cn";
import { MapCoordinatePickerModal } from "@/components/maps/MapCoordinatePickerModal";

export interface FarmParcelFormProps {
  farmerId: number;
  farmerName: string;
  defaultBarangay?: string;
  onSuccess: (farm: any) => void;
  onCancel: () => void;
}

export const FarmParcelForm: React.FC<FarmParcelFormProps> = ({
  farmerId,
  farmerName,
  defaultBarangay = "Poblacion",
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    farmName: "",
    barangay: defaultBarangay,
    municipality: "Polomolok",
    province: "South Cotabato",
    sitioPurok: "",
    totalAreaHa: "1.0",
    tenureType: "Owned",
    soilType: "Volcanic Loam",
    waterSource: "Rainfed",
    parcelNumber: "LOT-01",
    areaHa: "1.0",
    latitude: "6.2189",
    longitude: "125.0645",
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
      const res = await fetch(`/api/rsbsa/farmers/${farmerId}/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalAreaHa: parseFloat(formData.totalAreaHa),
          areaHa: parseFloat(formData.areaHa),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add farm parcel.");
      }

      onSuccess(data.farm);
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred while saving the parcel.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-800 animate-in fade-in shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Farmer Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
            ID
          </div>
          <div>
            <span className="font-semibold text-emerald-950">Target Farmer:</span>{" "}
            <strong>{farmerName}</strong> (Farmer ID: #{farmerId})
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5" /> DA RSBSA Parcel Record
        </span>
      </div>

      {/* SECTION 1: LANDHOLDING IDENTITY */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0 shadow-2xs">
              <TreePine className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Farm Landholding Location
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Physical property details within the Polomolok agricultural jurisdiction.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {/* Farm Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Farm / Plot Identifier Name
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="pl-3.5 text-slate-400">
                <TreePine className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                placeholder="e.g. Riverside Farm Lot 4"
                className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Barangay */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Barangay Location <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="pl-3.5 text-slate-400">
                <MapPin className="h-4 w-4" />
              </span>
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-medium text-slate-900 outline-none cursor-pointer"
              >
                {POLOMOLOK_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tenure */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Tenure / Ownership *
            </label>
            <select
              name="tenureType"
              value={formData.tenureType}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
            >
              {TENURE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Total Landholding Area */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Total Area (Hectares) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="number"
                step="0.01"
                required
                name="totalAreaHa"
                value={formData.totalAreaHa}
                onChange={handleChange}
                className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-900 outline-none"
              />
              <span className="pr-3.5 text-xs font-bold text-slate-400">ha</span>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Soil Type
            </label>
            <input
              type="text"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              placeholder="e.g. Volcanic Loam, Clay"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CADASTRAL PARCEL & CENTROID GEOLOCATION */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 shrink-0 shadow-2xs">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Cadastral Lot &amp; Geolocation Coordinates
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official lot number and GPS centroid for crop inspection verification.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Cadastral Lot / Parcel Number
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="pl-3.5 text-slate-400">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="parcelNumber"
                value={formData.parcelNumber}
                onChange={handleChange}
                placeholder="e.g. LOT-POB-01"
                className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-mono font-medium text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Specific Parcel Area (Hectares) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="number"
                step="0.01"
                required
                name="areaHa"
                value={formData.areaHa}
                onChange={handleChange}
                className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-900 outline-none"
              />
              <span className="pr-3.5 text-xs font-bold text-slate-400">ha</span>
            </div>
          </div>
        </div>

        {/* Centroid Geolocation Bar & Manual Inputs */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                Centroid Geolocation Coordinates
              </span>
              <p className="text-[11px] text-emerald-800/80">
                Maaaring i-pin drop sa mapa o i-type nang manual ang decimal coordinates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMapPickerOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Globe2 className="h-3.5 w-3.5" />
              Piliin sa Mapa / Pin Drop
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/60">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Centroid Latitude (°N)
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <input
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="6.218900"
                  className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-mono text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Centroid Longitude (°E)
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <input
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="125.064500"
                  className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-mono text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
            </div>
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
            <span>{isLoading ? "Saving Parcel..." : "Save Farm Parcel Record"}</span>
          </button>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium pl-1">
            Polomolok OMAG RSBSA Database
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

      {/* Map Coordinate Picker Modal */}
      <MapCoordinatePickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={formData.latitude}
        initialLng={formData.longitude}
        initialBarangay={formData.barangay}
        onSelectCoordinates={(lat, lng) => {
          setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        title="Piliin ang Centroid ng Farm Parcel"
        subtitle="I-click o i-drag ang pin sa eksaktong lokasyon ng lote sa Polomolok."
      />
    </form>
  );
};
