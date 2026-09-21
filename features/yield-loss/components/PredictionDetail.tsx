"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  Brain,
  Leaf,
  Calendar,
  MapPin,
  TrendingDown,
  TrendingUp,
  DollarSign,
  CloudRain,
  Thermometer,
  Layers,
  History,
  FileCheck2,
  Cpu,
  Sparkles,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PredictionRecordDTO } from "../types";

interface PredictionDetailProps {
  prediction: PredictionRecordDTO & {
    auditLogs?: Array<{
      id: string;
      action: string;
      details?: string | null;
      timestamp?: string | Date;
      createdAt?: string | Date;
      user?: {
        name?: string | null;
        fullName?: string | null;
        email: string | null;
        role: string;
      } | null;
    }>;
  };
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
}

export const PredictionDetail: React.FC<PredictionDetailProps> = ({
  prediction,
  userRole,
}) => {
  const backPath = userRole === "OMAG_HEAD" ? "/head/predictions" : "/staff/predictions";
  const farmer = prediction.crop?.parcel?.farm?.farmer;
  const farm = prediction.crop?.parcel?.farm;
  const parcel = prediction.crop?.parcel;
  const crop = prediction.crop;
  const model = prediction.model;
  const report = prediction.report;
  const assessment = report?.assessment;
  const snapshot = prediction.inputFeaturesSnapshot || {};

  // Agricultural fields
  const farmerName = farmer ? `${farmer.firstName} ${farmer.lastName}` : (snapshot.farmerName || "Registered Farmer");
  const rsbsaId = farmer?.rsbsaNumber || "Not Assigned";
  const farmName = farm?.farmName || "Primary Holding";
  const parcelNumber = parcel?.parcelNumber || snapshot.parcelNumber || "N/A";
  const barangay = farm?.barangay || snapshot.barangay || "Polomolok";
  const cropName = crop?.cropType || snapshot.cropType || "Crop";
  const cropType = crop?.cropType || snapshot.cropType || "Crop";
  const cropVariety = crop?.variety || snapshot.variety || "Standard Hybrid";
  const plantedArea = crop?.plantedAreaHa || snapshot.plantedAreaHa || 1.0;
  const cropSeason = crop?.season || snapshot.season || "Wet";
  const cropYear = crop?.year || snapshot.year || 2026;

  // Incident & Damage fields
  const incidentDate = report?.incidentDate 
    ? new Date(report.incidentDate).toLocaleDateString() 
    : (snapshot.incidentDate ? new Date(snapshot.incidentDate).toLocaleDateString() : "No Incident Recorded");
  const calamityCause = report?.calamityType || snapshot.damageCause || snapshot.calamityType || "General Calamity / Unspecified";
  
  const reportedDamagePct = report?.reportedDamagePercent !== undefined 
    ? report.reportedDamagePercent 
    : (snapshot.reportedDamagePercent !== undefined ? snapshot.reportedDamagePercent : null);

  const assessedDamagePct = assessment?.assessedDamagePercent !== undefined
    ? assessment.assessedDamagePercent
    : (snapshot.calamityDamagePercent !== undefined ? snapshot.calamityDamagePercent : 0);

  const assessedAreaHa = assessment?.assessedAreaHa !== undefined
    ? assessment.assessedAreaHa
    : (report?.reportedAffectedAreaHa !== undefined ? report.reportedAffectedAreaHa : plantedArea);

  const cropStage = assessment?.cropStage || "Vegetative / Standing";

  // ML & Mathematical Derived metrics
  const normalTons = prediction.projectedNormalYieldTons || 0;
  const remainingTons = prediction.predictedRemainingYieldTons || 0;
  const reductionTons = Math.max(0, normalTons - remainingTons);
  const reductionPct = prediction.predictedYieldReductionPercent || 0;
  const baselineYieldTonsHa = plantedArea > 0 ? normalTons / plantedArea : 0;
  const estimatedCropLossKg = reductionTons * 1000;
  const farmgatePrice = snapshot.cropUnitPricePhpKg || snapshot.unitPricePhpKg || null;

  // Toggle state to hide/show technical background details (Section A, Section B, Section D)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Yield &amp; Loss Prediction</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>View Prediction Result</span>
            <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              ID: {prediction.id.slice(0, 8)}...
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prediction Date/Time: <span className="font-semibold text-slate-800 font-mono">{new Date(prediction.predictionTimestamp).toLocaleString()}</span>
          </p>
        </div>

        {/* Workflow Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle button to hide/show technical details */}
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title={showTechnicalDetails ? "Hide technical parameters & model inputs" : "Show technical parameters & model inputs"}
          >
            {showTechnicalDetails ? (
              <>
                <EyeOff className="h-4 w-4 text-slate-500" />
                <span>Hide Technical Details</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-emerald-700" />
                <span>Show Technical Details</span>
              </>
            )}
          </button>

          {report && (
            <Link
              href={`/staff/photo-verification/${report.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <FileCheck2 className="h-4 w-4 text-slate-500" />
              <span>View Crop-Loss Case</span>
            </Link>
          )}

          {userRole === "OMAG_STAFF" && (
            <Link
              href="/staff/pcic/ranking"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
              title="Proceed to Priority Ranking workspace"
            >
              <span>Proceed to Priority Ranking</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          )}
        </div>
      </div>

      {/* Advisory Workflow Disclaimer */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold">Objective #3 Advisory Crop Yield/Loss Information:</span>
          <p className="text-blue-800">
            This machine learning prediction provides crop yield and loss estimation to support OMAG monitoring and decision-making. It does NOT automatically determine PCIC priority or claim compensation. Priority Ranking is evaluated independently in the PCIC Priority Ranking workspace based on approved scoring rules.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C — PREDICTION RESULT (PROMINENT KPI SUMMARY)                     */}
      {/* ========================================================================= */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>SECTION C — PREDICTION RESULT</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Baseline / Projected Yield */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Projected Yield</span>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {baselineYieldTonsHa.toFixed(2)}
              </span>{" "}
              <span className="text-xs font-semibold text-slate-500">tons/ha</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ML-predicted baseline productivity
            </p>
          </div>

          {/* 2. Expected / Normal Production */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Expected Production</span>
              <Leaf className="h-5 w-5 text-teal-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-teal-900 font-mono">
                {normalTons.toFixed(2)}
              </span>{" "}
              <span className="text-xs font-semibold text-slate-500">tons</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {baselineYieldTonsHa.toFixed(2)} t/ha × {plantedArea.toFixed(2)} ha
            </p>
          </div>

          {/* 3. Predicted Remaining Production */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Predicted Remaining Production</span>
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-blue-900 font-mono">
                {remainingTons.toFixed(2)}
              </span>{" "}
              <span className="text-xs font-semibold text-slate-500">tons</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Expected ({normalTons.toFixed(2)}t) - Loss ({reductionTons.toFixed(2)}t)
            </p>
          </div>

          {/* 4. Predicted Yield Reduction */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Predicted Yield Reduction</span>
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-700 font-mono">
                {reductionPct > 0 ? `-${reductionPct.toFixed(1)}%` : "0.0%"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              -{reductionTons.toFixed(2)} tons difference
            </p>
          </div>

          {/* 5. Estimated Crop Loss */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Estimated Crop Loss</span>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-red-800 font-mono">
                {reductionTons.toFixed(2)}
              </span>{" "}
              <span className="text-xs font-semibold text-slate-500">tons ({estimatedCropLossKg.toLocaleString()} kg)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {assessedDamagePct}% assessed field damage
            </p>
          </div>

          {/* 6. Estimated Economic Crop Loss */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Estimated Economic Loss</span>
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div className="mt-3">
              {prediction.estimatedEconomicLossPhp !== null ? (
                <span className="text-2xl font-black text-red-700 font-mono">
                  ₱{prediction.estimatedEconomicLossPhp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="text-sm font-semibold text-slate-400 italic">
                  Price Data Unavailable
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {farmgatePrice
                ? `Calculation: ${estimatedCropLossKg.toLocaleString()} kg × ₱${Number(farmgatePrice).toFixed(2)}/kg`
                : "No official farmgate price supplied"}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Technical Details: Section A, Section B, Section D */}
      {showTechnicalDetails ? (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Two-Column Section: Section A and Section B */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ========================================================================= */}
            {/* SECTION A — CROP-LOSS INFORMATION                                         */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  SECTION A — CROP-LOSS INFORMATION
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Brgy. {barangay}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Farmer</span>
                  <span className="font-bold text-slate-900 text-sm">{farmerName}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">RSBSA: {rsbsaId}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Barangay</span>
                  <span className="font-bold text-slate-900 text-sm">{barangay}</span>
                  <span className="text-[10px] text-slate-400 block">Municipal Jurisdiction</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Farm</span>
                  <span className="font-semibold text-slate-800">{farmName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Farm Parcel</span>
                  <span className="font-mono font-semibold text-slate-800">{parcelNumber}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Crop</span>
                  <span className="font-bold text-slate-900">{cropName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Crop Type</span>
                  <span className="font-semibold text-slate-800">{cropType} ({cropVariety})</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Planted Area</span>
                  <span className="font-mono font-bold text-slate-800">{Number(plantedArea).toFixed(2)} ha</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Incident Date</span>
                  <span className="font-semibold text-slate-800">{incidentDate}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Calamity / Cause</span>
                  <span className="font-semibold text-slate-800 capitalize">{calamityCause}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Crop Stage</span>
                  <span className="font-semibold text-slate-800">{cropStage}</span>
                </div>

                {/* Crucial: Distinction between Reported Damage vs Assessed Damage */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5">
                  <span className="text-amber-800 font-bold block text-[11px] uppercase tracking-wider">
                    Reported Damage %
                  </span>
                  <span className="text-lg font-black font-mono text-amber-950 block">
                    {reportedDamagePct !== null ? `${reportedDamagePct}%` : "Not reported"}
                  </span>
                  <span className="text-[10px] text-amber-700 block">Farmer / Reporter Declaration</span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
                  <span className="text-emerald-800 font-bold block text-[11px] uppercase tracking-wider">
                    Assessed Damage %
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-950 block">
                    {assessedDamagePct}%
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    OMAG Staff Field Assessment ({Number(assessedAreaHa).toFixed(2)} ha)
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION B — PREDICTION INPUTS (ACTUAL MODEL INPUTS ONLY)                   */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  SECTION B — PREDICTION INPUTS
                </h3>
                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  Model Features Used
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Displays only the actual model features utilized by the active RandomForestRegressor pipeline:
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-[11px] font-medium">1. Crop Type</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{cropType}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-[11px] font-medium">2. Barangay</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{barangay}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-[11px] font-medium">3. Season</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{cropSeason}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-[11px] font-medium">4. Soil Type</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{snapshot.soilType || "Volcanic Loam"}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-[11px] font-medium">5. Planted Area (ha)</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{Number(plantedArea).toFixed(2)} ha</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-[11px] font-medium">6. Historical Yield (Baseline)</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                    {snapshot.baselineYieldTonsHa ? `${Number(snapshot.baselineYieldTonsHa).toFixed(2)} t/ha` : `${baselineYieldTonsHa.toFixed(2)} t/ha`}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px] font-medium">7. Calamity Occurrences (Historical Shock Feature)</span>
                    <span className="font-bold font-mono text-slate-900">{snapshot.calamityOccurrences ?? 0}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Note: Historical calamity count is separate from current assessed damage ({assessedDamagePct}%).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION D — MODEL INFORMATION                                             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-6">
            {/* Card D.1: ML Model Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  SECTION D — MODEL INFORMATION
                </h3>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {model?.modelVersion || snapshot.modelVersion || "v1.0.0"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">ML Algorithm</span>
                  <span className="font-bold text-slate-900">
                    Random Forest Regressor
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Model Version</span>
                  <span className="font-mono font-bold text-slate-900">
                    {model?.modelVersion || snapshot.modelVersion || "v1.0.0"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Prediction Date/Time</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {new Date(prediction.predictionTimestamp).toLocaleString()}
                  </span>
                </div>

                {/* Model Evaluation Metrics */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-600 block mb-2">
                    Offline Model Evaluation Metrics (Not Individual Prediction Confidence):
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">R² Score</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {model?.r2Score !== undefined ? model.r2Score.toFixed(4) : "—"}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">MAE (t/ha)</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {model?.mae !== undefined ? model.mae.toFixed(3) : "—"}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">RMSE (t/ha)</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {model?.rmse !== undefined ? model.rmse.toFixed(3) : "—"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    * Note: MAE, RMSE, and R² reflect aggregate offline holdout evaluation, not confidence of an individual field prediction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed State Notice with Quick Reveal Button */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <p className="text-xs text-slate-500">
              Technical crop-loss inputs, ML features (Sections A &amp; B), and model parameters (Section D) are hidden for a cleaner view.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>Show Technical Details</span>
              </button>
              <Link
                href={`${userRole === "OMAG_HEAD" ? "/head" : "/staff"}/audit?module=CROP_PREDICTION&recordId=${prediction.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-2xs transition-colors"
              >
                <span>Activity / Audit Logs</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
