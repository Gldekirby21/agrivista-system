"use client";

import React, { useState } from "react";
import { ClaimStatus, PcicClaimListItemDTO } from "../types";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface UpdateStatusModalProps {
  claim: PcicClaimListItemDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  claim,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [status, setStatus] = useState<ClaimStatus>(
    claim?.claimStatus || ClaimStatus.SUBMITTED
  );
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (claim) {
      setStatus(claim.claimStatus);
      setRemarks("");
      setError(null);
    }
  }, [claim]);

  if (!isOpen || !claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pcic/claims/${claim.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimStatus: status,
          remarks: remarks || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update claim status");
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
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Update Case Monitoring Status
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              {claim.claimNumber} — {claim.farmerName}
            </p>
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

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              New Monitoring Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClaimStatus)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-500"
            >
              <option value="SUBMITTED">SUBMITTED — Initial farmer loss report registered</option>
              <option value="FOR_REVIEW">FOR_REVIEW — Under focal person preliminary review</option>
              <option value="REVIEWED">REVIEWED — Validated by municipal focal person</option>
              <option value="COORDINATED_WITH_PCIC">
                COORDINATED_WITH_PCIC — Forwarded / endorsed to PCIC adjuster
              </option>
              <option value="REQUIRES_CORRECTION">
                REQUIRES_CORRECTION — Discrepancies flagged in photos or land info
              </option>
              <option value="DRAFT">DRAFT — Internal drafting</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Status Change Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Endorsed crop loss dossier to PCIC South Cotabato field office for joint inspection..."
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
              {loading ? "Updating..." : "Save Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
