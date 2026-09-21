"use client";

import React, { useState, useEffect } from "react";
import {
  PcicClaimListItemDTO,
  CALAMITY_TYPES,
} from "../types";
import { PcicCaseTable } from "./PcicCaseTable";
import { CaseDetailModal } from "./CaseDetailModal";
import { PriorityLeaderboard } from "./PriorityLeaderboard";
import {
  ShieldAlert,
  Search,
  Layers,
  BarChart3,
  FileCheck2,
  Lock,
} from "lucide-react";

export const HeadPcicView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"cases" | "leaderboard">("cases");
  const [claims, setClaims] = useState<PcicClaimListItemDTO[]>([]);
  const [leaderboardItems, setLeaderboardItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);

  // Pagination & Filter States
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [calamityFilter, setCalamityFilter] = useState<string>("");

  // Modals
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("claimStatus", statusFilter);
      if (priorityFilter) params.append("priorityLevel", priorityFilter);
      if (calamityFilter) params.append("calamityType", calamityFilter);

      const res = await fetch(`/api/pcic/claims?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.items || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch PCIC claims", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/pcic/priority?limit=30");
      if (res.ok) {
        const data = await res.json();
        setLeaderboardItems(data.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to fetch priority leaderboard", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, statusFilter, priorityFilter, calamityFilter]);

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  return (
    <div className="space-y-5 text-xs">
      {/* 1. Header Banner & Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-6 w-6 text-slate-800 shrink-0" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                PCIC Claim Monitoring & Prioritization Oversight
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold text-[11px] flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Read-Only Oversight
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Executive review of reported crop losses, priority rankings, focal coordination notes, and audit history.
            </p>
          </div>
        </div>

        {/* Statutory Boundary Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Statutory Boundary Notice:</span> This view provides executive municipal oversight of crop-loss cases for coordination with the PCIC focal person and adjuster. It does <strong>NOT</strong> constitute official PCIC insurance claim adjudication or payment settlement.
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("cases")}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "cases"
              ? "border-purple-700 text-purple-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Monitoring Dossiers</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
            {claims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === "leaderboard"
              ? "border-purple-700 text-purple-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Priority Leaderboard</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
            Ranked
          </span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "cases" ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by claim #, farmer name, RSBSA, or crop..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Status: All</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="FOR_REVIEW">For Review</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="COORDINATED_WITH_PCIC">Coordinated w/ PCIC</option>
                <option value="REQUIRES_CORRECTION">Requires Correction</option>
                <option value="DRAFT">Draft</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Priority: All</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <select
                value={calamityFilter}
                onChange={(e) => {
                  setCalamityFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Calamity: All</option>
                {CALAMITY_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {(search || statusFilter || priorityFilter || calamityFilter) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setPriorityFilter("");
                    setCalamityFilter("");
                    setPage(1);
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs underline px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Cases Table */}
          <PcicCaseTable
            claims={claims}
            loading={loading}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelectClaim={(id) => {
              setSelectedClaimId(id);
              setIsDetailOpen(true);
            }}
          />
        </div>
      ) : (
        <PriorityLeaderboard
          items={leaderboardItems}
          loading={leaderboardLoading}
          onRefresh={fetchLeaderboard}
          onSelectClaim={(id) => {
            setSelectedClaimId(id);
            setIsDetailOpen(true);
          }}
          canRecalculate={true}
        />
      )}

      {/* Dossier Detail Modal */}
      <CaseDetailModal
        claimId={selectedClaimId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClaimId(null);
        }}
        isStaff={false}
      />
    </div>
  );
};
