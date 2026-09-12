"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import {
  Brain,
  Cpu,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Info,
  Layers,
  Database,
  ShieldAlert,
} from "lucide-react";
import { ModelMetricsDTO } from "../types";

interface ModelTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrainingComplete?: (metrics: ModelMetricsDTO) => void;
}

export const ModelTrainingModal: React.FC<ModelTrainingModalProps> = ({
  isOpen,
  onClose,
  onTrainingComplete,
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [useSynthetic, setUseSynthetic] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState<ModelMetricsDTO | null>(null);
  const [trainingResult, setTrainingResult] = useState<ModelMetricsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Fetch current active model metrics on open
  useEffect(() => {
    if (isOpen) {
      fetchActiveModel();
      setError(null);
      setTrainingResult(null);
    }
  }, [isOpen]);

  const fetchActiveModel = async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch("/api/predictions/models");
      const data = await res.json();
      if (res.ok && data.success && data.data && data.data.length > 0) {
        setActiveMetrics(data.data[0]);
      }
    } catch (err: any) {
      console.error("Failed to fetch model metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setError(null);
    setTrainingResult(null);

    try {
      const res = await fetch("/api/predictions/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useSyntheticBaseline: useSynthetic }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to train machine learning model");
      }

      setTrainingResult(data.data);
      setActiveMetrics(data.data);
      if (onTrainingComplete) {
        onTrainingComplete(data.data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during model training.");
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ML Model Management & Training"
      subtitle="Train or retrain the tabular Random Forest crop yield regression model with historical and baseline records."
      size="3xl"
    >
      <div className="space-y-6 text-slate-800">
        {/* Classification and Prototype Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <span>🟡 PROPOSED SYSTEM DESIGN</span>
                <span className="text-slate-400">•</span>
                <span>⚫ SYNTHETIC DEMONSTRATION BASELINE</span>
              </p>
              <p className="leading-relaxed">
                The regression pipeline utilizes <strong>scikit-learn RandomForestRegressor</strong> trained on stratified 
                crop production records. Evaluation metrics (<code className="font-mono font-semibold">MAE</code>, <code className="font-mono font-semibold">RMSE</code>, <code className="font-mono font-semibold">R²</code>) are calculated exclusively on a dedicated 20% hold-out test split.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Model Training Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Training Configuration */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-600" />
            Training Data Source Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                useSynthetic
                  ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Polomolok Synthetic Baseline
                </span>
                <input
                  type="radio"
                  name="dataSource"
                  checked={useSynthetic}
                  onChange={() => setUseSynthetic(true)}
                  className="accent-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-600">
                Generates 500+ stratified historical records (2021–2025) across all 23 Polomolok barangays, key crops (Corn, Rice, Pineapple, Banana, Coffee), and agro-climatic conditions.
              </p>
              <span className="mt-2 inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full w-fit">
                Recommended for Demo / Testing
              </span>
            </label>

            <label
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                !useSynthetic
                  ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-blue-600" />
                  Database Production Records
                </span>
                <input
                  type="radio"
                  name="dataSource"
                  checked={!useSynthetic}
                  onChange={() => setUseSynthetic(false)}
                  className="accent-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-600">
                Pulls all enrolled Objective 1 crop planting records from PostgreSQL/Prisma. Falls back to synthetic baseline if fewer than 10 completed crop records exist.
              </p>
              <span className="mt-2 inline-flex items-center text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full w-fit">
                Production Records
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              Algorithm: <code className="font-mono text-slate-700 font-semibold">RandomForestRegressor(n_estimators=100, random_state=42)</code>
            </div>

            <button
              type="button"
              onClick={handleTrain}
              disabled={isTraining}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isTraining ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Training Scikit-Learn Model...</span>
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  <span>Train Model Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Model Metrics Display */}
        {(trainingResult || activeMetrics) && (
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {trainingResult ? "Freshly Trained Model Performance" : "Active Production Model Metrics"}
                </h4>
                <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{(trainingResult || activeMetrics)?.modelName}</span>
                  <span className="text-xs font-mono font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {(trainingResult || activeMetrics)?.modelVersion}
                  </span>
                </p>
              </div>

              {trainingResult && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Model Ready & Persisted
                </span>
              )}
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">R² Score</span>
                <p className="text-lg font-black text-slate-900 mt-1 font-mono">
                  {(trainingResult || activeMetrics)?.r2Score !== undefined
                    ? ((trainingResult || activeMetrics)!.r2Score).toFixed(4)
                    : "—"}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">Goodness of fit</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">MAE</span>
                <p className="text-lg font-black text-slate-900 mt-1 font-mono">
                  {(trainingResult || activeMetrics)?.mae !== undefined
                    ? ((trainingResult || activeMetrics)!.mae).toFixed(3)
                    : "—"}{" "}
                  <span className="text-xs font-normal text-slate-500">t/ha</span>
                </p>
                <span className="text-[10px] text-slate-500">Mean Abs Error</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">RMSE</span>
                <p className="text-lg font-black text-slate-900 mt-1 font-mono">
                  {(trainingResult || activeMetrics)?.rmse !== undefined
                    ? ((trainingResult || activeMetrics)!.rmse).toFixed(3)
                    : "—"}{" "}
                  <span className="text-xs font-normal text-slate-500">t/ha</span>
                </p>
                <span className="text-[10px] text-slate-500">Root Mean Sq Error</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dataset Split</span>
                <p className="text-lg font-black text-slate-900 mt-1 font-mono">
                  {(trainingResult || activeMetrics)?.trainSetCount || 0} /{" "}
                  {(trainingResult || activeMetrics)?.testSetCount || 0}
                </p>
                <span className="text-[10px] text-slate-500">80% Train / 20% Test</span>
              </div>
            </div>

            {/* Feature Pipeline Summary */}
            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 text-xs">
              <span className="font-bold text-slate-700 block mb-1.5">Input Features Preprocessed:</span>
              <div className="flex flex-wrap gap-1.5">
                {((trainingResult || activeMetrics)?.featuresUsed || []).map((feat, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-mono shadow-2xs"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </Modal>
  );
};
