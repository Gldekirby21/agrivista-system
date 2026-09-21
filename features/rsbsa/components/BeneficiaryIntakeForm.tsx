"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Layers,
  MapPin,
  Sprout,
  FileText,
  ShieldCheck,
  Check,
  HeartHandshake,
  Accessibility,
  Users,
  Compass,
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Phone,
  Mail,
  FileCheck,
  Copy,
  CheckCheck,
  Navigation,
  Wheat,
  UploadCloud,
  ChevronRight,
  Calculator,
  QrCode,
  Globe2,
  Clock,
  TrendingUp,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { generateRsbsaNumber } from "@/features/rsbsa/lib/rsbsaUtils";
import { Button } from "@/components/ui/Button";
import { MapCoordinatePickerModal } from "@/components/maps/MapCoordinatePickerModal";

// ─── Municipal Constants ──────────────────────────────────────────────────────
const POLOMOLOK_BARANGAYS = [
  "Bentung", "Cannery Site", "Crossing Pangi", "Glamang", "Kinilis",
  "Klinan 6", "Koronadal Proper", "Lam-caliaf", "Lapu", "Lumakil",
  "Maligo", "Magsaysay", "Pagalungan", "Poblacion", "Polo", "Rubber",
  "Silway 7", "Silway 8", "Sulit", "Sumbakil", "Upper Klinan",
];

const TENURE_OPTIONS = [
  { id: "Owned", label: "Owner-Cultivator", desc: "Titled / OCT / TCT", icon: "🏡" },
  { id: "Tenant", label: "Tenant Cultivator", desc: "Share / Leasehold", icon: "🤝" },
  { id: "Leased", label: "Leaseholder", desc: "Contract of Lease", icon: "📜" },
  { id: "Beneficiary (DAR)", label: "DAR CLOA", desc: "Agrarian Reform", icon: "🎖️" },
  { id: "Usufructuary", label: "Usufruct", desc: "Grant of Cultivation", icon: "🌱" },
  { id: "Mortgaged", label: "Mortgaged", desc: "Collateralized Holding", icon: "🏦" },
];

const COMMODITY_PRESETS = [
  { name: "Corn (Yellow)", icon: "🌽", category: "Grain", avgYield: 4.8, maturityDays: 115 },
  { name: "Rice (Palay)", icon: "🌾", category: "Grain", avgYield: 4.2, maturityDays: 120 },
  { name: "Pineapple", icon: "🍍", category: "High-Value Commercial", avgYield: 35.0, maturityDays: 540 },
  { name: "Banana (Cavendish)", icon: "🍌", category: "Fruit", avgYield: 28.0, maturityDays: 270 },
  { name: "Corn (White)", icon: "🌽", category: "Grain", avgYield: 3.5, maturityDays: 110 },
  { name: "Cassava", icon: "🍠", category: "Tuber / Industrial", avgYield: 22.0, maturityDays: 300 },
  { name: "Vegetables (Highland)", icon: "🥬", category: "High-Value Horticulture", avgYield: 15.0, maturityDays: 75 },
  { name: "Coffee", icon: "☕", category: "Industrial Commercial", avgYield: 1.8, maturityDays: 365 },
  { name: "Cacao", icon: "🍫", category: "Industrial Commercial", avgYield: 2.1, maturityDays: 365 },
  { name: "Coconut", icon: "🌴", category: "Industrial Commercial", avgYield: 5.5, maturityDays: 365 },
];

const DOC_TYPES = [
  { type: "Land Title (OCT/TCT)", label: "Original / Transfer Certificate of Title (OCT/TCT)", icon: "📜" },
  { type: "Tax Declaration", label: "Real Property Tax Declaration", icon: "🏛️" },
  { type: "Certificate of Land Ownership Award (CLOA)", label: "DAR Certificate of Land Ownership (CLOA)", icon: "🎖️" },
  { type: "Deed of Sale", label: "Deed of Absolute Sale / Transfer", icon: "📑" },
  { type: "Lease Contract / Usufruct Agreement", label: "Agricultural Lease / Usufruct Contract", icon: "📋" },
  { type: "Barangay Certification", label: "Barangay Agricultural Residency Certification", icon: "🏷️" },
  { type: "Government-Issued Valid ID", label: "Government ID (PhilSys, Driver's License, Voter's)", icon: "🪪" },
  { type: "RSBSA Registration Form", label: "DA RSBSA Physical Enrollment Intake Form", icon: "📄" },
];

const WATER_SOURCES = [
  { id: "Rainfed", label: "Rainfed Upland", icon: "🌧️" },
  { id: "National Irrigation System (NIS)", label: "National Irrigation (NIS)", icon: "💧" },
  { id: "Communal Irrigation (CIS)", label: "Communal Irrigation (CIS)", icon: "🏞️" },
  { id: "Deep Well / Shallow Tube Well", label: "Deep Well / Pump", icon: "🚰" },
  { id: "Spring / River", label: "Natural Spring / Creek", icon: "🌊" },
];

const SOIL_TYPES = [
  { id: "Clay Loam", label: "Clay Loam (Rich & Heavy)", icon: "🧱" },
  { id: "Sandy Loam", label: "Sandy Loam (Well Drained)", icon: "🏖️" },
  { id: "Volcanic Loam (Mt. Matutum)", label: "Volcanic Loam (Rich Slopes)", icon: "🌋" },
  { id: "Silt Loam", label: "Silt Loam (Alluvial Plain)", icon: "🪨" },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-2xs";
const selectCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer shadow-2xs";
const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5";

interface BeneficiaryIntakeFormProps {
  baseHref?: string;
  userRole?: "OMAG_STAFF" | "OMAG_HEAD";
}

export const BeneficiaryIntakeForm: React.FC<BeneficiaryIntakeFormProps> = ({
  baseHref = "/staff/beneficiaries",
  userRole = "OMAG_STAFF",
}) => {
  const router = useRouter();

  // ── Form State ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    extensionName: "",
    farmerCode: "Farmer / Land Owner",
    barangay: "Poblacion",
    contactNumber: "",
    email: "",
    sex: "Male",
    dateOfBirth: "",
    civilStatus: "Married",
    isSenior: false,
    isPwd: false,
    is4ps: false,
    isIp: false,
  });

  const [rsbsaId, setRsbsaId] = useState("");
  const [copiedRsbsa, setCopiedRsbsa] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Section Toggles
  const [includeFarm, setIncludeFarm] = useState(true);
  const [includeParcel, setIncludeParcel] = useState(true);
  const [includeCrop, setIncludeCrop] = useState(true);
  const [includeDoc, setIncludeDoc] = useState(false);

  // Section 2: Farm
  const [farm, setFarm] = useState({
    farmName: "",
    barangay: "Poblacion",
    sitioPurok: "",
    totalAreaHa: "1.0",
    tenureType: "Owned",
    soilType: "Clay Loam",
    waterSource: "Rainfed",
    remarks: "",
  });

  // Section 3: Parcel
  const [parcel, setParcel] = useState({
    parcelNumber: "LOT-01",
    areaHa: "1.0",
    latitude: "6.2189",
    longitude: "125.0645",
    remarks: "",
  });

  // Section 4: Crop
  const [crop, setCrop] = useState({
    cropType: "Corn (Yellow)",
    variety: "Hybrid Pioneer 30Y87",
    category: "Grain",
    plantedAreaHa: "1.0",
    plantingDate: new Date().toISOString().split("T")[0],
    expectedHarvestDate: "",
    season: "Wet",
    year: new Date().getFullYear().toString(),
    status: "Standing",
    remarks: "",
  });

  // Section 5: Land Document
  const [landDoc, setLandDoc] = useState({
    documentType: "Land Title (OCT/TCT)",
    fileName: "",
    remarks: "",
  });

  // Active section for quick jump
  const [activeSection, setActiveSection] = useState("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize auto-generated RSBSA ID on client
  useEffect(() => {
    setRsbsaId(generateRsbsaNumber("Poblacion"));
  }, []);

  // Compute expected harvest date automatically based on commodity preset
  useEffect(() => {
    if (crop.plantingDate) {
      const preset = COMMODITY_PRESETS.find((c) => c.name === crop.cropType);
      const days = preset ? preset.maturityDays : 110;
      const pDate = new Date(crop.plantingDate);
      if (!isNaN(pDate.getTime())) {
        const hDate = new Date(pDate.getTime() + days * 24 * 60 * 60 * 1000);
        setCrop((prev) => ({
          ...prev,
          expectedHarvestDate: hDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [crop.cropType, crop.plantingDate]);

  const handleBarangayChange = (b: string) => {
    setProfile((prev) => ({ ...prev, barangay: b }));
    setFarm((prev) => ({ ...prev, barangay: b }));
    setRsbsaId(generateRsbsaNumber(b));
  };

  const handleCopyRsbsa = () => {
    if (rsbsaId && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(rsbsaId);
      setCopiedRsbsa(true);
      setTimeout(() => setCopiedRsbsa(false), 2000);
    }
  };

  const handleApplyCommodityPreset = (preset: typeof COMMODITY_PRESETS[0]) => {
    setCrop((prev) => ({
      ...prev,
      cropType: preset.name,
      category: preset.category,
      variety: preset.name.includes("Corn") ? "Hybrid Pioneer 30Y87" : preset.name.includes("Rice") ? "NSIC Rc222" : "Local Certified",
    }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (typeof window !== "undefined") {
      const element = window.document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleReset = () => {
    if (confirm("Reset the entire registration form? All unsaved inputs will be cleared.")) {
      setProfile({
        firstName: "",
        middleName: "",
        lastName: "",
        extensionName: "",
        farmerCode: "Farmer / Land Owner",
        barangay: "Poblacion",
        contactNumber: "",
        email: "",
        sex: "Male",
        dateOfBirth: "",
        civilStatus: "Married",
        isSenior: false,
        isPwd: false,
        is4ps: false,
        isIp: false,
      });
      setFarm({
        farmName: "",
        barangay: "Poblacion",
        sitioPurok: "",
        totalAreaHa: "1.0",
        tenureType: "Owned",
        soilType: "Clay Loam",
        waterSource: "Rainfed",
        remarks: "",
      });
      setParcel({
        parcelNumber: "LOT-01",
        areaHa: "1.0",
        latitude: "6.2189",
        longitude: "125.0645",
        remarks: "",
      });
      setCrop({
        cropType: "Corn (Yellow)",
        variety: "Hybrid Pioneer 30Y87",
        category: "Grain",
        plantedAreaHa: "1.0",
        plantingDate: new Date().toISOString().split("T")[0],
        expectedHarvestDate: "",
        season: "Wet",
        year: new Date().getFullYear().toString(),
        status: "Standing",
        remarks: "",
      });
      setLandDoc({
        documentType: "Land Title (OCT/TCT)",
        fileName: "",
        remarks: "",
      });
      setRsbsaId(generateRsbsaNumber("Poblacion"));
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fn = profile.firstName.trim();
    const ln = profile.lastName.trim();
    if (!fn && !ln) {
      setErrorMessage("Please provide at least the beneficiary's First or Last Name.");
      scrollToSection("profile");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        profile: {
          ...profile,
          rsbsaNumber: rsbsaId,
        },
        farm: includeFarm
          ? {
              ...farm,
              includeFarm: true,
            }
          : null,
        parcel: includeFarm && includeParcel
          ? {
              ...parcel,
              includeParcel: true,
            }
          : null,
        crop: includeFarm && includeParcel && includeCrop
          ? {
              ...crop,
              includeCrop: true,
            }
          : null,
        document: includeDoc
          ? {
              ...landDoc,
              includeDocument: true,
            }
          : null,
      };

      const res = await fetch("/api/beneficiaries/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register beneficiary record.");
      }

      setSuccessMessage("Beneficiary and associated agricultural records created successfully!");
      setTimeout(() => {
        router.push(`${baseHref}/${data.beneficiaryId}`);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during submission.");
      setIsSubmitting(false);
    }
  };

  // Helper values
  const fullNameDisplay =
    [profile.firstName, profile.middleName, profile.lastName, profile.extensionName]
      .filter(Boolean)
      .join(" ") || "New Beneficiary";

  const initials =
    ((profile.firstName[0] || "") + (profile.lastName[0] || "")).toUpperCase() || "NB";

  const farmAreaNumber = parseFloat(farm.totalAreaHa) || 1.0;
  const squareMeters = (farmAreaNumber * 10000).toLocaleString();

  const selectedCommodity = COMMODITY_PRESETS.find((c) => c.name === crop.cropType);
  const estYieldTons = (farmAreaNumber * (selectedCommodity?.avgYield || 4.0)).toFixed(1);

  // Sections list for anchor navigation
  const sections = [
    { id: "profile", label: "1. Beneficiary Profile", icon: User, badge: "Core" },
    {
      id: "farm",
      label: "2. Farm Landholding",
      icon: Layers,
      enabled: includeFarm,
      badge: includeFarm ? `${farm.totalAreaHa} ha` : "Skipped",
    },
    {
      id: "parcel",
      label: "3. Farm Parcel",
      icon: MapPin,
      enabled: includeFarm && includeParcel,
      badge: includeFarm && includeParcel ? parcel.parcelNumber : "Skipped",
    },
    {
      id: "crop",
      label: "4. Standing Crops",
      icon: Sprout,
      enabled: includeFarm && includeParcel && includeCrop,
      badge: includeFarm && includeParcel && includeCrop ? crop.cropType.split(" ")[0] : "Skipped",
    },
    {
      id: "document",
      label: "5. Land Documents",
      icon: FileText,
      enabled: includeDoc,
      badge: includeDoc ? "Attached" : "Skipped",
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header & Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link
              href={baseHref}
              className="inline-flex items-center text-slate-500 hover:text-emerald-600 transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Beneficiary Directory
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-bold">New Registration Intake</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              RSBSA Beneficiary &amp; Farm Intake
            </h1>
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
              OMAG Polomolok Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Single unified intake form for enrolling farmer profile, landholding, parcel plot, standing crops, and land titles in one seamless record.
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSubmitting}
            className="text-xs h-9 px-3 border-slate-300 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Reset Form
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs h-9 px-4 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Saving Records…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Register Beneficiary Record
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Official DA / RSBSA Card Preview ── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 p-5 text-white shadow-md">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Official DA Header & Details */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md font-black text-xl tracking-tight shrink-0 border-2 border-white/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-300 border border-emerald-400/30">
                  DA-RFO XII • Municipal Agriculture Registry
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-200">
                  <Globe2 className="h-3 w-3" /> Polomolok, South Cotabato
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {fullNameDisplay}
              </h2>
              <div className="flex items-center gap-3 text-xs text-emerald-100/80 mt-0.5 flex-wrap">
                <span>Role: <strong className="text-white">{profile.farmerCode}</strong></span>
                <span>•</span>
                <span>Barangay: <strong className="text-emerald-300">{profile.barangay}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-400">Active Intake</strong></span>
              </div>
            </div>
          </div>

          {/* Right: RSBSA Identification Box with Copy */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2.5 bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Official RSBSA System Identifier
              </p>
              <p className="font-mono text-base sm:text-lg font-black tracking-wide text-white">
                {rsbsaId || "Generating ID…"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRsbsa}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {copiedRsbsa ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-emerald-200" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-1 rounded bg-black/30 px-2 py-1 text-[10px] font-mono text-emerald-300">
                <QrCode className="h-3.5 w-3.5" />
                <span>Verified Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Banners ── */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Quick Jump Section Navigation Bar ── */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2.5 bg-slate-50/95 backdrop-blur-md border-y border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {sections.map((s) => {
            const Icon = s.icon;
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-emerald-600")} />
                <span>{s.label}</span>
                <span
                  className={cn(
                    "ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-black",
                    isSelected
                      ? "bg-white/20 text-white"
                      : s.enabled === false
                      ? "bg-slate-100 text-slate-400"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}
                >
                  {s.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: BENEFICIARY PERSONAL PROFILE                                */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div
          id="profile"
          className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  1. Beneficiary Personal Profile
                </h2>
                <p className="text-[11px] text-slate-500">
                  Primary demographic identity, civil registry, sector attributes, and municipal jurisdiction.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
              Mandatory Base Record
            </span>
          </div>

          {/* Names Grid */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Full Legal Name
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  className={inputCls}
                  value={profile.firstName}
                  placeholder="e.g. Kirby Jay"
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Middle Name</label>
                <input
                  className={inputCls}
                  value={profile.middleName}
                  placeholder="e.g. Santos"
                  onChange={(e) => setProfile((p) => ({ ...p, middleName: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  className={inputCls}
                  value={profile.lastName}
                  placeholder="e.g. Geldore"
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Ext. (Jr./Sr./III)</label>
                <input
                  className={inputCls}
                  value={profile.extensionName}
                  placeholder="e.g. Jr."
                  onChange={(e) => setProfile((p) => ({ ...p, extensionName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Demographics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Sex</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "Male", label: "Male ♂" },
                  { val: "Female", label: "Female ♀" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, sex: s.val }))}
                    className={cn(
                      "py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs",
                      profile.sex === s.val
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  className={inputCls}
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Civil Status</label>
              <select
                className={selectCls}
                value={profile.civilStatus}
                onChange={(e) => setProfile((p) => ({ ...p, civilStatus: e.target.value }))}
              >
                {["Married", "Single", "Widowed", "Separated", "Co-habiting"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Agricultural Category</label>
              <select
                className={selectCls}
                value={profile.farmerCode}
                onChange={(e) => setProfile((p) => ({ ...p, farmerCode: e.target.value }))}
              >
                <option value="Farmer / Land Owner">🌾 Farmer / Land Owner</option>
                <option value="Farmer / Tenant">🚜 Tenant Cultivator</option>
                <option value="Farmer / Farmworker">🧑‍🌾 Farmworker / Laborer</option>
                <option value="Agri-Fisherfolk">🐟 Agri-Fisherfolk</option>
                <option value="Livestock Raiser">🐂 Livestock / Poultry Producer</option>
              </select>
            </div>
          </div>

          {/* Contact & Barangay */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Mobile Contact Number</label>
              <div className="relative">
                <input
                  type="tel"
                  className={inputCls}
                  value={profile.contactNumber}
                  placeholder="09XX-XXX-XXXX"
                  onChange={(e) => setProfile((p) => ({ ...p, contactNumber: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                className={inputCls}
                value={profile.email}
                placeholder="beneficiary@gmail.com"
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>
                Registered Barangay <span className="text-[10px] text-emerald-700 font-normal">(Polomolok Zone)</span>
              </label>
              <select
                className={selectCls}
                value={profile.barangay}
                onChange={(e) => handleBarangayChange(e.target.value)}
              >
                {POLOMOLOK_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    Brgy. {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sector Classifications Cards */}
          <div>
            <span className={labelCls}>Statutory Sector Attributes &amp; Demographics</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { k: "isSenior", label: "Senior Citizen", desc: "Age 60 & Above", icon: Users, color: "text-emerald-700", bg: "bg-emerald-500/10" },
                { k: "isPwd", label: "Person w/ Disability", desc: "Special Mobility", icon: Accessibility, color: "text-blue-700", bg: "bg-blue-500/10" },
                { k: "is4ps", label: "4Ps Beneficiary", desc: "DSWD Pantawid", icon: HeartHandshake, color: "text-amber-700", bg: "bg-amber-500/10" },
                { k: "isIp", label: "Indigenous People", desc: "Ancestral Domain", icon: Compass, color: "text-purple-700", bg: "bg-purple-500/10" },
              ].map(({ k, label, desc, icon: Icon, color, bg }) => {
                const checked = (profile as any)[k];
                return (
                  <div
                    key={k}
                    onClick={() => setProfile((p) => ({ ...p, [k]: !(p as any)[k] }))}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all shadow-2xs",
                      checked
                        ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", bg)}>
                        <Icon className={cn("h-4 w-4", color)} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{label}</p>
                        <p className="text-[10px] text-slate-500">{desc}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors shrink-0",
                        checked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {checked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: FARM LANDHOLDING                                           */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div
          id="farm"
          className={cn(
            "rounded-2xl border bg-white p-5 md:p-6 shadow-xs space-y-5 transition-all",
            includeFarm ? "border-slate-200" : "border-slate-200/60 opacity-60 bg-slate-50/50"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    2. Farm Landholding
                  </h2>
                  <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                    Agricultural Holding
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Total farm area, land ownership tenure, soil type, and irrigation source.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors">
              <input
                type="checkbox"
                checked={includeFarm}
                onChange={(e) => setIncludeFarm(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {includeFarm ? "Holding Enabled" : "Skip Farm"}
              </span>
            </label>
          </div>

          {includeFarm ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Land Tenure Visual Options */}
              <div>
                <span className={labelCls}>Tenure Type / Land Ownership Structure</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {TENURE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFarm((f) => ({ ...f, tenureType: t.id }))}
                      className={cn(
                        "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs",
                        farm.tenureType === t.id
                          ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      )}
                    >
                      <span className="text-base mb-1">{t.icon}</span>
                      <span className="text-xs font-bold text-slate-900 leading-tight">{t.label}</span>
                      <span className="text-[9px] text-slate-500 mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Farm Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Farm Name / Registry Tag</label>
                  <input
                    className={inputCls}
                    value={farm.farmName}
                    placeholder={`e.g. ${profile.lastName ? `${profile.lastName} Farm Landholding` : "Polomolok Ricefield Plot A"}`}
                    onChange={(e) => setFarm((f) => ({ ...f, farmName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Farm Barangay</label>
                  <select
                    className={selectCls}
                    value={farm.barangay}
                    onChange={(e) => setFarm((f) => ({ ...f, barangay: e.target.value }))}
                  >
                    {POLOMOLOK_BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        Brgy. {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area & Irrigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Sitio / Purok</label>
                  <input
                    className={inputCls}
                    value={farm.sitioPurok}
                    placeholder="e.g. Purok Pag-asa"
                    onChange={(e) => setFarm((f) => ({ ...f, sitioPurok: e.target.value }))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Total Farm Area (ha)
                    </label>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      {squareMeters} m²
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={inputCls}
                    value={farm.totalAreaHa}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFarm((f) => ({ ...f, totalAreaHa: v }));
                      setParcel((p) => ({ ...p, areaHa: v }));
                      setCrop((c) => ({ ...c, plantedAreaHa: v }));
                    }}
                  />
                </div>

                <div>
                  <label className={labelCls}>Water Source</label>
                  <select
                    className={selectCls}
                    value={farm.waterSource}
                    onChange={(e) => setFarm((f) => ({ ...f, waterSource: e.target.value }))}
                  >
                    {WATER_SOURCES.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Soil Classification</label>
                  <select
                    className={selectCls}
                    value={farm.soilType}
                    onChange={(e) => setFarm((f) => ({ ...f, soilType: e.target.value }))}
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Farm Remarks / Field Notes</label>
                <input
                  className={inputCls}
                  value={farm.remarks}
                  placeholder="Optional operational remarks, agrarian reform status, or access road details"
                  onChange={(e) => setFarm((f) => ({ ...f, remarks: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-2">
              Farm landholding section is skipped. Only farmer beneficiary profile will be registered.
            </p>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: FARM PARCEL (Georeferenced Plot)                           */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div
          id="parcel"
          className={cn(
            "rounded-2xl border bg-white p-5 md:p-6 shadow-xs space-y-5 transition-all",
            includeFarm && includeParcel ? "border-slate-200" : "border-slate-200/60 opacity-60 bg-slate-50/50"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    3. Georeferenced Farm Parcel
                  </h2>
                  <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                    GPS Geotagged Plot
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Cadastral survey lot number, plot area, and GPS centroid coordinates.
                </p>
              </div>
            </div>
            {includeFarm && (
              <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors">
                <input
                  type="checkbox"
                  checked={includeParcel}
                  onChange={(e) => setIncludeParcel(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {includeParcel ? "Parcel Enabled" : "Skip Parcel"}
                </span>
              </label>
            )}
          </div>

          {includeFarm && includeParcel ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* GPS Helpers Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium">
                  <Navigation className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>
                    Centroid GPS: <strong className="font-mono text-slate-900">{parcel.latitude}° N, {parcel.longitude}° E</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="Open visual satellite/street map to drop or drag the farm centroid pin"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-200" />
                    <span>Piliin sa Mapa / Pin Drop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParcel((p) => ({ ...p, latitude: "6.2189", longitude: "125.0645" }))}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Polomolok Center Preset
                  </button>
                </div>
              </div>

              {/* Parcel Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Parcel / Lot Number</label>
                  <div className="flex items-center gap-1">
                    <input
                      className={inputCls}
                      value={parcel.parcelNumber}
                      placeholder="LOT-01"
                      onChange={(e) => setParcel((p) => ({ ...p, parcelNumber: e.target.value }))}
                    />
                  </div>
                  {/* Quick Lot presets */}
                  <div className="flex items-center gap-1 mt-1">
                    {["LOT-01", "LOT-02", "LOT-A"].map((lot) => (
                      <button
                        key={lot}
                        type="button"
                        onClick={() => setParcel((p) => ({ ...p, parcelNumber: lot }))}
                        className="text-[10px] font-mono font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded px-1.5 py-0.5 border border-slate-200"
                      >
                        {lot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Parcel Plot Area (ha)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={inputCls}
                    value={parcel.areaHa}
                    onChange={(e) => setParcel((p) => ({ ...p, areaHa: e.target.value }))}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Matches Farm: {farm.totalAreaHa} ha
                  </span>
                </div>

                <div>
                  <label className={labelCls}>Latitude (Decimal Degrees)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className={inputCls}
                    value={parcel.latitude}
                    placeholder="6.2189"
                    onChange={(e) => setParcel((p) => ({ ...p, latitude: e.target.value }))}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Standard Polomolok: 6.2189</span>
                </div>

                <div>
                  <label className={labelCls}>Longitude (Decimal Degrees)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className={inputCls}
                    value={parcel.longitude}
                    placeholder="125.0645"
                    onChange={(e) => setParcel((p) => ({ ...p, longitude: e.target.value }))}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Standard Polomolok: 125.0645</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Parcel Boundary &amp; Terrain Remarks</label>
                <input
                  className={inputCls}
                  value={parcel.remarks}
                  placeholder="e.g. Near creek border, terrain flat, surveyed under cadastral survey plan"
                  onChange={(e) => setParcel((p) => ({ ...p, remarks: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-2">
              {!includeFarm
                ? "Farm landholding is disabled, so farm parcel plot is skipped."
                : "Farm parcel section is skipped."}
            </p>
          )}

          {/* Interactive Leaflet Map Modal for Parcel Centroid Pin Drop */}
          <MapCoordinatePickerModal
            isOpen={isMapPickerOpen}
            onClose={() => setIsMapPickerOpen(false)}
            initialLat={parcel.latitude}
            initialLng={parcel.longitude}
            initialBarangay={farm.barangay}
            onSelectCoordinates={(lat, lng) => {
              setParcel((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            }}
            title="Plot Farm Parcel Centroid"
            subtitle={`Visual georeferencing for agricultural landholding in Brgy. ${farm.barangay || "Poblacion"}, Polomolok.`}
          />
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: STANDING CROPS                                             */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div
          id="crop"
          className={cn(
            "rounded-2xl border bg-white p-5 md:p-6 shadow-xs space-y-5 transition-all",
            includeFarm && includeParcel && includeCrop
              ? "border-slate-200"
              : "border-slate-200/60 opacity-60 bg-slate-50/50"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    4. Standing Crops &amp; Commodity Baseline
                  </h2>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    Crop Production
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Primary agricultural commodity, seed variety, planting schedule, and estimated yield.
                </p>
              </div>
            </div>
            {includeFarm && includeParcel && (
              <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors">
                <input
                  type="checkbox"
                  checked={includeCrop}
                  onChange={(e) => setIncludeCrop(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {includeCrop ? "Crop Enabled" : "Skip Crops"}
                </span>
              </label>
            )}
          </div>

          {includeFarm && includeParcel && includeCrop ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Popular Polomolok Commodities Quick Grid */}
              <div>
                <span className={labelCls}>Popular Polomolok Commodities (Quick Select)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {COMMODITY_PRESETS.slice(0, 5).map((preset) => {
                    const isSelected = crop.cropType === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyCommodityPreset(preset)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer shadow-2xs",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 text-emerald-950 font-bold"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        )}
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{preset.name}</p>
                          <p className="text-[9px] text-slate-500">~{preset.maturityDays}d cycle</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commodity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Crop Commodity</label>
                  <select
                    className={selectCls}
                    value={crop.cropType}
                    onChange={(e) => setCrop((c) => ({ ...c, cropType: e.target.value }))}
                  >
                    {COMMODITY_PRESETS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Cultivar / Seed Variety</label>
                  <input
                    className={inputCls}
                    value={crop.variety}
                    placeholder="e.g. Hybrid Pioneer 30Y87"
                    onChange={(e) => setCrop((c) => ({ ...c, variety: e.target.value }))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Planted Area (ha)
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Est: {estYieldTons} MT
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={inputCls}
                    value={crop.plantedAreaHa}
                    onChange={(e) => setCrop((c) => ({ ...c, plantedAreaHa: e.target.value }))}
                  />
                </div>

                <div>
                  <label className={labelCls}>Cropping Season</label>
                  <select
                    className={selectCls}
                    value={crop.season}
                    onChange={(e) => setCrop((c) => ({ ...c, season: e.target.value }))}
                  >
                    {["Wet", "Dry", "Year-Round"].map((s) => (
                      <option key={s} value={s}>
                        {s === "Wet" ? "🌧️ Wet Season" : s === "Dry" ? "☀️ Dry Season" : "🔄 Year-Round"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule & Lifecycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Crop Year</label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    className={inputCls}
                    value={crop.year}
                    onChange={(e) => setCrop((c) => ({ ...c, year: e.target.value }))}
                  />
                </div>

                <div>
                  <label className={labelCls}>Current Crop Status</label>
                  <select
                    className={selectCls}
                    value={crop.status}
                    onChange={(e) => setCrop((c) => ({ ...c, status: e.target.value }))}
                  >
                    <option value="Standing">🌱 Standing / Vegetative</option>
                    <option value="Harvested">🌾 Harvested Cycle</option>
                    <option value="Damaged">⚠️ Calamity Damaged</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Planting Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={crop.plantingDate}
                    onChange={(e) => setCrop((c) => ({ ...c, plantingDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className={labelCls}>Expected Harvest Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={crop.expectedHarvestDate}
                    onChange={(e) => setCrop((c) => ({ ...c, expectedHarvestDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Production Notes &amp; Agro-Input Remarks</label>
                <input
                  className={inputCls}
                  value={crop.remarks}
                  placeholder="e.g. Basal fertilizer applied, targeted for municipal food security monitoring"
                  onChange={(e) => setCrop((c) => ({ ...c, remarks: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-2">
              Standing crops section is skipped. No crop cycle records will be registered.
            </p>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: SUPPORTING LAND DOCUMENTS                                  */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div
          id="document"
          className={cn(
            "rounded-2xl border bg-white p-5 md:p-6 shadow-xs space-y-5 transition-all",
            includeDoc ? "border-slate-200" : "border-slate-200/60 opacity-60 bg-slate-50/50"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-2xs">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    5. Supporting Land Documents &amp; Titling
                  </h2>
                  <span className="rounded bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold">
                    Tenure Verification
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Land title, real property tax declaration, DAR CLOA, or barangay tenure certificate.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors">
              <input
                type="checkbox"
                checked={includeDoc}
                onChange={(e) => setIncludeDoc(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {includeDoc ? "Document Attached" : "Attach Document"}
              </span>
            </label>
          </div>

          {includeDoc ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Interactive Upload simulation zone */}
              <div className="border-2 border-dashed border-purple-200 rounded-2xl p-5 bg-purple-50/30 flex flex-col items-center justify-center text-center hover:bg-purple-50/60 transition-colors">
                <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-2 shadow-2xs">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Select Supporting Document Reference
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supported: Land Title (OCT/TCT), Tax Dec, CLOA Award, Deed of Sale, or Barangay Cert
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Document Type</label>
                  <select
                    className={selectCls}
                    value={landDoc.documentType}
                    onChange={(e) => setLandDoc((d) => ({ ...d, documentType: e.target.value }))}
                  >
                    {DOC_TYPES.map((d) => (
                      <option key={d.type} value={d.type}>
                        {d.icon} {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>File Name / Registry Serial Number</label>
                  <input
                    className={inputCls}
                    value={landDoc.fileName}
                    placeholder="e.g. OCT_TCT_No_12345_Poblacion.pdf"
                    onChange={(e) => setLandDoc((d) => ({ ...d, fileName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Document Remarks &amp; Registry Notes</label>
                <input
                  className={inputCls}
                  value={landDoc.remarks}
                  placeholder="e.g. Registered with Registry of Deeds Koronadal City, certified true copy on file"
                  onChange={(e) => setLandDoc((d) => ({ ...d, remarks: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-2">
              No supporting land documents are being attached at this time. Supporting documents can be uploaded later.
            </p>
          )}
        </div>

        {/* ── Bottom Sticky Actions Bar ── */}
        <div className="sticky bottom-4 z-30 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <FileCheck className="h-4 w-4" />
            </div>
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-900 leading-tight">
                {fullNameDisplay} • {rsbsaId || "RSBSA Intake"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enrolling: <strong>1 Beneficiary Profile</strong>
                {includeFarm && <span> + <strong>1 Farm ({farm.totalAreaHa} ha)</strong></span>}
                {includeFarm && includeParcel && <span> + <strong>1 Parcel ({parcel.parcelNumber})</strong></span>}
                {includeFarm && includeParcel && includeCrop && <span> + <strong>1 Standing Crop ({crop.cropType})</strong></span>}
                {includeDoc && <span> + <strong>1 Document</strong></span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(baseHref)}
              disabled={isSubmitting}
              className="text-xs h-9 px-4 border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Registering Records…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save &amp; Register All Records
                </span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
