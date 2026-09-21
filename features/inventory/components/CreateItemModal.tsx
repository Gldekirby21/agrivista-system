"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Plus, Package, AlertCircle, Sparkles, RefreshCw } from "lucide-react";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to generate formatted municipal catalog item code
function generateAutoItemCode(category: "SEEDS" | "FERTILIZER"): string {
  const prefix = category === "SEEDS" ? "SEED" : "FERT";
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${randomSuffix}`;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"SEEDS" | "FERTILIZER">("FERTILIZER");
  const [unit, setUnit] = useState("Bags (50kg)");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically generate an Item Code when modal opens
  useEffect(() => {
    if (isOpen) {
      setItemCode(generateAutoItemCode(category));
      setError(null);
    }
  }, [isOpen]);

  // Handle category change and sync prefix if code matches auto-format
  const handleCategoryChange = (newCategory: "SEEDS" | "FERTILIZER") => {
    setCategory(newCategory);
    if (!itemCode || itemCode.startsWith("SEED-") || itemCode.startsWith("FERT-")) {
      setItemCode(generateAutoItemCode(newCategory));
    }
  };

  const handleRegenerateCode = () => {
    setItemCode(generateAutoItemCode(category));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemCode: itemCode.trim().toUpperCase(),
          name: name.trim(),
          category,
          unit: unit.trim(),
          reorderLevel: parseFloat(reorderLevel) || 10,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create inventory item");
      }

      // Reset form & trigger refresh
      setItemCode("");
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll Inventory Item"
      subtitle="Register a new fertilizer or seed commodity into the municipal catalog."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Creation Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Item Code *
              </label>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                title="Generate a new item code"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. FERT-2026-X8K2"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Auto
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Auto-generated code based on category. Editable if custom coding is needed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as "SEEDS" | "FERTILIZER")}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="FERTILIZER">Fertilizer</option>
              <option value="SEEDS">Seeds</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Item Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Complete Fertilizer 14-14-14"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unit of Measurement *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bags (50kg), Packs (1kg)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reorder / Alert Threshold
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="10"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description / Specifications
          </label>
          <textarea
            rows={2}
            placeholder="Grade, active formula, target crops..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? "Registering..." : "Save Catalog Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
