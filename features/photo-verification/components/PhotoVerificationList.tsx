"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Camera,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Info,
} from "lucide-react";
import { PhotoVerificationListItem } from "../types";
import { PhotoUploadModal } from "./PhotoUploadModal";

interface PhotoVerificationListProps {
  initialItems: PhotoVerificationListItem[];
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

export const PhotoVerificationList: React.FC<PhotoVerificationListProps> = ({
  initialItems,
  totalCount,
  userRole,
}) => {
  const [items, setItems] = useState<PhotoVerificationListItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async (search?: string, barangay?: string, status?: string) => {
    setLoading(true);
    try {
      const q = search !== undefined ? search : searchTerm;
      const b = barangay !== undefined ? barangay : barangayFilter;
      const s = status !== undefined ? status : statusFilter;

      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (b && b !== "ALL") params.set("barangay", b);
      if (s && s !== "ALL") params.set("status", s);

      const res = await fetch(`/api/photo-verification?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to query photo verifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchRecords(val, barangayFilter, statusFilter);
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBarangayFilter(val);
    fetchRecords(searchTerm, val, statusFilter);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchRecords(searchTerm, barangayFilter, val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-900/60 border border-emerald-700 text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> ACCEPTED
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-900/60 border border-amber-700 text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> REQUIRES REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-red-900/60 border border-red-700 text-red-300">
            <XCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
      case "NOT_ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-900/60 border border-rose-700 text-rose-300">
            <XCircle className="w-3.5 h-3.5" /> NOT ACCEPTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            <Clock className="w-3.5 h-3.5" /> PENDING
          </span>
        );
    }
  };

  const getAiBadge = (assessment: string | null, conflict: boolean) => {
    if (!assessment) {
      return (
        <span className="text-[11px] text-slate-500 italic">
          Not evaluated
        </span>
      );
    }

    if (conflict) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950/80 border border-amber-700 text-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-400" /> AI CONFLICT
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-950/80 border border-purple-700 text-purple-300">
        <Sparkles className="w-3 h-3 text-purple-400" /> {assessment}
      </span>
    );
  };

  const basePath = userRole === "OMAG_HEAD" ? "/head/photo-verification" : "/staff/photo-verification";

  return (
    <div className="space-y-6">
      {/* Evidence & Methodology Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Deterministic Verification & AI Advisory Framework</span>
        </div>
        <p>
          🟢 <strong>OMAG CONFIRMED:</strong> Photo GPS and Timestamp are essential metadata elements. Missing or questionable metadata is categorized as "Not accepted".
        </p>
        <p className="text-amber-300/90">
          🟡 <strong>PROPOSED SYSTEM CRITERIA:</strong> Geolocation spatial matching is calculated mathematically via the Haversine formula against registered parcel centroid coordinates. The 500m default tolerance is a configurable system baseline (🔴 PENDING OMAG CONFIRMATION). AI assessments (Gemini 2.5 Flash) provide advisory interpretation only and cannot override deterministic results.
        </p>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search file, farmer name, RSBSA ID, parcel #..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Barangay Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={barangayFilter}
              onChange={handleBarangayChange}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b === "ALL" ? "All Barangays" : `Barangay: ${b}`}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="ACCEPTED">ACCEPTED (Within Tolerance)</option>
              <option value="REVIEW">REVIEW (Anomalies / Missing Time)</option>
              <option value="REJECTED">REJECTED (Outside Tolerance)</option>
              <option value="NOT_ACCEPTED">NOT ACCEPTED (Missing GPS)</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>
        </div>

        {/* Action Button for Staff */}
        {userRole === "OMAG_STAFF" && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Upload Photo for Audit
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Photo / File</th>
                <th className="px-4 py-3">Beneficiary</th>
                <th className="px-4 py-3">Barangay & Parcel</th>
                <th className="px-4 py-3">GPS Distance</th>
                <th className="px-4 py-3">Deterministic Status</th>
                <th className="px-4 py-3">AI Interpretation</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading verification records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No photo verification records found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {userRole === "OMAG_STAFF"
                        ? "Upload a farm photo to begin deterministic GPS and EXIF verification."
                        : "No submitted farm photos matching the selected filter criteria."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="truncate max-w-[160px]" title={item.originalFileName}>
                        {item.originalFileName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.photoTimestamp
                          ? new Date(item.photoTimestamp).toLocaleDateString()
                          : "No timestamp"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{item.farmerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.rsbsaNumber || item.farmerCode || "No ID"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300">{item.barangay}</div>
                      <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.parcelNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.calculatedDistanceMeters !== null ? (
                        <div>
                          <span
                            className={`font-mono font-bold ${
                              item.calculatedDistanceMeters <= item.thresholdMeters
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {item.calculatedDistanceMeters.toFixed(1)}m
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            (Tolerance: {item.thresholdMeters}m)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No GPS match</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.verificationStatus)}</td>
                    <td className="px-4 py-3">{getAiBadge(item.aiAssessment, item.aiConflict)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.systemReviewStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`${basePath}/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                      >
                        Inspect Dossier <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal for Staff */}
      {userRole === "OMAG_STAFF" && (
        <PhotoUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(newId) => {
            fetchRecords();
            window.location.href = `${basePath}/${newId}`;
          }}
        />
      )}
    </div>
  );
};
