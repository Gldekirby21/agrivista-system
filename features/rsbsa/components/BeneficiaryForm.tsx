"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  User,
  Hash,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  HeartHandshake,
  Accessibility,
  Users,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const POLOMOLOK_BARANGAYS = [
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

interface BeneficiaryFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSuccess?: (beneficiary: any) => void;
  onCancel?: () => void;
}

export const BeneficiaryForm: React.FC<BeneficiaryFormProps> = ({
  initialData,
  isEdit = false,
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    extensionName: initialData?.extensionName || "",
    rsbsaNumber: initialData?.rsbsaNumber || "",
    farmerCode: initialData?.farmerCode || "",
    barangay: initialData?.barangay || "Poblacion",
    municipality: initialData?.municipality || "Polomolok",
    province: initialData?.province || "South Cotabato",
    contactNumber: initialData?.contactNumber || "",
    email: initialData?.email || "",
    sex: initialData?.sex || "Male",
    dateOfBirth: initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
      : "",
    civilStatus: initialData?.civilStatus || "Married",
    isSenior: initialData?.isSenior || false,
    isPwd: initialData?.isPwd || false,
    is4ps: initialData?.is4ps || false,
    isIp: initialData?.isIp || false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);
    setServerSuccess(null);

    const payload: any = {
      ...formData,
      rsbsaNumber: formData.rsbsaNumber.trim() || null,
      farmerCode: formData.farmerCode.trim() || null,
      middleName: formData.middleName.trim() || null,
      extensionName: formData.extensionName.trim() || null,
      contactNumber: formData.contactNumber.trim() || null,
      email: formData.email.trim() || null,
      civilStatus: formData.civilStatus.trim() || null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
    };

    try {
      const url = isEdit
        ? `/api/beneficiaries/${initialData.id}`
        : `/api/beneficiaries`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save beneficiary record");
      }

      setServerSuccess(
        isEdit
          ? "Beneficiary profile updated successfully!"
          : "New beneficiary registered successfully in RSBSA masterlist!"
      );

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(data);
        }, 500);
      } else {
        setTimeout(() => {
          router.push(
            isEdit
              ? `/staff/beneficiaries/${initialData.id}`
              : `/staff/beneficiaries/${data.id || ""}`
          );
          router.refresh();
        }, 1000);
      }
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alert Banners */}
      {serverSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="flex-1">{serverSuccess}</span>
        </div>
      )}
      {serverError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs font-semibold text-red-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="flex-1">{serverError}</span>
        </div>
      )}

      {/* Compact Grid Layout: 3 Columns x 2 Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
        {/* DIV 1: OFFICIAL RSBSA IDENTIFICATION (grid-area: 1 / 1 / 2 / 3) */}
        <div className="lg:col-span-2 lg:row-start-1 lg:col-start-1 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <Hash className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                  Official RSBSA Identifiers
                </h2>
                <p className="text-[10px] text-slate-500">
                  Government validation census numbers.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
              <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
              OMAG Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* RSBSA Reference Number */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                RSBSA System Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="pl-2.5 text-slate-400">
                  <Hash className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  name="rsbsaNumber"
                  value={formData.rsbsaNumber}
                  onChange={handleChange}
                  placeholder="12-63-14-XXX-XXXXXX"
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Farmer Code / Work Designation */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Primary Agricultural Role
              </label>
              <select
                name="farmerCode"
                value={formData.farmerCode}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              >
                <option value="">— Select Agricultural Role —</option>
                <option value="Farmer / Land Owner">Farmer / Land Owner</option>
                <option value="Farmer / Tenant">Farmer / Tenant Cultivator</option>
                <option value="Farmer / Farmworker">Agricultural Farmworker / Laborer</option>
                <option value="Agri-Fisherfolk">Agri-Fisherfolk Operator</option>
                <option value="Livestock Raiser">Livestock / Poultry Producer</option>
              </select>
            </div>
          </div>
        </div>

        {/* DIV 3: JURISDICTION & ADDRESS (grid-area: 1 / 3 / 2 / 4) */}
        <div className="lg:col-span-1 lg:row-start-1 lg:col-start-3 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                  Jurisdiction &amp; Address
                </h2>
                <p className="text-[10px] text-slate-500">
                  Polomolok municipality.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Barangay <span className="text-red-500">*</span>
              </label>
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
              >
                {POLOMOLOK_BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Municipality
                </label>
                <input
                  type="text"
                  disabled
                  value="Polomolok"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Province
                </label>
                <input
                  type="text"
                  disabled
                  value="South Cotabato"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIV 2: PERSONAL IDENTITY & DEMOGRAPHICS (grid-area: 2 / 1 / 3 / 3) */}
        <div className="lg:col-span-2 lg:row-start-2 lg:col-start-1 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800 shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                  Personal Identity &amp; Demographics
                </h2>
                <p className="text-[10px] text-slate-500">
                  Full registered legal name on government IDs.
                </p>
              </div>
            </div>
          </div>

          {/* Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Juan"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Santos"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Dela Cruz"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Extension <span className="text-slate-400 font-normal lowercase">(Jr.)</span>
              </label>
              <input
                type="text"
                name="extensionName"
                value={formData.extensionName}
                onChange={handleChange}
                placeholder="Jr."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* Demographics & Contact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
            {/* Sex / Gender Pill Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Sex
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {["Male", "Female"].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setFormData({ ...formData, sex: s })}
                    className={cn(
                      "flex items-center justify-center py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer",
                      formData.sex === s
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                        : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Date of Birth
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="pl-2.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-transparent px-2 py-1.5 text-xs font-medium text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Mobile Contact
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="pl-2.5 text-slate-400">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full bg-transparent px-2 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Civil Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Civil Status
              </label>
              <select
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Co-habiting">Co-habiting</option>
              </select>
            </div>
          </div>
        </div>

        {/* DIV 4: SECTORAL & SOCIAL CLASSIFICATIONS (grid-area: 2 / 3 / 3 / 4) */}
        <div className="lg:col-span-1 lg:row-start-2 lg:col-start-3 rounded-xl border border-slate-200/80 bg-white p-3.5 md:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-800 shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                  Sectoral Classifications
                </h2>
                <p className="text-[10px] text-slate-500">
                  Targeted subsidies.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {/* Senior Citizen */}
            <div
              onClick={() => handleToggle("isSenior", !formData.isSenior)}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none",
                formData.isSenior
                  ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 text-emerald-950 font-bold"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px]">Senior Citizen</span>
              </div>
              <div className={cn("flex h-4 w-4 items-center justify-center rounded border shrink-0", formData.isSenior ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white")}>
                {formData.isSenior && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* PWD */}
            <div
              onClick={() => handleToggle("isPwd", !formData.isPwd)}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none",
                formData.isPwd
                  ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 text-emerald-950 font-bold"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Accessibility className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px]">Person w/ Disability</span>
              </div>
              <div className={cn("flex h-4 w-4 items-center justify-center rounded border shrink-0", formData.isPwd ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white")}>
                {formData.isPwd && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* 4Ps Beneficiary */}
            <div
              onClick={() => handleToggle("is4ps", !formData.is4ps)}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none",
                formData.is4ps
                  ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 text-emerald-950 font-bold"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
              )}
            >
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px]">4Ps Beneficiary</span>
              </div>
              <div className={cn("flex h-4 w-4 items-center justify-center rounded border shrink-0", formData.is4ps ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white")}>
                {formData.is4ps && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* Indigenous People (IP) */}
            <div
              onClick={() => handleToggle("isIp", !formData.isIp)}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none",
                formData.isIp
                  ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 text-emerald-950 font-bold"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Compass className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px]">Indigenous People</span>
              </div>
              <div className={cn("flex h-4 w-4 items-center justify-center rounded border shrink-0", formData.isIp ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white")}>
                {formData.isIp && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gmail-Style Sticky Bottom Action Toolbar */}
      <div className="sticky bottom-0 -mx-4 -mb-4 md:-mx-5 md:-mb-5 px-4 md:px-5 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs px-5 py-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {isSubmitting
                ? "Saving..."
                : isEdit
                ? "Update Beneficiary Profile"
                : "Complete Registration"}
            </span>
          </button>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium pl-1">
            Polomolok OMAG RSBSA Intake
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : router.back())}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Discard & Close"
            aria-label="Discard & Close"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
};
