"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Edit3, AlertCircle } from "lucide-react";
import { InventoryBatchDTO } from "../types";

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch: InventoryBatchDTO | null;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batch,
}) => {
  const [supplierSource, setSupplierSource] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [status, setStatus] = useState("Available");
  const [expiryDate, setExpiryDate] = useState("");
  const [viabilityDate, setViabilityDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setSupplierSource(batch.supplierSource || "");
      setStorageLocation(batch.storageLocation || "");
      setStatus(batch.status || "Available");
      setExpiryDate(
        batch.expiryDate ? new Date(batch.expiryDate).toISOString().split("T")[0] : ""
      );
      setViabilityDate(
        batch.viabilityDate ? new Date(batch.viabilityDate).toISOString().split("T")[0] : ""
      );
      setError(null);
    }
  }, [batch]);

  if (!batch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierSource: supplierSource.trim() || null,
          storageLocation: storageLocation.trim() || null,
          status,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
          viabilityDate: viabilityDate ? new Date(viabilityDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to update batch");
      }

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
      title="Edit Inventory Batch"
      subtitle={`Modify details for Batch #${batch.batchNumber} (${batch.item?.name || "Item"}).`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Update Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Read-Only Summary Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Commodity</span>
            <span className="font-semibold text-slate-900">{batch.item?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Received Date (FIFO)</span>
            <span className="font-semibold text-slate-900">{new Date(batch.dateReceived).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Received Qty</span>
            <span className="font-semibold text-slate-900">{batch.receivedQuantity} {batch.item?.unit}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Remaining Balance</span>
            <span className="font-bold text-emerald-700">{batch.remainingQuantity} {batch.item?.unit}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Batch Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Depleted">Depleted</option>
              <option value="Expired">Expired</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Storage Warehouse / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Warehouse Bay A-12"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Supplier / Procurement Source
            </label>
            <input
              type="text"
              placeholder="e.g. DA-RFO XII Regional Seed Depot"
              value={supplierSource}
              onChange={(e) => setSupplierSource(e.target.value)}
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

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Seed Viability Date (Where Applicable)
            </label>
            <input
              type="date"
              value={viabilityDate}
              onChange={(e) => setViabilityDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
