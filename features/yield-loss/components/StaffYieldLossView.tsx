"use client";

import React, { useState, useEffect, Suspense } from "react";
import { PredictionList } from "./PredictionList";
import { PredictionForm } from "./PredictionForm";
import { PredictionGenerator } from "./PredictionGenerator";
import { ModelTrainingModal } from "./ModelTrainingModal";
import { PredictionRecordDTO } from "../types";
import { RefreshCw, Sparkles, ListFilter, PlusCircle } from "lucide-react";

function StaffYieldLossContent() {
  const [predictions, setPredictions] = useState<PredictionRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"records" | "generate">("records");
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/predictions");
      const data = await res.json();
      if (res.ok && (data.success || Array.isArray(data.data))) {
        setPredictions(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  if (!mounted) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="text-xs font-semibold">Loading Prediction Module...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Yield &amp; Loss Prediction
          </h2>
          <p className="text-xs text-slate-500">
            Machine-learning-based crop yield and economic loss predictions for field operations and planning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("records")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "records"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Prediction Records ({predictions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("generate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "generate"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Generate Prediction</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchPredictions}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            title="Refresh prediction records"
          >
            <RefreshCw className={`h-3.5 w-3.5${loading ? " animate-spin text-emerald-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "records" ? (
        <PredictionList
          predictions={predictions}
          userRole="OMAG_STAFF"
          loading={loading}
          onOpenNewPrediction={() => setActiveTab("generate")}
        />
      ) : (
        <div className="space-y-4">
          <PredictionGenerator
            onSuccess={() => {
              fetchPredictions();
            }}
            onViewHistory={() => {
              setActiveTab("records");
              fetchPredictions();
            }}
          />
        </div>
      )}

      {/* Legacy/Quick Modal fallback if triggered */}
      <PredictionForm
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        onSuccess={() => {
          setIsPredictionModalOpen(false);
          fetchPredictions();
        }}
      />

      {/* Model Training Modal */}
      <ModelTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        onTrainingComplete={() => {
          fetchPredictions();
        }}
      />
    </div>
  );
}

export const StaffYieldLossView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading Prediction Module...</span>
        </div>
      }
    >
      <StaffYieldLossContent />
    </Suspense>
  );
};
