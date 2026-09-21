"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { CreateCaseModal } from "./CreateCaseModal";
import { CaseDetailModal } from "./CaseDetailModal";
import { DistributionRequestModal } from "@/features/inventory/components/DistributionRequestModal";
import { DistributionRequestList } from "@/features/inventory/components/DistributionRequestList";
import { DistributionRequestDTO } from "@/features/inventory/types";
import {
  BarChart3,
  ShieldAlert,
  Plus,
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  Layers,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  User,
  ExternalLink,
  ChevronsUpDown,
  Trophy,
  Activity,
  ArrowUpDown,
} from "lucide-react";

interface LeaderboardItem {
  id: string;
  claimId: string;
  score: number;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW";
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

interface BarangayStat {
  barangay: string;
  high: number;
  medium: number;
  low: number;
  total: number;
  avgDamage: number;
  sumDamage: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  claims: LeaderboardItem[];
}

function StaffRankingContent() {
  const [activeTab, setActiveTab] = useState<"ranking" | "requests">("ranking");

  // Leaderboard data states
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalClaims, setTotalClaims] = useState<number>(0);

  // Distribution requests states
  const [requests, setRequests] = useState<DistributionRequestDTO[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // View & Filtering states in Unified Ranking View
  const [viewMode, setViewMode] = useState<"barangay" | "leaderboard">("barangay");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [expandedBarangays, setExpandedBarangays] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Distribution request modal state
  const [isDistModalOpen, setIsDistModalOpen] = useState<boolean>(false);
  const [selectedBarangayForDist, setSelectedBarangayForDist] = useState<string>("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pcic/priority?limit=200");
      if (res.ok) {
        const data = await res.json();
        const items = data.leaderboard || [];
        setLeaderboardItems(items);
        setTotalClaims(data.total ?? items.length);

        // Auto-expand the top 3 highest-priority barangays by default
        const brgyCounts: Record<string, number> = {};
        items.forEach((item: LeaderboardItem) => {
          const b = item.claim?.report?.farmer?.barangay || "Unassigned";
          brgyCounts[b] = (brgyCounts[b] || 0) + 1;
        });
        const initialExpanded: Record<string, boolean> = {};
        Object.keys(brgyCounts).slice(0, 3).forEach((b) => {
          initialExpanded[b] = true;
        });
        setExpandedBarangays(initialExpanded);
      }
    } catch (err) {
      console.error("Failed to fetch priority leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/inventory/requests?limit=100");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch distribution requests", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchRequests();
  }, []);

  // Compute unified barangay stats with aggregated claims
  const barangaySummary: BarangayStat[] = useMemo(() => {
    const map = new Map<string, BarangayStat>();

    leaderboardItems.forEach((item) => {
      const brgy = item.claim?.report?.farmer?.barangay || "Unassigned";
      if (!map.has(brgy)) {
        map.set(brgy, {
          barangay: brgy,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
          avgDamage: 0,
          sumDamage: 0,
          priority: "LOW",
          claims: [],
        });
      }
      const entry = map.get(brgy)!;
      entry.total++;
      entry.claims.push(item);

      const damageVal =
        item.claim?.report?.assessment?.assessedDamagePercent ??
        item.claim?.report?.reportedDamagePercent ??
        0;
      entry.sumDamage += damageVal;

      if (item.priorityLevel === "HIGH") entry.high++;
      else if (item.priorityLevel === "MEDIUM") entry.medium++;
      else entry.low++;
    });

    map.forEach((entry) => {
      entry.avgDamage = entry.total > 0 ? Math.round(entry.sumDamage / entry.total) : 0;
      entry.priority = entry.high > 0 ? "HIGH" : entry.medium > 0 ? "MEDIUM" : "LOW";
      // Sort claims inside each barangay by priority score descending
      entry.claims.sort((a, b) => b.score - a.score);
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort by urgency: High count desc, Medium count desc, avgDamage desc, total cases desc
      if (b.high !== a.high) return b.high - a.high;
      if (b.medium !== a.medium) return b.medium - a.medium;
      if (b.avgDamage !== a.avgDamage) return b.avgDamage - a.avgDamage;
      return b.total - a.total;
    });
  }, [leaderboardItems]);

  // Filtered Barangays based on search query and priority filter
  const filteredBarangays = useMemo(() => {
    return barangaySummary.filter((stat) => {
      // Priority filter match
      if (priorityFilter !== "ALL" && stat.priority !== priorityFilter) {
        return false;
      }

      // Search query match (against barangay name or any farmer/claim in that barangay)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      if (stat.barangay.toLowerCase().includes(q)) return true;

      return stat.claims.some((c) => {
        const farmerName = `${c.claim?.report?.farmer?.firstName} ${c.claim?.report?.farmer?.lastName}`.toLowerCase();
        const claimNum = c.claim?.claimNumber?.toLowerCase() || "";
        const crop = c.claim?.report?.crop?.cropType?.toLowerCase() || "";
        const calamity = c.claim?.report?.calamityType?.toLowerCase() || "";
        return (
          farmerName.includes(q) ||
          claimNum.includes(q) ||
          crop.includes(q) ||
          calamity.includes(q)
        );
      });
    });
  }, [barangaySummary, searchQuery, priorityFilter]);

  // Filtered Flat Claims for Leaderboard mode
  const filteredClaims = useMemo(() => {
    return leaderboardItems.filter((item) => {
      if (priorityFilter !== "ALL" && item.priorityLevel !== priorityFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const brgy = item.claim?.report?.farmer?.barangay?.toLowerCase() || "";
      const farmerName = `${item.claim?.report?.farmer?.firstName} ${item.claim?.report?.farmer?.lastName}`.toLowerCase();
      const claimNum = item.claim?.claimNumber?.toLowerCase() || "";
      const crop = item.claim?.report?.crop?.cropType?.toLowerCase() || "";
      const calamity = item.claim?.report?.calamityType?.toLowerCase() || "";
      return (
        brgy.includes(q) ||
        farmerName.includes(q) ||
        claimNum.includes(q) ||
        crop.includes(q) ||
        calamity.includes(q)
      );
    });
  }, [leaderboardItems, searchQuery, priorityFilter]);

  // Expand / Collapse Helpers
  const toggleBarangay = (brgy: string) => {
    setExpandedBarangays((prev) => ({
      ...prev,
      [brgy]: !prev[brgy],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    barangaySummary.forEach((b) => {
      all[b.barangay] = true;
    });
    setExpandedBarangays(all);
  };

  const collapseAll = () => {
    setExpandedBarangays({});
  };

  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const handleOpenDistributionModal = (brgy: string) => {
    setSelectedBarangayForDist(brgy);
    setIsDistModalOpen(true);
  };

  // KPI Metrics Calculation
  const highPriorityBarangaysCount = barangaySummary.filter((b) => b.priority === "HIGH").length;
  const totalAvgMunicipalDamage =
    barangaySummary.length > 0
      ? Math.round(
          barangaySummary.reduce((acc, curr) => acc + curr.avgDamage, 0) / barangaySummary.length
        )
      : 0;

  return (
    <div className="space-y-5 text-xs">
      {/* Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-amber-600 shrink-0" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Barangay Priority Ranking &amp; Resource Distribution
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px]">
                Per Barangay
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Unified barangay crop-loss ranking and aid distribution hub. Review ranked damage cohorts, inspect individual farmer dossiers, and trigger FIFO distribution requisitions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Open New Claim Case</span>
            </button>
          </div>
        </div>

        {/* Operational Guidance Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Operational Guidance:</span> Priority ranking aggregates crop-loss severity per barangay to inform aid allocation. It does <strong>NOT</strong> automatically deduct supplies. Staff specifies requisition quantities via the <strong>[ Distribution ]</strong> action, which requires Municipal Head approval prior to deterministic FIFO release.
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
            activeTab === "ranking"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Barangay Priority &amp; Claim Ranking</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {barangaySummary.length} Barangays
          </span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
            activeTab === "requests"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Distribution Requests &amp; FIFO Execution</span>
          {approvedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-mono font-bold animate-pulse">
              {approvedCount} Ready
            </span>
          )}
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-mono">
              {pendingCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === "ranking" ? (
        <div className="space-y-4">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Affected Barangays</span>
                <MapPin className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {barangaySummary.length}
                </span>
                <span className="text-[11px] text-slate-500">of 23 in Polomolok</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Ranked Claims</span>
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {totalClaims}
                </span>
                <span className="text-[11px] text-slate-500">crop damage files</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">High Urgency Areas</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-red-600">
                  {highPriorityBarangaysCount}
                </span>
                <span className="text-[11px] text-slate-500">critical barangays</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Municipal Loss</span>
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {totalAvgMunicipalDamage}%
                </span>
                <span className="text-[11px] text-slate-500">assessed severity</span>
              </div>
            </div>
          </div>

          {/* Unified Controls & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search barangay, farmer name, claim #, crop type..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filters & View Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Priority Levels</option>
                  <option value="HIGH">High Priority Only</option>
                  <option value="MEDIUM">Medium Priority Only</option>
                  <option value="LOW">Low Priority Only</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("barangay")}
                  className={`px-3 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    viewMode === "barangay"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Barangay Cohorts
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("leaderboard")}
                  className={`px-3 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    viewMode === "leaderboard"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Flat Leaderboard
                </button>
              </div>

              {/* Expand/Collapse All (Only in Barangay Mode) */}
              {viewMode === "barangay" && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Unified Content Section */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium text-xs">Aggregating barangay cohorts and deterministic rankings...</span>
              </div>
            </div>
          ) : viewMode === "barangay" ? (
            /* ================= VIEW 1: UNIFIED BARANGAY COHORTS ================= */
            <div className="space-y-3">
              {filteredBarangays.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                  No barangay data matches your current search or priority filter.
                </div>
              ) : (
                filteredBarangays.map((stat, idx) => {
                  const isExpanded = !!expandedBarangays[stat.barangay];
                  const isHigh = stat.priority === "HIGH";
                  const isMed = stat.priority === "MEDIUM";

                  return (
                    <div
                      key={stat.barangay}
                      className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${
                        isHigh
                          ? "border-red-200/80 hover:border-red-300"
                          : isMed
                          ? "border-amber-200/80 hover:border-amber-300"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Barangay Cohort Header Card */}
                      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                        {/* Left: Barangay Rank & Identity */}
                        <div className="flex items-center gap-3.5 min-w-[200px]">
                          <div
                            className={`flex flex-col items-center justify-center h-11 w-11 rounded-lg font-mono font-bold shrink-0 border ${
                              isHigh
                                ? "bg-red-600 text-white border-red-700"
                                : isMed
                                ? "bg-amber-500 text-white border-amber-600"
                                : "bg-slate-700 text-white border-slate-800"
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-tighter">Urgency</span>
                            <span className="text-base leading-none">#{idx + 1}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                              <h3 className="font-bold text-slate-900 text-sm">
                                Brgy. {stat.barangay}
                              </h3>
                              {isHigh ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  HIGH PRIORITY
                                </span>
                              ) : isMed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  MEDIUM PRIORITY
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  LOW PRIORITY
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span><strong>{stat.total}</strong> affected case{stat.total !== 1 ? "s" : ""}</span>
                              <span>•</span>
                              <span>Avg Loss: <strong className="text-slate-800 font-mono">{stat.avgDamage}%</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Center: Damage Metrics & Severity Breakdown */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {stat.high > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                {stat.high} Critical
                              </span>
                            )}
                            {stat.medium > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {stat.medium} Moderate
                              </span>
                            )}
                            {stat.low > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {stat.low} Minor
                              </span>
                            )}
                          </div>

                          {/* Mini Visual Damage Bar */}
                          <div className="hidden md:flex items-center gap-2 w-32">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  stat.avgDamage >= 60
                                    ? "bg-red-600"
                                    : stat.avgDamage >= 30
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(stat.avgDamage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">
                              {stat.avgDamage}%
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions ([ Distribution ] & Expand Accordion) */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDistributionModal(stat.barangay)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                            title={`Initiate resource distribution request for Brgy. ${stat.barangay}`}
                          >
                            <Package className="h-3.5 w-3.5" />
                            <span>Distribution</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleBarangay(stat.barangay)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                            aria-expanded={isExpanded}
                          >
                            <span>{stat.claims.length} Cases</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section: Ranked Claims within Barangay */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                          <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between px-1 pb-1">
                            <span>Individual Damage Dossiers (Ranked by Cohort Score)</span>
                            <span className="text-slate-400 font-mono">
                              Click any dossier to view claim evaluation details
                            </span>
                          </div>

                          <div className="space-y-2">
                            {stat.claims.map((item, claimIdx) => {
                              const hasAssessed =
                                item.claim?.report?.assessment?.assessedDamagePercent !== undefined &&
                                item.claim?.report?.assessment?.assessedDamagePercent !== null;

                              const damageVal = hasAssessed
                                ? item.claim.report.assessment!.assessedDamagePercent
                                : item.claim?.report?.reportedDamagePercent ?? 0;

                              const itemIsHigh = item.priorityLevel === "HIGH";
                              const itemIsMed = item.priorityLevel === "MEDIUM";

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setSelectedClaimId(item.claimId);
                                    setIsDetailOpen(true);
                                  }}
                                  className={`p-3 rounded-lg border bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    itemIsHigh
                                      ? "border-red-200 hover:border-red-400 hover:bg-red-50/20"
                                      : itemIsMed
                                      ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50/20"
                                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  {/* Left: Rank & Farmer Info */}
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`flex flex-col items-center justify-center h-9 w-9 rounded-md font-mono font-bold shrink-0 text-white ${
                                        itemIsHigh
                                          ? "bg-red-600"
                                          : itemIsMed
                                          ? "bg-amber-500"
                                          : "bg-slate-600"
                                      }`}
                                    >
                                      <span className="text-[8px] uppercase">Brgy</span>
                                      <span className="text-xs leading-none">#{claimIdx + 1}</span>
                                    </div>

                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-bold text-slate-900 text-xs">
                                          {item.claim?.claimNumber}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="font-bold text-slate-800">
                                          {item.claim?.report?.farmer?.firstName} {item.claim?.report?.farmer?.lastName}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          (Municipal Rank #{item.rankPosition})
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                                        <span>Crop: <strong>{item.claim?.report?.crop?.cropType}</strong></span>
                                        <span>•</span>
                                        <span>Calamity: <strong>{item.claim?.report?.calamityType}</strong></span>
                                        <span>•</span>
                                        <span>
                                          Incident:{" "}
                                          <span className="font-mono">
                                            {item.claim?.report?.incidentDate
                                              ? new Date(item.claim.report.incidentDate).toLocaleDateString()
                                              : "N/A"}
                                          </span>
                                        </span>
                                      </div>

                                      {item.formulaBreakdown?.explanation && (
                                        <p className="text-[10px] text-slate-500 font-mono pt-0.5 line-clamp-1">
                                          {item.formulaBreakdown.explanation}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: Damage & Priority Score Pillar */}
                                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                    <div className="text-right">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                        Priority Score
                                      </span>
                                      <span className="font-mono text-xs font-bold text-slate-900">
                                        {item.score.toFixed(1)} / 100
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono font-bold text-xs text-slate-800">
                                        {damageVal.toFixed(1)}%
                                      </span>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                          hasAssessed
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                      >
                                        {hasAssessed ? "Assessed" : "Reported"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ================= VIEW 2: FLAT MUNICIPAL LEADERBOARD ================= */
            <div className="space-y-2.5">
              {filteredClaims.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                  No ranked claims match your search or priority criteria.
                </div>
              ) : (
                filteredClaims.map((item) => {
                  const hasAssessed =
                    item.claim?.report?.assessment?.assessedDamagePercent !== undefined &&
                    item.claim?.report?.assessment?.assessedDamagePercent !== null;

                  const damageVal = hasAssessed
                    ? item.claim.report.assessment!.assessedDamagePercent
                    : item.claim?.report?.reportedDamagePercent ?? 0;

                  const isHigh = item.priorityLevel === "HIGH";
                  const isMed = item.priorityLevel === "MEDIUM";
                  const brgy = item.claim?.report?.farmer?.barangay || "Unassigned";

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border bg-white shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isHigh
                          ? "border-red-200 hover:border-red-400"
                          : isMed
                          ? "border-amber-200 hover:border-amber-400"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Municipal Rank Badge */}
                        <div
                          className={`flex flex-col items-center justify-center h-11 w-11 rounded-lg font-mono font-bold shrink-0 border ${
                            isHigh
                              ? "bg-red-600 text-white border-red-700"
                              : isMed
                              ? "bg-amber-500 text-white border-amber-600"
                              : "bg-slate-700 text-white border-slate-800"
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-tighter">Rank</span>
                          <span className="text-base leading-none">#{item.rankPosition}</span>
                        </div>

                        {/* Case Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {item.claim?.claimNumber}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-slate-800">
                              {item.claim?.report?.farmer?.firstName} {item.claim?.report?.farmer?.lastName}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-emerald-600" />
                              <span>Brgy. {brgy}</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                            <span>Crop: <strong>{item.claim?.report?.crop?.cropType}</strong></span>
                            <span>•</span>
                            <span>Calamity: <strong>{item.claim?.report?.calamityType}</strong></span>
                            <span>•</span>
                            <span>
                              Incident:{" "}
                              <span className="font-mono">
                                {item.claim?.report?.incidentDate
                                  ? new Date(item.claim.report.incidentDate).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </span>
                          </div>

                          {item.formulaBreakdown?.explanation && (
                            <p className="text-[10px] font-mono text-slate-500 line-clamp-1">
                              {item.formulaBreakdown.explanation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Score, Severity, and Action Buttons */}
                      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-right">
                          <div className="text-[9px] uppercase font-bold text-slate-400">
                            Priority Score
                          </div>
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {item.score.toFixed(1)} / 100
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 justify-end">
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {damageVal.toFixed(1)}%
                            </span>
                            <span
                              className={`text-[8px] px-1 rounded font-semibold uppercase ${
                                hasAssessed ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {hasAssessed ? "Assessed" : "Reported"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClaimId(item.claimId);
                              setIsDetailOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDistributionModal(brgy)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 transition-colors cursor-pointer shadow-2xs"
                            title={`Requisition distribution for Brgy. ${brgy}`}
                          >
                            <Package className="h-3 w-3" />
                            <span>Distribute</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        /* Requests & Execution Tab */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Barangay Resource Distribution Dockets
              </h3>
              <p className="text-[11px] text-slate-500">
                Track submitted requests through Head Approval (PENDING → APPROVED) and execute atomic FIFO allocation.
              </p>
            </div>

            <button
              onClick={() => handleOpenDistributionModal("")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Distribution Request</span>
            </button>
          </div>

          <DistributionRequestList
            requests={requests}
            loading={loadingRequests}
            onRefresh={fetchRequests}
            userRole="OMAG_STAFF"
          />
        </div>
      )}

      {/* Modals */}
      <DistributionRequestModal
        isOpen={isDistModalOpen}
        onClose={() => setIsDistModalOpen(false)}
        initialBarangay={selectedBarangayForDist}
        onCreated={() => {
          fetchRequests();
          setActiveTab("requests");
        }}
      />

      <CreateCaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchLeaderboard}
      />

      <CaseDetailModal
        claimId={selectedClaimId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClaimId(null);
        }}
        onStatusUpdated={fetchLeaderboard}
        isStaff={true}
      />
    </div>
  );
}

export const StaffRankingView: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading Priority Ranking...</span>
        </div>
      }
    >
      <StaffRankingContent />
    </Suspense>
  );
};

