"use client";

import React, { useState, useEffect, Suspense } from "react";
import { PredictionList } from "./PredictionList";
import { PredictionRecordDTO } from "../types";
import { RefreshCw } from "lucide-react";

function HeadYieldLossContent() {
  const [predictions, setPredictions] = useState<PredictionRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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
        <span className="text-xs font-semibold">Loading Prediction Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Municipal Yield &amp; Loss Prediction Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Executive oversight of municipal crop yield forecasts and economic damage estimations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPredictions}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh prediction records"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <PredictionList
        predictions={predictions}
        userRole="OMAG_HEAD"
        loading={loading}
      />
    </div>
  );
}

export const HeadYieldLossView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading Prediction Records...</span>
        </div>
      }
    >
      <HeadYieldLossContent />
    </Suspense>
  );
};
