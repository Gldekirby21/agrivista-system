"use client";

import React, { useState, useEffect } from "react";
import { ResourceDemandForecastDTO } from "../types";
import { History, RefreshCw, FileText } from "lucide-react";

interface ForecastHistoryListProps {
  onRefreshTrigger?: number;
  onSelectForecast?: (forecast: ResourceDemandForecastDTO) => void;
  selectedId?: string;
}

export const ForecastHistoryList: React.FC<ForecastHistoryListProps> = ({
  onRefreshTrigger = 0,
  onSelectForecast,
  selectedId,
}) => {
  const [forecasts, setForecasts] = useState<ResourceDemandForecastDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (selectedBarangay) params.append("barangay", selectedBarangay);
      if (selectedCrop) params.append("cropType", selectedCrop);
      if (selectedYear) params.append("year", selectedYear);

      const res = await fetch(`/api/resource-demand/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setForecasts(data || []);
      }
    } catch (e) {
      console.error("Failed to load forecast history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [onRefreshTrigger, selectedBarangay, selectedCrop, selectedYear]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden text-xs">
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">Forecast Generation History & Audit Ledger</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Years</option>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          <button
            onClick={fetchHistory}
            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Refresh History"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Date Generated</th>
              <th className="py-2.5 px-3">Barangay</th>
              <th className="py-2.5 px-3">Crop</th>
              <th className="py-2.5 px-3">Target Period</th>
              <th className="py-2.5 px-3 text-right">Area (ha)</th>
              <th className="py-2.5 px-3 text-right">Seed Demand (kg)</th>
              <th className="py-2.5 px-3 text-right">Fertilizer Demand (bags)</th>
              <th className="py-2.5 px-3">Model Version</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1 text-slate-400" />
                  Loading forecast history...
                </td>
              </tr>
            ) : forecasts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  <FileText className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  No forecast records found.
                </td>
              </tr>
            ) : (
              forecasts.map((f) => {
                const isSelected = selectedId === f.id;
                return (
                  <tr
                    key={f.id}
                    onClick={() => onSelectForecast && onSelectForecast(f)}
                    className={`transition-colors ${
                      onSelectForecast ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? "bg-emerald-50/80 border-l-4 border-l-emerald-600"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(f.generatedAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{f.barangay}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{f.cropType}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {f.forecastSeason} {f.forecastYear}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {f.projectedAreaHa.toFixed(1)} ha
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {f.forecastSeedKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-800">
                      {f.forecastFertilizerBags.toLocaleString(undefined, { maximumFractionDigits: 1 })} bags
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                      {f.modelVersion || "v1.0.0"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        PLANNING ESTIMATE
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
