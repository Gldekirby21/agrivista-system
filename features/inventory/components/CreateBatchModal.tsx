"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Plus, Boxes, AlertCircle, Sparkles } from "lucide-react";
import { InventoryItemDTO } from "../types";

// System convenience helper — NOT an official OMAG numbering policy.
// Generates a human-readable batch identifier in the format LOT-YYYY-MM-XXXX.
// The database unique constraint remains the authoritative uniqueness enforcer.
function generateAutoBatchNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOT-${year}-${month}-${randomSuffix}`;
}

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultItemId?: number;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultItemId,
}) => {
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemId, setItemId] = useState<string>(defaultItemId ? defaultItemId.toString() : "");
  const [batchNumber, setBatchNumber] = useState("");
  const [receivedQuantity, setReceivedQuantity] = useState("");
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [viabilityDate, setViabilityDate] = useState("");
  const [supplierSource, setSupplierSource] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      // Auto-generate a batch number each time the modal opens.
      // The field remains editable if a custom identifier is needed.
      setBatchNumber(generateAutoBatchNumber());
      if (defaultItemId) {
        setItemId(defaultItemId.toString());
      }
    }
  }, [isOpen, defaultItemId]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/inventory?limit=100");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (!itemId && data.items?.length > 0) {
          setItemId(data.items[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Failed to load items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const selectedItem = items.find((i) => i.id.toString() === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const qty = parseFloat(receivedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Received quantity must be a positive number");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/inventory/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: parseInt(itemId, 10),
          batchNumber: batchNumber.trim(),
          receivedQuantity: qty,
          dateReceived: new Date(dateReceived).toISOString(),
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          viabilityDate: viabilityDate ? new Date(viabilityDate).toISOString() : undefined,
          supplierSource: supplierSource.trim() || undefined,
          storageLocation: storageLocation.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to receive batch");
      }

      // Reset form
      setBatchNumber("");
      setReceivedQuantity("");
      setExpiryDate("");
      setViabilityDate("");
      setSupplierSource("");
      setStorageLocation("");
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
      title="Receive Inventory Batch"
      subtitle="Intake a new commodity lot into the municipal warehouse with receipt date for FIFO tracking."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Batch Receipt Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Catalog Item *
          </label>
          <select
            required
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            disabled={loadingItems}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.category}] {item.name} ({item.itemCode}) — Unit: {item.unit}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Batch / Lot Identifier *
              </label>
              <button
                type="button"
                onClick={() => setBatchNumber(generateAutoBatchNumber())}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                title="Generate a new batch identifier"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Re-generate</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. LOT-2026-09-A3F2"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Auto
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Auto-generated for convenience. Editable if a supplier or official lot number must be used.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Received Quantity {selectedItem ? `(${selectedItem.unit})` : ""} *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="e.g. 200"
              value={receivedQuantity}
              onChange={(e) => setReceivedQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Receipt Date (FIFO Key) *
            </label>
            <input
              type="date"
              required
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Viability Date (Seeds)
            </label>
            <input
              type="date"
              value={viabilityDate}
              onChange={(e) => setViabilityDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Supplier / Procurement Source
            </label>
            <input
              type="text"
              placeholder="e.g. DA RFO-12, Commercial Supplier"
              value={supplierSource}
              onChange={(e) => setSupplierSource(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Storage Location
            </label>
            <input
              type="text"
              placeholder="e.g. OMAG Warehouse 1 - Bay B"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
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
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? "Receiving..." : "Save Batch"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
