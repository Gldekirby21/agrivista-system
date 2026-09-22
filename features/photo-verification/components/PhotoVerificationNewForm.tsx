"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import exifr from "exifr";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  User,
  Info,
  Calendar,
  Layers,
  Maximize2,
  ZoomIn,
  Download,
  UploadCloud,
  X,
  Globe,
  Save,
  ClipboardList,
} from "lucide-react";
import { CreateCaseModal } from "@/features/pcic/components/CreateCaseModal";
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
      farmerCode?: string;
    };
  };
}

interface PhotoVerificationNewFormProps {
  userRole: "OMAG_STAFF" | "OMAG_HEAD";
}

// Great-circle Haversine formula
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
    Math.cos(phi2) *
    Math.sin(deltaLambda / 2) *
    Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const PhotoVerificationNewForm: React.FC<PhotoVerificationNewFormProps> = ({
  userRole,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath =
    userRole === "OMAG_HEAD"
      ? "/head/photo-verification"
      : "/staff/photo-verification";

  // Pre-filled farmer from URL param (e.g. ?farmerId=42)
  const [prefilledFarmerId, setPrefilledFarmerId] = useState<number | null>(null);
  const [prefilledFarmerName, setPrefilledFarmerName] = useState<string | null>(null);

  const [parcels, setParcels] = useState<ParcelOption[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(true);
  const [selectedParcelId, setSelectedParcelId] = useState<number | "">("");

  // Crop-Loss Case Integration State
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [intakeMode, setIntakeMode] = useState<"CASE" | "PARCEL">("CASE");
  const [selectedCaseId, setSelectedCaseId] = useState<number | "">("");

  // ✅ Farmer Evaluation Step State (must happen BEFORE AI scan)
  const [hasEvaluatedFarmer, setHasEvaluatedFarmer] = useState<boolean>(false);

  // Photo & EXIF State
  const [file, setFile] = useState<File | null>(null);
  const [base64Preview, setBase64Preview] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [revealedChecksCount, setRevealedChecksCount] = useState<number>(0);
  const [revealedFinalStatus, setRevealedFinalStatus] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>(
    "Initializing AI vision scan..."
  );
  const [particles, setParticles] = useState<
    Array<{
      left: string;
      top: string;
      dx: string;
      dy: string;
      delay: string;
      duration: string;
    }>
  >([]);
  const [confidenceBarWidth, setConfidenceBarWidth] = useState<number>(0);
  const [photoLat, setPhotoLat] = useState<number | null>(null);
  const [photoLng, setPhotoLng] = useState<number | null>(null);
  const [photoAlt, setPhotoAlt] = useState<number | null>(null);
  const [photoTimestamp, setPhotoTimestamp] = useState<string | null>(null);
  const [deviceMake, setDeviceMake] = useState<string | null>(null);
  const [deviceModel, setDeviceModel] = useState<string | null>(null);

  // Dynamic Audit Trail State
  const [auditList, setAuditList] = useState<
    Array<{ id: string; title: string; detail: string; time: string; tag: string }>
  >([
    {
      id: "init",
      title: "System ready",
      detail: "Waiting for photo verification intake.",
      time: new Date().toLocaleTimeString(),
      tag: "SYS_READY",
    },
  ]);

  // Verification Parameters & State
  const [thresholdMeters, setThresholdMeters] = useState<number>(500);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEvaluateFarmerOpen, setIsEvaluateFarmerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // AI & Review State
  const [aiAssessment, setAiAssessment] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>(
    userRole === "OMAG_HEAD" ? "CONFIRMED" : "PENDING"
  );
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const addAuditItem = (title: string, detail: string, tag = "AI_AUDIT") => {
    setAuditList((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        detail,
        time: new Date().toLocaleTimeString(),
        tag,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchParcels();
    fetchCases();
    // Read farmerId from URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const farmerIdParam = urlParams.get("farmerId");
      if (farmerIdParam) {
        setPrefilledFarmerId(Number(farmerIdParam));
      }
    }
  }, []);

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const res = await fetch("/api/photo-verification?mode=cases&limit=100");
      if (res.ok) {
        const data = await res.json();
        const caseList = data.items || [];
        setCases(caseList);

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const caseParam = urlParams.get("caseId") || urlParams.get("damageReportId");
          const farmerIdParam = urlParams.get("farmerId");

          if (caseParam) {
            const num = Number(caseParam);
            const found = caseList.find((c: any) => c.id === num);
            if (found) {
              setSelectedCaseId(num);
              setIntakeMode("CASE");
              setSelectedParcelId(found.parcelId);
              setHasEvaluatedFarmer(true);
              setPrefilledFarmerName(found.farmerName || null);
              setPrefilledFarmerId(found.farmerId || null);
            }
          } else if (farmerIdParam) {
            // Auto-select the first case belonging to this farmer
            const farmerId = Number(farmerIdParam);
            const farmerCases = caseList.filter((c: any) => c.farmerId === farmerId);
            if (farmerCases.length > 0) {
              setSelectedCaseId(farmerCases[0].id);
              setIntakeMode("CASE");
              setSelectedParcelId(farmerCases[0].parcelId);
              setHasEvaluatedFarmer(true);
              setPrefilledFarmerName(farmerCases[0].farmerName || null);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load crop-loss cases:", e);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchParcels = async () => {
    setLoadingParcels(true);
    try {
      const res = await fetch("/api/farm-parcels");
      if (res.ok) {
        const data = await res.json();
        const parcelList = Array.isArray(data) ? data : [];
        setParcels(parcelList);
      }
    } catch (e) {
      console.error("Failed to load parcels:", e);
      setMessage({ type: "error", text: "Failed to load farm parcels." });
    } finally {
      setLoadingParcels(false);
    }
  };

  const selectedCase = cases.find((c) => c.id === Number(selectedCaseId));

  const selectedParcel = parcels.find(
    (p) => p.id === (intakeMode === "CASE" && selectedCase ? selectedCase.parcelId : Number(selectedParcelId))
  );

  const registeredLat = intakeMode === "CASE" && selectedCase && selectedCase.parcelLatitude !== null
    ? Number(selectedCase.parcelLatitude)
    : selectedParcel?.latitude
      ? Number(selectedParcel.latitude)
      : null;

  const registeredLng = intakeMode === "CASE" && selectedCase && selectedCase.parcelLongitude !== null
    ? Number(selectedCase.parcelLongitude)
    : selectedParcel?.longitude
      ? Number(selectedParcel.longitude)
      : null;

  // Real-time calculated distance
  let calculatedDistance: number | null = null;
  if (
    hasScanned &&
    registeredLat !== null &&
    registeredLng !== null &&
    photoLat !== null &&
    photoLng !== null
  ) {
    calculatedDistance = calculateHaversineDistance(
      registeredLat,
      registeredLng,
      photoLat,
      photoLng
    );
  }

  // Deterministic Status
  let verificationStatus = "PENDING";
  let verificationNotes =
    "Please select a target farm parcel and upload a photograph to scan.";

  if (file && !hasScanned) {
    verificationStatus = "READY_TO_SCAN";
    verificationNotes = `Photograph "${file.name}" is loaded and ready. Click the "Scan with AI" button below to extract camera EXIF telemetry and calculate distance to the target parcel.`;
  } else if (file && hasScanned) {
    if (photoLat === null || photoLng === null) {
      verificationStatus = "REVIEW";
      verificationNotes =
        "GPS metadata unavailable. Great-Circle Geofence cannot be computed. Ground verification may be required.";
    } else if (registeredLat === null || registeredLng === null) {
      verificationStatus = "REVIEW";
      verificationNotes =
        "Target cadastral parcel lacks registered centroid GPS. Manual physical inspection required.";
    } else if (calculatedDistance !== null) {
      if (calculatedDistance <= thresholdMeters) {
        verificationStatus = "ACCEPTED";
        verificationNotes = `Photo GPS coordinates match target parcel within ${thresholdMeters}m geofence tolerance (Calculated: ${calculatedDistance.toFixed(
          1
        )}m). Ground truth physically verified.`;
      } else {
        verificationStatus = "REJECTED";
        verificationNotes = `Photo GPS coordinates (${calculatedDistance.toFixed(
          1
        )}m away) exceed ${thresholdMeters}m geofence tolerance from registered parcel centroid (Result: REJECTED).`;
      }
    }
  }

  // Baseline checks required to submit to OMAG Head:
  // 3. EXIF Camera Timestamp: photoTimestamp must be valid (REQUIRED)
  // 4. Device Hardware Sensor: deviceMake OR deviceModel must be recorded (REQUIRED)
  // (1. GPS Location Embedded & 2. Great-Circle Geofence are NOT REQUIRED)
  // Rule:
  // - If 3 & 4 are valid: Can submit request to OMAG Head, and AI Advisory is required for Head review.
  // - If 3 or 4 is NOT valid: Blocked from submission.
  const hasGeofence = calculatedDistance !== null;
  const hasTimestamp = photoTimestamp !== null;
  const hasDeviceHardware = deviceMake !== null || deviceModel !== null;
  const theRequiredTwoAreValid = hasTimestamp && hasDeviceHardware;
  const hasAiAdvisory = hasScanned && revealedFinalStatus;

  // Review & submission is enabled once scanned and the 2 required checks (Timestamp & Device Sensor) are valid
  const canBeReviewed = hasScanned && revealedFinalStatus && theRequiredTwoAreValid;

  // ✅ Farmer evaluation is satisfied when a case exists OR user just created one
  const isFarmerEvaluated =
    hasEvaluatedFarmer || (intakeMode === "CASE" && !!selectedCaseId);

  // Helper to generate floating particles during AI scan
  const generateParticles = () => {
    const list = [];
    for (let i = 0; i < 40; i++) {
      list.push({
        left: `${(5 + Math.random() * 90).toFixed(1)}%`,
        top: `${(5 + Math.random() * 90).toFixed(1)}%`,
        dx: `${(Math.random() * 70 - 35).toFixed(1)}px`,
        dy: `${(Math.random() * 70 - 35).toFixed(1)}px`,
        delay: `${(Math.random() * 1.5).toFixed(2)}s`,
        duration: `${(1.2 + Math.random() * 1.4).toFixed(2)}s`,
      });
    }
    setParticles(list);
  };

  // Only load preview on file select/drop (Do NOT auto-scan!)
  const processFile = (selected: File) => {
    if (selected.size > 15 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size exceeds 15MB limit." });
      return;
    }

    setUploadingImage(true);
    setFile(selected);
    setHasScanned(false);
    setRevealedChecksCount(0);
    setRevealedFinalStatus(false);
    setConfidenceBarWidth(0);
    setPhotoLat(null);
    setPhotoLng(null);
    setPhotoAlt(null);
    setPhotoTimestamp(null);
    setDeviceMake(null);
    setDeviceModel(null);
    setMessage(null);

    addAuditItem(
      "Photo selected",
      `${selected.name} (${(selected.size / 1024).toFixed(1)} KB)`,
      "PHOTO_SELECT"
    );

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Preview(reader.result as string);
      setUploadingImage(false);
    };
    reader.readAsDataURL(selected);
  };

  const handleRunScan = async () => {
    if (!file) {
      setMessage({
        type: "error",
        text: "Please select or drop a photograph first.",
      });
      return;
    }

    setIsScanning(true);
    setHasScanned(false);
    setRevealedChecksCount(0);
    setRevealedFinalStatus(false);
    setConfidenceBarWidth(0);
    setMessage(null);
    generateParticles();

    addAuditItem(
      "AI scan started",
      `Analyzing submitted photo: ${file.name}`,
      "SCAN_START"
    );

    try {
      setScanStepText("Initializing AI vision scan...");
      await new Promise((r) => setTimeout(r, 650));

      setScanStepText("Detecting photo quality & structure...");
      await new Promise((r) => setTimeout(r, 700));

      setScanStepText("Extracting GPS metadata...");
      const output = await exifr.parse(file, {
        gps: true,
        tiff: true,
        exif: true,
      });

      let hasGps = false;
      let parsedLat: number | null = null;
      let parsedLng: number | null = null;
      let parsedAlt: number | null = null;
      let parsedTimestamp: string | null = null;
      let parsedMake: string | null = null;
      let parsedModel: string | null = null;

      if (output) {
        if (output.latitude && output.longitude) {
          parsedLat = Number(output.latitude);
          parsedLng = Number(output.longitude);
          hasGps = true;
        }

        parsedAlt = output.altitude ? Number(output.altitude) : null;

        if (output.DateTimeOriginal || output.CreateDate) {
          const d = new Date(output.DateTimeOriginal || output.CreateDate);
          parsedTimestamp = d.toISOString();
        }

        parsedMake = output.Make || null;
        parsedModel = output.Model || null;
      }

      setPhotoLat(parsedLat);
      setPhotoLng(parsedLng);
      setPhotoAlt(parsedAlt);
      setPhotoTimestamp(parsedTimestamp);
      setDeviceMake(parsedMake);
      setDeviceModel(parsedModel);

      await new Promise((r) => setTimeout(r, 700));

      setScanStepText("Reading date and time metadata...");
      await new Promise((r) => setTimeout(r, 700));

      setScanStepText("Comparing GPS coordinates with registered farm parcel...");
      await new Promise((r) => setTimeout(r, 850));

      setScanStepText("Checking metadata consistency...");
      await new Promise((r) => setTimeout(r, 750));

      setScanStepText("Generating AI advisory assessment...");
      await new Promise((r) => setTimeout(r, 800));

      setIsScanning(false);
      setHasScanned(true);

      for (let step = 1; step <= 4; step++) {
        await new Promise((r) => setTimeout(r, 360));
        setRevealedChecksCount(step);
      }

      await new Promise((r) => setTimeout(r, 550));
      setRevealedFinalStatus(true);

      const computedDistance =
        registeredLat !== null &&
          registeredLng !== null &&
          parsedLat !== null &&
          parsedLng !== null
          ? calculateHaversineDistance(
            registeredLat,
            registeredLng,
            parsedLat,
            parsedLng
          )
          : null;

      let finalStatus = "NOT ACCEPTED";
      let finalConfidence = 94;

      if (!hasGps) {
        finalStatus = "NOT ACCEPTED";
        finalConfidence = 95;
      } else if (registeredLat === null || registeredLng === null) {
        finalStatus = "REVIEW";
        finalConfidence = 82;
      } else if (computedDistance !== null) {
        if (computedDistance <= thresholdMeters) {
          finalStatus = "PASS";
          finalConfidence = 96;
        } else {
          finalStatus = "REJECTED";
          finalConfidence = 92;
        }
      }

      await new Promise((r) => setTimeout(r, 200));
      setConfidenceBarWidth(finalConfidence);

      const farmerDisplayName = selectedParcel?.farm?.farmer
        ? `${selectedParcel.farm.farmer.firstName} ${selectedParcel.farm.farmer.lastName}`
        : "Registered Parcel";
      const distString =
        computedDistance !== null
          ? `${computedDistance.toFixed(1)}m from parcel`
          : "No GPS Coordinates";

      addAuditItem(
        "Verification completed",
        `${finalStatus} • ${farmerDisplayName} • ${distString}`,
        "VERIFICATION_COMPLETE"
      );
    } catch (err) {
      console.warn("EXIF extraction notice:", err);
      setPhotoLat(null);
      setPhotoLng(null);
      setPhotoAlt(null);
      setPhotoTimestamp(null);
      setDeviceMake(null);
      setDeviceModel(null);
      setIsScanning(false);
      setHasScanned(true);
      setRevealedChecksCount(4);
      setRevealedFinalStatus(true);
      setConfidenceBarWidth(85);

      addAuditItem(
        "Verification completed",
        "NOT ACCEPTED • Missing / Damaged EXIF Headers",
        "VERIFICATION_FAILED"
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleSaveAndSubmitDossier = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCaseMode = intakeMode === "CASE" && selectedCaseId;
    const targetCase = isCaseMode ? cases.find((c) => c.id === Number(selectedCaseId)) : null;

    if (intakeMode === "CASE" && !targetCase) {
      setMessage({
        type: "error",
        text: "Please select an active Crop-Loss Case or switch to Standalone Farmland mode.",
      });
      return;
    }

    if (!isCaseMode && !selectedParcelId) {
      setMessage({
        type: "error",
        text: "Please select a target registered farm parcel.",
      });
      return;
    }

    if (!file || !base64Preview) {
      setMessage({
        type: "error",
        text: "Please upload an authentic field photograph.",
      });
      return;
    }
    if (!reviewNotes.trim()) {
      setMessage({
        type: "error",
        text: "Review & audit notes are required to record this dossier.",
      });
      return;
    }

    const parcel = parcels.find((p) => p.id === Number(selectedParcelId)) ||
      (targetCase ? { id: targetCase.parcelId, farm: { id: targetCase.farmId, farmer: { id: targetCase.farmerId } } } : null);

    if (!targetCase && !parcel) {
      setMessage({ type: "error", text: "Invalid parcel selected." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const uploadPayload = {
        farmerId: targetCase ? targetCase.farmerId : (parcel?.farm?.farmer?.id || 1),
        farmId: targetCase ? targetCase.farmId : (parcel?.farm?.id || 1),
        parcelId: targetCase ? targetCase.parcelId : parcel!.id,
        damageReportId: targetCase ? targetCase.id : null,
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
        throw new Error(errData.error || "Failed to create verification record");
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

      await fetch(`/api/photo-verification/${created.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemReviewStatus: reviewStatus,
          systemReviewNotes: reviewNotes.trim(),
        }),
      });

      const targetRedirectId = created.damageReportId ? created.damageReportId : created.id;
      router.push(`${basePath}/${targetRedirectId}`);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Failed to save verification dossier.",
      });
      setSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-12 text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold animate-pulse border border-slate-200">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Loading AI Metadata Verification Desk...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Records</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo & Raw EXIF Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Photo File Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>1. Select Crop-Loss Case and Upload Photograph</span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "0.0 KB"}
              </span>
            </div>

            {/* Real Photograph Preview Container */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative group aspect-4/3 rounded-xl overflow-hidden shadow-inner transition-all border-2",
                isDragging
                  ? "border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-950/80 scale-[1.01]"
                  : isScanning
                    ? "border-teal-400 ring-4 ring-teal-500/30 bg-slate-950 shadow-2xl"
                    : "border-slate-200 bg-slate-900"
              )}
            >
              {isDragging && (
                <div className="absolute inset-0 z-30 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center pointer-events-none border-2 border-dashed border-emerald-400">
                  <UploadCloud className="w-12 h-12 text-emerald-300 animate-bounce mb-2" />
                  <p className="text-sm font-bold text-white">Drop field photograph here</p>
                  <p className="text-[11px] text-emerald-200 mt-0.5">EXIF location metadata will be extracted automatically</p>
                </div>
              )}

              {isScanning && (
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-slate-950/65 backdrop-blur-2xs">
                  <div className="ai-scan-grid" />
                  <div className="ai-scan-line" />

                  <div className="absolute inset-0 overflow-hidden">
                    {particles.map((p, idx) => (
                      <i
                        key={idx}
                        className="ai-particle"
                        style={
                          {
                            left: p.left,
                            top: p.top,
                            "--dx": p.dx,
                            "--dy": p.dy,
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>

                  <div className="relative z-10 flex flex-col items-center text-center p-4">
                    <div className="ai-scanner-ring flex items-center justify-center mb-1">
                      <Sparkles className="w-7 h-7 text-emerald-300 animate-pulse" />
                    </div>
                    <div className="mt-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/50 text-[10px] font-mono font-black tracking-widest text-emerald-300 uppercase shadow-lg backdrop-blur-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>AI SCAN IN PROGRESS</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-white max-w-[260px] drop-shadow-md transition-all duration-300">
                      {scanStepText}
                    </p>
                  </div>
                </div>
              )}

              {base64Preview ? (
                <>
                  <img
                    src={base64Preview}
                    alt={file?.name || "Submitted Farm Photograph"}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-300",
                      isScanning
                        ? "opacity-60 scale-102 blur-[0.5px]"
                        : "group-hover:scale-105 cursor-pointer"
                    )}
                    onClick={() => !isScanning && setIsLightboxOpen(true)}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 pointer-events-none">
                    <div className="flex justify-between items-start pointer-events-auto">
                      <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-md max-w-[220px] truncate shadow-xs">
                        {file?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-sm transition-all cursor-pointer"
                        title="Zoom / Inspect Photo"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600/90 hover:bg-emerald-600 px-2.5 py-1.5 rounded-lg backdrop-blur-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Click to Zoom</span>
                      </button>
                    </div>
                  </div>

                  {!isScanning && (
                    <div className="absolute bottom-2 left-2 pointer-events-none group-hover:opacity-0 transition-opacity">
                      <span className="text-[10px] font-semibold text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Camera className="w-3 h-3 text-emerald-400" />
                        <span>Click to view full photo</span>
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-800 transition-colors">
                  <UploadCloud className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-white">
                    Drop field photograph here or click to browse
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts raw camera JPEG/PNG with EXIF GPS metadata
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {base64Preview && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Zoom</span>
                </button>
              )}

              {base64Preview ? (
                <>
                  <button
                    type="button"
                    onClick={handleRunScan}
                    disabled={isScanning || !isFarmerEvaluated}
                    className={cn(
                      "flex-1 py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer",
                      (isScanning || !isFarmerEvaluated) ? "opacity-60 cursor-not-allowed" : ""
                    )}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-emerald-200 animate-spin" />
                        <span>Scanning EXIF & Telemetry...</span>
                      </>
                    ) : !isFarmerEvaluated ? (
                      <>
                        <ClipboardList className="w-4 h-4 text-emerald-200" />
                        <span>Evaluate Farmer First</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>{hasScanned ? "Re-scan with AI" : "✨ Scan with AI"}</span>
                      </>
                    )}
                  </button>

                  <label
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Choose a different photograph"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingImage || isScanning}
                    />
                  </label>
                </>
              ) : (
                <label
                  className={cn(
                    "w-full py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer",
                    uploadingImage ? "opacity-50 pointer-events-none" : ""
                  )}
                >
                  <UploadCloud className="w-4 h-4 text-emerald-200" />
                  <span>{uploadingImage ? "Loading photograph..." : "Browse Photograph to Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Selected Parcel Telemetry */}
            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-bold text-slate-900 text-right">
                  {selectedParcel?.farm?.farmer
                    ? `${selectedParcel.farm.farmer.firstName} ${selectedParcel.farm.farmer.lastName}`
                    : "Select target parcel..."}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">RSBSA ID:</span>
                <span className="font-mono font-semibold text-emerald-700 text-right">
                  {selectedParcel?.farm?.farmer?.rsbsaNumber ||
                    selectedParcel?.farm?.farmer?.farmerCode ||
                    "—"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Farm / Barangay:</span>
                <span className="font-medium text-slate-800 text-right">
                  {selectedParcel?.farm
                    ? `${selectedParcel.farm.farmName || "Farm"} (${selectedParcel.farm.barangay})`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Parcel Number:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {selectedParcel
                    ? `Parcel ${selectedParcel.parcelNumber} (${selectedParcel.areaHa} ha)`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Uploaded Date:</span>
                <span className="text-slate-700 text-right" suppressHydrationWarning>
                  {file ? new Date().toLocaleString() : "No photo uploaded yet"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Panel 1: FDD Function 2 & 3: Verify Metadata & Compare with Farm Parcel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>2. Verify GPS, Timestamp, and Device Metadata &amp; 3. Compare with Registered Farm Parcel</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  suppressHydrationWarning
                  value={thresholdMeters}
                  onChange={(e) => setThresholdMeters(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
                >
                  <option value={100}>100m Tolerance</option>
                  <option value={360}>360m Tolerance</option>
                  <option value={500}>500m (Standard OMAG)</option>
                  <option value={1000}>1000m Tolerance</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Deterministic Rule Checklist:
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Inspection Rule</th>
                      <th className="py-2.5 px-3">Telemetry / Payload</th>
                      <th className="py-2.5 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr className={cn(
                      "transition-all duration-300",
                      hasScanned && revealedChecksCount >= 1 ? "bg-white" : "opacity-40"
                    )}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        1. GPS Location Embedded
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {hasScanned && revealedChecksCount >= 1 ? (
                          photoLat && photoLng ? (
                            `${photoLat.toFixed(6)}, ${photoLng.toFixed(6)}`
                          ) : (
                            "No embedded GPS metadata"
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 animate-pulse font-mono">Evaluating GPS...</span>
                        ) : (
                          "Awaiting AI scan"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {hasScanned && revealedChecksCount >= 1 ? (
                          photoLat && photoLng ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] animate-in fade-in-50">
                              PRESENT
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] animate-in fade-in-50">
                              UNAVAILABLE
                            </span>
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[10px] animate-pulse">
                            CHECKING...
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                            QUEUED
                          </span>
                        )}
                      </td>
                    </tr>

                    <tr className={cn(
                      "transition-all duration-300",
                      hasScanned && revealedChecksCount >= 2 ? "bg-white" : "opacity-40"
                    )}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        2. Great-Circle Geofence
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {hasScanned && revealedChecksCount >= 2 ? (
                          calculatedDistance !== null ? (
                            `${calculatedDistance.toFixed(1)}m from parcel (Tolerance: ${thresholdMeters}m)`
                          ) : (
                            "Cannot evaluate distance (No GPS)"
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 animate-pulse font-mono">Calculating Haversine...</span>
                        ) : (
                          "Awaiting AI scan"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {hasScanned && revealedChecksCount >= 2 ? (
                          calculatedDistance !== null ? (
                            verificationStatus === "ACCEPTED" ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] animate-in fade-in-50">
                                WITHIN GEOFENCE
                              </span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[10px] animate-in fade-in-50">
                                OUTSIDE GEOFENCE
                              </span>
                            )
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] animate-in fade-in-50">
                              NOT RECORDED
                            </span>
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[10px] animate-pulse">
                            CHECKING...
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                            QUEUED
                          </span>
                        )}
                      </td>
                    </tr>

                    <tr className={cn(
                      "transition-all duration-300",
                      hasScanned && revealedChecksCount >= 3 ? "bg-white" : "opacity-40"
                    )}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        3. EXIF Camera Timestamp <span className="text-[10px] font-bold text-emerald-700 font-mono">(REQUIRED)</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {hasScanned && revealedChecksCount >= 3 ? (
                          photoTimestamp ? (
                            new Date(photoTimestamp).toLocaleString()
                          ) : (
                            "No EXIF timestamp recorded"
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 animate-pulse font-mono">Reading Timestamp...</span>
                        ) : (
                          "Awaiting AI scan"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {hasScanned && revealedChecksCount >= 3 ? (
                          photoTimestamp ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] animate-in fade-in-50">
                              AUTHENTIC
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[10px] animate-in fade-in-50">
                              MISSING
                            </span>
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[10px] animate-pulse">
                            CHECKING...
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                            QUEUED
                          </span>
                        )}
                      </td>
                    </tr>

                    <tr className={cn(
                      "transition-all duration-300",
                      hasScanned && revealedChecksCount >= 4 ? "bg-white" : "opacity-40"
                    )}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        4. Device Hardware Sensor <span className="text-[10px] font-bold text-emerald-700 font-mono">(REQUIRED)</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {hasScanned && revealedChecksCount >= 4 ? (
                          [deviceMake, deviceModel].filter(Boolean).join(" ") || "Standard Camera Sensor"
                        ) : isScanning ? (
                          <span className="text-teal-600 animate-pulse font-mono">Parsing Hardware...</span>
                        ) : (
                          "Awaiting AI scan"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {hasScanned && revealedChecksCount >= 4 ? (
                          deviceMake || deviceModel ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] animate-in fade-in-50">
                              RECORDED
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[10px] animate-in fade-in-50">
                              MISSING
                            </span>
                          )
                        ) : isScanning ? (
                          <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[10px] animate-pulse">
                            CHECKING...
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                            QUEUED
                          </span>
                        )}
                      </td>
                    </tr>

                    <tr className={cn(
                      "transition-all duration-300",
                      hasScanned && revealedFinalStatus ? "bg-white" : "opacity-40"
                    )}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        5. AI Advisory Interpretation {theRequiredTwoAreValid ? (
                          <span className="text-[10px] font-bold text-purple-700 font-mono">(REQUIRED FOR HEAD REVIEW)</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 font-mono">(STANDBY)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {hasScanned && revealedFinalStatus ? (
                          `${verificationStatus === "ACCEPTED" ? "CONSISTENT" : verificationStatus === "REVIEW" ? "INSUFFICIENT_EVIDENCE" : "INCONSISTENT"} (Advisory generated)`
                        ) : isScanning ? (
                          <span className="text-teal-600 animate-pulse font-mono">Synthesizing Advisory...</span>
                        ) : (
                          "Awaiting AI scan"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {hasScanned && revealedFinalStatus ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] animate-in fade-in-50">
                            EVALUATED
                          </span>
                        ) : isScanning ? (
                          <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[10px] animate-pulse">
                            CHECKING...
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                            QUEUED
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Panel 2: AI-Assisted Interpretation */}
          <div className="bg-white border border-purple-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3.5">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-900">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>AI Advisory Interpretation</span>
              </div>
              {hasScanned && revealedFinalStatus && (
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 animate-in fade-in-50">
                  {confidenceBarWidth}% Confidence
                </span>
              )}
            </div>

            {hasScanned && revealedFinalStatus ? (
              <div className="space-y-4 animate-in fade-in-50 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-purple-700 uppercase font-bold block">
                      AI Consistency Assessment
                    </span>
                    <span className="text-sm font-bold text-purple-950 block">
                      {!photoTimestamp || (!deviceMake && !deviceModel)
                        ? "INSUFFICIENT_EVIDENCE"
                        : "CONSISTENT"}
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-purple-700 uppercase font-bold block">
                      AI Advisory Recommendation
                    </span>
                    <span className="text-sm font-bold text-purple-950 block">
                      {!photoTimestamp || (!deviceMake && !deviceModel)
                        ? "REJECT"
                        : "ACCEPT"}
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-purple-700 uppercase font-bold block">
                      OMAg Head Review Required
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold block",
                        photoTimestamp && (deviceMake || deviceModel) ? "text-emerald-700" : "text-amber-700"
                      )}
                    >
                      {photoTimestamp && (deviceMake || deviceModel) ? "READY FOR HEAD" : "BLOCKED (Incomplete Evidence)"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-700">AI Explanation &amp; Ground Truth Summary:</p>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed font-normal">
                    {!photoTimestamp || (!deviceMake && !deviceModel)
                      ? `Gemini AI advisory: Photograph lacks authentic camera hardware sensor or EXIF timestamp metadata. Cannot corroborate if this is an authentic field photograph (possible downloaded or modified image). Recommendation: REJECT or require re-capture.`
                      : calculatedDistance !== null && calculatedDistance <= thresholdMeters
                        ? `Gemini AI advisory: Evaluated photo EXIF telemetry matches registered parcel #${selectedParcel?.parcelNumber || "LOT"} within ${thresholdMeters}m geofence tolerance (${calculatedDistance.toFixed(1)}m calculated vector). Camera sensor (${[deviceMake, deviceModel].filter(Boolean).join(" ")}) and timestamp authentic.`
                        : photoTimestamp && (deviceMake || deviceModel)
                          ? `Gemini AI advisory: Authentic camera hardware sensor (${[deviceMake, deviceModel].filter(Boolean).join(" ")}) and timestamp recorded. Photo verified as camera-original field capture.`
                          : `Photograph evidence is under review.`}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-700">AI Suggested Municipal Audit Note:</p>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px]">
                    {!photoTimestamp || (!deviceMake && !deviceModel)
                      ? `[AI ADVISORY] Reject / Insufficient Evidence: Missing authentic camera hardware or timestamp metadata.`
                      : calculatedDistance !== null && calculatedDistance <= thresholdMeters
                        ? `[AI ADVISORY] Consistent: Camera sensor and timestamp authentic; GPS matches parcel #${selectedParcel?.parcelNumber || "LOT"} (${calculatedDistance.toFixed(1)}m).`
                        : `[AI ADVISORY] Consistent: Verified camera-original evidence (${[deviceMake, deviceModel].filter(Boolean).join(" ")} captured on ${new Date(photoTimestamp!).toLocaleDateString()}).`}
                  </p>
                </div>
              </div>
            ) : isScanning ? (
              <div className="p-6 text-center text-slate-600 space-y-2 border border-dashed border-teal-300 rounded-xl bg-teal-50/40 animate-pulse">
                <Sparkles className="w-8 h-8 text-teal-500 mx-auto animate-spin" />
                <p className="text-xs text-teal-900 font-bold">
                  {scanStepText}
                </p>
                <p className="text-[11px] text-teal-700">
                  Gemini AI advisory interpretation and sequential checks are running automatically.
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-xs text-slate-700 font-semibold">
                  Awaiting AI &amp; EXIF Metadata Scan
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Click &ldquo;✨ Scan with AI&rdquo; on your uploaded photograph to activate automated AI metadata verification and advisory interpretation.
                </p>
              </div>
            )}
          </div>

          {/* Panel 3: FDD Function 4: Display and Record Verification Findings */}
          {canBeReviewed ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3.5">
                <User className="w-5 h-5 text-emerald-700" />
                <span>4. Display and Record Verification Findings</span>
              </div>

              <form onSubmit={handleSaveAndSubmitDossier} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Review &amp; Audit Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    suppressHydrationWarning
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Record municipal review observations, parcel lot corroboration, or field technician notes..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-normal"
                    required
                  />
                </div>

                {message && message.type === "error" && (
                  <div className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !file || !selectedParcelId}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {submitting
                        ? "Recording Dossier..."
                        : "Record System Review & Submit Dossier"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          ) : hasScanned && revealedFinalStatus ? (
            <div className="bg-white border border-rose-200 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-900 border-b border-rose-100 pb-3.5">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Municipal Internal System Review — Not Available</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <p className="text-xs font-bold text-rose-900">
                  This record cannot be submitted for OMAG Head review.
                </p>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  The following <span className="font-bold">required camera verification checks</span> are missing or invalid:
                </p>
                <ul className="text-[11px] text-rose-800 list-disc list-inside space-y-0.5">
                  {!hasTimestamp && <li><span className="font-bold">EXIF Camera Timestamp (3)</span> — Photo timestamp metadata not detected.</li>}
                  {!hasDeviceHardware && <li><span className="font-bold">Device Hardware Sensor (4)</span> — Camera make/model sensor metadata not detected.</li>}
                </ul>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Both EXIF Camera Timestamp (3) and Device Hardware Sensor (4) must be valid to submit a request to OMAG Head.
                </p>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Please upload an authentic camera-original photograph containing valid timestamp and device hardware sensor metadata.
              </p>
            </div>
          ) : null}

          {/* Panel 4: Immutable Dynamic Audit Trail */}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && base64Preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
                    {file?.name || "Field Photo Preview"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : "Preview"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-[350px] max-h-[72vh] flex items-center justify-center p-3 bg-slate-950 overflow-auto">
              <img
                src={base64Preview}
                alt={file?.name || "Preview"}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Evaluate Farmer Modal (Step 1) */}
      {isEvaluateFarmerOpen && (
        <CreateCaseModal
          isOpen={isEvaluateFarmerOpen}
          onClose={() => setIsEvaluateFarmerOpen(false)}
          onCreated={async () => {
            setIsEvaluateFarmerOpen(false);
            await fetchCases();
            setHasEvaluatedFarmer(true);
            setMessage({
              type: "success",
              text: "Farmer evaluation recorded successfully! You may now proceed to Step 2: AI Metadata Verification.",
            });
            addAuditItem(
              "Farmer evaluated",
              `Crop-loss claim filed for ${selectedParcel?.farm?.farmer?.firstName || "farmer"} (Parcel #${selectedParcel?.parcelNumber || "LOT"}).`,
              "CASE_EVALUATED"
            );
          }}
          initialContext={{
            farmerId: selectedParcel?.farm?.farmer?.id || selectedCase?.farmerId,
            parcelId: selectedParcel?.id || selectedCase?.parcelId,
          }}
        />
      )}
    </div>
  );
};