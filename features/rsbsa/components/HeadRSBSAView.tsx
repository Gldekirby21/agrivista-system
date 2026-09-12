"use client";

import React, { useState } from "react";
import { Users, MapPin, Layers, Sprout, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { FarmerList } from "./FarmerList";
import { FarmerListItem, RSBSASummaryStats } from "../types";

export interface HeadRSBSAViewProps {
  initialFarmers: FarmerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summaryStats: RSBSASummaryStats;
}

export const HeadRSBSAView: React.FC<HeadRSBSAViewProps> = ({
  initialFarmers,
  pagination: initialPagination,
  summaryStats,
}) => {
  const [farmers, setFarmers] = useState(initialFarmers);
  const [pagination, setPagination] = useState(initialPagination);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleFilterChange = async (search: string, barangay: string, page: number) => {
    setIsFiltering(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (barangay && barangay !== "ALL") params.set("barangay", barangay);
      params.set("page", page.toString());
      params.set("limit", pagination.limit.toString());

      const res = await fetch(`/api/rsbsa/farmers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFarmers(data.items);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Filter fetch error:", e);
    } finally {
      setIsFiltering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Oversight Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">OMAG HEAD VIEW</Badge>
              <Badge variant="success">PHASE 3 — OBJECTIVE 1 — ACTIVE</Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              RSBSA Centralized Registry &amp; Landholdings Oversight
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Municipal census of registered agricultural producers, cadastral parcels, and monitored crops across the 23 barangays of Polomolok.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-white/80 border border-emerald-300/60 px-3.5 py-1.5 rounded-xl shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span className="text-xs font-bold text-emerald-900">Executive Census Stream</span>
          </div>
        </div>
      </div>

      {/* Oversight KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <CardHeader className="mb-1 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-600">Total Enrolled Farmers</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-extrabold text-slate-900">{summaryStats.totalFarmers}</span>
            <p className="text-[11px] text-slate-500 mt-1">Verified RSBSA profiles in database</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardHeader className="mb-1 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-600">Georeferenced Parcels</CardTitle>
            <MapPin className="h-4 w-4 text-sky-600" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-extrabold text-slate-900">{summaryStats.totalParcels}</span>
            <p className="text-[11px] text-slate-500 mt-1">Cadastral plot centroids recorded</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardHeader className="mb-1 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-600">Registered Agricultural Area</CardTitle>
            <Layers className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-extrabold text-slate-900">{summaryStats.totalHectares} ha</span>
            <p className="text-[11px] text-slate-500 mt-1">Total landholdings documented</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardHeader className="mb-1 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-600">Monitored Crop Cycles</CardTitle>
            <Sprout className="h-4 w-4 text-teal-600" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-extrabold text-slate-900">{summaryStats.totalCropsRecorded}</span>
            <p className="text-[11px] text-slate-500 mt-1">Logged standing &amp; harvested cycles</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Table */}
      <FarmerList
        initialFarmers={farmers}
        pagination={pagination}
        isStaff={false}
        baseHref="/head/rsbsa"
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};
