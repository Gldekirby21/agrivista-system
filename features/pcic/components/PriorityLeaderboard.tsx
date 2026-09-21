"use client";

import React, { useState, useMemo } from "react";
import { PriorityLevel } from "../types";
import {
  AlertTriangle,
  Clock,
  RotateCw,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Filter,
} from "lucide-react";

interface LeaderboardItem {
  id: string;
  claimId: string;
  score: number;
  priorityLevel: PriorityLevel;
  rankPosition: number;
  formulaBreakdown: any;
  calculatedAt: string;
  claim: {
    id: string;
    claimNumber: string;
    claimStatus: string;
    filingDate: string;
    report: {
      reportNumber: string;
      incidentDate: string;
      calamityType: string;
      reportedDamagePercent: number;
      farmer: {
        firstName: string;
        lastName: string;
        barangay: string;
      };
      crop: {
        cropType: string;
      };
      assessment?: {
        assessedDamagePercent: number;
      } | null;
    };
  };
}

interface PriorityLeaderboardProps {
  items: LeaderboardItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectClaim?: (claimId: string) => void;
  canRecalculate?: boolean;
  initialGroupByBarangay?: boolean;
}

const BARANGAYS = [
  "ALL",
  "Bentung",
  "Cannery Site",
  "Crossing Pangi",
  "Glamang",
  "Kinilis",
  "Klinan 6",
  "Koronadal Proper",
  "Lam-Calerio",
  "Lapu",
  "Lumakil",
  "Maligo",
  "Pagalungan",
  "Palian",
  "Plandes",
  "Poblacion",
  "Polo",
  "Rubber",
  "Silway 7",
  "Silway 8",
  "Sulit",
  "Sumbakil",
  "Upper Klinan",
  "Villarica",
];

export const PriorityLeaderboard: React.FC<PriorityLeaderboardProps> = ({
  items,
  loading,
  onRefresh,
  onSelectClaim,
  canRecalculate = false,
  initialGroupByBarangay = false,
}) => {
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [barangayFilter, setBarangayFilter] = useState<string>("ALL");
  const [groupByBarangay, setGroupByBarangay] = useState<boolean>(initialGroupByBarangay);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pcic/priority/recalculate", {
        method: "POST",
      });
      if (res.ok) {
        setMessage("Cohort priority ranks successfully recomputed.");
        onRefresh();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to recalculate priorities", err);
    } finally {
      setRecalculating(false);
    }
  };

  // Filter items by selected Barangay (or all)
  const filteredItems = useMemo(() => {
    if (barangayFilter === "ALL") return items;
    return items.filter(
      (item) => item.claim.report.farmer?.barangay?.toLowerCase() === barangayFilter.toLowerCase()
    );
  }, [items, barangayFilter]);

  // Group items by Barangay when groupByBarangay is enabled
  const groupedByBarangay = useMemo(() => {
    const map = new Map<string, LeaderboardItem[]>();
    filteredItems.forEach((item) => {
      const brgy = item.claim.report.farmer?.barangay || "Unassigned";
      if (!map.has(brgy)) {
        map.set(brgy, []);
      }
      map.get(brgy)!.push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const renderClaimCard = (item: LeaderboardItem) => {
    const hasAssessed =
      item.claim.report.assessment?.assessedDamagePercent !== undefined &&
      item.claim.report.assessment?.assessedDamagePercent !== null;

    const damageVal = hasAssessed
      ? item.claim.report.assessment!.assessedDamagePercent
      : item.claim.report.reportedDamagePercent;

    const isHigh = item.priorityLevel === "HIGH";
    const isMed = item.priorityLevel === "MEDIUM";

    return (
      <div
        key={item.id}
        onClick={() => onSelectClaim && onSelectClaim(item.claimId)}
        className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isHigh
            ? "bg-red-50/40 border-red-200 hover:bg-red-50/70"
            : isMed
            ? "bg-amber-50/40 border-amber-200 hover:bg-amber-50/70"
            : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Rank Badge */}
          <div
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-lg font-mono font-bold shrink-0 border ${
              isHigh
                ? "bg-red-600 text-white border-red-700"
                : isMed
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-slate-600 text-white border-slate-700"
            }`}
          >
            <span className="text-[10px] uppercase tracking-tighter">Rank</span>
            <span className="text-base leading-none">#{item.rankPosition}</span>
          </div>

          {/* Case Info */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-xs">
                {item.claim.claimNumber}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-800">
                {item.claim.report.farmer.firstName} {item.claim.report.farmer.lastName}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                <MapPin className="h-3 w-3 text-emerald-600" />
                <span>Brgy. {item.claim.report.farmer.barangay}</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
              <span>Crop: <strong>{item.claim.report.crop.cropType}</strong></span>
              <span>•</span>
              <span>Calamity: <strong>{item.claim.report.calamityType}</strong></span>
              <span>•</span>
              <span>
                Reported:{" "}
                <span className="font-mono">
                  {new Date(item.claim.report.incidentDate).toLocaleDateString()}
                </span>
              </span>
            </div>

            {item.formulaBreakdown?.explanation && (
              <p className="text-[10px] font-mono text-slate-500 pt-0.5 line-clamp-1">
                {item.formulaBreakdown.explanation}
              </p>
            )}
          </div>
        </div>

        {/* Score & Severity Pillar */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Priority Score
            </div>
            <div className="font-mono text-sm font-bold text-slate-900">
              {item.score.toFixed(1)} / 100
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono font-bold text-xs text-slate-800">
              {damageVal.toFixed(1)}%
            </span>
            <span
              className={`text-[9px] px-1 rounded font-semibold uppercase ${
                hasAssessed ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {hasAssessed ? "Assessed" : "Reported"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 text-sm">
              Priority Ranking Leaderboard
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              🟡 PROPOSED SYSTEM DESIGN
            </span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Organized by Barangay • Ranked by severity (70%) and earlier report date (30%) with deterministic tie-breaking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canRecalculate && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RotateCw className={`h-3.5 w-3.5 ${recalculating ? "animate-spin" : ""}`} />
              <span>{recalculating ? "Re-ranking..." : "Recalculate Cohort Ranks"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Barangay Organization Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-semibold text-slate-700">Barangay Scope:</span>
          <select
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b === "ALL" ? "All Barangays (Municipal Overview)" : `Brgy. ${b}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={groupByBarangay}
              onChange={(e) => setGroupByBarangay(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Group by Barangay Sections</span>
          </label>

          <span className="text-[11px] text-slate-500 font-mono">
            {filteredItems.length} claim{filteredItems.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {message && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Leaderboard Cards / List */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 font-medium">
          Loading priority rankings...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          No ranked claims available for {barangayFilter === "ALL" ? "the municipality" : `Brgy. ${barangayFilter}`}.
        </div>
      ) : groupByBarangay ? (
        /* Grouped by Barangay View */
        <div className="space-y-4">
          {groupedByBarangay.map(([brgy, groupClaims]) => (
            <div key={brgy} className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  <span className="font-bold text-slate-900 text-xs">Brgy. {brgy}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                  {groupClaims.length} case{groupClaims.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-2">
                {groupClaims.map((item) => renderClaimCard(item))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat Leaderboard View sorted by Municipal Rank Position */
        <div className="space-y-2.5">
          {filteredItems.map((item) => renderClaimCard(item))}
        </div>
      )}
    </div>
  );
};
