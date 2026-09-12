"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Compass,
  MapPin,
  Save,
  Trash2,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { cn } from "@/lib/utils/cn";

interface ParcelOption {
  id: number;
  parcelNumber: string;
  latitude: number | null;
  longitude: number | null;
  areaHa: number;
  farm: {
    id: number;
    farmName: string | null;
    barangay: string;
    farmer: {
      id: number;
      firstName: string;
      lastName: string;
      rsbsaNumber: string | null;
    };
  };
}

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecordId: string) => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [parcels, setParcels] = useState<ParcelOption[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [base64Preview, setBase64Preview] = useState<string | null>(null);
  const [thresholdMeters, setThresholdMeters] = useState<number>(500);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchParcels();
    }
  }, [isOpen]);

  const fetchParcels = async () => {
    setLoadingParcels(true);
    try {
      const res = await fetch("/api/farm-parcels");
      if (res.ok) {
        const data = await res.json();
        setParcels(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load parcels:", e);
    } finally {
      setLoadingParcels(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15MB limit.");
      return;
    }

    setError(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Preview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;

    if (selected.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15MB limit.");
      return;
    }

    setError(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Preview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcelId) {
      setError("Please select a registered farm parcel.");
      return;
    }
    if (!file || !base64Preview) {
      setError("Please select an image file.");
      return;
    }

    const parcel = parcels.find((p) => p.id === Number(selectedParcelId));
    if (!parcel) {
      setError("Invalid parcel selected.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const uploadPayload = {
        farmerId: parcel.farm?.farmer?.id || 1,
        farmId: parcel.farm?.id || 1,
        parcelId: parcel.id,
        originalFileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "image/jpeg",
        base64Data: base64Preview,
      };

      const res = await fetch("/api/photo-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload photo record");
      }

      const created = await res.json();

      await fetch(`/api/photo-verification/${created.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data: base64Preview,
          thresholdMeters: Number(thresholdMeters) || 500,
        }),
      });

      onSuccess(created.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Farm Field Photo for Metadata Verification"
      subtitle="Deterministic GPS distance calculation and AI advisory interpretation for farm photos."
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-800 animate-in fade-in shadow-xs">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* SECTION 1: PARCEL AUDIT LINKAGE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0 shadow-2xs">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Target Farm Parcel &amp; GPS Tolerance
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select the registered cadastral lot to verify against image EXIF coordinates.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" /> GPS Geofence Audit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Registered Farm Parcel <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedParcelId}
                onChange={(e) => setSelectedParcelId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingParcels || submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                required
              >
                <option value="">-- Select Farm Parcel to Verify Against --</option>
                {parcels.map((p) => {
                  const brgy = p.farm?.barangay || "Polomolok";
                  const farmerName = p.farm?.farmer
                    ? `${p.farm.farmer.firstName} ${p.farm.farmer.lastName}`
                    : "Registered Parcel";
                  const gpsStatus = p.latitude !== null ? "📍 Centroid Ready" : "⚠️ No GPS";

                  return (
                    <option key={p.id} value={p.id}>
                      Brgy. {brgy} — Parcel {p.parcelNumber} ({farmerName}) {gpsStatus}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                GPS Tolerance (Meters)
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={thresholdMeters}
                  onChange={(e) => setThresholdMeters(Number(e.target.value))}
                  className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-900 outline-none"
                />
                <span className="pr-3 text-xs font-bold text-slate-400">m</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PHOTO FILE DROPZONE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800 shrink-0 shadow-2xs">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Authentic Field Photograph (EXIF GPS)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Raw camera JPEG/PNG with embedded location coordinates.
                </p>
              </div>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer relative",
              isDragging
                ? "border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-500/10"
                : file
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500"
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleFileChange}
              disabled={submitting}
              className="sr-only"
              id="photo-file-upload-modal"
            />
            <label htmlFor="photo-file-upload-modal" className="cursor-pointer block">
              {base64Preview && file ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 text-left p-2">
                  <div className="w-24 h-24 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                    <img
                      src={base64Preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || "image/jpeg"}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      Ready for automated metadata audit &amp; distance calculation
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                      setBase64Preview(null);
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-slate-800">
                      Click to browse or drop field photograph here
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Must contain authentic camera EXIF GPS tags for location audit
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50">
                      Select Photo
                    </span>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 -mx-5 -mb-5 md:-mx-6 md:-mb-6 px-5 md:px-6 py-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !file || !selectedParcelId}
              className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs md:text-sm px-7 py-2.5 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>
                {submitting
                  ? "Processing Verification..."
                  : "Upload & Verify Photo"}
              </span>
            </button>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium pl-1">
              Deterministic EXIF Geolocation
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Discard & Close"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
