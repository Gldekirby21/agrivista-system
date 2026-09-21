"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HistoricalDataTable } from "./HistoricalDataTable";
import { CreateHistoricalDataModal } from "./CreateHistoricalDataModal";
import { EditHistoricalDataModal } from "./EditHistoricalDataModal";
import { ForecastGenerationForm } from "./ForecastGenerationForm";
import { ForecastResultCard } from "./ForecastResultCard";
import { ModelMetricsView } from "./ModelMetricsView";
import { ForecastHistoryList } from "./ForecastHistoryList";
import { HistoricalAgriculturalDataDTO, ForecastResultDTO } from "../types";
import { LineChart, Database, Cpu, History, Plus } from "lucide-react";

function StaffResourceDemandContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"forecast" | "historical" | "history" | "models">("forecast");

  // Modals & State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HistoricalAgriculturalDataDTO | null>(null);
  const [latestForecast, setLatestForecast] = useState<ForecastResultDTO | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync active tab with URL query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "historical") {
      setActiveTab("historical");
    } else if (tab === "models") {
      setActiveTab("models");
    } else if (tab === "history") {
      setActiveTab("history");
    } else if (tab === "forecast") {
      setActiveTab("forecast");
    }
  }, [searchParams]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Historical Agricultural Data &amp; Resource Demand (Objective 5)
            </h1>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold">
              Staff Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Encode and manage municipal multi-year agricultural production, seed, fertilizer, and crop yield records, and generate resource demand forecasts.
          </p>
        </div>

        {activeTab === "historical" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Record Historical Data
          </button>
        )}
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
          onClick={() => setActiveTab("historical")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "historical"
              ? "border-emerald-600 text-emerald-700 bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Database className="h-4 w-4" />
          Manage Historical Data
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
          Forecast History &amp; Ledger
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
          Forecast Models (Registry View)
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

      {activeTab === "historical" && (
        <HistoricalDataTable
          isStaff={true}
          onEdit={(rec) => setEditingRecord(rec)}
          onRefreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === "history" && (
        <ForecastHistoryList onRefreshTrigger={refreshTrigger} />
      )}

      {activeTab === "models" && (
        <ModelMetricsView
          isStaff={false}
          onRetrainSuccess={() => handleRefresh()}
        />
      )}

      {/* Modals */}
      <CreateHistoricalDataModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => handleRefresh()}
      />

      <EditHistoricalDataModal
        isOpen={editingRecord !== null}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={() => handleRefresh()}
      />
    </div>
  );
}

export const StaffResourceDemandView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200/70 rounded-xl w-80" />
          <div className="h-96 bg-white border border-slate-200 rounded-xl" />
        </div>
      }
    >
      <StaffResourceDemandContent />
    </Suspense>
  );
};
