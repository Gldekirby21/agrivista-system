"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import {
  HistoricalAgriculturalDataDTO,
  POLOMOLOK_BARANGAYS,
  SUPPORTED_CROPS,
  SEASONS,
  SOIL_TYPES,
} from "../types";

interface EditHistoricalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: HistoricalAgriculturalDataDTO | null;
}

export const EditHistoricalDataModal: React.FC<EditHistoricalDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const [barangay, setBarangay] = useState<string>("");
  const [year, setYear] = useState<number>(2025);
  const [season, setSeason] = useState<string>("Wet");
  const [cropType, setCropType] = useState<string>("Corn");
  const [plantedAreaHa, setPlantedAreaHa] = useState<string>("1.0");
  const [harvestedAreaHa, setHarvestedAreaHa] = useState<string>("1.0");
  const [productionTons, setProductionTons] = useState<string>("4.0");
  const [seedUsageKg, setSeedUsageKg] = useState<string>("");
  const [fertilizerUsageBags, setFertilizerUsageBags] = useState<string>("");
  const [soilType, setSoilType] = useState<string>("Volcanic Loam");
  const [calamityOccurrences, setCalamityOccurrences] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setBarangay(record.barangay);
      setYear(record.year);
      setSeason(record.season);
      setCropType(record.cropType);
      setPlantedAreaHa(String(record.plantedAreaHa));
      setHarvestedAreaHa(String(record.harvestedAreaHa));
      setProductionTons(String(record.productionTons));
      setSeedUsageKg(record.seedUsageKg !== null ? String(record.seedUsageKg) : "");
      setFertilizerUsageBags(record.fertilizerUsageBags !== null ? String(record.fertilizerUsageBags) : "");
      setSoilType(record.soilType || "Volcanic Loam");
      setCalamityOccurrences(record.calamityOccurrences || 0);
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        barangay,
        year: Number(year),
        season,
        cropType,
        plantedAreaHa: parseFloat(plantedAreaHa),
        harvestedAreaHa: parseFloat(harvestedAreaHa),
        productionTons: parseFloat(productionTons),
        seedUsageKg: seedUsageKg ? parseFloat(seedUsageKg) : null,
        fertilizerUsageBags: fertilizerUsageBags ? parseFloat(fertilizerUsageBags) : null,
        soilType: soilType || null,
        calamityOccurrences: Number(calamityOccurrences),
      };

      const res = await fetch(`/api/resource-demand/historical/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Failed to update historical record");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Historical Agricultural Record #${record.id}`}
      subtitle={`Updating record for ${record.barangay} (${record.cropType}, ${record.year}).`}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Barangay *</label>
            <select
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              required
            >
              {POLOMOLOK_BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Year (2000–2100) *</label>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Season *</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              required
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Crop Type *</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              required
            >
              {SUPPORTED_CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Planted Area (ha) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={plantedAreaHa}
              onChange={(e) => setPlantedAreaHa(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Harvested Area (ha) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={harvestedAreaHa}
              onChange={(e) => setHarvestedAreaHa(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Production (Metric Tons) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={productionTons}
              onChange={(e) => setProductionTons(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Seed Usage (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={seedUsageKg}
              onChange={(e) => setSeedUsageKg(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fertilizer Usage (50kg Bags)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={fertilizerUsageBags}
              onChange={(e) => setFertilizerUsageBags(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Soil Type</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-white"
            >
              {SOIL_TYPES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Calamity Occurrences</label>
            <input
              type="number"
              min="0"
              value={calamityOccurrences}
              onChange={(e) => setCalamityOccurrences(parseInt(e.target.value, 10) || 0)}
              className="w-full border border-slate-200 rounded-lg p-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Update Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
