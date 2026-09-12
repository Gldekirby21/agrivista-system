"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Cpu,
  FileText,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  BarChart2,
  Calendar,
  MapPin,
  Leaf,
  Layers,
} from "lucide-react";
import { PredictionRecordDTO } from "../types";

interface PredictionListProps {
  predictions: PredictionRecordDTO[];
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
  onOpenNewPrediction: () => void;
  onOpenModelTraining: () => void;
  loading?: boolean;
}

export const PredictionList: React.FC<PredictionListProps> = ({
  predictions,
  userRole,
  onOpenNewPrediction,
  onOpenModelTraining,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cropFilter, setCropFilter] = useState("ALL");
  const [barangayFilter, setBarangayFilter] = useState("ALL");

  // Distinct filters
  const cropTypes = useMemo(() => {
    const set = new Set<string>();
    predictions.forEach((p) => {
      if (p.crop?.cropType) set.add(p.crop.cropType);
    });
    return Array.from(set).sort();
  }, [predictions]);

  const barangays = useMemo(() => {
    const set = new Set<string>();
    predictions.forEach((p) => {
      const b = p.crop?.parcel?.farm?.barangay;
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [predictions]);

  // Filtered dataset
  const filtered = useMemo(() => {
    return predictions.filter((item) => {
      const farmerName = `${item.crop?.parcel?.farm?.farmer?.firstName || ""} ${item.crop?.parcel?.farm?.farmer?.lastName || ""}`.toLowerCase();
      const rsbsa = item.crop?.parcel?.farm?.farmer?.rsbsaNumber?.toLowerCase() || "";
      const crop = item.crop?.cropType?.toLowerCase() || "";
      const bgy = item.crop?.parcel?.farm?.barangay?.toLowerCase() || "";
      const parcelNum = item.crop?.parcel?.parcelNumber?.toLowerCase() || "";
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        farmerName.includes(query) ||
        rsbsa.includes(query) ||
        crop.includes(query) ||
        bgy.includes(query) ||
        parcelNum.includes(query);

      const matchesCrop = cropFilter === "ALL" || item.crop?.cropType === cropFilter;
      const matchesBarangay =
        barangayFilter === "ALL" || item.crop?.parcel?.farm?.barangay === barangayFilter;

      return matchesSearch && matchesCrop && matchesBarangay;
    });
  }, [predictions, searchTerm, cropFilter, barangayFilter]);

  // KPI Calculations
  const totalNormalTons = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + (curr.projectedNormalYieldTons || 0), 0);
  }, [filtered]);

  const totalRemainingTons = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + (curr.predictedRemainingYieldTons || 0), 0);
  }, [filtered]);

  const totalEstimatedLossPhp = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + (curr.estimatedEconomicLossPhp || 0), 0);
  }, [filtered]);

  const basePath = userRole === "OMAG_HEAD" ? "/head/predictions" : "/staff/predictions";

  return (
    <div className="space-y-6">
      {/* 1. Official Objective & Prototype Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider">
                Objective 3
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Machine-Learning-Based Crop Yield & Loss Prediction
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Crop Yield Estimates & Economic Loss Analytics
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Random Forest tabular regression modeling for projected yield reduction and potential crop economic loss across Polomolok agricultural parcels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenModelTraining}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-emerald-600" />
              <span>Model Registry & Metrics</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewPrediction}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Run New Prediction</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PCIC Boundary and Prototype Classification Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 block">PCIC Boundary & Statutory Disclaimer</span>
            <span>
              Predictions generated in this module are analytical advisory estimates for municipal agricultural planning only. They <strong>do NOT</strong> constitute official Philippine Crop Insurance Corporation (PCIC) claim approval or indemnity valuation.
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-start gap-3 text-xs text-blue-900">
          <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-950 block">Methodology & Dataset Notice</span>
            <span>
              Uses scikit-learn <code className="font-mono font-semibold">RandomForestRegressor</code>. Training utilizes historical crop records and demonstration synthetic data labeled <strong className="font-semibold">⚫ SYNTHETIC — Demonstration Data</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Analytics KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Predictions Run</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{filtered.length}</p>
          <span className="text-[11px] text-slate-500">Across {barangays.length} barangays</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Normal Baseline Yield</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-2 font-mono">
            {totalNormalTons.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
            <span className="text-xs font-normal text-slate-500">tons</span>
          </p>
          <span className="text-[11px] text-slate-500">Projected normal total</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Remaining Harvest</span>
            <Leaf className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-900 mt-2 font-mono">
            {totalRemainingTons.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
            <span className="text-xs font-normal text-slate-500">tons</span>
          </p>
          <span className="text-[11px] text-slate-500">After damage / stress factors</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Est. Economic Loss</span>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-2 font-mono">
            ₱{totalEstimatedLossPhp.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">Potential monetary impact</span>
        </div>
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search farmer, RSBSA, crop, parcel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Crops</option>
            {cropTypes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Barangays</option>
            {barangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Predictions Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading yield & loss prediction records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No prediction records found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Run your first machine learning yield and loss prediction on an enrolled crop parcel or adjust your search filters.
            </p>
            <button
              type="button"
              onClick={onOpenNewPrediction}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Run Prediction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Beneficiary & Parcel</th>
                  <th className="py-3 px-4">Crop & Season</th>
                  <th className="py-3 px-4 text-right">Planted Area</th>
                  <th className="py-3 px-4 text-right">Normal Yield</th>
                  <th className="py-3 px-4 text-right">Remaining Harvest</th>
                  <th className="py-3 px-4 text-right">Yield Reduction</th>
                  <th className="py-3 px-4 text-right">Est. Economic Loss</th>
                  <th className="py-3 px-4">Model & Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const farmer = item.crop?.parcel?.farm?.farmer;
                  const farm = item.crop?.parcel?.farm;
                  const reductionPct = item.predictedYieldReductionPercent || 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {farmer ? `${farmer.firstName} ${farmer.lastName}` : "Unknown Farmer"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-mono">{farmer?.rsbsaNumber || "No RSBSA"}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {farm?.barangay || "Polomolok"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Parcel: {item.crop?.parcel?.parcelNumber || "N/A"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{item.crop?.cropType || "Crop"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.crop?.variety ? `${item.crop.variety} • ` : ""}
                          {item.crop?.season || "Wet"} {item.crop?.year || 2026}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {item.crop?.plantedAreaHa?.toFixed(2) || "0.00"} ha
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">
                        {(item.projectedNormalYieldTons || 0).toFixed(2)} t
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-900 font-semibold">
                        {(item.predictedRemainingYieldTons || 0).toFixed(2)} t
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                            reductionPct === 0
                              ? "bg-slate-100 text-slate-700"
                              : reductionPct < 25
                              ? "bg-amber-100 text-amber-800"
                              : reductionPct < 50
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {reductionPct > 0 ? `-${reductionPct.toFixed(1)}%` : "0.0%"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {item.estimatedEconomicLossPhp !== null ? (
                          <span className="text-red-700">
                            ₱{item.estimatedEconomicLossPhp.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans font-normal text-slate-400 italic">
                            Price Unavailable
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] font-mono text-emerald-700">
                          {item.model?.modelVersion || "v1.0.0"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.predictionTimestamp).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`${basePath}/${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-[11px] shadow-2xs transition-colors"
                        >
                          <span>Dossier</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
