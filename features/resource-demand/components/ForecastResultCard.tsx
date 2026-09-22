"use client";

import React from "react";
import { ForecastResultDTO } from "../types";
import { CheckCircle2, AlertCircle, Info, Calculator, Cpu } from "lucide-react";

interface ForecastResultCardProps {
  result: ForecastResultDTO | null;
}

export const ForecastResultCard: React.FC<ForecastResultCardProps> = ({ result }) => {
  if (!result) return null;

  const { mlPredictions, deterministicDerivedValues, modelMetadata } = result;

  return (
    <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Resource Demand Forecast Result — {result.cropType} ({result.barangay})
            </h4>
            <p className="text-slate-500 text-[11px]">
              Period: {result.forecastSeason} {result.forecastYear} | Land Area: {result.projectedAreaHa} ha
              {result.projectedFarmers ? ` | Beneficiaries: ${result.projectedFarmers}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
        <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Planning Estimate Notice:</p>
          <p>{result.limitationsNotice}</p>
        </div>
      </div>

      {/* Section A: ML Model Predictions */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
          <Cpu className="h-4 w-4 text-indigo-600" />
          <span>Section A: Machine Learning Model Predictions (RandomForest)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
              Projected Seed Requirement
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-950">
                {mlPredictions.forecastSeedKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-semibold text-emerald-700">Kilograms (kg)</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-1">
              Estimated from historical variety demand and farm parcel scale.
            </p>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
              Projected Fertilizer Requirement
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-blue-950">
                {mlPredictions.forecastFertilizerBags.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-semibold text-blue-700">Bags (50kg each)</span>
            </div>
            <p className="text-[10px] text-blue-700 mt-1">
              Estimated based on soil classification, crop nutrition profile, and seasonal demand.
            </p>
          </div>
        </div>
      </div>

      {/* Section B: Deterministic Derived Values */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
          <Calculator className="h-4 w-4 text-slate-600" />
          <span>Section B: Deterministic Planning Ratios (Arithmetic Derivations)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-medium">Seed Application Rate</span>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
              {deterministicDerivedValues.seedRateKgPerHa.toFixed(2)} kg/ha
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-medium">Fertilizer Rate</span>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
              {deterministicDerivedValues.fertilizerRateBagsPerHa.toFixed(2)} bags/ha
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-medium">Avg Seed / Beneficiary</span>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
              {deterministicDerivedValues.seedPerFarmerKg !== null && deterministicDerivedValues.seedPerFarmerKg !== undefined
                ? `${deterministicDerivedValues.seedPerFarmerKg.toFixed(2)} kg`
                : "—"}
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-medium">Avg Fert / Beneficiary</span>
            <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
              {deterministicDerivedValues.fertilizerPerFarmerBags !== null && deterministicDerivedValues.fertilizerPerFarmerBags !== undefined
                ? `${deterministicDerivedValues.fertilizerPerFarmerBags.toFixed(2)} bags`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Model Metadata Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
        <div>
          Model Version: <span className="font-semibold text-slate-700">{modelMetadata?.modelVersion || "v1.0.0"}</span> | Algorithm:{" "}
          <span className="font-semibold text-slate-700">{modelMetadata?.algorithm || "RandomForestRegressor"}</span>
        </div>
        {result.forecastRecordId && (
          <div>
            Record ID: <span className="text-slate-600">{result.forecastRecordId}</span>
          </div>
        )}
      </div>
    </div>
  );
};
