"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Package,
  Layers,
  History,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { InventoryItemList } from "./InventoryItemList";
import { BatchList } from "./BatchList";
import { DistributionList } from "./DistributionList";
import { FifoAllocationPreview } from "./FifoAllocationPreview";
import { InventoryItemDTO, InventoryBatchDTO, DistributionRecordDTO, DistributionRequestDTO } from "../types";
import { DistributionRequestList } from "./DistributionRequestList";
import { Send } from "lucide-react";

function HeadInventoryContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "batches" | "distributions" | "simulator" | "requests">(
    "catalog"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "batches" || tab === "distributions" || tab === "simulator" || tab === "catalog" || tab === "requests") {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Data states
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [batches, setBatches] = useState<InventoryBatchDTO[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecordDTO[]>([]);
  const [requests, setRequests] = useState<DistributionRequestDTO[]>([]);

  // Loading states
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingDistributions, setLoadingDistributions] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [itemSearch, setItemSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [distSearch, setDistSearch] = useState("");

  useEffect(() => {
    loadItems();
  }, [categoryFilter, itemSearch]);

  // Load requests on mount so the PENDING badge shows accurate count immediately
  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (activeTab === "batches") {
      loadBatches();
    } else if (activeTab === "distributions") {
      loadDistributions();
    } else if (activeTab === "requests") {
      loadRequests();
    }
  }, [activeTab, statusFilter, batchSearch, distSearch]);

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const url = new URL("/api/inventory/requests", window.location.origin);
      url.searchParams.set("limit", "100");
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load distribution requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const url = new URL("/api/inventory", window.location.origin);
      if (categoryFilter !== "ALL") url.searchParams.set("category", categoryFilter);
      if (itemSearch) url.searchParams.set("search", itemSearch);
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load inventory items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const url = new URL("/api/inventory/batches", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (batchSearch) url.searchParams.set("search", batchSearch);
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadDistributions = async () => {
    setLoadingDistributions(true);
    try {
      const url = new URL("/api/inventory/distributions", window.location.origin);
      if (distSearch) url.searchParams.set("search", distSearch);
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setDistributions(data.distributions || []);
      }
    } catch (err) {
      console.error("Failed to load distributions:", err);
    } finally {
      setLoadingDistributions(false);
    }
  };

  const handleRefreshAll = () => {
    loadItems();
    if (activeTab === "batches") loadBatches();
    if (activeTab === "distributions") loadDistributions();
    if (activeTab === "requests") loadRequests();
  };

  // KPI Metrics Calculation
  const totalItemsCount = items.length;
  const fertilizerCount = items.filter((i) => i.category === "FERTILIZER").length;
  const seedsCount = items.filter((i) => i.category === "SEEDS").length;
  const lowStockCount = items.filter((i) => i.isLowStock).length;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200/70 rounded-xl w-80 animate-pulse" />
        <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Oversight Notice */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 uppercase tracking-wide mr-1">
            Executive Oversight View:
          </span>
          Real-time municipal inventory oversight, batch longevity monitoring, and distribution audit trails. FIFO stock allocation is governed deterministically. Reorder and expiration warnings are 🟡 <strong className="text-slate-900">Proposed System Design</strong> criteria pending official OMAG administrative confirmation.
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Catalog Items
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalItemsCount}</span>
            <span className="text-[11px] text-slate-500">
              ({fertilizerCount} Fert, {seedsCount} Seeds)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Lots & Batches
            </span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {items.reduce((sum, i) => sum + i.activeBatchesCount, 0)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">In Warehouses</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? "text-amber-500" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {lowStockCount}
            </span>
            <span className="text-[11px] text-slate-500">Below Reorder Level</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recorded Releases
            </span>
            <History className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {items.reduce((sum, i) => sum + (i.totalDistributed > 0 ? 1 : 0), 0)}
            </span>
            <span className="text-[11px] text-slate-500">Items Distributed</span>
          </div>
        </div>
      </div>

      {/* Tabs & Refresh Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "catalog"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            Stock Balances
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "batches"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Batch Watchlist
          </button>
          <button
            onClick={() => setActiveTab("distributions")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "distributions"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            Distribution Audit Log
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "requests"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-purple-600" />
            <span>Distribution Requests</span>
            {requests.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                {requests.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "simulator"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-amber-600" />
            FIFO Queue Simulator
          </button>
        </div>

        <button
          onClick={handleRefreshAll}
          title="Refresh Data"
          className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "catalog" && (
        <InventoryItemList
          items={items}
          loading={loadingItems}
          categoryFilter={categoryFilter}
          searchTerm={itemSearch}
          onCategoryChange={setCategoryFilter}
          onSearchChange={setItemSearch}
          onOpenReceiveBatch={() => {}}
          onOpenDistribute={() => {}}
          userRole="OMAG_HEAD"
        />
      )}

      {activeTab === "batches" && (
        <BatchList
          batches={batches}
          loading={loadingBatches}
          statusFilter={statusFilter}
          searchTerm={batchSearch}
          onStatusChange={setStatusFilter}
          onSearchChange={setBatchSearch}
          userRole="OMAG_HEAD"
        />
      )}

      {activeTab === "distributions" && (
        <DistributionList
          distributions={distributions}
          loading={loadingDistributions}
          searchTerm={distSearch}
          onSearchChange={setDistSearch}
        />
      )}

      {activeTab === "requests" && (
        <DistributionRequestList
          requests={requests}
          loading={loadingRequests}
          onRefresh={loadRequests}
          userRole="OMAG_HEAD"
        />
      )}

      {activeTab === "simulator" && <FifoAllocationPreview />}
    </div>
  );
}

export const HeadInventoryView: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading oversight inventory view...</div>}>
      <HeadInventoryContent />
    </Suspense>
  );
};
