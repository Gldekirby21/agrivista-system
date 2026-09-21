"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HistoricalDataTable } from "./HistoricalDataTable";
import { ModelMetricsView } from "./ModelMetricsView";
import { ForecastHistoryList } from "./ForecastHistoryList";
import { ForecastGenerationForm } from "./ForecastGenerationForm";
import { ForecastResultCard } from "./ForecastResultCard";
import { DualResourceModelsDTO, ForecastResultDTO } from "../types";
import { LineChart, Database, Cpu, History, AlertCircle, ShieldCheck } from "lucide-react";

function HeadResourceDemandContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"forecast" | "history" | "historical" | "models">("forecast");
  const [modelData, setModelData] = useState<DualResourceModelsDTO | null>(null);
  const [totalHistorical, setTotalHistorical] = useState(0);

  const [latestForecast, setLatestForecast] = useState<ForecastResultDTO | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "historical") {
      setActiveTab("historical");
    } else if (tab === "models") {
      setActiveTab("models");
    } else if (tab === "forecast") {
      setActiveTab("forecast");
    } else if (tab === "history") {
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
                Historical Crop Yield & Resource-Demand Modeling (Objective 5)
              </h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold">
                OMAG_HEAD Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supervised machine learning models for forecasting municipal seed and fertilizer requirements from historical data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-semibold text-[10px]">
              🟡 PROPOSED SYSTEM DESIGN
            </span>
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

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "forecast"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <LineChart className="h-4 w-4" />
          Demand Forecast
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
          Forecast History & Ledger
        </button>

        <button
          onClick={() => setActiveTab("historical")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "historical"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Database className="h-4 w-4" />
          Historical Agricultural Trends
        </button>

        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "models"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Cpu className="h-4 w-4" />
          ML Model Registry & Evaluation
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "forecast" && (
        <div className="space-y-5">
          <ForecastGenerationForm
            onForecastGenerated={(res) => {
              setLatestForecast(res);
              handleRefresh();
            }}
          />
          {latestForecast && (
            <ForecastResultCard result={latestForecast} />
          )}
        </div>
      )}

      {activeTab === "history" && (
        <ForecastHistoryList onRefreshTrigger={refreshTrigger} />
      )}

      {activeTab === "historical" && (
        <HistoricalDataTable isStaff={false} onRefreshTrigger={refreshTrigger} />
      )}

      {activeTab === "models" && (
        <ModelMetricsView isStaff={true} onRetrainSuccess={handleRefresh} />
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
