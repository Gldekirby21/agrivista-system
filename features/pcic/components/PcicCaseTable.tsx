"use client";

import React from "react";
import { PcicClaimListItemDTO, ClaimStatus, PriorityLevel } from "../types";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  Edit,
  PhoneCall,
} from "lucide-react";

interface PcicCaseTableProps {
  claims: PcicClaimListItemDTO[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectClaim: (claimId: string) => void;
  onUpdateStatus?: (claim: PcicClaimListItemDTO) => void;
  onCoordination?: (claim: PcicClaimListItemDTO) => void;
  onEdit?: (claim: PcicClaimListItemDTO) => void;
  isStaff?: boolean;
}

export const PcicCaseTable: React.FC<PcicCaseTableProps> = ({
  claims,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onSelectClaim,
  onUpdateStatus,
  onCoordination,
  onEdit,
  isStaff = false,
}) => {
  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      case "FOR_REVIEW":
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">For Review</span>;
      case "REVIEWED":
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">Reviewed</span>;
      case "COORDINATED_WITH_PCIC":
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Coordinated w/ PCIC</span>;
      case "REQUIRES_CORRECTION":
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">Requires Correction</span>;
      case "DRAFT":
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
    }
  };

  const getPriorityBadge = (level?: PriorityLevel | null, rank?: number | null) => {
    if (!level) {
      return <span className="text-slate-400 text-xs">—</span>;
    }

    const rankText = rank ? `Rank #${rank}` : "";

    switch (level) {
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="h-3 w-3" />
            {rankText ? `${rankText} (High)` : "HIGH"}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" />
            {rankText ? `${rankText} (Medium)` : "MEDIUM"}
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {rankText ? `${rankText} (Low)` : "LOW"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Priority / Rank</th>
              <th className="py-3 px-4">Claim & Report #</th>
              <th className="py-3 px-4">Farmer / Beneficiary</th>
              <th className="py-3 px-4">Barangay</th>
              <th className="py-3 px-4">Crop & Calamity</th>
              <th className="py-3 px-4">Damage Severity</th>
              <th className="py-3 px-4">Date Reported</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                  Loading PCIC monitoring cases...
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-slate-400" />
                    <p className="font-semibold text-slate-700 text-sm">No PCIC monitoring records found</p>
                    <p className="text-slate-400 text-xs">
                      There are currently no crop-loss claims matching your filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onSelectClaim(claim.id)}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getPriorityBadge(claim.priorityLevel, claim.rankPosition)}
                    {claim.priorityScore !== null && claim.priorityScore !== undefined && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Score: {claim.priorityScore.toFixed(1)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900">{claim.claimNumber}</div>
                    <div className="text-[10px] font-mono text-slate-400">{claim.reportNumber}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{claim.farmerName}</div>
                    {claim.farmerRsbsa && (
                      <div className="text-[10px] font-mono text-slate-500">
                        RSBSA: {claim.farmerRsbsa}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                    {claim.barangay}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{claim.cropType}</div>
                    <div className="text-[10px] text-slate-500">{claim.calamityType} ({claim.reportedAffectedAreaHa} ha)</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-slate-900">
                        {claim.applicableDamagePercent.toFixed(1)}%
                      </span>
                      <span
                        className={`text-[9px] px-1 rounded font-semibold uppercase ${
                          claim.damageBasis === "ASSESSED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                        title={
                          claim.damageBasis === "ASSESSED"
                            ? "Severity based on Field Assessment"
                            : "Severity based on Reported Damage"
                        }
                      >
                        {claim.damageBasis === "ASSESSED" ? "Assessed" : "Reported"}
                      </span>
                    </div>
                    {claim.assessedDamagePercent !== null && claim.damageBasis === "ASSESSED" && (
                      <div className="text-[10px] text-slate-400">
                        Rep: {claim.reportedDamagePercent.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                    {new Date(claim.incidentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(claim.claimStatus)}
                  </td>
                  <td
                    className="py-3 px-4 whitespace-nowrap text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectClaim(claim.id)}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        title="View Full Dossier"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {isStaff && (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(claim)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Edit Case & Damage Assessment"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {onCoordination && (
                            <button
                              onClick={() => onCoordination(claim)}
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              title="Update Coordination & Follow-up Notes"
                            >
                              <PhoneCall className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
