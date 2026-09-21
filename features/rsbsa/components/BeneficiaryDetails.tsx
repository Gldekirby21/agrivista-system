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
  Copy,
  CheckCheck,
  QrCode,
  Globe2,
  Navigation,
  Compass,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
  Accessibility,
  Users,
  Wheat,
  Scale,
  Droplets,
  Eye,
  Download,
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/common/Modal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { BeneficiaryForm } from "./BeneficiaryForm";
import { MapCoordinatePickerModal } from "@/components/maps/MapCoordinatePickerModal";

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

const getCommodityIcon = (cropType: string) => {
  const t = (cropType || "").toLowerCase();
  if (t.includes("corn") || t.includes("mais")) return "🌽";
  if (t.includes("rice") || t.includes("palay")) return "🌾";
  if (t.includes("pine")) return "🍍";
  if (t.includes("banana")) return "🍌";
  if (t.includes("cassava")) return "🍠";
  if (t.includes("veg")) return "🥬";
  if (t.includes("coffee")) return "☕";
  if (t.includes("cacao")) return "🍫";
  if (t.includes("coconut")) return "🌴";
  return "🌱";
};

const getTenureIcon = (tenure: string) => {
  const t = (tenure || "").toLowerCase();
  if (t.includes("own")) return "🏡";
  if (t.includes("tenant")) return "🤝";
  if (t.includes("lease")) return "📜";
  if (t.includes("dar") || t.includes("cloa")) return "🎖️";
  if (t.includes("usufruct")) return "🌱";
  if (t.includes("mortgage")) return "🏦";
  return "🏷️";
};

const getDocumentIcon = (docType: string) => {
  const d = (docType || "").toLowerCase();
  if (d.includes("title") || d.includes("oct") || d.includes("tct")) return "📜";
  if (d.includes("tax")) return "🏛️";
  if (d.includes("cloa") || d.includes("dar")) return "🎖️";
  if (d.includes("sale")) return "📑";
  if (d.includes("id")) return "🪪";
  if (d.includes("cert")) return "🏷️";
  return "📄";
};

const getEstimatedYield = (cropType: string, hectares: number) => {
  const t = (cropType || "").toLowerCase();
  let rate = 4.0;
  if (t.includes("yellow corn")) rate = 4.8;
  else if (t.includes("white corn")) rate = 3.5;
  else if (t.includes("rice") || t.includes("palay")) rate = 4.2;
  else if (t.includes("pine")) rate = 35.0;
  else if (t.includes("banana")) rate = 28.0;
  else if (t.includes("cassava")) rate = 22.0;
  else if (t.includes("veg")) rate = 15.0;
  else if (t.includes("coffee")) rate = 1.8;
  else if (t.includes("cacao")) rate = 2.1;
  else if (t.includes("coconut")) rate = 5.5;
  return (hectares * rate).toFixed(1);
};

export const BeneficiaryDetails: React.FC<BeneficiaryDetailsProps> = ({
  beneficiary: initialBeneficiary,
  isStaff = false,
  baseBackHref = "/staff/beneficiaries",
}) => {
  const router = useRouter();
  const [beneficiary, setBeneficiary] = useState<any>(initialBeneficiary);
  const [activeTab, setActiveTab] = useState<"farms" | "crops" | "documents">("farms");
  const [copiedRsbsa, setCopiedRsbsa] = useState(false);

  const handleCopyRsbsa = () => {
    if (beneficiary.rsbsaNumber && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(beneficiary.rsbsaNumber);
      setCopiedRsbsa(true);
      setTimeout(() => setCopiedRsbsa(false), 2000);
    }
  };

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

  // Edit states for Farm, Parcel, Crop, Document
  const [editingFarm, setEditingFarm] = useState<any | null>(null);
  const [editFarmForm, setEditFarmForm] = useState({
    farmName: "",
    barangay: "Poblacion",
    sitioPurok: "",
    totalAreaHa: "1.0",
    tenureType: "Owned",
    soilType: "Clay Loam",
    waterSource: "Rainfed",
    remarks: "",
  });

  const [editingParcel, setEditingParcel] = useState<any | null>(null);
  const [editParcelForm, setEditParcelForm] = useState({
    parcelNumber: "LOT-01",
    areaHa: "1.0",
    latitude: "6.2189",
    longitude: "125.0645",
    remarks: "",
  });

  const [isMapPickerOpenForAddParcel, setIsMapPickerOpenForAddParcel] = useState(false);
  const [isMapPickerOpenForEditParcel, setIsMapPickerOpenForEditParcel] = useState(false);

  const [editingCrop, setEditingCrop] = useState<any | null>(null);
  const [editCropForm, setEditCropForm] = useState({
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

  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [editDocumentForm, setEditDocumentForm] = useState({
    documentType: "Land Title (OCT/TCT)",
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

  const handleUpdateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/farms/${editingFarm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFarmForm,
          totalAreaHa: parseFloat(editFarmForm.totalAreaHa),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update farm");
      setActionSuccess("Farm landholding updated successfully.");
      setEditingFarm(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update farm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParcel) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/farm-parcels/${editingParcel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editParcelForm,
          areaHa: parseFloat(editParcelForm.areaHa),
          latitude: editParcelForm.latitude ? parseFloat(editParcelForm.latitude) : undefined,
          longitude: editParcelForm.longitude ? parseFloat(editParcelForm.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update parcel");
      setActionSuccess("Farm parcel updated successfully.");
      setEditingParcel(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update parcel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrop) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/crops/${editingCrop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editCropForm,
          plantedAreaHa: parseFloat(editCropForm.plantedAreaHa),
          year: parseInt(editCropForm.year, 10),
          expectedHarvestDate: editCropForm.expectedHarvestDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update crop");
      setActionSuccess("Crop planting record updated successfully.");
      setEditingCrop(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update crop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/land-documents/${editingDocument.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDocumentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update document");
      setActionSuccess("Supporting document record updated successfully.");
      setEditingDocument(null);
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || "Failed to update document");
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
    <div className="space-y-4">
      {/* Top Breadcrumb & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Link
          href={baseBackHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Beneficiary Directory</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {isStaff ? (
            <Badge variant="info" size="sm">OMAG Staff — Edit &amp; Mutation Authorized</Badge>
          ) : (
            <Badge variant="neutral" size="sm">OMAG Head — Oversight &amp; Review Mode</Badge>
          )}
          <Badge variant="neutral" size="sm">Centralized Beneficiary Record</Badge>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-2.5 px-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
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
        <div className="p-2.5 px-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-800">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-black text-xl shrink-0 shadow-md ring-4 ring-emerald-50">
              {beneficiary.firstName?.[0] || "B"}
              {beneficiary.lastName?.[0] || ""}
            </div>
            <div className="min-w-0 flex-1">
              {/* DA RFO XII Badge */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  DA-RFO XII • Municipal Agriculture Registry
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Globe2 className="h-3.5 w-3.5 text-emerald-600" /> Polomolok, South Cotabato
                </span>
              </div>

              {/* Name and Status */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
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

              {/* Roles & Sector Attributes */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                  <Wheat className="h-3.5 w-3.5 text-emerald-600" />
                  {beneficiary.farmerCode || "Agricultural Beneficiary"}
                </span>
                {beneficiary.sex && beneficiary.sex !== "Unspecified" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                    {beneficiary.sex === "Male" ? "Male ♂" : "Female ♀"}
                  </span>
                )}
                {beneficiary.civilStatus && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                    {beneficiary.civilStatus}
                  </span>
                )}
                {beneficiary.isSenior && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <Users className="h-3 w-3" /> Senior Citizen
                  </span>
                )}
                {beneficiary.isPwd && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                    <Accessibility className="h-3 w-3" /> PWD
                  </span>
                )}
                {beneficiary.is4ps && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                    <HeartHandshake className="h-3 w-3" /> 4Ps
                  </span>
                )}
                {beneficiary.isIp && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold">
                    <Compass className="h-3 w-3" /> IP
                  </span>
                )}
              </div>

              {/* Contact & Address */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Brgy. <strong className="text-slate-800">{beneficiary.barangay}</strong>, {beneficiary.municipality}, {beneficiary.province}
                  </span>
                </div>
                {beneficiary.contactNumber && (
                  <a
                    href={`tel:${beneficiary.contactNumber}`}
                    className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{beneficiary.contactNumber}</span>
                  </a>
                )}
                {beneficiary.email && (
                  <a
                    href={`mailto:${beneficiary.email}`}
                    className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{beneficiary.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Identification Box & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left lg:text-right shadow-2xs">
              <div className="flex items-center gap-1.5 justify-start lg:justify-end mb-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  RSBSA System Number
                </span>
              </div>
              <p className="font-mono text-sm font-black text-slate-900">
                {beneficiary.rsbsaNumber || "Not Issued"}
              </p>
              {beneficiary.rsbsaNumber && (
                <button
                  type="button"
                  onClick={handleCopyRsbsa}
                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  {copiedRsbsa ? (
                    <>
                      <CheckCheck className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-emerald-600" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isStaff && beneficiary.status !== "Archived" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold border-slate-300 hover:bg-slate-50"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit Profile
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={() => setIsArchivingBeneficiary(true)}
                >
                  <Archive className="h-3.5 w-3.5 mr-1" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Aggregate Metric Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Landholdings</span>
              <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900 leading-none">
              {activeFarms.length} <span className="text-xs font-normal text-slate-500">Farm{activeFarms.length !== 1 ? "s" : ""}</span>
            </p>
          </div>

          <div className="rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Farm Parcels</span>
              <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-lg font-black text-slate-900 leading-none">
              {totalParcels} <span className="text-xs font-normal text-slate-500">Plot{totalParcels !== 1 ? "s" : ""}</span>
            </p>
          </div>

          <div className="rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Farm Area</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {(totalHectares * 10000).toLocaleString()} m²
              </span>
            </div>
            <p className="text-lg font-black text-slate-900 leading-none">
              {totalHectares.toFixed(2)} <span className="text-xs font-normal text-slate-500">ha</span>
            </p>
          </div>

          <div className="rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Standing Crops</span>
              <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Sprout className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-sm font-black text-slate-900 leading-tight truncate" title={activeCropsSet.size > 0 ? Array.from(activeCropsSet).join(", ") : "None Recorded"}>
              {activeCropsSet.size > 0 ? (
                <span>
                  {Array.from(activeCropsSet).slice(0, 2).map((c: any) => `${getCommodityIcon(c)} ${c}`).join(", ")}
                  {activeCropsSet.size > 2 && ` +${activeCropsSet.size - 2}`}
                </span>
              ) : (
                <span className="text-slate-400 font-normal text-xs">None Recorded</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("farms")}
          className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 inline-flex items-center gap-1.5 whitespace-nowrap ${activeTab === "farms"
              ? "border-emerald-600 text-emerald-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
        >
          <Layers className={`h-3.5 w-3.5 ${activeTab === "farms" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>Farms &amp; Georeferenced Parcels</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "farms"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
            }`}>
            {activeFarms.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("crops")}
          className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 inline-flex items-center gap-1.5 whitespace-nowrap ${activeTab === "crops"
              ? "border-emerald-600 text-emerald-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
        >
          <Sprout className={`h-3.5 w-3.5 ${activeTab === "crops" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>Current &amp; Recorded Crops</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "crops"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
            }`}>
            {activeCropsSet.size}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 inline-flex items-center gap-1.5 whitespace-nowrap ${activeTab === "documents"
              ? "border-emerald-600 text-emerald-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
        >
          <FileText className={`h-3.5 w-3.5 ${activeTab === "documents" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>Supporting Land Documents</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "documents"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
            }`}>
            {activeDocuments.length}
          </span>
        </button>
      </div>

      {/* TAB 1: FARMS & PARCELS */}
      {activeTab === "farms" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Registered Farm Landholdings &amp; Georeferenced Parcel Plots
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeFarms.length} Holding{activeFarms.length !== 1 ? "s" : ""} • {totalParcels} Plot{totalParcels !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cadastral landholdings, tenure classifications, and GPS-stamped lot boundaries in Polomolok
              </p>
            </div>
            {isStaff && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium border-slate-300 hover:border-emerald-500 hover:text-emerald-700 bg-white"
                onClick={() => setIsAddingFarm(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
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
                    className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-200 transition-all space-y-4"
                  >
                    {/* Farm Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 tracking-tight">
                            {farm.farmName || `Farm Landholding #${farm.id}`}
                          </h4>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                            <span>{getTenureIcon(farm.tenureType)}</span>
                            <span>{farm.tenureType}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            <Layers className="h-3 w-3 text-slate-500" />
                            {farmParcels.length} Plot{farmParcels.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            Brgy. {farm.barangay}{farm.sitioPurok ? `, ${farm.sitioPurok}` : ""}, Polomolok
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-500">Declared Area:</span>
                            <strong className="text-slate-900 font-bold">{farm.totalAreaHa} ha</strong>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                              {(farm.totalAreaHa * 10000).toLocaleString()} m²
                            </span>
                          </span>
                          {farm.soilType && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/60 text-[11px] font-medium">
                                🌋 {farm.soilType}
                              </span>
                            </>
                          )}
                          {farm.waterSource && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200/60 text-[11px] font-medium">
                                💧 {farm.waterSource}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                        {isStaff && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100"
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
                              <Plus className="h-3 w-3 mr-1 text-emerald-600" />
                              Add Parcel
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-medium border-slate-300"
                              onClick={() => {
                                setEditFarmForm({
                                  farmName: farm.farmName || "",
                                  barangay: farm.barangay || "Poblacion",
                                  sitioPurok: farm.sitioPurok || "",
                                  totalAreaHa: String(farm.totalAreaHa || 1.0),
                                  tenureType: farm.tenureType || "Owned",
                                  soilType: farm.soilType || "Clay Loam",
                                  waterSource: farm.waterSource || "Rainfed",
                                  remarks: farm.remarks || "",
                                });
                                setEditingFarm(farm);
                              }}
                              title="Edit Farm Landholding"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleArchiveFarm(farm.id)}
                              title="Archive Farm"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Parcels Table */}
                    {farmParcels.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                            <tr>
                              <th scope="col" className="px-3.5 py-2.5">Lot / Parcel ID</th>
                              <th scope="col" className="px-3.5 py-2.5">Plot Area</th>
                              <th scope="col" className="px-3.5 py-2.5">GPS Centroid Coordinates</th>
                              <th scope="col" className="px-3.5 py-2.5">Standing Crop Cycle</th>
                              {isStaff && <th scope="col" className="px-3.5 py-2.5 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {farmParcels.map((parcel: any) => {
                              const activeCrops = (parcel.crops || []).filter(
                                (c: any) => c.status !== "Archived"
                              );
                              const latestCrop = activeCrops[0];

                              return (
                                <tr key={parcel.id} className="hover:bg-emerald-50/20 transition-colors">
                                  <td className="px-3.5 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                                        📍 {parcel.parcelNumber}
                                      </span>
                                    </div>
                                    {parcel.remarks && (
                                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                                        {parcel.remarks}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <div className="font-bold text-slate-900">
                                      {parcel.areaHa} ha
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                      {(parcel.areaHa * 10000).toLocaleString()} m²
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono text-[11px]">
                                    {parcel.latitude && parcel.longitude ? (
                                      <a
                                        href={`https://www.google.com/maps?q=${parcel.latitude},${parcel.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 hover:underline bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded transition-colors group"
                                        title="Open Centroid Coordinate in Google Maps"
                                      >
                                        <Navigation className="h-3 w-3 text-emerald-600" />
                                        <span>{Number(parcel.latitude).toFixed(4)}°N, {Number(parcel.longitude).toFixed(4)}°E</span>
                                        <ExternalLink className="h-2.5 w-2.5 text-slate-400 group-hover:text-emerald-700" />
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">No GPS fix recorded</span>
                                    )}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    {latestCrop ? (
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            <span>{getCommodityIcon(latestCrop.cropType)}</span>
                                            <span>{latestCrop.cropType}</span>
                                          </span>
                                          <span className="text-[11px] font-mono font-bold text-slate-700">
                                            {latestCrop.plantedAreaHa} ha
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                          {latestCrop.variety && <span>{latestCrop.variety}</span>}
                                          <span>•</span>
                                          <span>{latestCrop.season} Season</span>
                                          <span>•</span>
                                          <span className="text-emerald-700 font-semibold">
                                            Est: ~{getEstimatedYield(latestCrop.cropType, latestCrop.plantedAreaHa)} MT
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">No standing crop cycle</span>
                                    )}
                                  </td>
                                  {isStaff && (
                                    <td className="px-3.5 py-2.5 text-right">
                                      <div className="inline-flex items-center gap-1">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="h-6 text-[11px] px-2 font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
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
                                          onClick={() => {
                                            setEditParcelForm({
                                              parcelNumber: parcel.parcelNumber || "LOT-01",
                                              areaHa: String(parcel.areaHa || 1.0),
                                              latitude: parcel.latitude ? String(parcel.latitude) : "6.2189",
                                              longitude: parcel.longitude ? String(parcel.longitude) : "125.0645",
                                              remarks: parcel.remarks || "",
                                            });
                                            setEditingParcel(parcel);
                                          }}
                                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                          title="Edit Parcel Plot"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleArchiveParcel(parcel.id)}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        No parcel plots recorded under this farm landholding. Click <strong>"Add Parcel"</strong> to georeference a plot.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 px-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <Layers className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">No Farm Landholdings Registered</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Register this beneficiary's agricultural parcels, tenure classification, and coordinates to enable OMAG field monitoring.
              </p>
              {isStaff && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingFarm(true)}
                  className="mt-4 h-8 text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
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

            const totalPlantedHa = allCrops.reduce(
              (acc, c) => acc + (parseFloat(c.plantedAreaHa) || 0),
              0
            );
            const uniqueCommodities = Array.from(
              new Set(allCrops.map((c) => c.cropType).filter(Boolean))
            );
            const totalProjectedYieldMT = allCrops.reduce(
              (acc, c) => acc + parseFloat(getEstimatedYield(c.cropType, c.plantedAreaHa || 0)),
              0
            );

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Planted Crop Cycles &amp; Production Monitoring
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {allCrops.length} Active Cycle{allCrops.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      OMAG seasonal crop cycles, standing crop maturity tracking, and yield estimates
                    </p>
                  </div>
                </div>

                {/* Top Crop Summary Cards */}
                {allCrops.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/30 p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-600 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Total Planted Area
                        </span>
                        <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Wheat className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900">
                          {totalPlantedHa.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">ha</span>
                        <span className="ml-auto font-mono text-[10px] text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                          {(totalPlantedHa * 10000).toLocaleString()} m²
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/30 p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-600 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                          Standing Commodities
                        </span>
                        <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Sprout className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xl font-black text-slate-900">
                          {uniqueCommodities.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Type{uniqueCommodities.length !== 1 ? "s" : ""}
                        </span>
                        <div className="ml-auto flex items-center gap-1 text-base">
                          {uniqueCommodities.slice(0, 4).map((c: any, i: number) => (
                            <span key={i} title={c}>{getCommodityIcon(c)}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-cyan-50/30 p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-600 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                          Projected Yield Baseline
                        </span>
                        <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900">
                          ~{totalProjectedYieldMT.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">Metric Tons (MT)</span>
                        <span className="ml-auto text-[10px] text-blue-700 font-bold bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                          OMAG Standard
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {allCrops.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 px-4 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                      <Sprout className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-900">No Crop Records Found</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      Navigate to the "Farms &amp; Georeferenced Parcels" tab and click "Record Crop" on any parcel plot.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                        <tr>
                          <th scope="col" className="px-3.5 py-2.5">Crop Commodity</th>
                          <th scope="col" className="px-3.5 py-2.5">Parcel / Landholding</th>
                          <th scope="col" className="px-3.5 py-2.5">Planted Area</th>
                          <th scope="col" className="px-3.5 py-2.5">Cropping Season</th>
                          <th scope="col" className="px-3.5 py-2.5">Planting &amp; Harvest</th>
                          <th scope="col" className="px-3.5 py-2.5">Projected Yield</th>
                          <th scope="col" className="px-3.5 py-2.5">Status</th>
                          {isStaff && <th scope="col" className="px-3.5 py-2.5 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allCrops.map((c) => (
                          <tr key={c.id} className="hover:bg-emerald-50/20 transition-colors">
                            <td className="px-3.5 py-2.5 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="text-xl shrink-0">{getCommodityIcon(c.cropType)}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">{c.cropType}</span>
                                    {c.category && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                        {c.category}
                                      </span>
                                    )}
                                  </div>
                                  {c.variety && (
                                    <p className="text-[11px] text-slate-500 font-normal">
                                      Variety: <strong className="text-slate-700 font-semibold">{c.variety}</strong>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-700">
                              <div>
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                                  📍 {c.parcelNumber}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {c.farmName || "Farm"} • Brgy. {c.barangay}
                                </p>
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="font-bold text-slate-900">{c.plantedAreaHa} ha</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {(c.plantedAreaHa * 10000).toLocaleString()} m²
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                {c.season === "Wet" ? "🌧️ Wet" : "☀️ Dry"} Season {c.year}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-400">Planted: </span>
                                <span className="font-semibold text-slate-800">
                                  {c.plantingDate ? new Date(c.plantingDate).toISOString().split("T")[0] : "—"}
                                </span>
                              </div>
                              {c.expectedHarvestDate && (
                                <div className="text-[10px] text-emerald-700 mt-0.5">
                                  <span className="text-slate-400">Harvest: </span>
                                  <span>{new Date(c.expectedHarvestDate).toISOString().split("T")[0]}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="font-mono font-bold text-emerald-800 text-xs">
                                ~{getEstimatedYield(c.cropType, c.plantedAreaHa)} MT
                              </div>
                              <div className="text-[10px] text-slate-400">Baseline OMAG Est.</div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <Badge
                                variant={c.status === "Standing" ? "success" : c.status === "Harvested" ? "info" : "neutral"}
                                size="sm"
                              >
                                {c.status}
                              </Badge>
                            </td>
                            {isStaff && (
                              <td className="px-3.5 py-2.5 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditCropForm({
                                        cropType: c.cropType || "Corn (Yellow)",
                                        variety: c.variety || "",
                                        category: c.category || "Grain",
                                        plantedAreaHa: String(c.plantedAreaHa || 1.0),
                                        plantingDate: c.plantingDate ? new Date(c.plantingDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                                        expectedHarvestDate: c.expectedHarvestDate ? new Date(c.expectedHarvestDate).toISOString().split("T")[0] : "",
                                        season: c.season || "Wet",
                                        year: String(c.year || new Date().getFullYear()),
                                        status: c.status || "Standing",
                                        remarks: c.remarks || "",
                                      });
                                      setEditingCrop(c);
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                    title="Edit Crop Record"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleArchiveCrop(c.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                    title="Archive Crop Record"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* TAB 3: SUPPORTING DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Supporting Land Documents &amp; Legal Credentials
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeDocuments.length} Document{activeDocuments.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official DA-RFO XII &amp; LGU Polomolok land tenure proofs, OCT/TCT titles, CLOA awards, and valid IDs
              </p>
            </div>
            {isStaff && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium border-slate-300 hover:border-emerald-500 hover:text-emerald-700 bg-white"
                onClick={() => setIsAttachingDocument(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Attach Document
              </Button>
            )}
          </div>

          {activeDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeDocuments.map((doc: any) => {
                const associatedFarm = activeFarms.find((f: any) => f.id === doc.farmId);
                const isPdf = (doc.fileName || "").toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-xl shrink-0 group-hover:scale-105 transition-transform">
                            <span>{getDocumentIcon(doc.documentType)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {doc.documentType}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                                {((doc.fileSizeBytes || 102400) / 1024).toFixed(0)} KB
                              </span>
                              {isPdf && (
                                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1 py-0.2 rounded">
                                  PDF
                                </span>
                              )}
                            </div>
                            <h5 className="mt-1 text-xs font-bold text-slate-900 truncate" title={doc.fileName}>
                              {doc.fileName}
                            </h5>
                          </div>
                        </div>

                        {isStaff && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditDocumentForm({
                                  documentType: doc.documentType || "Land Title (OCT/TCT)",
                                  remarks: doc.remarks || "",
                                });
                                setEditingDocument(doc);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Edit Document"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveDocument(doc.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded shrink-0 transition-colors"
                              title="Archive Document"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Associated Farm Link */}
                      <div className="pt-1.5 text-xs text-slate-600">
                        {associatedFarm ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                            <Layers className="h-3 w-3 text-emerald-600" />
                            Linked to: <strong>{associatedFarm.farmName}</strong> (Brgy. {associatedFarm.barangay})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            General Beneficiary Identification Document
                          </span>
                        )}
                      </div>

                      {doc.remarks && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {doc.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>
                        Uploaded {new Date(doc.createdAt).toISOString().split("T")[0]}
                        {doc.uploadedBy && ` • ${doc.uploadedBy.fullName}`}
                      </span>

                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Document</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 px-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">No Supporting Documents Attached</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Land titles (OCT/TCT), valid government IDs, and tax declarations can be attached to support RSBSA verification and DAR compliance.
              </p>
              {isStaff && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAttachingDocument(true)}
                  className="mt-4 h-8 text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
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
          {/* Centroid Geolocation Coordinates & Interactive Map */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3 sm:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Centroid Geolocation Coordinates
                </span>
                <p className="text-[11px] text-emerald-800/80">
                  Maaaring i-pin drop sa mapa o i-type nang manual ang decimal coordinates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapPickerOpenForAddParcel(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Globe2 className="h-3.5 w-3.5" />
                Piliin sa Mapa / Pin Drop
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/60">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Latitude (Decimal °N)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={parcelForm.latitude}
                  onChange={(e) => setParcelForm({ ...parcelForm, latitude: e.target.value })}
                  placeholder="6.218900"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Longitude (Decimal °E)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={parcelForm.longitude}
                  onChange={(e) => setParcelForm({ ...parcelForm, longitude: e.target.value })}
                  placeholder="125.064500"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
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

      {/* 6. EDIT FARM LANDHOLDING MODAL */}
      <Modal
        isOpen={!!editingFarm}
        onClose={() => setEditingFarm(null)}
        title="Edit Farm Landholding"
        subtitle={`Updating farm record: ${editingFarm?.farmName || "Farm"}`}
        size="2xl"
      >
        <form onSubmit={handleUpdateFarm} className="space-y-4">
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
                value={editFarmForm.farmName}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, farmName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Barangay *</label>
              <select
                value={editFarmForm.barangay}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, barangay: e.target.value })}
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
                value={editFarmForm.sitioPurok}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, sitioPurok: e.target.value })}
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
                value={editFarmForm.totalAreaHa}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, totalAreaHa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tenure Type *</label>
              <select
                value={editFarmForm.tenureType}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, tenureType: e.target.value })}
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
                value={editFarmForm.waterSource}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, waterSource: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={editFarmForm.remarks}
                onChange={(e) => setEditFarmForm({ ...editFarmForm, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingFarm(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Farm Landholding"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. EDIT FARM PARCEL MODAL */}
      <Modal
        isOpen={!!editingParcel}
        onClose={() => setEditingParcel(null)}
        title="Edit Farm Parcel"
        subtitle={`Updating parcel: ${editingParcel?.parcelNumber || "Plot"}`}
        size="2xl"
      >
        <form onSubmit={handleUpdateParcel} className="space-y-4">
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
                value={editParcelForm.parcelNumber}
                onChange={(e) => setEditParcelForm({ ...editParcelForm, parcelNumber: e.target.value })}
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
                value={editParcelForm.areaHa}
                onChange={(e) => setEditParcelForm({ ...editParcelForm, areaHa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          {/* Centroid Geolocation Coordinates & Interactive Map */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3 sm:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Centroid Geolocation Coordinates
                </span>
                <p className="text-[11px] text-emerald-800/80">
                  Maaaring i-pin drop sa mapa o i-type nang manual ang decimal coordinates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapPickerOpenForEditParcel(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Globe2 className="h-3.5 w-3.5" />
                Piliin sa Mapa / Pin Drop
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/60">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Latitude (Decimal °N)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editParcelForm.latitude}
                  onChange={(e) => setEditParcelForm({ ...editParcelForm, latitude: e.target.value })}
                  placeholder="6.218900"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Longitude (Decimal °E)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editParcelForm.longitude}
                  onChange={(e) => setEditParcelForm({ ...editParcelForm, longitude: e.target.value })}
                  placeholder="125.064500"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={editParcelForm.remarks}
                onChange={(e) => setEditParcelForm({ ...editParcelForm, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingParcel(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Farm Parcel"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. EDIT CROP RECORD MODAL */}
      <Modal
        isOpen={!!editingCrop}
        onClose={() => setEditingCrop(null)}
        title="Edit Standing Crop Record"
        subtitle={`Updating crop record: ${editingCrop?.cropType || "Crop"}`}
        size="2xl"
      >
        <form onSubmit={handleUpdateCrop} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Commodity Type *</label>
              <select
                value={editCropForm.cropType}
                onChange={(e) => setEditCropForm({ ...editCropForm, cropType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {COMMON_CROP_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variety / Cultivar</label>
              <input
                type="text"
                value={editCropForm.variety}
                onChange={(e) => setEditCropForm({ ...editCropForm, variety: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planted Area (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={editCropForm.plantedAreaHa}
                onChange={(e) => setEditCropForm({ ...editCropForm, plantedAreaHa: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Status</label>
              <select
                value={editCropForm.status}
                onChange={(e) => setEditCropForm({ ...editCropForm, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Standing">Standing</option>
                <option value="Harvested">Harvested</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planting Date</label>
              <input
                type="date"
                value={editCropForm.plantingDate}
                onChange={(e) => setEditCropForm({ ...editCropForm, plantingDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Harvest Date</label>
              <input
                type="date"
                value={editCropForm.expectedHarvestDate}
                onChange={(e) => setEditCropForm({ ...editCropForm, expectedHarvestDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={editCropForm.remarks}
                onChange={(e) => setEditCropForm({ ...editCropForm, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingCrop(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Crop Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. EDIT LAND DOCUMENT MODAL */}
      <Modal
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        title="Edit Supporting Land Document"
        subtitle={`Updating document record`}
        size="lg"
      >
        <form onSubmit={handleUpdateDocument} className="space-y-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type *</label>
              <select
                value={editDocumentForm.documentType}
                onChange={(e) => setEditDocumentForm({ ...editDocumentForm, documentType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {SUPPORTING_DOCUMENT_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Notes</label>
              <input
                type="text"
                value={editDocumentForm.remarks}
                onChange={(e) => setEditDocumentForm({ ...editDocumentForm, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingDocument(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Document Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 10. ARCHIVE BENEFICIARY CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isArchivingBeneficiary}
        onClose={() => setIsArchivingBeneficiary(false)}
        onConfirm={handleArchiveBeneficiary}
        title="Archive Beneficiary Profile"
        subtitle="Deactivate agricultural beneficiary record"
        itemName={`${beneficiary.firstName} ${beneficiary.lastName}`}
        message="This beneficiary profile will be moved to archived records and hidden from the active municipal directory. All associated farm, parcel, crop, and document records are preserved in the database. This action is non-destructive and will be logged in the immutable audit trail."
        confirmText="Archive Beneficiary"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* 11. ARCHIVE ITEM CONFIRM MODAL */}
      <ConfirmModal
        isOpen={!!archiveItemTarget}
        onClose={() => setArchiveItemTarget(null)}
        onConfirm={handleConfirmArchiveItem}
        title={`Archive ${archiveItemTarget?.label || "Record"}`}
        subtitle="Confirm deactivation of agricultural component"
        itemName={archiveItemTarget?.label}
        message={`Are you sure you want to archive this ${archiveItemTarget?.label.toLowerCase()}? The record will be marked as archived in the database and preserved for historical audits. This action will be recorded in the audit trail.`}
        confirmText="Archive Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Map Coordinate Picker for Add Parcel */}
      <MapCoordinatePickerModal
        isOpen={isMapPickerOpenForAddParcel}
        onClose={() => setIsMapPickerOpenForAddParcel(false)}
        initialLat={parcelForm.latitude}
        initialLng={parcelForm.longitude}
        initialBarangay={beneficiary?.farms?.find((f: any) => f.id === addingParcelFarmId)?.barangay || "Poblacion"}
        onSelectCoordinates={(lat, lng) => {
          setParcelForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        title="Piliin ang Centroid ng Farm Parcel"
        subtitle="I-click o i-drag ang pin sa eksaktong lokasyon ng lote sa Polomolok."
      />

      {/* Map Coordinate Picker for Edit Parcel */}
      <MapCoordinatePickerModal
        isOpen={isMapPickerOpenForEditParcel}
        onClose={() => setIsMapPickerOpenForEditParcel(false)}
        initialLat={editParcelForm.latitude}
        initialLng={editParcelForm.longitude}
        initialBarangay={beneficiary?.farms?.find((f: any) => f.id === editingParcel?.farmId)?.barangay || "Poblacion"}
        onSelectCoordinates={(lat, lng) => {
          setEditParcelForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        title="I-update ang Centroid ng Farm Parcel"
        subtitle="I-click o i-drag ang pin sa eksaktong lokasyon ng lote sa Polomolok."
      />
    </div>
  );
};
