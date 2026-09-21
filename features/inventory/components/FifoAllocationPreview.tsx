"use client";

import React, { useState, useEffect } from "react";
import { Boxes, Play, CheckCircle, AlertTriangle, Info, Calendar } from "lucide-react";
import { InventoryItemDTO, FifoCalculationResult } from "../types";

export const FifoAllocationPreview: React.FC = () => {
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("50");
  const [result, setResult] = useState<FifoCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/inventory?limit=100");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.items?.length > 0) {
          setSelectedItemId(data.items[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  };

  const handleSimulate = async () => {
    if (!selectedItemId) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity to simulate");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/fifo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: parseInt(selectedItemId, 10),
          requestedQuantity: qty,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || "Failed to calculate FIFO preview");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Simulation error");
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id.toString() === selectedItemId);

  return (
    <div className="space-y-6">
      {/* Informational Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950 uppercase tracking-wide mr-1">
            🟡 Proposed System Design:
          </span>
          FIFO (First-In, First-Out) stock release is deterministically calculated by prioritizing the oldest received eligible batch (`dateReceived` ascending). This queue simulator executes read-only calculations to test allocation behavior without mutating inventory balances.
        </div>
      </div>

      {/* Simulator Form Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-emerald-600" />
          Simulate FIFO Queue Allocation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Inventory Item
            </label>
            <select
              name="simulatorItemId"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              suppressHydrationWarning
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.category}] {item.name} — Current Avail: {item.totalRemaining} {item.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Hypothetical Quantity {selectedItem ? `(${selectedItem.unit})` : ""}
            </label>
            <input
              type="number"
              name="simulatorQuantity"
              min="0.1"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 75"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              suppressHydrationWarning
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleSimulate}
              disabled={loading || !selectedItemId}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? "Calculating..." : "Simulate"}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
      </div>

      {/* Simulation Results Breakdown */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Simulation Outcome: {result.itemName}
              </h4>
              <p className="text-xs text-slate-500">
                Requested: <strong>{result.requestedQuantity}</strong> | Total Available:{" "}
                <strong>{result.totalAvailableStock}</strong> | Batches Depleted:{" "}
                <strong>{result.batchesDepletedCount}</strong>
              </p>
            </div>
            <div>
              {result.isSufficient ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle className="w-4 h-4" /> Sufficient Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  <AlertTriangle className="w-4 h-4" /> Insufficient Stock (Short by {result.unfulfilledQuantity})
                </span>
              )}
            </div>
          </div>

          {result.allocations.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Priority Queue</th>
                    <th className="px-4 py-2.5">Batch / Lot #</th>
                    <th className="px-4 py-2.5">Received Date (FIFO Key)</th>
                    <th className="px-4 py-2.5">Expiry / Viability</th>
                    <th className="px-4 py-2.5 text-right">Available Before</th>
                    <th className="px-4 py-2.5 text-right font-bold text-emerald-700">Drawn Qty</th>
                    <th className="px-4 py-2.5 text-right">Remaining After</th>
                    <th className="px-4 py-2.5">Projected Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {result.allocations.map((alloc, idx) => (
                    <tr key={alloc.batchId} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-500 font-medium">#{idx + 1}</td>
                      <td className="px-4 py-2 font-semibold text-slate-900">{alloc.batchNumber}</td>
                      <td className="px-4 py-2 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(alloc.dateReceived).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {alloc.expiryDate
                          ? `Exp: ${new Date(alloc.expiryDate).toLocaleDateString()}`
                          : alloc.viabilityDate
                          ? `Viability: ${new Date(alloc.viabilityDate).toLocaleDateString()}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">{alloc.availableBefore}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">
                        -{alloc.quantityAllocated}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-900">
                        {alloc.remainingAfter}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alloc.statusAfter === "Depleted"
                              ? "bg-slate-200 text-slate-700"
                              : alloc.statusAfter === "Low Stock"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {alloc.statusAfter}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No available batches exist for this item.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
