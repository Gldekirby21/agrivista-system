"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Plus, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { FarmerList } from "./FarmerList";
import { FarmerListItem } from "../types";

export interface StaffRSBSAViewProps {
  initialFarmers: FarmerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const StaffRSBSAView: React.FC<StaffRSBSAViewProps> = ({
  initialFarmers,
  pagination: initialPagination,
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
      {/* Operational Header Banner */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-blue-50 to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">OMAG STAFF VIEW</Badge>
              <Badge variant="success">PHASE 3 — OBJECTIVE 1 — ACTIVE</Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              RSBSA Farmer Intake &amp; Landholding Records
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Operational intake desk for registering agricultural producers, cadastral parcels, and recording updated crop plantings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/staff/rsbsa/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Register New Farmer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational List Table */}
      <FarmerList
        initialFarmers={farmers}
        pagination={pagination}
        isStaff={true}
        baseHref="/staff/rsbsa"
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};
