"use client";

import React, { useState, useEffect } from "react";
import {
  User, Layers, MapPin, Sprout, FileText,
  ChevronRight, ChevronLeft, Check,
  ShieldCheck, HeartHandshake, Accessibility, Users, Compass,
  Save, SkipForward, Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { generateRsbsaNumber } from "@/features/rsbsa/lib/rsbsaUtils";
import { Button } from "@/components/ui/Button";
import { MapCoordinatePickerModal } from "@/components/maps/MapCoordinatePickerModal";

// ─── Constants ────────────────────────────────────────────────────────────────
const BARANGAYS = [
  "Bentung", "Cannery Site", "Crossing Pangi", "Glamang", "Kinilis",
  "Klinan 6", "Koronadal Proper", "Lam-caliaf", "Lapu", "Lumakil",
  "Maligo", "Magsaysay", "Pagalungan", "Poblacion", "Polo", "Rubber",
  "Silway 7", "Silway 8", "Sulit", "Sumbakil", "Upper Klinan",
];
const TENURE_TYPES = ["Owned", "Tenant", "Leased", "Mortgaged", "Beneficiary (DAR)", "Usufructuary"];
const CROP_TYPES = [
  "Rice (Palay)", "Corn (Yellow)", "Corn (White)", "Pineapple", "Banana (Cavendish)",
  "Cassava", "Vegetables (Highland)", "Vegetables (Lowland)", "Coffee", "Cacao", "Rubber", "Coconut",
];
const DOC_TYPES = [
  "Land Title (OCT/TCT)", "Tax Declaration", "Certificate of Land Ownership Award (CLOA)",
  "Deed of Sale", "Lease Contract / Usufruct Agreement", "Barangay Certification",
  "Government-Issued Valid ID", "RSBSA Registration Form",
];

// ─── Step Config ──────────────────────────────────────────────────────────────
type StepId = "profile" | "farm" | "parcel" | "crop" | "document";
const STEPS: { id: StepId; label: string; short: string; icon: React.ReactNode; optional?: boolean }[] = [
  { id: "profile",  label: "Beneficiary Profile",  short: "Profile",  icon: <User className="h-3.5 w-3.5" /> },
  { id: "farm",     label: "Farm Landholding",      short: "Farm",     icon: <Layers className="h-3.5 w-3.5" />, optional: true },
  { id: "parcel",   label: "Farm Parcel",           short: "Parcel",   icon: <MapPin className="h-3.5 w-3.5" />, optional: true },
  { id: "crop",     label: "Standing Crop",         short: "Crop",     icon: <Sprout className="h-3.5 w-3.5" />, optional: true },
  { id: "document", label: "Land Document",         short: "Document", icon: <FileText className="h-3.5 w-3.5" />, optional: true },
];

// ─── Shared input styles ──────────────────────────────────────────────────────
const iCls = "w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none";
const sCls = "w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer";
const lCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1";

// ─── Props ────────────────────────────────────────────────────────────────────
interface RegistrationWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Wizard Component ─────────────────────────────────────────────────────────
export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({ onSuccess, onCancel }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState<Set<StepId>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Chained IDs
  const [farmerId, setFarmerId] = useState<number | null>(null);
  const [farmId, setFarmId] = useState<number | null>(null);
  const [parcelId, setParcelId] = useState<number | null>(null);

  // ── Step 1: Profile ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: "", middleName: "", lastName: "", extensionName: "",
    farmerCode: "", barangay: "Poblacion", contactNumber: "",
    email: "", sex: "Male", dateOfBirth: "", civilStatus: "Married",
    isSenior: false, isPwd: false, is4ps: false, isIp: false,
  });
  const [rsbsaId, setRsbsaId] = useState("");

  useEffect(() => {
    // Client-only — avoids SSR/hydration mismatch
    setRsbsaId(generateRsbsaNumber("Poblacion"));
  }, []);

  const onBarangayChange = (b: string) => {
    setProfile((p) => ({ ...p, barangay: b }));
    setRsbsaId(generateRsbsaNumber(b));
  };

  // ── Step 2: Farm ─────────────────────────────────────────────────────────
  const [farm, setFarm] = useState({
    farmName: "", barangay: "Poblacion", sitioPurok: "",
    totalAreaHa: "1.0", tenureType: "Owned", soilType: "Clay Loam",
    waterSource: "Rainfed", remarks: "",
  });

  // ── Step 3: Parcel ───────────────────────────────────────────────────────
  const [parcel, setParcel] = useState({
    parcelNumber: "LOT-01", areaHa: "1.0",
    latitude: "6.2189", longitude: "125.0645", remarks: "",
  });
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // ── Step 4: Crop ─────────────────────────────────────────────────────────
  const [crop, setCrop] = useState({
    cropType: "Corn (Yellow)", variety: "Hybrid", category: "Grain",
    plantedAreaHa: "1.0", plantingDate: "", expectedHarvestDate: "",
    season: "Wet", year: new Date().getFullYear().toString(),
    status: "Standing", remarks: "",
  });

  // ── Step 5: Document ─────────────────────────────────────────────────────
  const [doc, setDoc] = useState({
    documentType: "Land Title (OCT/TCT)", fileName: "", remarks: "",
  });

  // ── Navigation ───────────────────────────────────────────────────────────
  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const goNext = () => { setErr(null); setOk(null); setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)); };
  const goPrev = () => { setErr(null); setOk(null); setStepIdx((i) => Math.max(i - 1, 0)); };
  const skipStep = () => {
    setDone((d) => { const n = new Set(d); n.delete(current.id); return n; });
    if (isLast) onSuccess?.();
    else goNext();
  };

  // ── Submit Handlers ──────────────────────────────────────────────────────
  const post = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request to ${url} failed`);
    return data;
  };

  const put = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request to ${url} failed`);
    return data;
  };

  const saveProfile = async () => {
    const fn = profile.firstName.trim();
    const ln = profile.lastName.trim();
    if (!fn && !ln) {
      setErr("Please enter at least a name for the beneficiary.");
      return;
    }
    const resolvedFirstName = fn || "Beneficiary";
    const resolvedLastName = ln || "Record";

    setBusy(true); setErr(null);
    try {
      const payload = {
        ...profile,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        municipality: "Polomolok",
        province: "South Cotabato",
        rsbsaNumber: rsbsaId || generateRsbsaNumber(profile.barangay),
        farmerCode: profile.farmerCode || "Farmer",
        middleName: profile.middleName || null,
        extensionName: profile.extensionName || null,
        contactNumber: profile.contactNumber || null,
        email: profile.email || null,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
      };

      if (farmerId) {
        await put(`/api/beneficiaries/${farmerId}`, payload);
      } else {
        const data = await post("/api/beneficiaries", payload);
        setFarmerId(data.id);
      }
      setDone((d) => new Set(d).add("profile"));
      setOk("Beneficiary profile saved!");
      setTimeout(() => { setOk(null); goNext(); }, 400);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const saveFarm = async () => {
    if (!farmerId) { goNext(); return; }
    setBusy(true); setErr(null);
    try {
      const resolvedFarmName =
        farm.farmName.trim() ||
        `${profile.lastName ? `${profile.lastName} Farm` : "Farm Landholding"} (${farm.barangay})`;
      const resolvedArea = parseFloat(farm.totalAreaHa) || 1.0;

      const payload = {
        ...farm,
        farmName: resolvedFarmName,
        beneficiaryId: farmerId,
        municipality: "Polomolok",
        province: "South Cotabato",
        totalAreaHa: resolvedArea,
        sitioPurok: farm.sitioPurok || null,
        remarks: farm.remarks || null,
      };

      if (farmId) {
        await put(`/api/farms/${farmId}`, payload);
      } else {
        const data = await post("/api/farms", payload);
        setFarmId(data.id);
      }
      setDone((d) => new Set(d).add("farm"));
      setOk("Farm landholding saved!");
      setTimeout(() => { setOk(null); goNext(); }, 400);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const saveParcel = async () => {
    if (!farmId) { goNext(); return; }
    setBusy(true); setErr(null);
    try {
      const resolvedParcelNumber = parcel.parcelNumber.trim() || "LOT-01";
      const resolvedArea = parseFloat(parcel.areaHa) || parseFloat(farm.totalAreaHa) || 1.0;

      const payload = {
        ...parcel,
        farmId,
        parcelNumber: resolvedParcelNumber,
        areaHa: resolvedArea,
        latitude: parcel.latitude ? parseFloat(parcel.latitude) : undefined,
        longitude: parcel.longitude ? parseFloat(parcel.longitude) : undefined,
        remarks: parcel.remarks || null,
      };

      if (parcelId) {
        await put(`/api/farm-parcels/${parcelId}`, payload);
      } else {
        const data = await post("/api/farm-parcels", payload);
        setParcelId(data.id);
      }
      setDone((d) => new Set(d).add("parcel"));
      setOk("Farm parcel saved!");
      setTimeout(() => { setOk(null); goNext(); }, 400);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const saveCrop = async () => {
    if (!parcelId) { goNext(); return; }
    setBusy(true); setErr(null);
    try {
      const resolvedPlantedArea = parseFloat(crop.plantedAreaHa) || parseFloat(parcel.areaHa) || 1.0;
      const resolvedYear = parseInt(crop.year, 10) || new Date().getFullYear();

      await post("/api/crops", {
        ...crop,
        parcelId,
        cropType: crop.cropType.trim() || "Rice (Palay)",
        plantedAreaHa: resolvedPlantedArea,
        year: resolvedYear,
        plantingDate: crop.plantingDate || undefined,
        expectedHarvestDate: crop.expectedHarvestDate || undefined,
        variety: crop.variety || null,
        remarks: crop.remarks || null,
      });
      setDone((d) => new Set(d).add("crop"));
      setOk("Crop record saved!");
      setTimeout(() => { setOk(null); goNext(); }, 400);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const saveDocument = async () => {
    if (!farmerId) { onSuccess?.(); return; }
    // If no filename entered, gracefully complete registration without failing
    if (!doc.fileName.trim()) {
      setOk("Registration completed successfully!");
      setTimeout(() => onSuccess?.(), 500);
      return;
    }
    setBusy(true); setErr(null);
    try {
      await post("/api/land-documents", {
        ...doc,
        farmerId,
        farmId: farmId ?? undefined,
        fileUrl: `https://storage.local/rsbsa/${farmerId}/${Date.now()}-${doc.fileName.trim()}`,
        remarks: doc.remarks || null,
      });
      setDone((d) => new Set(d).add("document"));
      setOk("Document attached! Registration complete.");
      setTimeout(() => onSuccess?.(), 600);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleSave = () => {
    if (current.id === "profile") saveProfile();
    else if (current.id === "farm") saveFarm();
    else if (current.id === "parcel") saveParcel();
    else if (current.id === "crop") saveCrop();
    else if (current.id === "document") saveDocument();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>

      {/* ── Step Progress Indicator ── */}
      <div className="flex items-center gap-0.5 mb-4 pb-3 border-b border-slate-100 overflow-x-auto shrink-0 flex-wrap gap-y-1">
        {STEPS.map((step, idx) => {
          const isActive = idx === stepIdx;
          const isDone = done.has(step.id);
          const canClick = idx < stepIdx || isDone;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={!canClick && !isActive}
                onClick={() => { if (canClick) { setStepIdx(idx); setErr(null); setOk(null); } }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                  isActive ? "bg-emerald-600 text-white shadow-sm" :
                  isDone ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer" :
                  canClick ? "text-slate-500 hover:text-slate-800 cursor-pointer" :
                  "text-slate-300 cursor-default"
                )}
              >
                <span className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                  isActive ? "bg-white/20 text-white" :
                  isDone ? "bg-emerald-600 text-white" :
                  "bg-slate-200 text-slate-500"
                )}>
                  {isDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : idx + 1}
                </span>
                <span className="hidden sm:inline">{step.short}</span>
                {step.optional && !isActive && !isDone && (
                  <span className="hidden lg:inline text-[9px] font-normal text-current opacity-50">(opt)</span>
                )}
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step Body ── */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(80vh - 200px)" }}>

        {/* STEP 1 — PROFILE */}
        {current.id === "profile" && (
          <div className="space-y-3">
            {/* Auto RSBSA Banner */}
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Auto-Generated RSBSA System Number</p>
                <p className="font-mono text-xs font-bold text-slate-900 truncate">
                  {rsbsaId || <span className="text-slate-400 font-normal">Generating…</span>}
                </p>
              </div>
              <span className="text-[9px] text-emerald-600 shrink-0">Read-only</span>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div><label className={lCls}>First Name</label>
                <input className={iCls} value={profile.firstName} placeholder="Juan"
                  onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div><label className={lCls}>Middle Name</label>
                <input className={iCls} value={profile.middleName} placeholder="Santos"
                  onChange={(e) => setProfile(p => ({ ...p, middleName: e.target.value }))} /></div>
              <div><label className={lCls}>Last Name</label>
                <input className={iCls} value={profile.lastName} placeholder="Dela Cruz"
                  onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))} /></div>
              <div><label className={lCls}>Ext. (Jr./Sr.)</label>
                <input className={iCls} value={profile.extensionName} placeholder="Jr."
                  onChange={(e) => setProfile(p => ({ ...p, extensionName: e.target.value }))} /></div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div>
                <label className={lCls}>Sex</label>
                <div className="grid grid-cols-2 gap-1">
                  {["Male", "Female"].map(s => (
                    <button key={s} type="button"
                      onClick={() => setProfile(p => ({ ...p, sex: s }))}
                      className={cn("py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                        profile.sex === s ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
                      )}>{s}</button>
                  ))}
                </div>
              </div>
              <div><label className={lCls}>Date of Birth</label>
                <input type="date" className={iCls} value={profile.dateOfBirth}
                  onChange={(e) => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))} /></div>
              <div><label className={lCls}>Civil Status</label>
                <select className={sCls} value={profile.civilStatus}
                  onChange={(e) => setProfile(p => ({ ...p, civilStatus: e.target.value }))}>
                  {["Single", "Married", "Widowed", "Separated", "Co-habiting"].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className={lCls}>Agricultural Role</label>
                <select className={sCls} value={profile.farmerCode}
                  onChange={(e) => setProfile(p => ({ ...p, farmerCode: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="Farmer / Land Owner">Farmer / Land Owner</option>
                  <option value="Farmer / Tenant">Tenant Cultivator</option>
                  <option value="Farmer / Farmworker">Farmworker / Laborer</option>
                  <option value="Agri-Fisherfolk">Agri-Fisherfolk</option>
                  <option value="Livestock Raiser">Livestock / Poultry Producer</option>
                </select></div>
            </div>

            {/* Contact & Barangay */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div><label className={lCls}>Mobile Number</label>
                <input type="tel" className={iCls} value={profile.contactNumber} placeholder="09XX-XXX-XXXX"
                  onChange={(e) => setProfile(p => ({ ...p, contactNumber: e.target.value }))} /></div>
              <div><label className={lCls}>Email</label>
                <input type="email" className={iCls} value={profile.email} placeholder="juan@example.com"
                  onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="lg:col-span-2"><label className={lCls}>Barangay</label>
                <select className={sCls} value={profile.barangay} onChange={(e) => onBarangayChange(e.target.value)}>
                  {BARANGAYS.map(b => <option key={b}>{b}</option>)}
                </select></div>
            </div>

            {/* Sector Classifications */}
            <div>
              <label className={lCls}>Sector Classifications</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                {[
                  { k: "isSenior", label: "Senior Citizen",       icon: <Users className="h-3.5 w-3.5 text-emerald-600" /> },
                  { k: "isPwd",    label: "Person w/ Disability",  icon: <Accessibility className="h-3.5 w-3.5 text-blue-600" /> },
                  { k: "is4ps",   label: "4Ps Beneficiary",       icon: <HeartHandshake className="h-3.5 w-3.5 text-amber-600" /> },
                  { k: "isIp",    label: "Indigenous People",     icon: <Compass className="h-3.5 w-3.5 text-purple-600" /> },
                ].map(({ k, label, icon }) => (
                  <div key={k}
                    onClick={() => setProfile(p => ({ ...p, [k]: !(p as any)[k] }))}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-lg border cursor-pointer select-none transition-all",
                      (profile as any)[k]
                        ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                    )}>
                    <div className="flex items-center gap-1.5">{icon}<span className="text-[11px] font-semibold text-slate-700">{label}</span></div>
                    <div className={cn("flex h-4 w-4 items-center justify-center rounded border shrink-0",
                      (profile as any)[k] ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white")}>
                      {(profile as any)[k] && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — FARM */}
        {current.id === "farm" && (
          <div className="space-y-3">
            {!farmerId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                ⚠ Complete Step 1 first so this farm can be linked to the new beneficiary.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className={lCls}>Farm Name</label>
                <input className={iCls} value={farm.farmName} placeholder="e.g. Polomolok Ricefield Plot A"
                  onChange={(e) => setFarm(f => ({ ...f, farmName: e.target.value }))} /></div>
              <div><label className={lCls}>Barangay</label>
                <select className={sCls} value={farm.barangay}
                  onChange={(e) => setFarm(f => ({ ...f, barangay: e.target.value }))}>
                  {BARANGAYS.map(b => <option key={b}>{b}</option>)}
                </select></div>
              <div><label className={lCls}>Sitio / Purok</label>
                <input className={iCls} value={farm.sitioPurok} placeholder="e.g. Purok 3"
                  onChange={(e) => setFarm(f => ({ ...f, sitioPurok: e.target.value }))} /></div>
              <div><label className={lCls}>Total Area (ha)</label>
                <input type="number" step="0.01" min="0.01" className={iCls} value={farm.totalAreaHa}
                  onChange={(e) => setFarm(f => ({ ...f, totalAreaHa: e.target.value }))} /></div>
              <div><label className={lCls}>Tenure Type</label>
                <select className={sCls} value={farm.tenureType}
                  onChange={(e) => setFarm(f => ({ ...f, tenureType: e.target.value }))}>
                  {TENURE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div><label className={lCls}>Water Source</label>
                <input className={iCls} value={farm.waterSource} placeholder="Rainfed / Irrigated"
                  onChange={(e) => setFarm(f => ({ ...f, waterSource: e.target.value }))} /></div>
              <div><label className={lCls}>Soil Type</label>
                <input className={iCls} value={farm.soilType} placeholder="e.g. Clay Loam"
                  onChange={(e) => setFarm(f => ({ ...f, soilType: e.target.value }))} /></div>
              <div className="col-span-2"><label className={lCls}>Remarks</label>
                <input className={iCls} value={farm.remarks} placeholder="Optional notes"
                  onChange={(e) => setFarm(f => ({ ...f, remarks: e.target.value }))} /></div>
            </div>
          </div>
        )}

        {/* STEP 3 — PARCEL */}
        {current.id === "parcel" && (
          <div className="space-y-3">
            {!farmId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                ⚠ No farm registered yet — this parcel can&apos;t be linked. Skip or go back to add a farm.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lCls}>Parcel / Lot Number</label>
                <input className={iCls} value={parcel.parcelNumber} placeholder="LOT-01"
                  onChange={(e) => setParcel(p => ({ ...p, parcelNumber: e.target.value }))} /></div>
              <div><label className={lCls}>Plot Area (ha)</label>
                <input type="number" step="0.01" min="0.01" className={iCls} value={parcel.areaHa}
                  onChange={(e) => setParcel(p => ({ ...p, areaHa: e.target.value }))} /></div>

              {/* Centroid Geolocation Coordinates & Interactive Map Button */}
              <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600" />
                      Centroid Geolocation Coordinates
                    </span>
                    <p className="text-[10px] text-emerald-800/80">
                      Piliin sa mapa o i-type nang manual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Globe2 className="h-3 w-3" />
                    Piliin sa Mapa / Pin Drop
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60">
                  <div>
                    <label className={lCls}>Latitude (Decimal °N)</label>
                    <input type="number" step="0.000001" className={cn(iCls, "bg-white font-mono")} value={parcel.latitude} placeholder="6.218900"
                      onChange={(e) => setParcel(p => ({ ...p, latitude: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lCls}>Longitude (Decimal °E)</label>
                    <input type="number" step="0.000001" className={cn(iCls, "bg-white font-mono")} value={parcel.longitude} placeholder="125.064500"
                      onChange={(e) => setParcel(p => ({ ...p, longitude: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="col-span-2"><label className={lCls}>Remarks</label>
                <input className={iCls} value={parcel.remarks} placeholder="Optional notes"
                  onChange={(e) => setParcel(p => ({ ...p, remarks: e.target.value }))} /></div>
            </div>
          </div>
        )}

        {/* STEP 4 — CROP */}
        {current.id === "crop" && (
          <div className="space-y-3">
            {!parcelId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 font-medium">
                ⚠ No parcel registered yet. Skip or go back to add a parcel first.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lCls}>Crop Commodity</label>
                <select className={sCls} value={crop.cropType}
                  onChange={(e) => setCrop(c => ({ ...c, cropType: e.target.value }))}>
                  {CROP_TYPES.map(c => <option key={c}>{c}</option>)}
                </select></div>
              <div><label className={lCls}>Variety / Seed Type</label>
                <input className={iCls} value={crop.variety} placeholder="e.g. Hybrid, OPV"
                  onChange={(e) => setCrop(c => ({ ...c, variety: e.target.value }))} /></div>
              <div><label className={lCls}>Planted Area (ha)</label>
                <input type="number" step="0.01" min="0.01" className={iCls} value={crop.plantedAreaHa}
                  onChange={(e) => setCrop(c => ({ ...c, plantedAreaHa: e.target.value }))} /></div>
              <div><label className={lCls}>Season</label>
                <select className={sCls} value={crop.season}
                  onChange={(e) => setCrop(c => ({ ...c, season: e.target.value }))}>
                  {["Wet", "Dry", "Year-Round"].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className={lCls}>Crop Year</label>
                <input type="number" min="2000" max="2100" className={iCls} value={crop.year}
                  onChange={(e) => setCrop(c => ({ ...c, year: e.target.value }))} /></div>
              <div><label className={lCls}>Status</label>
                <select className={sCls} value={crop.status}
                  onChange={(e) => setCrop(c => ({ ...c, status: e.target.value }))}>
                  {["Standing", "Harvested", "Damaged"].map(s => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className={lCls}>Planting Date</label>
                <input type="date" className={iCls} value={crop.plantingDate}
                  onChange={(e) => setCrop(c => ({ ...c, plantingDate: e.target.value }))} /></div>
              <div><label className={lCls}>Expected Harvest Date</label>
                <input type="date" className={iCls} value={crop.expectedHarvestDate}
                  onChange={(e) => setCrop(c => ({ ...c, expectedHarvestDate: e.target.value }))} /></div>
              <div className="col-span-2"><label className={lCls}>Remarks</label>
                <input className={iCls} value={crop.remarks} placeholder="Optional notes"
                  onChange={(e) => setCrop(c => ({ ...c, remarks: e.target.value }))} /></div>
            </div>
          </div>
        )}

        {/* STEP 5 — DOCUMENT */}
        {current.id === "document" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lCls}>Document Type</label>
                <select className={sCls} value={doc.documentType}
                  onChange={(e) => setDoc(d => ({ ...d, documentType: e.target.value }))}>
                  {DOC_TYPES.map(d => <option key={d}>{d}</option>)}
                </select></div>
              <div><label className={lCls}>File Name / Label</label>
                <input className={iCls} value={doc.fileName} placeholder="e.g. OCT_12345_Poblacion.pdf"
                  onChange={(e) => setDoc(d => ({ ...d, fileName: e.target.value }))} /></div>
              <div className="col-span-2"><label className={lCls}>Remarks</label>
                <input className={iCls} value={doc.remarks} placeholder="Optional notes"
                  onChange={(e) => setDoc(d => ({ ...d, remarks: e.target.value }))} /></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Feedback Banner ── */}
      {(err || ok) && (
        <div className={cn(
          "mt-3 shrink-0 px-3 py-2 rounded-lg border text-xs font-medium",
          err ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
        )}>{err || ok}</div>
      )}

      {/* ── Footer Buttons ── */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          {stepIdx > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={goPrev} disabled={busy}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />Back
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" disabled={busy}
            className="text-slate-500 hover:text-red-600 hover:border-red-300" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {current.optional && (
            <Button type="button" variant="outline" size="sm" onClick={skipStep} disabled={busy}
              className="text-[11px] text-slate-500">
              <SkipForward className="h-3.5 w-3.5 mr-1" />
              {isLast ? "Skip & Finish" : "Skip"}
            </Button>
          )}
          <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </span>
            ) : isLast ? (
              <><Save className="h-3.5 w-3.5 mr-1.5" />Complete Registration</>
            ) : (
              <>{current.optional ? "Save & Next" : "Save & Continue"}<ChevronRight className="h-3.5 w-3.5 ml-1" /></>
            )}
          </Button>
        </div>
      </div>

      {/* Map Coordinate Picker Modal */}
      <MapCoordinatePickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={parcel.latitude}
        initialLng={parcel.longitude}
        initialBarangay={farm.barangay || "Poblacion"}
        onSelectCoordinates={(lat, lng) => {
          setParcel((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        }}
        title="Piliin ang Centroid ng Farm Parcel"
        subtitle="I-click o i-drag ang pin sa eksaktong lokasyon ng lote sa Polomolok."
      />
    </div>
  );
};
