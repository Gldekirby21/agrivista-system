"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  MapPin,
  ArrowUpRight,
  Info,
  Layers,
  FileCheck2,
  FileText,
  AlertCircle,
  Eye,
  Calendar,
  Tag,
} from "lucide-react";
import { CropLossCaseVerificationListItem } from "../types";
import { PhotoUploadModal } from "./PhotoUploadModal";
import { cn } from "@/lib/utils/cn";

interface PhotoVerificationListProps {
  initialItems: CropLossCaseVerificationListItem[];
  totalCount: number;
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
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

const CASE_STATUSES = [
  "ALL",
  "UNLINKED",
  "SUBMITTED",
  "UNDER_REVIEW",
  "COORDINATED_WITH_PCIC",
  "SETTLED",
  "CLOSED",
];

const PRIORITY_LEVELS = ["ALL", "HIGH", "MEDIUM", "LOW"];

const VERIFICATION_STATUSES = [
  "ALL",
  "ACCEPTED",
  "REVIEW",
  "REJECTED",
  "NOT_ACCEPTED",
  "PENDING",
];

export const PhotoVerificationList: React.FC<PhotoVerificationListProps> = ({
  initialItems,
  totalCount,
  userRole,
}) => {
  const [items, setItems] = useState<CropLossCaseVerificationListItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("ALL");
  const [caseStatusFilter, setCaseStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchRecords = async (
    search?: string,
    barangay?: string,
    caseStatus?: string,
    priority?: string,
    vStatus?: string
  ) => {
    setLoading(true);
    try {
      const q = search !== undefined ? search : searchTerm;
      const b = barangay !== undefined ? barangay : barangayFilter;
      const cs = caseStatus !== undefined ? caseStatus : caseStatusFilter;
      const p = priority !== undefined ? priority : priorityFilter;
      const vs = vStatus !== undefined ? vStatus : verificationStatusFilter;

      const params = new URLSearchParams();
      params.set("mode", "cases");
      if (q) params.set("search", q);
      if (b && b !== "ALL") params.set("barangay", b);
      if (cs && cs !== "ALL") params.set("caseStatus", cs);
      if (p && p !== "ALL") params.set("priorityLevel", p);
      if (vs && vs !== "ALL") params.set("status", vs);

      const res = await fetch(`/api/photo-verification?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to query crop-loss cases:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchRecords(val, barangayFilter, caseStatusFilter, priorityFilter, verificationStatusFilter);
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBarangayFilter(val);
    fetchRecords(searchTerm, val, caseStatusFilter, priorityFilter, verificationStatusFilter);
  };

  const handleCaseStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCaseStatusFilter(val);
    fetchRecords(searchTerm, barangayFilter, val, priorityFilter, verificationStatusFilter);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPriorityFilter(val);
    fetchRecords(searchTerm, barangayFilter, caseStatusFilter, val, verificationStatusFilter);
  };

  const handleVerificationStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setVerificationStatusFilter(val);
    fetchRecords(searchTerm, barangayFilter, caseStatusFilter, priorityFilter, val);
  };

  // KPI Calculations based on Cases
  const stats = useMemo(() => {
    const totalCases = items.length;
    const acceptedCases = items.filter(
      (i) => i.consolidatedVerificationStatus === "ACCEPTED"
    ).length;
    const reviewCases = items.filter(
      (i) => i.consolidatedVerificationStatus === "REVIEW"
    ).length;
    const rejectedCases = items.filter(
      (i) =>
        i.consolidatedVerificationStatus === "REJECTED" ||
        i.consolidatedVerificationStatus === "NOT_ACCEPTED"
    ).length;
    const totalPhotos = items.reduce((acc, curr) => acc + curr.photoCount, 0);

    return {
      totalCases,
      acceptedCases,
      reviewCases,
      rejectedCases,
      totalPhotos,
    };
  }, [items]);

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ACCEPTED
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> REQUIRES REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-900 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> REJECTED
          </span>
        );
      case "NOT_ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> NOT ACCEPTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> PENDING
          </span>
        );
    }
  };

  const getPriorityBadge = (level: string | null, rank: number | null) => {
    if (!level) return <span className="text-slate-400 font-mono text-xs">—</span>;

    const rankText = rank ? `Rank #${rank}` : "";

    switch (level) {
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" />
            {rankText ? `${rankText} (HIGH)` : "HIGH"}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {rankText ? `${rankText} (MED)` : "MEDIUM"}
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {rankText ? `${rankText} (LOW)` : "LOW"}
          </span>
        );
      default:
        return <span className="text-slate-500 text-xs">{level}</span>;
    }
  };

  const getCaseStatusBadge = (status: string) => {
    switch (status) {
      case "UNLINKED":
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-300">
            Unlinked Photo
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Submitted
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      case "COORDINATED_WITH_PCIC":
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Coordinated w/ PCIC
          </span>
        );
      case "SETTLED":
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Settled
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const basePath = userRole === "OMAG_HEAD" ? "/head/photo-verification" : "/staff/photo-verification";

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider">
                Consolidated Monitoring
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Objective #2 (Photo Verification) + Objective #6 (PCIC Claims)
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {userRole === "OMAG_HEAD"
                ? "Crop-Loss Case Verification & Photo Audit Oversight"
                : "Crop-Loss Case Verification & Photo Audit Desk"}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Consolidated crop-loss case monitoring aggregating multiple geotagged field photos,
              deterministic GPS-based photo verification, Gemini AI advisory analysis,
              and PCIC claim prioritization rankings.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {userRole === "OMAG_STAFF" && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Upload Field Photo</span>
              </button>
            )}

            <Link
              href={`${basePath}/new`}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="h-4 w-4 text-emerald-200" />
              <span>New Photo Verification Intake</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Analytics KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Active Cases</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{stats.totalCases}</p>
          <span className="text-[11px] text-slate-500">{stats.totalPhotos} field photos attached</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Accepted Cases</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-2 font-mono">{stats.acceptedCases}</p>
          <span className="text-[11px] text-emerald-700 font-medium">All photos within 500m geofence</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Requires Review</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-800 mt-2 font-mono">{stats.reviewCases}</p>
          <span className="text-[11px] text-amber-700 font-medium">Timestamp/GPS notices detected</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rejected / Not Accepted</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-800 mt-2 font-mono">{stats.rejectedCases}</p>
          <span className="text-[11px] text-rose-700 font-medium">Exceeds tolerance or missing GPS</span>
        </div>
      </div>

      {/* 3. Search and Multi-Filter Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search claim, report, farmer, crop, parcel..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Barangay Filter */}
          <select
            value={barangayFilter}
            onChange={handleBarangayChange}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
          >
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b === "ALL" ? "All Barangays" : `Brgy. ${b}`}
              </option>
            ))}
          </select>

          {/* Case Status Filter */}
          <select
            value={caseStatusFilter}
            onChange={handleCaseStatusChange}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
          >
            <option value="ALL">All Case Statuses</option>
            {CASE_STATUSES.filter((s) => s !== "ALL").map((s) => (
              <option key={s} value={s}>
                Status: {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {/* Priority Level Filter */}
          <select
            value={priorityFilter}
            onChange={handlePriorityChange}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            {PRIORITY_LEVELS.filter((p) => p !== "ALL").map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          {/* Consolidated Verification Status Filter */}
          <select
            value={verificationStatusFilter}
            onChange={handleVerificationStatusChange}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="ACCEPTED">ACCEPTED (All Photos Valid)</option>
            <option value="REVIEW">REVIEW (Photo Requires Review)</option>
            <option value="REJECTED">REJECTED (Outside Tolerance)</option>
            <option value="NOT_ACCEPTED">NOT ACCEPTED (Missing GPS)</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>

      {/* 4. Main Consolidated Crop-Loss Cases Verification Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading crop-loss case verification records...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No crop-loss cases found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No crop-loss cases match the specified search and filter criteria. You can register a case in PCIC monitoring or start a photo intake.
            </p>
            <div className="pt-2">
              <Link
                href={`${basePath}/new`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span>New Photo Verification Intake</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Claim / Report #</th>
                  <th className="py-3 px-4">Farmer & Barangay</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4 text-center">Damage %</th>
                  <th className="py-3 px-4 text-center">Photos</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Case Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Claim / Report Number */}
                    <td className="py-3.5 px-4">
                      {item.claimNumber ? (
                        <>
                          <div className="font-bold text-slate-900 font-mono text-[11px]">
                            {item.claimNumber}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.reportNumber}
                          </div>
                        </>
                      ) : item.caseStatus === "UNLINKED" || item.reportNumber?.startsWith("UNLINKED-") ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Unlinked Photo
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.reportNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          {item.reportNumber}
                        </div>
                      )}
                    </td>

                    {/* 2. Farmer & Barangay */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.farmerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Brgy. {item.barangay}</span>
                      </div>
                    </td>

                    {/* 3. Crop */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.cropType}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.variety || "Standard Variety"}
                      </div>
                    </td>

                    {/* 4. Damage % (Reported & Assessed) */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {item.reportedDamagePercent}%
                      </span>
                      {item.assessedDamagePercent !== null && (
                        <span className="block text-[10px] text-emerald-700 font-medium">
                          Assessed: {item.assessedDamagePercent}%
                        </span>
                      )}
                    </td>

                    {/* 5. Number of Submitted Photos (with thumbnail previews) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full font-mono min-w-[24px]",
                            item.photoCount > 0
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          )}
                        >
                          {item.photoCount}
                        </span>

                        {item.photos && item.photos.length > 0 && (
                          <div className="flex items-center -space-x-1.5 mt-0.5">
                            {item.photos.slice(0, 3).map((p, idx) => (
                              <div
                                key={p.id || idx}
                                className="w-6 h-6 rounded-md overflow-hidden border border-white shadow-2xs bg-slate-200"
                                title={p.originalFileName}
                              >
                                <img
                                  src={`/api/photo-verification/${p.id}/image`}
                                  alt={p.originalFileName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.src.includes("default-field-photo.jpg")) {
                                      target.src = "/assets/default-field-photo.jpg";
                                    }
                                  }}
                                />
                              </div>
                            ))}
                            {item.photos.length > 3 && (
                              <span className="w-5 h-5 rounded-md bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                                +{item.photos.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. Consolidated Verification Status */}
                    <td className="py-3.5 px-4">
                      {getVerificationBadge(item.consolidatedVerificationStatus)}
                    </td>

                    {/* 7. Case Status */}
                    <td className="py-3.5 px-4">
                      {getCaseStatusBadge(item.caseStatus)}
                    </td>

                    {/* 9. Action: View Details + Upload Photo */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details */}
                        <Link
                          href={`${basePath}/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 font-semibold text-[11px] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                          title="View case details"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span>View Details</span>
                        </Link>

                        {/* Upload Photo to Verify — routes to PhotoVerificationNewForm with farmerId */}
                        {userRole === "OMAG_STAFF" && (
                          <Link
                            href={`${basePath}/new?farmerId=${item.farmerId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                            title={`Upload a field photo to verify for ${item.farmerName}`}
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Upload Photo</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal-based Upload & Verification Intake */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          fetchRecords();
        }}
      />
    </div>
  );
};