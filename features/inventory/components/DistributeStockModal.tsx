"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Send, AlertTriangle, CheckCircle, Boxes, UserCheck } from "lucide-react";
import { InventoryItemDTO, FifoCalculationResult } from "../types";

interface FarmerOption {
  id: number;
  firstName: string;
  lastName: string;
  rsbsaNumber: string | null;
  barangay: string;
}

interface DistributeStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultItemId?: number;
}

export const DistributeStockModal: React.FC<DistributeStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultItemId,
}) => {
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);

  const [itemId, setItemId] = useState<string>(defaultItemId ? defaultItemId.toString() : "");
  const [farmerId, setFarmerId] = useState<string>("");
  const [requestedQuantity, setRequestedQuantity] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");

  const [fifoPreview, setFifoPreview] = useState<FifoCalculationResult | null>(null);
  const [calculatingFifo, setCalculatingFifo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPrerequisites();
      if (defaultItemId) {
        setItemId(defaultItemId.toString());
      }
    }
  }, [isOpen, defaultItemId]);

  const loadPrerequisites = async () => {
    setLoadingPrereqs(true);
    try {
      const [itemRes, farmerRes] = await Promise.all([
        fetch("/api/inventory?limit=100"),
        fetch("/api/beneficiaries?limit=100"),
      ]);

      if (itemRes.ok) {
        const itemData = await itemRes.json();
        setItems(itemData.items || []);
        if (!itemId && itemData.items?.length > 0) {
          setItemId(itemData.items[0].id.toString());
        }
      }

      if (farmerRes.ok) {
        const farmerData = await farmerRes.json();
        setFarmers(farmerData.records || farmerData.farmers || []);
        if (farmerData.records?.length > 0) {
          setFarmerId(farmerData.records[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Failed to load distribution prereqs:", err);
    } finally {
      setLoadingPrereqs(false);
    }
  };

  // Live FIFO calculation preview when item or quantity changes
  useEffect(() => {
    const qty = parseFloat(requestedQuantity);
    if (!itemId || isNaN(qty) || qty <= 0) {
      setFifoPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCalculatingFifo(true);
      setError(null);
      try {
        const res = await fetch("/api/inventory/fifo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: parseInt(itemId, 10),
            requestedQuantity: qty,
          }),
        });

        if (res.ok) {
          const preview = await res.json();
          setFifoPreview(preview);
        } else {
          setFifoPreview(null);
        }
      } catch (err) {
        console.error("FIFO preview fetch failed:", err);
      } finally {
        setCalculatingFifo(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [itemId, requestedQuantity]);

  const selectedItem = items.find((i) => i.id.toString() === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const qty = parseFloat(requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity");
      setSubmitting(false);
      return;
    }

    if (!farmerId) {
      setError("Please select a registered RSBSA beneficiary");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/inventory/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: parseInt(itemId, 10),
          farmerId: parseInt(farmerId, 10),
          requestedQuantity: qty,
          purpose: purpose.trim() || undefined,
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Distribution transaction rejected");
      }

      // Success
      setRequestedQuantity("");
      setPurpose("");
      setRemarks("");
      setFifoPreview(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Distribute Agricultural Resource (FIFO)"
      subtitle="Execute deterministic stock release prioritized by oldest received batch. Transactionally auditable."
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Distribution Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Commodity *
            </label>
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={loadingPrereqs}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.category}] {item.name} — Avail: {item.totalRemaining} {item.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Beneficiary (RSBSA Farmer) *
            </label>
            <select
              required
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              disabled={loadingPrereqs}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.lastName}, {f.firstName} ({f.barangay}) {f.rsbsaNumber ? `— ${f.rsbsaNumber}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Requested Quantity {selectedItem ? `(${selectedItem.unit})` : ""} *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            required
            placeholder="Enter quantity to distribute..."
            value={requestedQuantity}
            onChange={(e) => setRequestedQuantity(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Real-time Deterministic FIFO Allocation Breakdown */}
        {calculatingFifo && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 animate-pulse">
            Calculating deterministic FIFO queue allocation...
          </div>
        )}

        {fifoPreview && !calculatingFifo && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Deterministic FIFO Allocation Preview
                </span>
              </div>
              <div>
                {fifoPreview.isSufficient ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5" /> Stock Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    <AlertTriangle className="w-3.5 h-3.5" /> Insufficient Stock
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600">
              Total Available: <strong className="text-slate-900">{fifoPreview.totalAvailableStock}</strong> {selectedItem?.unit} | Requested: <strong className="text-slate-900">{fifoPreview.requestedQuantity}</strong> {selectedItem?.unit}
            </div>

            {fifoPreview.allocations.length > 0 ? (
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-1.5">Batch #</th>
                      <th className="px-3 py-1.5">Received Date (FIFO)</th>
                      <th className="px-3 py-1.5 text-right">Avail Before</th>
                      <th className="px-3 py-1.5 text-right font-bold text-emerald-700">Allocated</th>
                      <th className="px-3 py-1.5 text-right">Remaining After</th>
                      <th className="px-3 py-1.5">Result Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fifoPreview.allocations.map((alloc) => (
                      <tr key={alloc.batchId}>
                        <td className="px-3 py-1.5 font-medium text-slate-900">{alloc.batchNumber}</td>
                        <td className="px-3 py-1.5 text-slate-500">
                          {new Date(alloc.dateReceived).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600">{alloc.availableBefore}</td>
                        <td className="px-3 py-1.5 text-right font-bold text-emerald-700">
                          -{alloc.quantityAllocated}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-900">{alloc.remainingAfter}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
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
              <div className="text-xs text-slate-500 italic">No available active batches found for this item.</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Distribution Purpose / Program
            </label>
            <input
              type="text"
              placeholder="e.g. Calamity Recovery, Regular Fertilizer Subsidy"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Audit Remarks / Voucher Ref
            </label>
            <input
              type="text"
              placeholder="e.g. RIS-2026-09-0012"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
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
            disabled={submitting || !fifoPreview?.isSufficient}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Distributing..." : "Confirm FIFO Distribution"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
