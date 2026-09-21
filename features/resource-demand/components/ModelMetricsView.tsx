"use client";

import React, { useState, useEffect } from "react";
import { DualResourceModelsDTO } from "../types";
import { Activity, RefreshCw, Cpu, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface ModelMetricsViewProps {
  isStaff?: boolean;
  onRetrainSuccess?: () => void;
}

export const ModelMetricsView: React.FC<ModelMetricsViewProps> = ({
  isStaff = false,
  onRetrainSuccess,
}) => {
  const [modelData, setModelData] = useState<DualResourceModelsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resource-demand/models");
      if (res.ok) {
        const data = await res.json();
        setModelData(data);
      }
    } catch (e) {
      console.error("Failed to load model metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleRetrain = async () => {
    if (!confirm("Retrain Seed and Fertilizer RandomForest models using current historical agricultural data?")) {
      return;
    }
    setRetraining(true);
    setMessage(null);

    try {
      const res = await fetch("/api/resource-demand/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelVersion: "v1.1.0",
          useSyntheticFallback: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Model training failed");
      }

      const data = await res.json();
      setMessage({
        type: "success",
        text: `Models retrained successfully! Evaluated on holdout test partition. Seed R²: ${data.seedModel.r2Score.toFixed(3)}, Fertilizer R²: ${data.fertilizerModel.r2Score.toFixed(3)}`,
      });
      await fetchModels();
      if (onRetrainSuccess) onRetrainSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Retraining failed" });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
        Loading machine learning model registry & metrics...
      </div>
    );
  }

  if (!modelData) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
        Unable to load model metrics. Ensure Python ML service is running.
      </div>
    );
  }

  const { seedModel, fertilizerModel } = modelData;

  return (
    <div className="space-y-4 text-xs">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Supervised Regression Model Registry & Evaluation
              </h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Dual RandomForestRegressor pipelines evaluating seed requirement (kg) and fertilizer requirement (bags).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-semibold text-[10px]">
              🟡 PROPOSED SYSTEM DESIGN
            </span>
            {isStaff && (
              <button
                onClick={handleRetrain}
                disabled={retraining}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${retraining ? "animate-spin" : ""}`} />
                {retraining ? "Training Models..." : "Retrain Models"}
              </button>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Dual Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seed Model Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-xs">
                  Model 1: {seedModel.modelName}
                </span>
                <p className="text-[10px] text-slate-500">Target: {seedModel.targetVariable} (kg)</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-semibold text-[10px]">
                {seedModel.algorithm}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-medium">R² Score</span>
                <p className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                  {seedModel.r2Score.toFixed(3)}
                </p>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-medium">MAE</span>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  {seedModel.mae.toFixed(1)} kg
                </p>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-medium">RMSE</span>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  {seedModel.rmse.toFixed(1)} kg
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Features Encoded
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {seedModel.featuresUsed.map((f) => (
                  <span key={f} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Fertilizer Model Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-xs">
                  Model 2: {fertilizerModel.modelName}
                </span>
                <p className="text-[10px] text-slate-500">Target: {fertilizerModel.targetVariable} (50kg bags)</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-semibold text-[10px]">
                {fertilizerModel.algorithm}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-medium">R² Score</span>
                <p className="text-base font-bold font-mono text-blue-700 mt-0.5">
                  {fertilizerModel.r2Score.toFixed(3)}
                </p>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-medium">MAE</span>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  {fertilizerModel.mae.toFixed(1)} bags
                </p>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-medium">RMSE</span>
                <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  {fertilizerModel.rmse.toFixed(1)} bags
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Features Encoded
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {fertilizerModel.featuresUsed.map((f) => (
                  <span key={f} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Disclaimer Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Time-Aware Evaluation & Demonstration Disclosure: </span>
            {modelData.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
