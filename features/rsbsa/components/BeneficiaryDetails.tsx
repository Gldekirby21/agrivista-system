"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sprout,
  FileText,
  Edit,
  Plus,
  ArrowLeft,
  Archive,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/common/Modal";
import { BeneficiaryForm } from "./BeneficiaryForm";

export interface BeneficiaryDetailsProps {
  beneficiary: any;
  isStaff?: boolean;
  baseBackHref?: string;
}

const POLOMOLOK_BARANGAYS = [
  "Bentung", "Cannery Site", "Crossing Pangi", "Glamang", "Kinilis", "Klinan 6",
  "Koronadal Proper", "Lam-caliaf", "Lapu", "Lumakil", "Maligo", "Magsaysay",
  "Pagalungan", "Poblacion", "Polo", "Rubber", "Silway 7", "Silway 8",
  "Sulit", "Sumbakil", "Upper Klinan",
];

const TENURE_TYPES = ["Owned", "Tenant", "Leased", "Mortgaged", "Beneficiary (DAR)", "Usufructuary"];

const COMMON_CROP_TYPES = [
  "Rice (Palay)", "Corn (Yellow)", "Corn (White)", "Pineapple", "Banana (Cavendish)",
  "Cassava", "Vegetables (Highland)", "Vegetables (Lowland)", "Coffee", "Cacao", "Rubber", "Coconut",
];

const SUPPORTING_DOCUMENT_TYPES = [
  "Land Title (OCT/TCT)", "Tax Declaration", "Certificate of Land Ownership Award (CLOA)",
  "Deed of Sale", "Lease Contract / Usufruct Agreement", "Barangay Certification",
  "Government-Issued Valid ID", "RSBSA Registration Form",
];

export const BeneficiaryDetails: React.FC<BeneficiaryDetailsProps> = ({
  beneficiary: initialBeneficiary,
  isStaff = false,
  baseBackHref = "/staff/beneficiaries",
}) => {
  const router = useRouter();
  const [beneficiary, setBeneficiary] = useState<any>(initialBeneficiary);
  const [activeTab, setActiveTab] = useState<"farms" | "crops" | "documents">("farms");

  // Modals & form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isArchivingBeneficiary, setIsArchivingBeneficiary] = useState(false);
  const [isAddingFarm, setIsAddingFarm] = useState(false);
  const [addingParcelFarmId, setAddingParcelFarmId] = useState<number | null>(null);
  const [recordingCropParcel, setRecordingCropParcel] = useState<{
    parcelId: number;
    parcelNumber: string;
    areaHa: number;
  } | null>(null);
  const [isAttachingDocument, setIsAttachingDocument] = useState(false);

  // Form error/success states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [archiveItemTarget, setArchiveItemTarget] = useState<{
    type: "farm" | "parcel" | "crop" | "document";
    id: number;
    label: string;
  } | null>(null);

  // Form inputs
  const [farmForm, setFarmForm] = useState({
    farmName: "",
    barangay: initialBeneficiary?.barangay || "Poblacion",
    municipality: "Polomolok",
    province: "South Cotabato",
    sitioPurok: "",
    totalAreaHa: "1.0",
    tenureType: "Owned",
    soilType: "Clay Loam",
    waterSource: "Rainfed",
  });

  const [parcelForm, setParcelForm] = useState({
    parcelNumber: "LOT-01",
    areaHa: "1.0",
    latitude: "6.2189",
    longitude: "125.0645",
    status: "Active",
    remarks: "",
  });

  const [cropForm, setCropForm] = useState({
    cropType: "Corn (Yellow)",
    variety: "Hybrid",
    category: "Grain",
    plantedAreaHa: "1.0",
    plantingDate: new Date().toISOString().split("T")[0],
    expectedHarvestDate: "",
    season: "Wet",
    year: new Date().getFullYear().toString(),
    status: "Standing",
    remarks: "",
  });

  const [documentForm, setDocumentForm] = useState({
    documentType: "Land Title (OCT/TCT)",
    fileName: "",
    fileUrl: "",
    fileSizeBytes: 102400,
    mimeType: "application/pdf",
    farmId: "",
    remarks: "",
  });

  // Calculate totals
  let totalHectares = 0;
  let totalParcels = 0;
  const activeCropsSet = new Set<string>();

  const activeFarms = (beneficiary.farms || []).filter((f: any) => f.status !== "Archived");

  for (const farm of activeFarms) {
    totalHectares += farm.totalAreaHa || 0;
    const farmActiveParcels = (farm.parcels || []).filter((p: any) => p.status !== "Archived");
    totalParcels += farmActiveParcels.length;
    for (const p of farmActiveParcels) {
      for (const c of p.crops || []) {
        if (c.status !== "Archived" && c.cropType) {
          activeCropsSet.add(c.cropType);
        }
      }
    }
  }

  const activeDocuments = (beneficiary.documents || []).filter(
    (d: any) => d.verificationStatus !== "Archived"
  );

  const refreshData = async () => {
    try {
      const res = await fetch(`/api/beneficiaries/${beneficiary.id}`);
      if (res.ok) {
        const data = await res.json();
        setBeneficiary(data);
      }
    } catch (e) {
      console.error("Failed to refresh beneficiary record", e);
    }
  };

  // Handlers
  const handleArchiveBeneficiary = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/beneficiaries/${beneficiary.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive beneficiary");
      }
      setActionSuccess("Beneficiary record archived successfully.");
      setIsArchivingBeneficiary(false);
      router.push(baseBackHref);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to archive record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...farmForm,
          farmerId: beneficiary.id,
          totalAreaHa: parseFloat(farmForm.totalAreaHa),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add farm");
      setActionSuccess("Farm landholding added successfully.");
      setIsAddingFarm(false);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to add farm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingParcelFarmId) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/farm-parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parcelForm,
          farmId: addingParcelFarmId,
          areaHa: parseFloat(parcelForm.areaHa),
          latitude: parcelForm.latitude ? parseFloat(parcelForm.latitude) : undefined,
          longitude: parcelForm.longitude ? parseFloat(parcelForm.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add parcel");
      setActionSuccess("Farm parcel added successfully.");
      setAddingParcelFarmId(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to add parcel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingCropParcel) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cropForm,
          parcelId: recordingCropParcel.parcelId,
          plantedAreaHa: parseFloat(cropForm.plantedAreaHa),
          year: parseInt(cropForm.year, 10),
          expectedHarvestDate: cropForm.expectedHarvestDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record crop");
      setActionSuccess("Crop planting recorded successfully.");
      setRecordingCropParcel(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to record crop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/land-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...documentForm,
          farmerId: beneficiary.id,
          farmId: documentForm.farmId ? parseInt(documentForm.farmId, 10) : undefined,
          fileUrl: documentForm.fileUrl.trim() || `https://storage.local/rsbsa/${beneficiary.id}/${Date.now()}-${documentForm.fileName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to attach document");
      setActionSuccess("Supporting land document attached successfully.");
      setIsAttachingDocument(false);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to attach document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveFarm = (farmId: number) => {
    setArchiveItemTarget({ type: "farm", id: farmId, label: "Farm Landholding" });
  };

  const handleArchiveParcel = (parcelId: number) => {
    setArchiveItemTarget({ type: "parcel", id: parcelId, label: "Farm Parcel" });
  };

  const handleArchiveCrop = (cropId: number) => {
    setArchiveItemTarget({ type: "crop", id: cropId, label: "Crop Record" });
  };

  const handleArchiveDocument = (docId: number) => {
    setArchiveItemTarget({ type: "document", id: docId, label: "Supporting Document" });
  };

  const handleConfirmArchiveItem = async () => {
    if (!archiveItemTarget) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const endpoint =
        archiveItemTarget.type === "farm"
          ? `/api/farms/${archiveItemTarget.id}`
          : archiveItemTarget.type === "parcel"
          ? `/api/farm-parcels/${archiveItemTarget.id}`
          : archiveItemTarget.type === "crop"
          ? `/api/crops/${archiveItemTarget.id}`
          : `/api/land-documents/${archiveItemTarget.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to archive ${archiveItemTarget.label}`);
      }

      setActionSuccess(`${archiveItemTarget.label} archived successfully.`);
      setArchiveItemTarget(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "An error occurred while archiving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={baseBackHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Beneficiary Directory</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {isStaff ? (
            <Badge variant="info">OMAG Staff — Edit &amp; Mutation Authorized</Badge>
          ) : (
            <Badge variant="neutral">OMAG Head — Oversight &amp; Review Mode</Badge>
          )}
          <Badge variant="neutral">Centralized Beneficiary Record</Badge>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Beneficiary Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xl shrink-0 border border-slate-200">
              {beneficiary.firstName?.[0] || "B"}
              {beneficiary.lastName?.[0] || ""}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {beneficiary.lastName}, {beneficiary.firstName} {beneficiary.middleName || ""}{" "}
                  {beneficiary.extensionName || ""}
                </h1>
                <Badge
                  variant={
                    beneficiary.status === "Active"
                      ? "success"
                      : beneficiary.status === "Archived"
                      ? "danger"
                      : "neutral"
                  }
                  size="sm"
                >
                  {beneficiary.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-medium text-slate-700">
                  {beneficiary.farmerCode || "Agricultural Beneficiary"}
                </span>
                {beneficiary.sex && beneficiary.sex !== "Unspecified" && (
                  <span>• Sex: {beneficiary.sex}</span>
                )}
                {beneficiary.civilStatus && <span>• {beneficiary.civilStatus}</span>}
              </div>

              {/* Vulnerability Sector Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                {beneficiary.isSenior && <Badge variant="neutral" size="sm">Senior Citizen</Badge>}
                {beneficiary.isPwd && <Badge variant="neutral" size="sm">PWD</Badge>}
                {beneficiary.is4ps && <Badge variant="neutral" size="sm">4Ps</Badge>}
                {beneficiary.isIp && <Badge variant="neutral" size="sm">IP</Badge>}
                {!beneficiary.isSenior && !beneficiary.isPwd && !beneficiary.is4ps && !beneficiary.isIp && (
                  <span className="text-slate-400 text-xs">General Sector</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Brgy. {beneficiary.barangay}, {beneficiary.municipality}, {beneficiary.province}
                  </span>
                </div>
                {beneficiary.contactNumber && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{beneficiary.contactNumber}</span>
                  </div>
                )}
                {beneficiary.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{beneficiary.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Identification Box & Actions */}
          <div className="flex flex-col items-start lg:items-end gap-2.5 shrink-0">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-left lg:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                RSBSA Identifier
              </p>
              <p className="font-mono text-xs font-bold text-slate-900">
                {beneficiary.rsbsaNumber || "Not Issued"}
              </p>
            </div>

            {isStaff && beneficiary.status !== "Archived" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit Profile
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsArchivingBeneficiary(true)}
                >
                  <Archive className="h-3.5 w-3.5 mr-1" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Aggregate Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Landholdings</span>
            <p className="text-base font-bold text-slate-900">{activeFarms.length} Farm{activeFarms.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Farm Parcels</span>
            <p className="text-base font-bold text-slate-900">{totalParcels} Geotagged Plot{totalParcels !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Farm Area</span>
            <p className="text-base font-bold text-slate-900">{totalHectares.toFixed(2)} ha</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Active Standing Crops</span>
            <p className="text-base font-bold text-slate-900">
              {activeCropsSet.size > 0 ? Array.from(activeCropsSet).join(", ") : "None Recorded"}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Archiving Beneficiary */}
      {isArchivingBeneficiary && (
        <div className="p-5 border-2 border-red-300 bg-red-50/50 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Archive Beneficiary Record</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Are you sure you want to archive <strong>{beneficiary.firstName} {beneficiary.lastName}</strong>?
            In accordance with OMAG policy, this performs non-destructive soft-archival and records an event in the AuditLog.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              onClick={handleArchiveBeneficiary}
            >
              {isSubmitting ? "Archiving..." : "Confirm Archival"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsArchivingBeneficiary(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Modal / Card for Editing Profile */}
      {isEditingProfile && (
        <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Edit RSBSA Beneficiary Profile</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>
              Close
            </Button>
          </div>
          <BeneficiaryForm
            initialData={beneficiary}
            isEdit
          />
        </div>
      )}

      {/* Modal / Card for Adding Farm */}
      {isAddingFarm && (
        <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Register New Farm Landholding</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingFarm(false)}>
              Close
            </Button>
          </div>
          <form onSubmit={handleAddFarm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Farm Name / Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={farmForm.farmName}
                  onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                  placeholder="e.g. Farm Parcel A - Upper Klinan"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Barangay Location <span className="text-emerald-700 font-bold">* 🟢 OMAG CONFIRMED</span>
                </label>
                <select
                  value={farmForm.barangay}
                  onChange={(e) => setFarmForm({ ...farmForm, barangay: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {POLOMOLOK_BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Farm Area (Hectares) <span className="text-emerald-700 font-bold">* 🟢 OMAG CONFIRMED</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={farmForm.totalAreaHa}
                  onChange={(e) => setFarmForm({ ...farmForm, totalAreaHa: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Land Ownership / Tenure <span className="text-emerald-700 font-bold">* 🟢 OMAG CONFIRMED</span>
                </label>
                <select
                  value={farmForm.tenureType}
                  onChange={(e) => setFarmForm({ ...farmForm, tenureType: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {TENURE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sitio / Purok <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={farmForm.sitioPurok}
                  onChange={(e) => setFarmForm({ ...farmForm, sitioPurok: e.target.value })}
                  placeholder="e.g. Purok 4"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Water Source <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={farmForm.waterSource}
                  onChange={(e) => setFarmForm({ ...farmForm, waterSource: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Save Farm Landholding"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingFarm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Card for Adding Parcel */}
      {addingParcelFarmId !== null && (
        <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add Georeferenced Parcel Plot</h3>
            <Button variant="ghost" size="sm" onClick={() => setAddingParcelFarmId(null)}>
              Close
            </Button>
          </div>
          <form onSubmit={handleAddParcel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parcel Identifier / Lot No. <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={parcelForm.parcelNumber}
                  onChange={(e) => setParcelForm({ ...parcelForm, parcelNumber: e.target.value })}
                  placeholder="e.g. LOT-01 or CAD-1234"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parcel Area (Hectares) <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={parcelForm.areaHa}
                  onChange={(e) => setParcelForm({ ...parcelForm, areaHa: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Centroid Latitude (°N) <span className="text-slate-400 font-normal">(Centroid coordinate)</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={parcelForm.latitude}
                  onChange={(e) => setParcelForm({ ...parcelForm, latitude: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Centroid Longitude (°E) <span className="text-slate-400 font-normal">(Centroid coordinate)</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={parcelForm.longitude}
                  onChange={(e) => setParcelForm({ ...parcelForm, longitude: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Save Parcel Plot"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setAddingParcelFarmId(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Card for Recording Crop */}
      {recordingCropParcel !== null && (
        <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Standing Crop Cycle</h3>
              <p className="text-[11px] text-slate-500">
                Parcel: <strong className="font-mono">{recordingCropParcel.parcelNumber}</strong> (Plot Area: {recordingCropParcel.areaHa} ha)
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRecordingCropParcel(null)}>
              Close
            </Button>
          </div>
          <form onSubmit={handleRecordCrop} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crop Commodity Type <span className="text-emerald-700 font-bold">* 🟢 OMAG CONFIRMED</span>
                </label>
                <select
                  value={cropForm.cropType}
                  onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                >
                  {COMMON_CROP_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Variety / Seed Type <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={cropForm.variety}
                  onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                  placeholder="e.g. Hybrid NK8840 or Inbred NSIC Rc222"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Planted Area (Hectares) <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={cropForm.plantedAreaHa}
                  onChange={(e) => setCropForm({ ...cropForm, plantedAreaHa: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Planting Date <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={cropForm.plantingDate}
                  onChange={(e) => setCropForm({ ...cropForm, plantingDate: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Season &amp; Year
                </label>
                <div className="flex gap-2">
                  <select
                    value={cropForm.season}
                    onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                    className="w-1/2 text-xs px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="Wet">Wet Season</option>
                    <option value="Dry">Dry Season</option>
                  </select>
                  <input
                    type="number"
                    value={cropForm.year}
                    onChange={(e) => setCropForm({ ...cropForm, year: e.target.value })}
                    className="w-1/2 text-xs px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crop Status
                </label>
                <select
                  value={cropForm.status}
                  onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="Standing">Standing (Current)</option>
                  <option value="Harvested">Harvested</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Crop Planting"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setRecordingCropParcel(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Card for Attaching Document */}
      {isAttachingDocument && (
        <div className="rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Attach Supporting Land Document</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAttachingDocument(false)}>
              Close
            </Button>
          </div>
          <form onSubmit={handleAttachDocument} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type <span className="text-emerald-700 font-bold">* 🟢 OMAG CONFIRMED</span>
                </label>
                <select
                  value={documentForm.documentType}
                  onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                >
                  {SUPPORTING_DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Reference / Document Name <span className="text-emerald-700 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={documentForm.fileName}
                  onChange={(e) => setDocumentForm({ ...documentForm, fileName: e.target.value })}
                  placeholder="e.g. OCT-12345-LandTitle.pdf"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related Farm Landholding <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={documentForm.farmId}
                  onChange={(e) => setDocumentForm({ ...documentForm, farmId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="">Beneficiary Overall</option>
                  {activeFarms.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.farmName || `Farm #${f.id}`} (Brgy. {f.barangay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={documentForm.remarks}
                  onChange={(e) => setDocumentForm({ ...documentForm, remarks: e.target.value })}
                  placeholder="e.g. Verified with DAR Registry"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Attaching..." : "Attach Document Record"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAttachingDocument(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("farms")}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "farms"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Farms &amp; Georeferenced Parcels ({activeFarms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("crops")}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "crops"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout className="h-4 w-4" />
          <span>Current &amp; Recorded Crops ({activeCropsSet.size})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "documents"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Supporting Land Documents ({activeDocuments.length})</span>
        </button>
      </div>

      {/* TAB 1: FARMS & PARCELS */}
      {activeTab === "farms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Registered Farm Landholdings &amp; Parcel Plots
            </h3>
            {isStaff && (
              <Button variant="outline" size="sm" onClick={() => setIsAddingFarm(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Farm Landholding
              </Button>
            )}
          </div>

          {activeFarms.length > 0 ? (
            <div className="space-y-4">
              {activeFarms.map((farm: any) => {
                const farmParcels = (farm.parcels || []).filter((p: any) => p.status !== "Archived");
                return (
                  <div
                    key={farm.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                  >
                    {/* Farm Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {farm.farmName || `Farm #${farm.id}`}
                          </h4>
                          <Badge variant="neutral" size="sm">
                            {farm.tenureType}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-emerald-600" />
                            Brgy. {farm.barangay}, Polomolok
                          </span>
                          <span>•</span>
                          <span>Total Area: <strong className="text-slate-700">{farm.totalAreaHa} ha</strong></span>
                          {farm.waterSource && (
                            <>
                              <span>•</span>
                              <span>Source: {farm.waterSource}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isStaff && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setParcelForm({
                                  parcelNumber: `LOT-${farmParcels.length + 1}`,
                                  areaHa: "1.0",
                                  latitude: "6.2189",
                                  longitude: "125.0645",
                                  status: "Active",
                                  remarks: "",
                                });
                                setAddingParcelFarmId(farm.id);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Parcel
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleArchiveFarm(farm.id)}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Parcels Table */}
                    {farmParcels.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-100">
                            <tr>
                              <th scope="col" className="px-3 py-2">Lot / Parcel ID</th>
                              <th scope="col" className="px-3 py-2">Plot Area</th>
                              <th scope="col" className="px-3 py-2">Centroid Coordinate</th>
                              <th scope="col" className="px-3 py-2">Standing Crop</th>
                              {isStaff && <th scope="col" className="px-3 py-2 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {farmParcels.map((parcel: any) => {
                              const activeCrops = (parcel.crops || []).filter(
                                (c: any) => c.status !== "Archived"
                              );
                              const latestCrop = activeCrops[0];

                              return (
                                <tr key={parcel.id} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                                    {parcel.parcelNumber}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-800 font-semibold">
                                    {parcel.areaHa} ha
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                                    {parcel.latitude && parcel.longitude ? (
                                      <span>
                                        {Number(parcel.latitude).toFixed(4)}°N, {Number(parcel.longitude).toFixed(4)}°E
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">No coordinates</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {latestCrop ? (
                                      <div className="flex items-center gap-1.5">
                                        <Badge
                                          variant={latestCrop.status === "Standing" ? "success" : "neutral"}
                                          size="sm"
                                        >
                                          {latestCrop.cropType} ({latestCrop.plantedAreaHa} ha)
                                        </Badge>
                                        {latestCrop.variety && (
                                          <span className="text-[10px] text-slate-400">
                                            {latestCrop.variety}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">No active crop</span>
                                    )}
                                  </td>
                                  {isStaff && (
                                    <td className="px-3 py-2.5 text-right">
                                      <div className="inline-flex items-center gap-1">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="h-6 text-[11px] px-2"
                                          onClick={() => {
                                            setCropForm({
                                              cropType: "Corn (Yellow)",
                                              variety: "Hybrid",
                                              category: "Grain",
                                              plantedAreaHa: parcel.areaHa.toString(),
                                              plantingDate: new Date().toISOString().split("T")[0],
                                              expectedHarvestDate: "",
                                              season: "Wet",
                                              year: new Date().getFullYear().toString(),
                                              status: "Standing",
                                              remarks: "",
                                            });
                                            setRecordingCropParcel({
                                              parcelId: parcel.id,
                                              parcelNumber: parcel.parcelNumber,
                                              areaHa: parcel.areaHa,
                                            });
                                          }}
                                        >
                                          <Sprout className="h-3 w-3 mr-1 text-emerald-600" />
                                          Record Crop
                                        </Button>
                                        <button
                                          type="button"
                                          onClick={() => handleArchiveParcel(parcel.id)}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                                          title="Archive Parcel"
                                        >
                                          <Archive className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                        No parcel plots recorded under this farm landholding.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Layers className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">No Farm Landholdings Registered</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Register the beneficiary's agricultural parcels and land tenure to begin monitoring.
              </p>
              {isStaff && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingFarm(true)} className="mt-3">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Register First Farm Landholding
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CROPS */}
      {activeTab === "crops" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Planted Crop Cycles &amp; Production Records
              </h3>
              <p className="text-[11px] text-slate-500">
                Latest updated crop records per parcel plot (OMAG Questionnaire Operational Need)
              </p>
            </div>
          </div>

          {(() => {
            const allCrops: any[] = [];
            for (const f of activeFarms) {
              for (const p of f.parcels || []) {
                if (p.status !== "Archived") {
                  for (const c of p.crops || []) {
                    if (c.status !== "Archived") {
                      allCrops.push({
                        ...c,
                        parcelNumber: p.parcelNumber,
                        farmName: f.farmName,
                        barangay: f.barangay,
                      });
                    }
                  }
                }
              }
            }

            allCrops.sort(
              (a, b) => new Date(b.plantingDate).getTime() - new Date(a.plantingDate).getTime()
            );

            if (allCrops.length === 0) {
              return (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <Sprout className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-700">No Crop Records Found</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Use the "Farms &amp; Parcels" tab to record a standing crop for any parcel.
                  </p>
                </div>
              );
            }

            return (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Crop Commodity</th>
                      <th scope="col" className="px-3 py-2.5">Parcel / Location</th>
                      <th scope="col" className="px-3 py-2.5">Planted Area</th>
                      <th scope="col" className="px-3 py-2.5">Season &amp; Year</th>
                      <th scope="col" className="px-3 py-2.5">Planting Date</th>
                      <th scope="col" className="px-3 py-2.5">Status</th>
                      {isStaff && <th scope="col" className="px-3 py-2.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allCrops.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          <div>
                            <span className="font-bold text-slate-900">{c.cropType}</span>
                            {c.variety && (
                              <p className="text-[11px] text-slate-500 font-normal">
                                Variety: {c.variety}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          <div>
                            <span className="font-mono font-semibold text-slate-800">{c.parcelNumber}</span>
                            <p className="text-[10px] text-slate-400">
                              {c.farmName || "Farm"} • Brgy. {c.barangay}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {c.plantedAreaHa} ha
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {c.season} {c.year}
                        </td>
                        <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">
                          {c.plantingDate ? new Date(c.plantingDate).toISOString().split("T")[0] : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={c.status === "Standing" ? "success" : "neutral"}
                            size="sm"
                          >
                            {c.status}
                          </Badge>
                        </td>
                        {isStaff && (
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleArchiveCrop(c.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Archive Crop Record"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: SUPPORTING DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Supporting Land Documents &amp; Identification Records
              </h3>
              <p className="text-[11px] text-slate-500">
                Land titles, government IDs, and tax declarations (🟢 OMAG CONFIRMED)
              </p>
            </div>
            {isStaff && (
              <Button variant="outline" size="sm" onClick={() => setIsAttachingDocument(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Attach Document
              </Button>
            )}
          </div>

          {activeDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDocuments.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm">
                          {doc.documentType}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {((doc.fileSizeBytes || 102400) / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-900 truncate">
                        {doc.fileName}
                      </p>
                      {doc.remarks && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {doc.remarks}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">
                        Uploaded {new Date(doc.createdAt).toISOString().split("T")[0]}
                        {doc.uploadedBy && ` by ${doc.uploadedBy.fullName}`}
                      </p>
                    </div>
                  </div>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => handleArchiveDocument(doc.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded shrink-0"
                      title="Archive Document"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">No Supporting Documents Attached</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Land titles (OCT/TCT), valid IDs, and tax declarations can be attached to support RSBSA verification.
              </p>
              {isStaff && (
                <Button variant="outline" size="sm" onClick={() => setIsAttachingDocument(true)} className="mt-3">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Attach First Document
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        title="Edit Beneficiary Profile"
        subtitle={`Updating records for ${beneficiary.firstName} ${beneficiary.lastName}`}
        size="3xl"
      >
        <BeneficiaryForm
          isEdit={true}
          initialData={beneficiary}
          onSuccess={() => {
            setIsEditingProfile(false);
            refreshData();
          }}
          onCancel={() => setIsEditingProfile(false)}
        />
      </Modal>

      {/* 2. ADD FARM LANDHOLDING MODAL */}
      <Modal
        isOpen={isAddingFarm}
        onClose={() => setIsAddingFarm(false)}
        title="Register Farm Landholding"
        subtitle="Add a cadastral farm holding associated with this beneficiary."
        size="2xl"
      >
        <form onSubmit={handleAddFarm} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Name *</label>
              <input
                type="text"
                required
                value={farmForm.farmName}
                onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                placeholder="e.g. Polomolok Main Ricefield"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Barangay *</label>
              <select
                value={farmForm.barangay}
                onChange={(e) => setFarmForm({ ...farmForm, barangay: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {POLOMOLOK_BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sitio / Purok</label>
              <input
                type="text"
                value={farmForm.sitioPurok}
                onChange={(e) => setFarmForm({ ...farmForm, sitioPurok: e.target.value })}
                placeholder="e.g. Purok 4"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Area (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={farmForm.totalAreaHa}
                onChange={(e) => setFarmForm({ ...farmForm, totalAreaHa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tenure Type *</label>
              <select
                value={farmForm.tenureType}
                onChange={(e) => setFarmForm({ ...farmForm, tenureType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {TENURE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Water Source</label>
              <input
                type="text"
                value={farmForm.waterSource}
                onChange={(e) => setFarmForm({ ...farmForm, waterSource: e.target.value })}
                placeholder="e.g. Irrigated / NIA, Rainfed"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingFarm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Farm Landholding"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. ADD PARCEL MODAL */}
      <Modal
        isOpen={addingParcelFarmId !== null}
        onClose={() => setAddingParcelFarmId(null)}
        title="Add Farm Parcel"
        subtitle="Register a subdivided parcel under this farm landholding."
        size="2xl"
      >
        <form onSubmit={handleAddParcel} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel Number / Lot *</label>
              <input
                type="text"
                required
                value={parcelForm.parcelNumber}
                onChange={(e) => setParcelForm({ ...parcelForm, parcelNumber: e.target.value })}
                placeholder="e.g. LOT-01"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel Area (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={parcelForm.areaHa}
                onChange={(e) => setParcelForm({ ...parcelForm, areaHa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (GPS)</label>
              <input
                type="number"
                step="0.000001"
                value={parcelForm.latitude}
                onChange={(e) => setParcelForm({ ...parcelForm, latitude: e.target.value })}
                placeholder="6.2189"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (GPS)</label>
              <input
                type="number"
                step="0.000001"
                value={parcelForm.longitude}
                onChange={(e) => setParcelForm({ ...parcelForm, longitude: e.target.value })}
                placeholder="125.0645"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              value={parcelForm.remarks}
              onChange={(e) => setParcelForm({ ...parcelForm, remarks: e.target.value })}
              placeholder="e.g. Near creek border"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingParcelFarmId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Parcel"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. RECORD CROP MODAL */}
      <Modal
        isOpen={recordingCropParcel !== null}
        onClose={() => setRecordingCropParcel(null)}
        title="Record Standing Crop Cycle"
        subtitle={`Recording crop planting on Parcel ${recordingCropParcel?.parcelNumber || ""}`}
        size="2xl"
      >
        <form onSubmit={handleRecordCrop} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Type *</label>
              <select
                value={cropForm.cropType}
                onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {COMMON_CROP_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planted Area (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={cropForm.plantedAreaHa}
                onChange={(e) => setCropForm({ ...cropForm, plantedAreaHa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Variety</label>
              <input
                type="text"
                value={cropForm.variety}
                onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                placeholder="e.g. NSIC Rc222, Hybrid Sweet"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planting Date *</label>
              <input
                type="date"
                required
                value={cropForm.plantingDate}
                onChange={(e) => setCropForm({ ...cropForm, plantingDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cropping Season *</label>
              <select
                value={cropForm.season}
                onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Wet">Wet Season</option>
                <option value="Dry">Dry Season</option>
                <option value="Third">Third Cropping</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Harvest Date</label>
              <input
                type="date"
                value={cropForm.expectedHarvestDate}
                onChange={(e) => setCropForm({ ...cropForm, expectedHarvestDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setRecordingCropParcel(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Record Crop"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. ATTACH DOCUMENT MODAL */}
      <Modal
        isOpen={isAttachingDocument}
        onClose={() => setIsAttachingDocument(false)}
        title="Attach Supporting Land Document"
        subtitle="Upload or record supporting tenure documents and valid government IDs."
        size="2xl"
      >
        <form onSubmit={handleAttachDocument} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type *</label>
              <select
                value={documentForm.documentType}
                onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {SUPPORTING_DOCUMENT_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Name / Label *</label>
              <input
                type="text"
                required
                value={documentForm.fileName}
                onChange={(e) => setDocumentForm({ ...documentForm, fileName: e.target.value })}
                placeholder="e.g. OCT_12345_Poblacion.pdf"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Farm (Optional)</label>
              <select
                value={documentForm.farmId}
                onChange={(e) => setDocumentForm({ ...documentForm, farmId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— General / Not Farm Specific —</option>
                {activeFarms.map((f: any) => (
                  <option key={f.id} value={f.id.toString()}>
                    {f.farmName} ({f.barangay})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={documentForm.remarks}
                onChange={(e) => setDocumentForm({ ...documentForm, remarks: e.target.value })}
                placeholder="e.g. Verified with Polomolok Registry"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAttachingDocument(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Attach Document"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. ARCHIVE CONFIRMATION MODAL */}
      <Modal
        isOpen={isArchivingBeneficiary}
        onClose={() => setIsArchivingBeneficiary(false)}
        title="Archive Beneficiary Profile"
        subtitle="Confirm archiving of agricultural dossier"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p>
              Are you sure you want to archive <strong>{beneficiary.firstName} {beneficiary.lastName}</strong>? This profile will be moved to archived records.
            </p>
          </div>
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {actionError}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsArchivingBeneficiary(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              onClick={handleArchiveBeneficiary}
            >
              {isSubmitting ? "Archiving..." : "Confirm Archive"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. ARCHIVE ITEM CONFIRMATION MODAL (Non-blocking) */}
      <Modal
        isOpen={!!archiveItemTarget}
        onClose={() => setArchiveItemTarget(null)}
        title={`Archive ${archiveItemTarget?.label || "Record"}`}
        subtitle="Confirm deactivation of agricultural component"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p>
              Are you sure you want to archive this <strong>{archiveItemTarget?.label.toLowerCase()}</strong>? It will be marked as inactive in this dossier.
            </p>
          </div>
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {actionError}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setArchiveItemTarget(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={handleConfirmArchiveItem}
            >
              Confirm Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
