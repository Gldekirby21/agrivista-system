"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Archive,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  MapPin,
  Sprout,
  FileText,
  Globe2,
  RotateCcw,
  X,
} from "lucide-react";
import { BeneficiaryListItem } from "../lib/beneficiaryQueries";
import { Badge } from "@/components/common/Badge";
import { RowActionsMenu } from "@/components/common/RowActionsMenu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/common/Modal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { MapCoordinatePickerModal } from "@/components/maps/MapCoordinatePickerModal";

const POLOMOLOK_BARANGAYS = [
  "ALL",
  "Bentung",
  "Cannery Site",
  "Crossing Pangi",
  "Glamang",
  "Kinilis",
  "Klinan 6",
  "Koronadal Proper",
  "Lam-caliaf",
  "Lapu",
  "Lumakil",
  "Maligo",
  "Magsaysay",
  "Pagalungan",
  "Poblacion",
  "Polo",
  "Rubber",
  "Silway 7",
  "Silway 8",
  "Sulit",
  "Sumbakil",
  "Upper Klinan",
];

const TENURE_TYPES = ["Owned", "Tenant", "Leased", "Mortgaged", "Beneficiary (DAR)", "Usufructuary"];

const COMMON_CROP_TYPES = [
  "Rice (Palay)",
  "Corn (Yellow)",
  "Corn (White)",
  "Pineapple",
  "Banana (Cavendish)",
  "Cassava",
  "Vegetables (Highland)",
  "Vegetables (Lowland)",
  "Coffee",
  "Cacao",
  "Rubber",
  "Coconut",
];

const SUPPORTING_DOCUMENT_TYPES = [
  "Land Title (OCT/TCT)",
  "Tax Declaration",
  "Certificate of Land Ownership Award (CLOA)",
  "Deed of Sale",
  "Lease Contract / Usufruct Agreement",
  "Barangay Certification",
  "Government-Issued Valid ID",
  "RSBSA Registration Form",
];

type ActiveTab = "farmers" | "farms" | "parcels" | "crops" | "documents";

const TAB_ITEMS: {
  key: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "farmers", label: "Beneficiaries", icon: Users },
  { key: "farms", label: "Farms", icon: Layers },
  { key: "parcels", label: "Parcels", icon: MapPin },
  { key: "crops", label: "Crops", icon: Sprout },
  { key: "documents", label: "Documents", icon: FileText },
];

const ENTITY_STATUS_OPTIONS = ["Active", "Archived"];
const CROP_STATUS_OPTIONS = ["Standing", "Ready for Harvest", "Harvested", "Archived"];
const DOCUMENT_STATUS_OPTIONS = ["Pending", "Verified", "Rejected", "Archived"];

const SEARCH_FIELDS: Record<ActiveTab, { key: string; label: string }[]> = {
  farmers: [
    { key: "ALL", label: "All Fields" },
    { key: "name", label: "Beneficiary Name" },
    { key: "rsbsa", label: "RSBSA / ID Number" },
    { key: "contact", label: "Contact Number" },
    { key: "barangay", label: "Barangay" },
  ],
  farms: [
    { key: "ALL", label: "All Fields" },
    { key: "farmName", label: "Farm Name" },
    { key: "farmer", label: "Farmer Owner" },
    { key: "barangay", label: "Barangay" },
  ],
  parcels: [
    { key: "ALL", label: "All Fields" },
    { key: "parcelNumber", label: "Parcel / Lot #" },
    { key: "farmName", label: "Farm Name" },
    { key: "farmer", label: "Farmer Owner" },
  ],
  crops: [
    { key: "ALL", label: "All Fields" },
    { key: "cropType", label: "Crop Commodity" },
    { key: "variety", label: "Variety / Seed" },
    { key: "farmer", label: "Farmer Owner" },
  ],
  documents: [
    { key: "ALL", label: "All Fields" },
    { key: "docType", label: "Document Type" },
    { key: "fileName", label: "File Name" },
    { key: "farmer", label: "Farmer Owner" },
  ],
};

const getSearchPlaceholder = (tab: ActiveTab, field: string) => {
  if (field === "ALL") {
    switch (tab) {
      case "farmers": return "Search by RSBSA ID, name, contact, or barangay...";
      case "farms": return "Search by farm name, barangay, or farmer...";
      case "parcels": return "Search by parcel lot ID, farm, or farmer...";
      case "crops": return "Search by crop commodity, variety, or farmer...";
      case "documents": return "Search by document type, file name, or farmer...";
    }
  }
  const fieldObj = SEARCH_FIELDS[tab]?.find((f) => f.key === field);
  return `Search by ${fieldObj?.label || field}...`;
};

interface BeneficiaryListProps {
  initialBeneficiaries: BeneficiaryListItem[];
  totalCount: number;
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({
  initialBeneficiaries,
  totalCount,
  userRole,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isStaff = userRole === "OMAG_STAFF";
  const basePath = isStaff ? "/staff/beneficiaries" : "/head/beneficiaries";

  // Determine active view from URL param (default: "farmers")
  const rawView = searchParams.get("view");
  const activeTab: ActiveTab =
    rawView === "farms" ||
      rawView === "parcels" ||
      rawView === "crops" ||
      rawView === "documents"
      ? rawView
      : "farmers";

  // Filters & Search
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("ALL");
  const [selectedBarangay, setSelectedBarangay] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const handleResetFilters = () => {
    setSearch("");
    setSearchField("ALL");
    setSelectedBarangay("ALL");
    setSelectedStatus("ALL");
  };

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Entities Data State
  const [farmersList, setFarmersList] = useState<BeneficiaryListItem[]>(initialBeneficiaries);
  const [farmsList, setFarmsList] = useState<any[]>([]);
  const [parcelsList, setParcelsList] = useState<any[]>([]);
  const [cropsList, setCropsList] = useState<any[]>([]);
  const [documentsList, setDocumentsList] = useState<any[]>([]);

  // Modals state
  const [isRegisterFarmerOpen, setIsRegisterFarmerOpen] = useState(false);
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [isAddParcelOpen, setIsAddParcelOpen] = useState(false);
  const [isRecordCropOpen, setIsRecordCropOpen] = useState(false);
  const [isAttachDocOpen, setIsAttachDocOpen] = useState(false);

  // Edit Modals state
  const [editingFarm, setEditingFarm] = useState<any | null>(null);
  const [editingParcel, setEditingParcel] = useState<any | null>(null);
  const [editingCrop, setEditingCrop] = useState<any | null>(null);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);

  // Archive ConfirmModal target
  const [archiveTarget, setArchiveTarget] = useState<{
    type: "farmer" | "farm" | "parcel" | "crop" | "document";
    id: number | string;
    name: string;
  } | null>(null);

  // Creation Forms
  const [farmForm, setFarmForm] = useState({
    beneficiaryId: "",
    farmName: "",
    barangay: "Poblacion",
    municipality: "Polomolok",
    province: "South Cotabato",
    sitioPurok: "",
    totalAreaHa: "1.0",
    tenureType: "Owned",
    soilType: "Clay Loam",
    waterSource: "Rainfed",
  });

  const [parcelForm, setParcelForm] = useState({
    farmId: "",
    parcelNumber: "LOT-01",
    areaHa: "1.0",
    latitude: "6.2189",
    longitude: "125.0645",
    remarks: "",
  });

  const [cropForm, setCropForm] = useState({
    parcelId: "",
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
    farmerId: "",
    farmId: "",
    documentType: "Land Title (OCT/TCT)",
    fileName: "",
    remarks: "",
  });

  // Edit Forms
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

  const [editParcelForm, setEditParcelForm] = useState({
    parcelNumber: "LOT-01",
    areaHa: "1.0",
    latitude: "6.2189",
    longitude: "125.0645",
    remarks: "",
  });

  const [isMapPickerOpenForAddParcel, setIsMapPickerOpenForAddParcel] = useState(false);
  const [isMapPickerOpenForEditParcel, setIsMapPickerOpenForEditParcel] = useState(false);

  const [editCropForm, setEditCropForm] = useState({
    cropType: "Corn (Yellow)",
    variety: "Hybrid",
    category: "Grain",
    plantedAreaHa: "1.0",
    plantingDate: "",
    expectedHarvestDate: "",
    season: "Wet",
    year: new Date().getFullYear().toString(),
    status: "Standing",
    remarks: "",
  });

  const [editDocumentForm, setEditDocumentForm] = useState({
    documentType: "Land Title (OCT/TCT)",
    remarks: "",
  });

  // Fetch entities data on view change
  const fetchEntityData = async (view: ActiveTab) => {
    setActionError(null);
    setIsLoading(true);
    try {
      if (view === "farms") {
        const res = await fetch("/api/farms");
        if (res.ok) setFarmsList(await res.json());
      } else if (view === "parcels") {
        const res = await fetch("/api/farm-parcels");
        if (res.ok) setParcelsList(await res.json());
      } else if (view === "crops") {
        const res = await fetch("/api/crops");
        if (res.ok) setCropsList(await res.json());
      } else if (view === "documents") {
        const res = await fetch("/api/land-documents");
        if (res.ok) setDocumentsList(await res.json());
      } else if (view === "farmers") {
        const res = await fetch("/api/beneficiaries");
        if (res.ok) {
          const data = await res.json();
          setFarmersList(data.items || initialBeneficiaries);
        }
      }
    } catch (err: any) {
      console.error(`Failed to load ${view} records:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntityData(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    setSearch("");
    setSearchField("ALL");
    setSelectedBarangay("ALL");
    setSelectedStatus("ALL");
    setActionSuccess(null);
    setActionError(null);
    router.push(tab === "farmers" ? basePath : `${basePath}?view=${tab}`, { scroll: false });
  };

  // --- Handlers: Archive ---
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const endpoint =
        archiveTarget.type === "farmer"
          ? `/api/beneficiaries/${archiveTarget.id}`
          : archiveTarget.type === "farm"
            ? `/api/farms/${archiveTarget.id}`
            : archiveTarget.type === "parcel"
              ? `/api/farm-parcels/${archiveTarget.id}`
              : archiveTarget.type === "crop"
                ? `/api/crops/${archiveTarget.id}`
                : `/api/land-documents/${archiveTarget.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to archive ${archiveTarget.type}`);
      }

      setActionSuccess(`${archiveTarget.name} archived successfully.`);
      setArchiveTarget(null);
      await fetchEntityData(activeTab);
      router.refresh();
    } catch (err: any) {
      setActionError(err?.message || "An error occurred while archiving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers: Create ---
  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmForm.beneficiaryId) {
      setActionError("Please select a registered farmer beneficiary.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...farmForm,
          beneficiaryId: parseInt(farmForm.beneficiaryId, 10),
          totalAreaHa: parseFloat(farmForm.totalAreaHa),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create farm landholding");
      setActionSuccess("Farm landholding created successfully.");
      setIsAddFarmOpen(false);
      await fetchEntityData("farms");
    } catch (err: any) {
      setActionError(err.message || "Failed to create farm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelForm.farmId) {
      setActionError("Please select an existing farm landholding.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/farm-parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parcelForm,
          farmId: parseInt(parcelForm.farmId, 10),
          areaHa: parseFloat(parcelForm.areaHa),
          latitude: parcelForm.latitude ? parseFloat(parcelForm.latitude) : undefined,
          longitude: parcelForm.longitude ? parseFloat(parcelForm.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add parcel plot");
      setActionSuccess("Farm parcel plot registered successfully.");
      setIsAddParcelOpen(false);
      await fetchEntityData("parcels");
    } catch (err: any) {
      setActionError(err.message || "Failed to add parcel");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropForm.parcelId) {
      setActionError("Please select a farm parcel plot.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cropForm,
          parcelId: parseInt(cropForm.parcelId, 10),
          plantedAreaHa: parseFloat(cropForm.plantedAreaHa),
          year: parseInt(cropForm.year, 10),
          expectedHarvestDate: cropForm.expectedHarvestDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record standing crop");
      setActionSuccess("Crop planting recorded successfully.");
      setIsRecordCropOpen(false);
      await fetchEntityData("crops");
    } catch (err: any) {
      setActionError(err.message || "Failed to record crop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentForm.farmerId) {
      setActionError("Please select a farmer beneficiary.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/land-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...documentForm,
          farmerId: parseInt(documentForm.farmerId, 10),
          farmId: documentForm.farmId ? parseInt(documentForm.farmId, 10) : undefined,
          fileUrl: `https://storage.local/rsbsa/${documentForm.farmerId}/${Date.now()}-${documentForm.fileName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to attach document");
      setActionSuccess("Supporting land document attached successfully.");
      setIsAttachDocOpen(false);
      await fetchEntityData("documents");
    } catch (err: any) {
      setActionError(err.message || "Failed to attach document");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers: Update ---
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
      await fetchEntityData("farms");
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
      await fetchEntityData("parcels");
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
      await fetchEntityData("crops");
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
      await fetchEntityData("documents");
    } catch (err: any) {
      setActionError(err.message || "Failed to update document");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dynamic Status Options & Real-Time Counts per Active Tab ---
  const statusOptions = useMemo(() => {
    if (activeTab === "crops") return ["ALL", ...CROP_STATUS_OPTIONS];
    if (activeTab === "documents") return ["ALL", ...DOCUMENT_STATUS_OPTIONS];
    return ["ALL", ...ENTITY_STATUS_OPTIONS];
  }, [activeTab]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    if (activeTab === "farmers") {
      counts.ALL = farmersList.length;
      farmersList.forEach((f) => {
        const s = f.status || "Active";
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (activeTab === "farms") {
      counts.ALL = farmsList.length;
      farmsList.forEach((f) => {
        const s = f.status || "Active";
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (activeTab === "parcels") {
      counts.ALL = parcelsList.length;
      parcelsList.forEach((p) => {
        const s = p.status || "Active";
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (activeTab === "crops") {
      counts.ALL = cropsList.length;
      cropsList.forEach((c) => {
        const s = c.status || "Standing";
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (activeTab === "documents") {
      counts.ALL = documentsList.length;
      documentsList.forEach((d) => {
        const s = d.verificationStatus || d.status || "Pending";
        counts[s] = (counts[s] || 0) + 1;
      });
    }
    return counts;
  }, [activeTab, farmersList, farmsList, parcelsList, cropsList, documentsList]);

  // --- Field-Aware Filtering Logic per Active Tab ---
  const filteredFarmers = useMemo(() => {
    return farmersList.filter((item) => {
      const q = search.trim().toLowerCase();
      let matchesSearch = true;
      if (q !== "") {
        if (searchField === "name") {
          matchesSearch = item.fullName.toLowerCase().includes(q);
        } else if (searchField === "rsbsa") {
          matchesSearch =
            Boolean(item.rsbsaNumber && item.rsbsaNumber.toLowerCase().includes(q)) ||
            Boolean(item.farmerCode && item.farmerCode.toLowerCase().includes(q));
        } else if (searchField === "contact") {
          matchesSearch = Boolean(item.contactNumber && item.contactNumber.toLowerCase().includes(q));
        } else if (searchField === "barangay") {
          matchesSearch = item.barangay.toLowerCase().includes(q);
        } else {
          matchesSearch =
            item.fullName.toLowerCase().includes(q) ||
            Boolean(item.rsbsaNumber && item.rsbsaNumber.toLowerCase().includes(q)) ||
            Boolean(item.farmerCode && item.farmerCode.toLowerCase().includes(q)) ||
            Boolean(item.contactNumber && item.contactNumber.toLowerCase().includes(q)) ||
            item.barangay.toLowerCase().includes(q);
        }
      }

      const matchesBarangay =
        selectedBarangay === "ALL" ||
        item.barangay.toLowerCase() === selectedBarangay.toLowerCase();

      const matchesStatus =
        selectedStatus === "ALL" ||
        item.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesBarangay && matchesStatus;
    });
  }, [farmersList, search, searchField, selectedBarangay, selectedStatus]);

  const filteredFarms = useMemo(() => {
    return farmsList.filter((item) => {
      const q = search.trim().toLowerCase();
      const farmerName = item.farmer ? `${item.farmer.firstName} ${item.farmer.lastName}` : "Unassigned";
      let matchesSearch = true;
      if (q !== "") {
        if (searchField === "farmName") {
          matchesSearch = Boolean(item.farmName && item.farmName.toLowerCase().includes(q));
        } else if (searchField === "farmer") {
          matchesSearch = farmerName.toLowerCase().includes(q);
        } else if (searchField === "barangay") {
          matchesSearch = item.barangay.toLowerCase().includes(q);
        } else {
          matchesSearch =
            Boolean(item.farmName && item.farmName.toLowerCase().includes(q)) ||
            item.barangay.toLowerCase().includes(q) ||
            farmerName.toLowerCase().includes(q) ||
            Boolean(item.farmer?.rsbsaNumber && item.farmer.rsbsaNumber.toLowerCase().includes(q));
        }
      }

      const matchesBarangay =
        selectedBarangay === "ALL" ||
        (item.barangay && item.barangay.toLowerCase() === selectedBarangay.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" ||
        item.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesBarangay && matchesStatus;
    });
  }, [farmsList, search, searchField, selectedBarangay, selectedStatus]);

  const filteredParcels = useMemo(() => {
    return parcelsList.filter((item) => {
      const q = search.trim().toLowerCase();
      const farmerName = item.farm?.farmer ? `${item.farm.farmer.firstName} ${item.farm.farmer.lastName}` : "Unassigned";
      let matchesSearch = true;
      if (q !== "") {
        if (searchField === "parcelNumber") {
          matchesSearch = item.parcelNumber.toLowerCase().includes(q);
        } else if (searchField === "farmName") {
          matchesSearch = Boolean(item.farm?.farmName && item.farm.farmName.toLowerCase().includes(q));
        } else if (searchField === "farmer") {
          matchesSearch = farmerName.toLowerCase().includes(q);
        } else {
          matchesSearch =
            item.parcelNumber.toLowerCase().includes(q) ||
            Boolean(item.farm?.farmName && item.farm.farmName.toLowerCase().includes(q)) ||
            Boolean(item.farm?.barangay && item.farm.barangay.toLowerCase().includes(q)) ||
            farmerName.toLowerCase().includes(q);
        }
      }

      const matchesBarangay =
        selectedBarangay === "ALL" ||
        Boolean(item.farm?.barangay && item.farm.barangay.toLowerCase() === selectedBarangay.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" ||
        item.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesBarangay && matchesStatus;
    });
  }, [parcelsList, search, searchField, selectedBarangay, selectedStatus]);

  const filteredCrops = useMemo(() => {
    return cropsList.filter((item) => {
      const q = search.trim().toLowerCase();
      const farmerName = item.parcel?.farm?.farmer
        ? `${item.parcel.farm.farmer.firstName} ${item.parcel.farm.farmer.lastName}`
        : "Unassigned";
      let matchesSearch = true;
      if (q !== "") {
        if (searchField === "cropType") {
          matchesSearch = item.cropType.toLowerCase().includes(q);
        } else if (searchField === "variety") {
          matchesSearch = Boolean(item.variety && item.variety.toLowerCase().includes(q));
        } else if (searchField === "farmer") {
          matchesSearch = farmerName.toLowerCase().includes(q);
        } else {
          matchesSearch =
            item.cropType.toLowerCase().includes(q) ||
            Boolean(item.variety && item.variety.toLowerCase().includes(q)) ||
            Boolean(item.parcel?.parcelNumber && item.parcel.parcelNumber.toLowerCase().includes(q)) ||
            farmerName.toLowerCase().includes(q);
        }
      }

      const matchesBarangay =
        selectedBarangay === "ALL" ||
        Boolean(item.parcel?.farm?.barangay && item.parcel.farm.barangay.toLowerCase() === selectedBarangay.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" ||
        item.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesBarangay && matchesStatus;
    });
  }, [cropsList, search, searchField, selectedBarangay, selectedStatus]);

  const filteredDocuments = useMemo(() => {
    return documentsList.filter((item) => {
      const q = search.trim().toLowerCase();
      const farmerName = item.farmer ? `${item.farmer.firstName} ${item.farmer.lastName}` : "Unassigned";
      let matchesSearch = true;
      if (q !== "") {
        if (searchField === "docType") {
          matchesSearch = item.documentType.toLowerCase().includes(q);
        } else if (searchField === "fileName") {
          matchesSearch = item.fileName.toLowerCase().includes(q);
        } else if (searchField === "farmer") {
          matchesSearch = farmerName.toLowerCase().includes(q);
        } else {
          matchesSearch =
            item.documentType.toLowerCase().includes(q) ||
            item.fileName.toLowerCase().includes(q) ||
            Boolean(item.remarks && item.remarks.toLowerCase().includes(q)) ||
            farmerName.toLowerCase().includes(q);
        }
      }

      const matchesBarangay =
        selectedBarangay === "ALL" ||
        Boolean(item.farmer?.barangay && item.farmer.barangay.toLowerCase() === selectedBarangay.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" ||
        item.verificationStatus.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesBarangay && matchesStatus;
    });
  }, [documentsList, search, searchField, selectedBarangay, selectedStatus]);

  const currentFilteredCount =
    activeTab === "farmers"
      ? filteredFarmers.length
      : activeTab === "farms"
        ? filteredFarms.length
        : activeTab === "parcels"
          ? filteredParcels.length
          : activeTab === "crops"
            ? filteredCrops.length
            : filteredDocuments.length;

  const currentTotalCount =
    activeTab === "farmers"
      ? farmersList.length
      : activeTab === "farms"
        ? farmsList.length
        : activeTab === "parcels"
          ? parcelsList.length
          : activeTab === "crops"
            ? cropsList.length
            : documentsList.length;

  const hasActiveFilters = Boolean(
    search.trim() !== "" ||
    searchField !== "ALL" ||
    selectedBarangay !== "ALL" ||
    selectedStatus !== "ALL"
  );

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar with Quick Status Pills & Field Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-none space-y-3.5">
        {/* ROW 1: Quick Status Filter Pills with Real-Time Counts */}
        <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 pb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
            Status:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusOptions.map((statusOpt) => {
              const isSelected = selectedStatus === statusOpt;
              const count = statusCounts[statusOpt] ?? 0;
              return (
                <button
                  key={statusOpt}
                  type="button"
                  onClick={() => setSelectedStatus(statusOpt)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60"
                  )}
                >
                  <span>{statusOpt === "ALL" ? "All" : statusOpt}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-600 border border-slate-200"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 2: Search by Field, Keyword, Barangay & Instant Reset */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Field Dropdown */}
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shrink-0 cursor-pointer"
              aria-label="Filter by Search Field"
              suppressHydrationWarning
            >
              {SEARCH_FIELDS[activeTab]?.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Keyword Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={getSearchPlaceholder(activeTab, searchField)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-label="Search Agricultural Records"
                suppressHydrationWarning
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Barangay Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-700 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                aria-label="Filter by Barangay"
                suppressHydrationWarning
              >
                {POLOMOLOK_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b === "ALL" ? "All Barangays" : b}
                  </option>
                ))}
              </select>
            </div>

            {/* Instant Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                title="I-reset ang lahat ng filter sa default"
              >
                <RotateCcw className="h-3 w-3 text-slate-500" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Action Button for Staff */}
          {isStaff && (
            <div className="shrink-0">
              {activeTab === "farmers" && (
                <Link
                  href={`${basePath}/new`}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Add Beneficiary
                </Link>
              )}
              {activeTab === "farms" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddFarmOpen(true)}
                  className="text-xs h-8 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Add Farm Landholding
                </Button>
              )}
              {activeTab === "parcels" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddParcelOpen(true)}
                  className="text-xs h-8 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Add Farm Parcel
                </Button>
              )}
              {activeTab === "crops" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRecordCropOpen(true)}
                  className="text-xs h-8 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Record Crop Planting
                </Button>
              )}
              {activeTab === "documents" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAttachDocOpen(true)}
                  className="text-xs h-8 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Attach Land Document
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ROW 3: Results Counter & Active Filter Badge */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800 font-bold">{currentFilteredCount}</strong> of{" "}
            <strong className="text-slate-800 font-bold">{currentTotalCount}</strong> recorded {activeTab}
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              ● Filtered view active
            </span>
          )}
        </div>

        {/* Notices */}
        {actionSuccess && (
          <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 rounded border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-800">
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"
              aria-hidden="true"
            />
            <span>Loading latest {activeTab} records…</span>
          </div>
        )}
      </div>

      {/* View Tab Navigation — URL-driven deep links shared with the sidebar menu */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-none">
        {TAB_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
                  : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              }
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FARMERS / RSBSA TABLE */}
      {activeTab === "farmers" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">RSBSA / Reg ID</th>
                  <th scope="col" className="px-4 py-3">Beneficiary Name</th>
                  <th scope="col" className="px-4 py-3">Barangay</th>
                  <th scope="col" className="px-4 py-3">Contact</th>
                  <th scope="col" className="px-4 py-3">Sector</th>
                  <th scope="col" className="px-4 py-3">Farm Area</th>
                  <th scope="col" className="px-4 py-3">Crops</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="w-5 p-0" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-800">
                        {item.rsbsaNumber || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.barangay}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {item.contactNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.farmerCode || "Smallholder"}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {item.totalHectares > 0 ? `${item.totalHectares} ha` : "0 ha"}
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({item.parcelCount} {item.parcelCount === 1 ? "parcel" : "parcels"})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.activeCrops.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.activeCrops.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800 border border-emerald-200"
                              >
                                {c}
                              </span>
                            ))}
                            {item.activeCrops.length > 2 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{item.activeCrops.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None logged</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={item.status === "Active" ? "success" : "neutral"}
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="w-5 p-0 text-right align-middle leading-none">
                        <RowActionsMenu
                          label={item.fullName}
                          actions={[
                            {
                              label: isStaff ? "Manage beneficiary" : "Review beneficiary",
                              icon: <Eye className="h-4 w-4" />,
                              href: `${basePath}/${item.id}`,
                            },
                            isStaff && item.status !== "Archived" && {
                              label: "Archive beneficiary",
                              icon: <Archive className="h-4 w-4" />,
                              danger: true,
                              onClick: () => setArchiveTarget({ type: "farmer", id: item.id, name: item.fullName }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 border border-slate-200">
                        <FileText className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Walang natagpuang beneficiary records</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Walang talaang tumutugma sa iyong search keyword, barangay, o status filter.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3 text-slate-500" />
                          Reset Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{filteredFarmers.length}</strong> of{" "}
              <strong className="text-slate-700">{totalCount}</strong> recorded beneficiaries
            </span>
            <span className="text-[11px] text-slate-500">
              RSBSA Centralized Municipal Registry
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: FARMS TABLE */}
      {activeTab === "farms" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Farm Name / Code</th>
                  <th scope="col" className="px-4 py-3">Registered Farmer</th>
                  <th scope="col" className="px-4 py-3">Barangay Location</th>
                  <th scope="col" className="px-4 py-3">Total Area</th>
                  <th scope="col" className="px-4 py-3">Tenure Type</th>
                  <th scope="col" className="px-4 py-3">Water Source</th>
                  <th scope="col" className="px-4 py-3">Parcels</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="w-5 p-0" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredFarms.length > 0 ? (
                  filteredFarms.map((farm) => {
                    const farmerName = farm.farmer
                      ? `${farm.farmer.firstName} ${farm.farmer.lastName}`
                      : "Unassigned";
                    return (
                      <tr key={farm.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {farm.farmName || `Farm #${farm.id}`}
                        </td>
                        <td className="px-4 py-3">
                          {farm.farmer ? (
                            <Link
                              href={`${basePath}/${farm.farmer.id}`}
                              className="font-medium text-emerald-700 hover:underline"
                            >
                              {farmerName}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                          {farm.farmer?.rsbsaNumber && (
                            <p className="font-mono text-[10px] text-slate-400">
                              {farm.farmer.rsbsaNumber}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          Brgy. {farm.barangay}
                          {farm.sitioPurok && (
                            <span className="text-[11px] text-slate-400 block">
                              {farm.sitioPurok}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {farm.totalAreaHa} ha
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" size="sm">
                            {farm.tenureType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {farm.waterSource || "Rainfed"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono">
                          {farm.parcels?.length || 0}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={farm.status === "Active" ? "success" : "neutral"}
                            size="sm"
                          >
                            {farm.status}
                          </Badge>
                        </td>
                        <td className="w-5 p-0 text-right align-middle leading-none">
                          <RowActionsMenu
                            label={farm.farmName || `Farm #${farm.id}`}
                            actions={[
                              isStaff && farm.status !== "Archived" && {
                                label: "Edit farm",
                                icon: <Edit className="h-4 w-4" />,
                                onClick: () => {
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
                                },
                              },
                              isStaff && farm.status !== "Archived" && {
                                label: "Archive farm",
                                icon: <Archive className="h-4 w-4" />,
                                danger: true,
                                onClick: () => setArchiveTarget({ type: "farm", id: farm.id, name: farm.farmName || `Farm #${farm.id}` }),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 border border-slate-200">
                        <Layers className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Walang natagpuang farm landholdings</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Walang talaang tumutugma sa napiling filter o search query.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3 text-slate-500" />
                          Reset Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{filteredFarms.length}</strong> farm holdings
            </span>
            <span className="text-[11px] text-slate-500">
              Registered Farm Parcels &amp; Landholdings
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: FARM PARCELS TABLE */}
      {activeTab === "parcels" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Parcel / Lot ID</th>
                  <th scope="col" className="px-4 py-3">Parent Farm</th>
                  <th scope="col" className="px-4 py-3">Registered Farmer</th>
                  <th scope="col" className="px-4 py-3">Plot Area</th>
                  <th scope="col" className="px-4 py-3">Centroid Location</th>
                  <th scope="col" className="px-4 py-3">Standing Crop</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="w-5 p-0" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredParcels.length > 0 ? (
                  filteredParcels.map((parcel) => {
                    const farmerName = parcel.farm?.farmer
                      ? `${parcel.farm.farmer.firstName} ${parcel.farm.farmer.lastName}`
                      : "Unassigned";
                    const activeCrops = (parcel.crops || []).filter(
                      (c: any) => c.status !== "Archived"
                    );
                    const latestCrop = activeCrops[0];

                    return (
                      <tr key={parcel.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {parcel.parcelNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {parcel.farm?.farmName || `Farm #${parcel.farmId}`}
                          <span className="text-[10px] text-slate-400 block">
                            Brgy. {parcel.farm?.barangay}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {parcel.farm?.farmer ? (
                            <Link
                              href={`${basePath}/${parcel.farm.farmer.id}`}
                              className="font-medium text-emerald-700 hover:underline"
                            >
                              {farmerName}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {parcel.areaHa} ha
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {parcel.latitude && parcel.longitude ? (
                            <span>
                              {Number(parcel.latitude).toFixed(4)}°N, {Number(parcel.longitude).toFixed(4)}°E
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No coordinates</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {latestCrop ? (
                            <Badge
                              variant={latestCrop.status === "Standing" ? "success" : "neutral"}
                              size="sm"
                            >
                              {latestCrop.cropType} ({latestCrop.plantedAreaHa} ha)
                            </Badge>
                          ) : (
                            <span className="text-slate-400 italic">No standing crop</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={parcel.status === "Active" ? "success" : "neutral"}
                            size="sm"
                          >
                            {parcel.status}
                          </Badge>
                        </td>
                        <td className="w-5 p-0 text-right align-middle leading-none">
                          <RowActionsMenu
                            label={`Parcel ${parcel.parcelNumber}`}
                            actions={[
                              Boolean(parcel.farm?.farmer) && {
                                label: "View farmer dossier",
                                icon: <Eye className="h-4 w-4" />,
                                href: `${basePath}/${parcel.farm?.farmer?.id}`,
                              },
                              isStaff && parcel.status !== "Archived" && {
                                label: "Edit parcel",
                                icon: <Edit className="h-4 w-4" />,
                                onClick: () => {
                                  setEditParcelForm({
                                    parcelNumber: parcel.parcelNumber || "LOT-01",
                                    areaHa: String(parcel.areaHa || 1.0),
                                    latitude: parcel.latitude ? String(parcel.latitude) : "6.2189",
                                    longitude: parcel.longitude ? String(parcel.longitude) : "125.0645",
                                    remarks: parcel.remarks || "",
                                  });
                                  setEditingParcel(parcel);
                                },
                              },
                              isStaff && parcel.status !== "Archived" && {
                                label: "Archive parcel",
                                icon: <Archive className="h-4 w-4" />,
                                danger: true,
                                onClick: () => setArchiveTarget({ type: "parcel", id: parcel.id, name: `Parcel ${parcel.parcelNumber}` }),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 border border-slate-200">
                        <MapPin className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Walang natagpuang farm parcels</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Walang lote o pitak na tumutugma sa iyong filter.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3 text-slate-500" />
                          Reset Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{filteredParcels.length}</strong> georeferenced parcels
            </span>
            <span className="text-[11px] text-slate-500">
              Farm Parcel Plot Registry
            </span>
          </div>
        </div>
      )}

      {/* TAB 4: CROPS TABLE */}
      {activeTab === "crops" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Crop Commodity</th>
                  <th scope="col" className="px-4 py-3">Variety / Seed</th>
                  <th scope="col" className="px-4 py-3">Parcel &amp; Farm</th>
                  <th scope="col" className="px-4 py-3">Farmer</th>
                  <th scope="col" className="px-4 py-3">Planted Area</th>
                  <th scope="col" className="px-4 py-3">Season &amp; Year</th>
                  <th scope="col" className="px-4 py-3">Planting Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="w-5 p-0" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCrops.length > 0 ? (
                  filteredCrops.map((crop) => {
                    const farmer = crop.parcel?.farm?.farmer;
                    const farmerName = farmer
                      ? `${farmer.firstName} ${farmer.lastName}`
                      : "Unassigned";

                    return (
                      <tr key={crop.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {crop.cropType}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {crop.variety || "Standard"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-800 font-semibold">
                            {crop.parcel?.parcelNumber || "Plot"}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {crop.parcel?.farm?.farmName || "Farm"} (Brgy. {crop.parcel?.farm?.barangay})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {farmer ? (
                            <Link
                              href={`${basePath}/${farmer.id}`}
                              className="font-medium text-emerald-700 hover:underline"
                            >
                              {farmerName}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {crop.plantedAreaHa} ha
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {crop.season} {crop.year}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {crop.plantingDate
                            ? new Date(crop.plantingDate).toISOString().split("T")[0]
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={crop.status === "Standing" ? "success" : "neutral"}
                            size="sm"
                          >
                            {crop.status}
                          </Badge>
                        </td>
                        <td className="w-5 p-0 text-right align-middle leading-none">
                          <RowActionsMenu
                            label={`${crop.cropType} Crop`}
                            actions={[
                              Boolean(farmer) && {
                                label: "View farmer dossier",
                                icon: <Eye className="h-4 w-4" />,
                                href: `${basePath}/${farmer?.id}`,
                              },
                              isStaff && crop.status !== "Archived" && {
                                label: "Edit crop",
                                icon: <Edit className="h-4 w-4" />,
                                onClick: () => {
                                  setEditCropForm({
                                    cropType: crop.cropType || "Corn (Yellow)",
                                    variety: crop.variety || "",
                                    category: crop.category || "Grain",
                                    plantedAreaHa: String(crop.plantedAreaHa || 1.0),
                                    plantingDate: crop.plantingDate
                                      ? new Date(crop.plantingDate).toISOString().split("T")[0]
                                      : new Date().toISOString().split("T")[0],
                                    expectedHarvestDate: crop.expectedHarvestDate
                                      ? new Date(crop.expectedHarvestDate).toISOString().split("T")[0]
                                      : "",
                                    season: crop.season || "Wet",
                                    year: String(crop.year || new Date().getFullYear()),
                                    status: crop.status || "Standing",
                                    remarks: crop.remarks || "",
                                  });
                                  setEditingCrop(crop);
                                },
                              },
                              isStaff && crop.status !== "Archived" && {
                                label: "Archive crop",
                                icon: <Archive className="h-4 w-4" />,
                                danger: true,
                                onClick: () => setArchiveTarget({ type: "crop", id: crop.id, name: `${crop.cropType} Crop` }),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 border border-slate-200">
                        <Sprout className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Walang natagpuang crop planting records</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Walang pananim na tumutugma sa iyong status o search query.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3 text-slate-500" />
                          Reset Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{filteredCrops.length}</strong> crop records
            </span>
            <span className="text-[11px] text-slate-500">
              Standing &amp; Historical Crop Production Records
            </span>
          </div>
        </div>
      )}

      {/* TAB 5: LAND DOCUMENTS TABLE */}
      {activeTab === "documents" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Document Type</th>
                  <th scope="col" className="px-4 py-3">File Reference / Label</th>
                  <th scope="col" className="px-4 py-3">Associated Farmer</th>
                  <th scope="col" className="px-4 py-3">Related Farm</th>
                  <th scope="col" className="px-4 py-3">File Size</th>
                  <th scope="col" className="px-4 py-3">Uploaded Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="w-5 p-0" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => {
                    const farmer = doc.farmer;
                    const farmerName = farmer
                      ? `${farmer.firstName} ${farmer.lastName}`
                      : "Unassigned";

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <Badge variant="info" size="sm">
                            {doc.documentType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {doc.fileName}
                          {doc.remarks && (
                            <p className="text-[10px] text-slate-400">{doc.remarks}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {farmer ? (
                            <Link
                              href={`${basePath}/${farmer.id}`}
                              className="font-medium text-emerald-700 hover:underline"
                            >
                              {farmerName}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {doc.farm?.farmName || "General Dossier"}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {((doc.fileSizeBytes || 102400) / 1024).toFixed(0)} KB
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(doc.createdAt).toISOString().split("T")[0]}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={doc.verificationStatus === "Archived" ? "danger" : "neutral"}
                            size="sm"
                          >
                            {doc.verificationStatus}
                          </Badge>
                        </td>
                        <td className="w-5 p-0 text-right align-middle leading-none">
                          <RowActionsMenu
                            label={doc.fileName || doc.documentType}
                            actions={[
                              Boolean(farmer) && {
                                label: "View farmer dossier",
                                icon: <Eye className="h-4 w-4" />,
                                href: `${basePath}/${farmer?.id}`,
                              },
                              isStaff && doc.verificationStatus !== "Archived" && {
                                label: "Edit document",
                                icon: <Edit className="h-4 w-4" />,
                                onClick: () => {
                                  setEditDocumentForm({
                                    documentType: doc.documentType || "Land Title (OCT/TCT)",
                                    remarks: doc.remarks || "",
                                  });
                                  setEditingDocument(doc);
                                },
                              },
                              isStaff && doc.verificationStatus !== "Archived" && {
                                label: "Archive document",
                                icon: <Archive className="h-4 w-4" />,
                                danger: true,
                                onClick: () => setArchiveTarget({ type: "document", id: doc.id, name: doc.fileName }),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5 border border-slate-200">
                        <FileText className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Walang natagpuang land documents</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Walang dokumento o titulo na tumutugma sa napiling criteria.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3 text-slate-500" />
                          Reset Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{filteredDocuments.length}</strong> supporting documents
            </span>
            <span className="text-[11px] text-slate-500">
              Land Titles &amp; Supporting Documentation
            </span>
          </div>
        </div>
      )}


      {/* MODAL 2: ADD FARM LANDHOLDING */}
      <Modal
        isOpen={isAddFarmOpen}
        onClose={() => setIsAddFarmOpen(false)}
        title="Register Farm Landholding"
        subtitle="Add a farm holding associated with a registered beneficiary."
        size="2xl"
      >
        <form onSubmit={handleCreateFarm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Farmer Beneficiary *
              </label>
              <select
                required
                value={farmForm.beneficiaryId}
                onChange={(e) => setFarmForm({ ...farmForm, beneficiaryId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— Select Beneficiary —</option>
                {farmersList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fullName} (RSBSA: {f.rsbsaNumber || "None"}) — Brgy. {f.barangay}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm Name *</label>
              <input
                type="text"
                required
                value={farmForm.farmName}
                onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                placeholder="e.g. Polomolok Ricefield Plot A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Barangay Location *</label>
              <select
                value={farmForm.barangay}
                onChange={(e) => setFarmForm({ ...farmForm, barangay: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {POLOMOLOK_BARANGAYS.filter((b) => b !== "ALL").map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Farm Area (Hectares) *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sitio / Purok</label>
              <input
                type="text"
                value={farmForm.sitioPurok}
                onChange={(e) => setFarmForm({ ...farmForm, sitioPurok: e.target.value })}
                placeholder="e.g. Purok 3"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Water Source</label>
              <input
                type="text"
                value={farmForm.waterSource}
                onChange={(e) => setFarmForm({ ...farmForm, waterSource: e.target.value })}
                placeholder="e.g. Rainfed, Irrigated"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddFarmOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Save Farm Landholding"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDIT FARM LANDHOLDING */}
      <Modal
        isOpen={!!editingFarm}
        onClose={() => setEditingFarm(null)}
        title="Edit Farm Landholding"
        subtitle={`Updating farm: ${editingFarm?.farmName || "Farm"}`}
        size="2xl"
      >
        <form onSubmit={handleUpdateFarm} className="space-y-4">
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
                {POLOMOLOK_BARANGAYS.filter((b) => b !== "ALL").map((b) => (
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

      {/* MODAL 4: ADD FARM PARCEL */}
      <Modal
        isOpen={isAddParcelOpen}
        onClose={() => setIsAddParcelOpen(false)}
        title="Add Georeferenced Farm Parcel"
        subtitle="Subdivide a farm landholding into a surveyed parcel plot."
        size="2xl"
      >
        <form onSubmit={handleCreateParcel} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Farm Landholding *
              </label>
              <select
                required
                value={parcelForm.farmId}
                onChange={(e) => setParcelForm({ ...parcelForm, farmId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— Select Farm —</option>
                {farmsList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farmName || `Farm #${f.id}`} (Brgy. {f.barangay}) — {f.farmer ? `${f.farmer.firstName} ${f.farmer.lastName}` : "No farmer"}
                  </option>
                ))}
              </select>
            </div>
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
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddParcelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Parcel Plot"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: EDIT FARM PARCEL */}
      <Modal
        isOpen={!!editingParcel}
        onClose={() => setEditingParcel(null)}
        title="Edit Farm Parcel"
        subtitle={`Updating parcel: ${editingParcel?.parcelNumber || "Plot"}`}
        size="2xl"
      >
        <form onSubmit={handleUpdateParcel} className="space-y-4">
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

      {/* MODAL 6: RECORD CROP */}
      <Modal
        isOpen={isRecordCropOpen}
        onClose={() => setIsRecordCropOpen(false)}
        title="Record Standing Crop Cycle"
        subtitle="Register standing crop commodities under an active farm parcel."
        size="2xl"
      >
        <form onSubmit={handleCreateCrop} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Farm Parcel Plot *
              </label>
              <select
                required
                value={cropForm.parcelId}
                onChange={(e) => setCropForm({ ...cropForm, parcelId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— Select Parcel Plot —</option>
                {parcelsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.parcelNumber} ({p.areaHa} ha) — {p.farm?.farmName || "Farm"} (Brgy. {p.farm?.barangay})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Commodity Type *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variety / Seed Cultivar</label>
              <input
                type="text"
                value={cropForm.variety}
                onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                placeholder="e.g. Hybrid NK8840"
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
                value={cropForm.plantedAreaHa}
                onChange={(e) => setCropForm({ ...cropForm, plantedAreaHa: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Harvest Date</label>
              <input
                type="date"
                value={cropForm.expectedHarvestDate}
                onChange={(e) => setCropForm({ ...cropForm, expectedHarvestDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Season</label>
              <select
                value={cropForm.season}
                onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Wet">Wet Season</option>
                <option value="Dry">Dry Season</option>
                <option value="Year-round">Year-round</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRecordCropOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Save Crop Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 7: EDIT CROP RECORD */}
      <Modal
        isOpen={!!editingCrop}
        onClose={() => setEditingCrop(null)}
        title="Edit Standing Crop Record"
        subtitle={`Updating crop: ${editingCrop?.cropType || "Crop"}`}
        size="2xl"
      >
        <form onSubmit={handleUpdateCrop} className="space-y-4">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
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

      {/* MODAL 8: ATTACH LAND DOCUMENT */}
      <Modal
        isOpen={isAttachDocOpen}
        onClose={() => setIsAttachDocOpen(false)}
        title="Attach Supporting Land Document"
        subtitle="Upload or record Land Titles (OCT/TCT), valid IDs, or agrarian certificates."
        size="2xl"
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associated Farmer Beneficiary *
              </label>
              <select
                required
                value={documentForm.farmerId}
                onChange={(e) => setDocumentForm({ ...documentForm, farmerId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— Select Farmer —</option>
                {farmersList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fullName} (RSBSA: {f.rsbsaNumber || "None"})
                  </option>
                ))}
              </select>
            </div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Related Farm (Optional)</label>
              <select
                value={documentForm.farmId}
                onChange={(e) => setDocumentForm({ ...documentForm, farmId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">— General / Not Farm Specific —</option>
                {farmsList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farmName || `Farm #${f.id}`} (Brgy. {f.barangay})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                value={documentForm.remarks}
                onChange={(e) => setDocumentForm({ ...documentForm, remarks: e.target.value })}
                placeholder="e.g. Verified against official municipal registry"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAttachDocOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Attaching..." : "Attach Land Document"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 9: EDIT LAND DOCUMENT */}
      <Modal
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        title="Edit Supporting Land Document"
        subtitle={`Updating document record`}
        size="lg"
      >
        <form onSubmit={handleUpdateDocument} className="space-y-4">
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

      {/* STANDARDIZED ARCHIVE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        title={`Archive ${archiveTarget?.type === "farmer"
            ? "Beneficiary Profile"
            : archiveTarget?.type === "farm"
              ? "Farm Landholding"
              : archiveTarget?.type === "parcel"
                ? "Farm Parcel Plot"
                : archiveTarget?.type === "crop"
                  ? "Crop Planting Record"
                  : "Supporting Document"
          }`}
        subtitle="Confirm deactivation of municipal agricultural record"
        itemName={archiveTarget?.name}
        message="This record will be moved to archived records and hidden from the active municipal registry. In accordance with OMAG audit standards, this action is non-destructive and will be recorded in the immutable audit trail."
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
        initialBarangay={farmsList.find((f: any) => String(f.id) === String(parcelForm.farmId))?.barangay || "Poblacion"}
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
        initialBarangay={farmsList.find((f: any) => String(f.id) === String(editingParcel?.farmId))?.barangay || "Poblacion"}
        onSelectCoordinates={(lat, lng) => {
          setEditParcelForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        title="I-update ang Centroid ng Farm Parcel"
        subtitle="I-click o i-drag ang pin sa eksaktong lokasyon ng lote sa Polomolok."
      />
    </div>
  );
};
