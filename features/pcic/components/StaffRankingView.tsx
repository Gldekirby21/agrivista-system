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
    headApprovalStatus?: string | null;
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
      photoVerifications?: Array<{
        id: string;
        systemReviewStatus?: string | null;
      }>;
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
  requestStatus?: "NONE" | "PENDING" | "APPROVED" | "DISTRIBUTED";
}

function StaffRankingContent() {
  const [activeTab, setActiveTab] = useState<"ranking" | "requests">("ranking");

  // Leaderboard data states
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalClaims, setTotalClaims] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  // Distribution requests states
  const [requests, setRequests] = useState<DistributionRequestDTO[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);

  // Filtering & expansion states in Barangay Ranking View
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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Track approved or distributed barangays (requests approved by OMAG Head or FIFO completed)
  const servicedBarangaysMap = useMemo(() => {
    const map = new Map<string, DistributionRequestDTO[]>();
    requests.forEach((r) => {
      if (r.status === "APPROVED" || r.status === "DISTRIBUTED") {
        const key = r.barangay.trim().toLowerCase();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
    });
    return map;
  }, [requests]);

  // Track pending barangay distribution requests awaiting OMAG Head approval
  const pendingRequestsBarangayMap = useMemo(() => {
    const map = new Map<string, DistributionRequestDTO[]>();
    requests.forEach((r) => {
      if (r.status === "PENDING") {
        const key = r.barangay.trim().toLowerCase();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
    });
    return map;
  }, [requests]);

  // Compute unified barangay stats with aggregated claims
  // NOTE: Barangays stay in this ranking view even if a request is PENDING.
  // Once APPROVED or DISTRIBUTED by OMAG Head, they graduate to the Distribution Requests & FIFO Execution tab.
  const barangaySummary: BarangayStat[] = useMemo(() => {
    const map = new Map<string, BarangayStat>();

    leaderboardItems.forEach((item) => {
      const brgy = item.claim?.report?.farmer?.barangay || "Unassigned";

      // If the barangay has already been APPROVED or DISTRIBUTED by OMAG Head, exclude from active priority ranking
      if (servicedBarangaysMap.has(brgy.trim().toLowerCase())) {
        return;
      }

      if (!map.has(brgy)) {
        const isPending = pendingRequestsBarangayMap.has(brgy.trim().toLowerCase());
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
          requestStatus: isPending ? "PENDING" : "NONE",
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
  }, [leaderboardItems, servicedBarangaysMap, pendingRequestsBarangayMap]);

  // Total serviced barangays count
  const servicedBarangaysCount = servicedBarangaysMap.size;

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

  if (!mounted) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
        <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading Priority Ranking...</span>
      </div>
    );
  }

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
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${activeTab === "ranking"
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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${activeTab === "requests"
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

              {/* Expand/Collapse All */}
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
          ) : (
            /* ================= BARANGAY COHORTS ================= */
            <div className="space-y-3">
              {filteredBarangays.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                  {barangaySummary.length === 0 && servicedBarangaysCount > 0 ? (
                    <div className="space-y-2">
                      <div className="text-emerald-700 font-bold text-sm">All barangay damage requests have been approved or distributed!</div>
                      <p className="text-xs text-slate-500">
                        All ranked cohorts have received official OMAG approval. Check the <strong>Distribution Requests &amp; FIFO Execution</strong> tab to track stock contributions and release batches.
                      </p>
                    </div>
                  ) : (
                    "No barangay data matches your current search or priority filter."
                  )}
                </div>
              ) : (
                filteredBarangays.map((stat, idx) => {
                  const isExpanded = !!expandedBarangays[stat.barangay];
                  const isHigh = stat.priority === "HIGH";
                  const isMed = stat.priority === "MEDIUM";

                  return (
                    <div
                      key={stat.barangay}
                      className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${isHigh
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
                            className={`flex flex-col items-center justify-center h-11 w-11 rounded-lg font-mono font-bold shrink-0 border ${isHigh
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
                              {stat.requestStatus === "PENDING" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  <Clock className="h-3 w-3 text-purple-600" />
                                  <span>REQUEST PENDING REVIEW</span>
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
                                className={`h-full rounded-full ${stat.avgDamage >= 60
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer ${
                              stat.requestStatus === "PENDING"
                                ? "bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100"
                                : "bg-emerald-700 text-white hover:bg-emerald-800"
                            }`}
                            title={
                              stat.requestStatus === "PENDING"
                                ? `A distribution request for Brgy. ${stat.barangay} is currently pending OMAG Head review. Click to submit another request.`
                                : `Initiate resource distribution request for Brgy. ${stat.barangay}`
                            }
                          >
                            <Package className="h-3.5 w-3.5" />
                            <span>
                              {stat.requestStatus === "PENDING" ? "Request Pending" : "Distribution"}
                            </span>
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
                                  className={`p-3 rounded-lg border bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${itemIsHigh
                                    ? "border-red-200 hover:border-red-400 hover:bg-red-50/20"
                                    : itemIsMed
                                      ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50/20"
                                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                  {/* Left: Rank & Farmer Info */}
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`flex flex-col items-center justify-center h-9 w-9 rounded-md font-mono font-bold shrink-0 text-white ${itemIsHigh
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
                                          (Municipal Rank #{item.rankPosition ?? "—"})
                                        </span>
                                        {(() => {
                                          const photos = item.claim?.report?.photoVerifications || [];
                                          const isConfirmed = photos.some((p) => p.systemReviewStatus === "CONFIRMED") || item.claim?.headApprovalStatus === "APPROVED";
                                          const isPending = photos.some((p) => p.systemReviewStatus === "REQUIRES_REVIEW" || !p.systemReviewStatus || p.systemReviewStatus === "PENDING");
                                          if (isConfirmed) {
                                            return (
                                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                PHOTO VERIFIED
                                              </span>
                                            );
                                          }
                                          if (photos.length > 0) {
                                            return (
                                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                PHOTO PENDING APPROVAL
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
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
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${hasAssessed
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
          )}
        </div>
      ) : (
        /* Requests & Execution Tab */
        <div className="space-y-4">
          {/* Contribution & Allocation Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Aid Contribution
                </span>
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900">
                {requests
                  .filter((r) => r.status === "APPROVED" || r.status === "DISTRIBUTED")
                  .reduce((sum, r) => sum + Number(r.requestedQuantity || 0), 0)
                  .toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                Across {servicedBarangaysCount} approved barangays
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Ready for FIFO Dispatch
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-emerald-700">
                {approvedCount} <span className="text-xs font-normal text-slate-500">Approved Dockets</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Awaiting staff warehouse stock release
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Head Review
                </span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-amber-700">
                {pendingCount} <span className="text-xs font-normal text-slate-500">Requests</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Queued for OMAG Head authorization
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Barangay Resource Distribution Dockets &amp; Contributions
              </h3>
              <p className="text-[11px] text-slate-500">
                Tracking approved aid contributions per barangay/farmer and executing atomic FIFO allocation across inventory batches.
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

