"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Package,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
} from "lucide-react";
import { InventoryItemDTO } from "../types";

interface DistributionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialBarangay?: string;
}

export const DistributionRequestModal: React.FC<DistributionRequestModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialBarangay = "",
}) => {
  const [barangay, setBarangay] = useState(initialBarangay);
  const [resourceType, setResourceType] = useState<"ALL" | "FERTILIZER" | "SEEDS">("ALL");
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");

  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialBarangay) {
      setBarangay(initialBarangay);
    }
  }, [initialBarangay]);

  useEffect(() => {
    if (isOpen) {
      loadCatalogItems();
      setError(null);
    }
  }, [isOpen, resourceType]);

  const loadCatalogItems = async () => {
    setLoadingItems(true);
    try {
      const url = new URL("/api/inventory", window.location.origin);
      if (resourceType !== "ALL") {
        url.searchParams.set("category", resourceType);
      }
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load inventory items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const selectedItem = items.find((it) => it.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangay.trim()) {
      setError("Please specify the destination barangay.");
      return;
    }
    if (!selectedItemId) {
      setError("Please select an inventory item.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a requested quantity strictly greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barangay: barangay.trim(),
          itemId: Number(selectedItemId),
          requestedQuantity: Number(quantity),
          unit: selectedItem?.unit || "Units",
          resourceType: selectedItem?.category || (resourceType !== "ALL" ? resourceType : undefined),
          remarks: remarks.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit distribution request.");
      }

      // Reset form
      setQuantity("");
      setRemarks("");
      setSelectedItemId("");
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit distribution request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Barangay Resource Distribution Request
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Initiate resource requisition for Barangay {barangay || "Destination"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Workflow Status Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              <span>Workflow Stage: Request Creation (PENDING)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Saving this request will record it in <strong>PENDING</strong> status for Municipal Head review. Inventory will <strong>NOT</strong> be deducted and FIFO will <strong>NOT</strong> run until approved and explicitly distributed.
            </p>
          </div>

          {/* Barangay Destination */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Barangay Destination <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                placeholder="e.g. Bentung, Glamang, Cannery Site"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-colors"
              />
            </div>
          </div>

          {/* Resource Type Filter / Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Resource Category
              </label>
              <select
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value as any);
                  setSelectedItemId("");
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="FERTILIZER">Fertilizer</option>
                <option value="SEEDS">Seeds</option>
              </select>
            </div>

            {/* Inventory Item Selection */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Catalog Item <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : "")}
                required
                disabled={loadingItems}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 cursor-pointer disabled:bg-slate-100"
              >
                <option value="">{loadingItems ? "Loading catalog..." : "-- Select Item --"}</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.unit}) • {it.totalRemaining} in stock
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Requested Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 50"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Unit
              </label>
              <input
                type="text"
                value={selectedItem?.unit || "Bags / Kg"}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Stock Availability Hint */}
          {selectedItem && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-600">Available Eligible Stock:</span>
              <span className="font-mono font-bold text-slate-900">
                {selectedItem.totalRemaining} {selectedItem.unit}
              </span>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Request Remarks / Purpose
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Calamity relief distribution for high-damage corn farmers in Brgy. Glamang."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? "Saving Request..." : "Submit for Approval"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
