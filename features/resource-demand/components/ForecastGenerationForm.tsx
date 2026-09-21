"use client";

import React, { useState } from "react";
import {
  POLOMOLOK_BARANGAYS,
  SUPPORTED_CROPS,
  SEASONS,
  SOIL_TYPES,
  ForecastResultDTO,
} from "../types";
import { Sparkles, AlertTriangle, Users, CheckCircle } from "lucide-react";

interface ForecastGenerationFormProps {
  onForecastGenerated: (result: ForecastResultDTO) => void;
}

export const ForecastGenerationForm: React.FC<ForecastGenerationFormProps> = ({
  onForecastGenerated,
}) => {
  const [cropType, setCropType] = useState<string>("Corn");
  const [barangay, setBarangay] = useState<string>("Poblacion");
  const [forecastYear, setForecastYear] = useState<number>(2026);
  const [forecastSeason, setForecastSeason] = useState<string>("Wet");
  const [projectedAreaHa, setProjectedAreaHa] = useState<string>("5.0");
  const [projectedFarmers, setProjectedFarmers] = useState<string>("4");
  const [soilType, setSoilType] = useState<string>("Volcanic Loam");
  const [calamityOccurrences, setCalamityOccurrences] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rsbsaLoading, setRsbsaLoading] = useState(false);
  const [rsbsaNotice, setRsbsaNotice] = useState<string | null>(null);

  const handleLoadRsbsaContext = async () => {
    setRsbsaLoading(true);
    setRsbsaNotice(null);
    try {
      const res = await fetch(
        `/api/resource-demand/context?barangay=${encodeURIComponent(barangay)}&cropType=${encodeURIComponent(cropType)}`
      );
      if (res.ok) {
        const data = await res.json();
        setProjectedAreaHa(String(data.plantedAreaHa));
        setProjectedFarmers(String(data.farmerCount));
        if (data.prevailingSoilType) {
          setSoilType(data.prevailingSoilType);
        }
        setRsbsaNotice(
          `Current RSBSA Context: ${data.farmerCount} registered farmers, ${data.plantedAreaHa} ha landholdings in Brgy. ${data.barangay}.`
        );
      }
    } catch (e) {
      console.error("Failed to load RSBSA context:", e);
    } finally {
      setRsbsaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        cropType,
        barangay,
        forecastYear: Number(forecastYear),
        forecastSeason,
        projectedAreaHa: parseFloat(projectedAreaHa),
        projectedFarmers: projectedFarmers ? parseInt(projectedFarmers, 10) : null,
        soilType: soilType || null,
        calamityOccurrences: Number(calamityOccurrences),
      };

      const res = await fetch("/api/resource-demand/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || "Failed to generate forecast");
      }

      const result: ForecastResultDTO = await res.json();
      onForecastGenerated(result);
    } catch (err: any) {
      setError(err.message || "Forecast generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Generate Agricultural Resource Demand Forecast
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Supervised RandomForest regression models estimating municipal seed (kg) and fertilizer (50kg bags) requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadRsbsaContext}
          disabled={rsbsaLoading}
          className="px-3 py-1.5 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
          title="Autofill from registered RSBSA farmers and parcels in the selected barangay"
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          {rsbsaLoading ? "Querying RSBSA..." : "Use Current RSBSA Context"}
        </button>
      </div>

      {rsbsaNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{rsbsaNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Crop *</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              required
            >
              {SUPPORTED_CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Barangay *</label>
            <select
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              required
            >
              {POLOMOLOK_BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Soil Classification</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
            >
              {SOIL_TYPES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Forecast Year *</label>
            <input
              type="number"
              name="forecastYear"
              min={2024}
              max={2035}
              value={forecastYear}
              onChange={(e) => setForecastYear(parseInt(e.target.value, 10))}
              autoComplete="off"
              className="w-full border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Forecast Season *</label>
            <select
              value={forecastSeason}
              onChange={(e) => setForecastSeason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              required
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Projected Area (ha) *</label>
            <input
              type="number"
              name="projectedAreaHa"
              step="0.1"
              min="0.1"
              value={projectedAreaHa}
              onChange={(e) => setProjectedAreaHa(e.target.value)}
              autoComplete="off"
              className="w-full border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Projected Beneficiaries</label>
            <input
              type="number"
              name="projectedFarmers"
              min="1"
              value={projectedFarmers}
              onChange={(e) => setProjectedFarmers(e.target.value)}
              placeholder="e.g. 5"
              autoComplete="off"
              className="w-full border border-slate-200 rounded-lg p-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Model: <span className="font-semibold text-slate-700">RandomForestRegressor (Dual Seed & Fertilizer)</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
          >
            {loading ? "Evaluating Models..." : "Run ML Forecast Simulation"}
          </button>
        </div>
      </form>
    </div>
  );
};
