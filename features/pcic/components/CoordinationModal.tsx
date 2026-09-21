"use client";

import React, { useState } from "react";
import { PcicClaimListItemDTO } from "../types";
import { AlertCircle, PhoneCall, X } from "lucide-react";

interface CoordinationModalProps {
  claim: PcicClaimListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const CoordinationModal: React.FC<CoordinationModalProps> = ({
  claim,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (claim) {
      setRemarks("");
      setError(null);
    }
  }, [claim]);

  if (!isOpen || !claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError("Please enter coordination notes.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pcic/claims/${claim.id}/coordination`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remarks: remarks.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to record coordination notes");
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-md overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Record Coordination / Follow-up Notes
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {claim.claimNumber} — {claim.farmerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {claim.remarks && (
            <div>
              <label className="font-semibold text-slate-600 block mb-1">
                Existing Coordination History
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                {claim.remarks}
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              New Follow-up Note with PCIC Focal Person / Adjuster *
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              placeholder="e.g. Coordinated with PCIC focal person Mr. Santos. Adjuster scheduled for on-site damage assessment on Thursday morning..."
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Append Coordination Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
