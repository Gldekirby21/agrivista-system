"use client";

import React, { useState } from "react";
import {
  DistributionRequestDTO,
  DistributionRequestStatusType,
} from "../types";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  Send,
  AlertTriangle,
  Play,
  RotateCw,
  Eye,
  Calendar,
  Layers,
} from "lucide-react";

interface DistributionRequestListProps {
  requests: DistributionRequestDTO[];
  loading: boolean;
  onRefresh: () => void;
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
}

export const DistributionRequestList: React.FC<DistributionRequestListProps> = ({
  requests,
  loading,
  onRefresh,
  userRole,
}) => {
  const isHead = userRole === "OMAG_HEAD";
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReview = async (id: string, decision: "APPROVED" | "REJECTED", remarks?: string) => {
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/inventory/requests/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, remarks: remarks || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review decision.");
      }

      setMessage({
        type: "success",
        text: `Request has been successfully ${decision === "APPROVED" ? "APPROVED" : "REJECTED"}.`,
      });
      setRejectModalId(null);
      setRejectRemarks("");
      onRefresh();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to review request." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDistribute = async (id: string, requestNumber: string) => {
    if (!confirm(`Execute FIFO stock distribution for Request #${requestNumber}? This will deduct available inventory across eligible batches.`)) {
      return;
    }

    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/inventory/requests/${id}/distribute`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to execute distribution.");
      }

      const data = await res.json();
      setMessage({
        type: "success",
        text: `FIFO distribution executed successfully! Deducted across ${data.createdRecords?.length || 1} batch(es).`,
      });
      onRefresh();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to execute distribution." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: DistributionRequestStatusType) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>PENDING HEAD APPROVAL</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>APPROVED — READY TO DISTRIBUTE</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
            <XCircle className="h-3 w-3 text-red-600" />
            <span>REJECTED</span>
          </span>
        );
      case "DISTRIBUTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Package className="h-3 w-3 text-blue-600" />
            <span>DISTRIBUTED (FIFO EXECUTED)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
              : "bg-red-50 border-red-200 text-red-800 font-semibold"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Barangay</th>
                <th className="py-3 px-4">Requested Item</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Request Details</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading distribution requests...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No distribution requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const isActionLoading = actionLoadingId === req.id;
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Request # */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {req.requestNumber}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Barangay */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          <span>Brgy. {req.barangay}</span>
                        </span>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.item?.name || `Item #${req.itemId}`}</div>
                        <div className="text-[10px] text-slate-400">
                          {req.item?.category || req.resourceType || "Agricultural Supply"}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {req.requestedQuantity} {req.unit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(req.status)}
                        {req.approvalRemarks && (
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">
                            &quot;{req.approvalRemarks}&quot;
                          </div>
                        )}
                      </td>

                      {/* Staff & Timestamp */}
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <div>Staff: <strong>{req.requestedBy?.fullName || "Staff"}</strong></div>
                        {req.remarks && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs" title={req.remarks}>
                            {req.remarks}
                          </div>
                        )}
                        {req.distributedAt && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Distributed: {new Date(req.distributedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Contextual Action Button */}
                      <td className="py-3 px-4 text-center">
                        {isHead && req.status === "PENDING" ? (
                          /* OMAG HEAD Actions: Approve / Reject */
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleReview(req.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                              title="Approve distribution request"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => setRejectModalId(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold text-[11px] hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Reject distribution request"
                            >
                              Reject
                            </button>
                          </div>
                        ) : req.status === "APPROVED" ? (
                          /* Authorized Action: DISTRIBUTE (Executes FIFO) */
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleDistribute(req.id, req.requestNumber)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-700 text-white font-bold text-[11px] hover:bg-purple-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                            title="Execute FIFO allocation and deduct stock"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>{isActionLoading ? "Distributing..." : "Distribute"}</span>
                          </button>
                        ) : req.status === "DISTRIBUTED" ? (
                          <span className="text-[11px] font-mono text-slate-400">
                            Completed
                          </span>
                        ) : req.status === "REJECTED" ? (
                          <span className="text-[11px] font-mono text-red-500">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Awaiting Head
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Remarks Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">
              Reject Distribution Request
            </h4>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting this distribution request.
            </p>
            <textarea
              rows={3}
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Insufficient municipal stock allocation or inaccurate damage scope..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalId(null);
                  setRejectRemarks("");
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectModalId, "REJECTED", rejectRemarks)}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
