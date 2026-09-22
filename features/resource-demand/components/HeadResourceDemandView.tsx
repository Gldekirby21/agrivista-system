"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HistoricalDataTable } from "./HistoricalDataTable";
import { ModelMetricsView } from "./ModelMetricsView";
import { ForecastHistoryList } from "./ForecastHistoryList";
import { ForecastResultCard } from "./ForecastResultCard";
import {
  DualResourceModelsDTO,
  ForecastResultDTO,
  ResourceDemandForecastDTO,
} from "../types";
import {
  LineChart,
  Database,
  Cpu,
  History,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

function forecastDtoToResultCard(
  f: ResourceDemandForecastDTO,
  models?: DualResourceModelsDTO | null
): ForecastResultDTO {
  const seedRate = f.projectedAreaHa > 0 ? f.forecastSeedKg / f.projectedAreaHa : 0;
  const fertRate = f.projectedAreaHa > 0 ? f.forecastFertilizerBags / f.projectedAreaHa : 0;
  const seedPerFarmer =
    f.projectedFarmers && f.projectedFarmers > 0
      ? f.forecastSeedKg / f.projectedFarmers
      : null;
  const fertPerFarmer =
    f.projectedFarmers && f.projectedFarmers > 0
      ? f.forecastFertilizerBags / f.projectedFarmers
      : null;

  return {
    success: true,
    forecastRecordId: f.id,
    cropType: f.cropType,
    barangay: f.barangay,
    forecastYear: f.forecastYear,
    forecastSeason: f.forecastSeason,
    projectedAreaHa: f.projectedAreaHa,
    projectedFarmers: f.projectedFarmers,
    mlPredictions: {
      forecastSeedKg: f.forecastSeedKg,
      forecastFertilizerBags: f.forecastFertilizerBags,
    },
    deterministicDerivedValues: {
      seedRateKgPerHa: seedRate,
      fertilizerRateBagsPerHa: fertRate,
      seedPerFarmerKg: seedPerFarmer,
      fertilizerPerFarmerBags: fertPerFarmer,
    },
    modelMetadata: {
      seedModelName: "SeedRequirementPipeline",
      fertilizerModelName: "FertilizerRequirementPipeline",
      modelVersion: f.modelVersion || models?.modelVersion || "v1.0.0",
      algorithm: models?.algorithm || "RandomForestRegressor",
      trainingPeriod: models?.seedModel?.trainingPeriod || "2020–2024",
    },
    limitationsNotice:
      f.limitationsNotice ||
      "Demonstration / Synthetic Data. Forecast results are for system demonstration and testing only. They are not official OMAG procurement or allocation requirements.",
    isSynthetic: f.isSynthetic ?? true,
    generatedAt: typeof f.generatedAt === "string" ? f.generatedAt : new Date(f.generatedAt).toISOString(),
  };
}

function HeadResourceDemandContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"historical" | "forecast" | "history">("historical");
  const [modelData, setModelData] = useState<DualResourceModelsDTO | null>(null);
  const [totalHistorical, setTotalHistorical] = useState(0);

  const [savedForecasts, setSavedForecasts] = useState<ResourceDemandForecastDTO[]>([]);
  const [selectedForecastId, setSelectedForecastId] = useState<string>("");
  const [selectedForecastCard, setSelectedForecastCard] = useState<ForecastResultDTO | null>(null);
  const [forecastsLoading, setForecastsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "historical") {
      setActiveTab("historical");
    } else if (tab === "forecast") {
      setActiveTab("forecast");
    } else if (tab === "history" || tab === "models") {
      setActiveTab("history");
    }
  }, [searchParams]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    // Load summary KPIs
    fetch("/api/resource-demand/models")
      .then((res) => res.json())
      .then((data) => setModelData(data))
      .catch((e) => console.error(e));

    fetch("/api/resource-demand/historical?limit=1")
      .then((res) => res.json())
      .then((data) => setTotalHistorical(data.total || 0))
      .catch((e) => console.error(e));
  }, [refreshTrigger]);

  // Load existing forecasts for view-only inspection
  useEffect(() => {
    setForecastsLoading(true);
    fetch("/api/resource-demand/history?limit=50")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: ResourceDemandForecastDTO[]) => {
        setSavedForecasts(items || []);
        if (items && items.length > 0) {
          // If no selection yet or previous selection not in list, select latest
          const target = items.find((i) => i.id === selectedForecastId) || items[0];
          setSelectedForecastId(target.id);
          setSelectedForecastCard(forecastDtoToResultCard(target, modelData));
        } else {
          setSelectedForecastCard(null);
        }
      })
      .catch((e) => console.error("Error loading saved forecasts:", e))
      .finally(() => setForecastsLoading(false));
  }, [refreshTrigger, modelData]);

  const handleSelectForecast = (forecast: ResourceDemandForecastDTO) => {
    setSelectedForecastId(forecast.id);
    setSelectedForecastCard(forecastDtoToResultCard(forecast, modelData));
    setActiveTab("forecast");
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedForecastId(id);
    const found = savedForecasts.find((f) => f.id === id);
    if (found) {
      setSelectedForecastCard(forecastDtoToResultCard(found, modelData));
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200/70 rounded-xl w-80 animate-pulse" />
        <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Historical Crop Yield & Purchase Modeling
              </h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold">
                OMAG_HEAD Oversight (View-Only)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Inspection of historical crop production data, estimated seed and fertilizer requirements, and previous modeling results.
            </p>
          </div>
        </div>

        {/* Executive Disclaimer */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Executive Planning Notice: </span>
            Forecast outputs represent decision-support estimates derived from historical data. They do NOT constitute official OMAG municipal budget approvals, procurement authorizations, or beneficiary claim entitlements.
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Historical Records</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalHistorical}</p>
          <span className="text-[10px] text-slate-400">Archived & active records</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Seed Model R² Accuracy</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {modelData?.seedModel?.r2Score !== undefined ? modelData.seedModel.r2Score.toFixed(3) : "—"}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">RandomForest Regression</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Fertilizer Model R² Accuracy</span>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {modelData?.fertilizerModel?.r2Score !== undefined ? modelData.fertilizerModel.r2Score.toFixed(3) : "—"}
          </p>
          <span className="text-[10px] text-blue-600 font-medium">RandomForest Regression</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Evaluation Methodology</span>
          <p className="text-sm font-bold text-slate-800 mt-2">Time-Aware Holdout</p>
          <span className="text-[10px] text-slate-400">Chronological validation split</span>
        </div>
      </div>

      {/* Tabs strictly corresponding to approved FDD */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("historical")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "historical"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Database className="h-4 w-4" />
          1. View Historical Crop Production Data
        </button>

        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "forecast"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <LineChart className="h-4 w-4" />
          2. View Estimated Seed and Fertilizer Requirements
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="h-4 w-4" />
          3. View Historical Yield and Resource-Demand Results
        </button>
      </div>

      {/* Tab 1: View Historical Crop Production Data */}
      {activeTab === "historical" && (
        <HistoricalDataTable onRefreshTrigger={refreshTrigger} />
      )}

      {/* Tab 2: View Estimated Seed and Fertilizer Requirements */}
      {activeTab === "forecast" && (
        <div className="space-y-5">
          {/* View-Only Forecast Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Estimated Resource Requirements Inspection
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select any recorded agricultural estimation to view projected seed (kg) and fertilizer (bags) requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[340px]">
                <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                  Saved Estimate:
                </label>
                <div className="relative flex-1">
                  <select
                    value={selectedForecastId}
                    onChange={handleDropdownChange}
                    disabled={forecastsLoading || savedForecasts.length === 0}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 pr-8 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {savedForecasts.length === 0 ? (
                      <option value="">No saved estimates available</option>
                    ) : (
                      savedForecasts.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.cropType} — {f.barangay} ({f.forecastSeason} {f.forecastYear}) | {f.projectedAreaHa} ha
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleRefresh}
                  className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                  title="Refresh Forecast Records"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {forecastsLoading ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
              Loading saved forecast data...
            </div>
          ) : selectedForecastCard ? (
            <ForecastResultCard result={selectedForecastCard} />
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
              No previous resource demand forecasts found in the database.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: View Historical Yield and Resource-Demand Results */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <ForecastHistoryList
            onRefreshTrigger={refreshTrigger}
            onSelectForecast={handleSelectForecast}
            selectedId={selectedForecastId}
          />

          {/* Model Evaluation & Performance Registry (Read-Only) */}
          <div className="pt-2">
            <ModelMetricsView />
          </div>
        </div>
      )}
    </div>
  );
}

export const HeadResourceDemandView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200/70 rounded-xl w-80" />
          <div className="h-96 bg-white border border-slate-200 rounded-xl" />
        </div>
      }
    >
      <HeadResourceDemandContent />
    </Suspense>
  );
};
