"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Plus,
  Send,
  Package,
  Layers,
  History,
  Info,
  RefreshCw,
} from "lucide-react";
import { InventoryItemList } from "./InventoryItemList";
import { BatchList } from "./BatchList";
import { DistributionList } from "./DistributionList";
import { FifoAllocationPreview } from "./FifoAllocationPreview";
import { CreateItemModal } from "./CreateItemModal";
import { EditItemModal } from "./EditItemModal";
import { CreateBatchModal } from "./CreateBatchModal";
import { EditBatchModal } from "./EditBatchModal";
import { DistributeStockModal } from "./DistributeStockModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { InventoryItemDTO, InventoryBatchDTO, DistributionRecordDTO } from "../types";

function StaffInventoryContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "batches" | "distribute" | "distributions">(
    "catalog"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tab with URL query param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "batches" || tab === "distributions") {
      setActiveTab(tab);
    } else if (tab === "distribute" || tab === "simulator") {
      setActiveTab("distribute");
    } else if (tab === "catalog") {
      setActiveTab("catalog");
    }
  }, [searchParams]);

  // Data states
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [batches, setBatches] = useState<InventoryBatchDTO[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecordDTO[]>([]);

  // Loading states
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingDistributions, setLoadingDistributions] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [itemSearch, setItemSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [distSearch, setDistSearch] = useState("");

  // Modal triggers
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDTO | null>(null);
  const [itemToArchive, setItemToArchive] = useState<InventoryItemDTO | null>(null);
  const [archivingItemLoading, setArchivingItemLoading] = useState(false);

  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatchDTO | null>(null);
  const [batchToArchive, setBatchToArchive] = useState<InventoryBatchDTO | null>(null);
  const [archivingBatchLoading, setArchivingBatchLoading] = useState(false);

  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [targetItemId, setTargetItemId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadItems();
  }, [categoryFilter, itemSearch]);

  useEffect(() => {
    if (activeTab === "batches") {
      loadBatches();
    } else if (activeTab === "distributions") {
      loadDistributions();
    }
  }, [activeTab, statusFilter, batchSearch, distSearch]);

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
  };

  const handleOpenReceiveBatch = (itemId?: number) => {
    setTargetItemId(itemId);
    setIsCreateBatchOpen(true);
  };

  const handleOpenDistribute = (itemId?: number) => {
    setTargetItemId(itemId);
    setIsDistributeOpen(true);
  };

  const handleConfirmArchiveItem = async () => {
    if (!itemToArchive) return;
    setArchivingItemLoading(true);
    try {
      const res = await fetch(`/api/inventory/${itemToArchive.id}`, { method: "DELETE" });
      if (res.ok) {
        setItemToArchive(null);
        handleRefreshAll();
      }
    } catch (err) {
      console.error("Failed to archive item:", err);
    } finally {
      setArchivingItemLoading(false);
    }
  };

  const handleConfirmArchiveBatch = async () => {
    if (!batchToArchive) return;
    setArchivingBatchLoading(true);
    try {
      const res = await fetch(`/api/inventory/batches/${batchToArchive.id}`, { method: "DELETE" });
      if (res.ok) {
        setBatchToArchive(null);
        handleRefreshAll();
      }
    } catch (err) {
      console.error("Failed to archive batch:", err);
    } finally {
      setArchivingBatchLoading(false);
    }
  };

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
      {/* Proposed System Design Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-950 uppercase tracking-wide mr-1">
            🟡 Proposed System Design Notice:
          </span>
          FIFO stock prioritization, reorder levels, batch status transitions, and expiration/viability warning thresholds are proposed by this system. Exact municipal threshold policies are 🔴 <strong className="text-blue-950">Pending OMAG Confirmation</strong>. All stock allocations are executed deterministically and logged in the immutable system audit trail.
        </div>
      </div>

      {/* Action Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        {/* Tabs */}
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
            Manage Inventory Items
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
            Manage Inventory Batches
          </button>
          <button
            onClick={() => setActiveTab("distribute")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "distribute"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-amber-600" />
            FIFO Distribution
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
            Distribution Records
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefreshAll}
            title="Refresh Data"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateItemOpen(true)}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            Add Item
          </button>
          <button
            onClick={() => handleOpenReceiveBatch()}
            className="px-3 py-1.5 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Receive Batch
          </button>
          <button
            onClick={() => handleOpenDistribute()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Distribute (FIFO)
          </button>
        </div>
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
          onOpenReceiveBatch={handleOpenReceiveBatch}
          onOpenDistribute={handleOpenDistribute}
          onEditItem={(item) => setEditingItem(item)}
          onArchiveItem={(item) => setItemToArchive(item)}
          userRole="OMAG_STAFF"
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
          onEditBatch={(batch) => setEditingBatch(batch)}
          onArchiveBatch={(batch) => setBatchToArchive(batch)}
          userRole="OMAG_STAFF"
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

      {activeTab === "distribute" && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">Live FIFO Stock Distribution</h3>
            <p className="text-xs text-slate-500">
              Distribute seeds and fertilizer directly to RSBSA beneficiaries using automatic FIFO batch deduction.
            </p>
          </div>
          <button
            onClick={() => handleOpenDistribute()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Launch Distribution Modal
          </button>
        </div>
      )}

      {/* Modal Dialogs */}
      <CreateItemModal
        isOpen={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={handleRefreshAll}
        item={editingItem}
      />

      <CreateBatchModal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
        onSuccess={handleRefreshAll}
        defaultItemId={targetItemId}
      />

      <EditBatchModal
        isOpen={!!editingBatch}
        onClose={() => setEditingBatch(null)}
        onSuccess={handleRefreshAll}
        batch={editingBatch}
      />

      <DistributeStockModal
        isOpen={isDistributeOpen}
        onClose={() => setIsDistributeOpen(false)}
        onSuccess={handleRefreshAll}
        defaultItemId={targetItemId}
      />

      {/* Archive Item Confirmation */}
      <ConfirmModal
        isOpen={!!itemToArchive}
        onClose={() => setItemToArchive(null)}
        onConfirm={handleConfirmArchiveItem}
        title="Archive Inventory Catalog Item"
        itemName={itemToArchive ? `${itemToArchive.itemCode} - ${itemToArchive.name}` : undefined}
        message="Are you sure you want to soft-archive this catalog item? The item will be deactivated from active intake and distributions, and all historical batch records will be preserved."
        confirmText="Archive Item"
        variant="danger"
        isLoading={archivingItemLoading}
      />

      {/* Archive Batch Confirmation */}
      <ConfirmModal
        isOpen={!!batchToArchive}
        onClose={() => setBatchToArchive(null)}
        onConfirm={handleConfirmArchiveBatch}
        title="Archive Inventory Batch"
        itemName={batchToArchive ? `Batch #${batchToArchive.batchNumber} (${batchToArchive.item?.name})` : undefined}
        message="Are you sure you want to soft-archive this stock batch? The batch will be excluded from future FIFO distributions while preserving all historical distribution records."
        confirmText="Archive Batch"
        variant="danger"
        isLoading={archivingBatchLoading}
      />
    </div>
  );
}

export const StaffInventoryView: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading inventory view...</div>}>
      <StaffInventoryContent />
    </Suspense>
  );
};
