"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Plus,
  ShieldAlert,
  Sprout,
  TrendingUp,
  PhoneCall,
  History,
  AlertCircle,
  Link2,
  ExternalLink,
  ClipboardList,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CasePhotoSummaryItem } from "../types";
import { CreateCaseModal } from "@/features/pcic/components/CreateCaseModal";
import { CaseDetailModal } from "@/features/pcic/components/CaseDetailModal";

interface PhotoVerificationDetailProps {
  record: any;
  userRole: "OMAG_HEAD" | "OMAG_STAFF";
}

export const PhotoVerificationDetail: React.FC<PhotoVerificationDetailProps> = ({
  record: initialRecord,
  userRole,
}) => {
  const [record, setRecord] = useState(initialRecord);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  // Derive photos list
  const photos: CasePhotoSummaryItem[] =
    record.photos && record.photos.length > 0
      ? record.photos
      : record.originalFileName
        ? [
          {
            id: record.id,
            originalFileName: record.originalFileName,
            storageKey: record.storageKey || "",
            mimeType: record.mimeType || "image/jpeg",
            fileSizeBytes: record.fileSizeBytes || 0,
            photoTimestamp: record.photoTimestamp ? new Date(record.photoTimestamp).toISOString() : null,
            photoLatitude: record.photoLatitude,
            photoLongitude: record.photoLongitude,
            photoAltitude: record.photoAltitude || null,
            deviceMake: record.deviceMake || null,
            deviceModel: record.deviceModel || null,
            registeredLatitude: record.registeredLatitude,
            registeredLongitude: record.registeredLongitude,
            calculatedDistanceMeters: record.calculatedDistanceMeters,
            thresholdMeters: record.thresholdMeters || 500,
            verificationStatus: record.verificationStatus || "PENDING",
            gpsStatus: record.gpsStatus || "GPS_MISSING",
            timestampStatus: record.timestampStatus || "TIMESTAMP_MISSING",
            failureReasonCode: record.failureReasonCode || null,
            verificationNotes: record.verificationNotes || null,
            aiAssessment: record.aiAssessment || null,
            aiRecommendation: record.aiRecommendation || null,
            aiReviewRequired: record.aiReviewRequired || false,
            aiExplanation: record.aiExplanation || null,
            aiAuditNote: record.aiAuditNote || null,
            aiConfidence: record.aiConfidence || null,
            aiConflict: record.aiConflict || false,
            aiModelUsed: record.aiModelUsed || null,
            aiAssessedAt: record.aiAssessedAt ? new Date(record.aiAssessedAt).toISOString() : null,
            systemReviewStatus: record.systemReviewStatus || null,
            systemReviewNotes: record.systemReviewNotes || null,
            createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
            verifiedByName: record.verifiedBy?.fullName || null,
          },
        ]
        : [];

  const activePhoto: CasePhotoSummaryItem | null =
    photos[selectedPhotoIndex] || photos[0] || null;

  const [verifying, setVerifying] = useState(false);
  const [assessingAi, setAssessingAi] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(
    activePhoto?.systemReviewStatus || record.systemReviewStatus || "REVIEWED"
  );
  const [reviewNotes, setReviewNotes] = useState(
    activePhoto?.systemReviewNotes || record.systemReviewNotes || ""
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageVersion, setImageVersion] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "streets">("satellite");
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const isStaff = userRole === "OMAG_STAFF";
  const basePath = isStaff ? "/staff/photo-verification" : "/head/photo-verification";

  // Evaluate Farmer modal state (opens CreateCaseModal inline)
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);
  // View Claim Details modal state (opens CaseDetailModal inline)
  const [isViewClaimOpen, setIsViewClaimOpen] = useState(false);

  // Derive whether photo is connected to a PCIC Crop-Loss Claim
  const isLinkedToClaim = Boolean(
    record.damageReportId ||
    record.claimId ||
    record.claimNumber ||
    (record.damageReport && record.damageReport.id) ||
    (typeof record.id === "number" && record.id > 0) ||
    (typeof record.reportNumber === "string" && record.reportNumber.startsWith("DR-"))
  );

  const claimId = record.claimId || record.damageReport?.pcicClaim?.id || null;
  const claimNumber = record.claimNumber || record.damageReport?.pcicClaim?.claimNumber || null;
  const reportNumber = record.reportNumber || record.damageReport?.reportNumber || (isLinkedToClaim ? `DR-${record.id}` : null);
  const damageReportId = record.damageReportId || record.damageReport?.id || (typeof record.id === "number" ? record.id : null);
  const caseStatus = record.caseStatus || record.damageReport?.pcicClaim?.claimStatus || record.damageReport?.status || "SUBMITTED";
  const priorityLevel = record.priorityLevel || record.damageReport?.pcicClaim?.priorityScore?.priorityLevel || null;
  const priorityScore = record.priorityScore ?? record.damageReport?.pcicClaim?.priorityScore?.score ?? null;
  const rankPosition = record.rankPosition ?? record.damageReport?.pcicClaim?.priorityScore?.rankPosition ?? null;
  const insurancePolicyNo = record.insurancePolicyNo || record.damageReport?.pcicClaim?.insurancePolicyNo || null;
  const coordinationRemarks = record.coordinationRemarks || record.damageReport?.pcicClaim?.remarks || null;

  const farmerName = record.farmerName || (record.farmer ? `${record.farmer.firstName} ${record.farmer.lastName}` : "Registered Farmer");
  const farmerRsbsa = record.farmerRsbsa || record.farmer?.rsbsaNumber || record.farmerCode || record.farmer?.farmerCode || "N/A";
  const farmerId = record.farmerId || record.farmer?.id;
  const parcelId = record.parcelId || record.parcel?.id;
  const farmId = record.farmId || record.farm?.id || record.parcel?.farmId;
  const farmName = record.farmName || record.farm?.farmName || record.parcel?.farm?.farmName || "Farm";
  const barangay = record.barangay || record.farm?.barangay || record.farmer?.barangay || "Polomolok";
  const parcelNumber = record.parcelNumber || record.parcel?.parcelNumber || "N/A";
  const parcelAreaHa = record.parcelAreaHa ?? record.parcel?.areaHa ?? 0;
  const cropType = record.cropType || record.damageReport?.crop?.cropType || record.parcel?.crops?.[0]?.cropType || "Registered Crop";
  const variety = record.variety || record.damageReport?.crop?.variety || record.parcel?.crops?.[0]?.variety || "Standard Variety";
  const cropId = record.cropId || record.damageReport?.cropId || record.parcel?.crops?.[0]?.id || 1;
  const reportedDamagePercent = record.reportedDamagePercent ?? record.damageReport?.reportedDamagePercent ?? null;
  const assessedDamagePercent = record.assessedDamagePercent ?? record.damageReport?.assessment?.assessedDamagePercent ?? null;
  const reportedAffectedAreaHa = record.reportedAffectedAreaHa ?? record.damageReport?.reportedAffectedAreaHa ?? null;
  const incidentDate = record.incidentDate || record.damageReport?.incidentDate || null;
  const calamityType = record.calamityType || record.damageReport?.calamityType || null;
  const narrativeDescription = record.narrativeDescription || record.damageReport?.narrativeDescription || null;

  // Active photo image URL
  const activeImageUrl = activePhoto
    ? imageVersion > 0
      ? `/api/photo-verification/${activePhoto.id}/image?v=${imageVersion}`
      : `/api/photo-verification/${activePhoto.id}/image`
    : "/assets/default-field-photo.jpg";

  // Geospatial Centroid Coordinates
  const centroidLat = record.parcelLatitude ?? record.registeredLatitude ?? record.parcel?.latitude ?? null;
  const centroidLng = record.parcelLongitude ?? record.registeredLongitude ?? record.parcel?.longitude ?? null;
  const photoLat = activePhoto?.photoLatitude ?? null;
  const photoLng = activePhoto?.photoLongitude ?? null;

  // Initialize and update interactive geospatial Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const hasCentroid =
      centroidLat !== null && centroidLng !== null && !isNaN(Number(centroidLat)) && !isNaN(Number(centroidLng));
    const hasPhotoGps =
      photoLat !== null && photoLng !== null && !isNaN(Number(photoLat)) && !isNaN(Number(photoLng));

    if (!hasCentroid && !hasPhotoGps) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter: [number, number] = hasCentroid
        ? [Number(centroidLat), Number(centroidLng)]
        : [Number(photoLat), Number(photoLng)];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      const satelliteUrl =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(mapType === "satellite" ? satelliteUrl : streetsUrl, {
        maxZoom: 19,
        attribution: mapType === "satellite" ? "© Esri World Imagery" : "© OpenStreetMap contributors",
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const boundsPoints: [number, number][] = [];

      // 1. Registered Parcel Centroid Marker & 500m Geofence
      if (hasCentroid) {
        const cLat = Number(centroidLat);
        const cLng = Number(centroidLng);
        boundsPoints.push([cLat, cLng]);

        const centroidIcon = L.divIcon({
          className: "centroid-marker",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <div style="background: linear-gradient(135deg, #047857, #065f46); color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 800; font-size: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>📍 Parcel ${record.parcelNumber || record.parcel?.parcelNumber || "Centroid"}</span>
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #047857; margin-top: -1px;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker([cLat, cLng], { icon: centroidIcon })
          .addTo(map)
          .bindPopup(
            `<b>Registered Parcel Centroid</b><br/>Lot #${record.parcelNumber || record.parcel?.parcelNumber || "N/A"}<br/>Coords: ${cLat.toFixed(6)}, ${cLng.toFixed(6)}`
          );

        // 500m Municipal Geofence Radius
        L.circle([cLat, cLng], {
          radius: activePhoto?.thresholdMeters || record.thresholdMeters || 500,
          color: "#059669",
          fillColor: "#10b981",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "6, 6",
        })
          .addTo(map)
          .bindTooltip(`500m Municipal Geofence Tolerance`, { permanent: false });
      }

      // 2. Active Photo Location Marker
      if (hasPhotoGps) {
        const pLat = Number(photoLat);
        const pLng = Number(photoLng);
        boundsPoints.push([pLat, pLng]);

        const isMatch = activePhoto?.verificationStatus === "ACCEPTED";
        const photoColor = isMatch ? "#059669" : "#dc2626";

        const photoIcon = L.divIcon({
          className: "photo-marker",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <div style="background: ${photoColor}; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 800; font-size: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>📷 Photo #${selectedPhotoIndex + 1} GPS</span>
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${photoColor}; margin-top: -1px;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker([pLat, pLng], { icon: photoIcon })
          .addTo(map)
          .bindPopup(
            `<b>Field Photo Embedded GPS</b><br/>Lat: ${pLat.toFixed(6)}, Lng: ${pLng.toFixed(6)}<br/>Camera: ${[activePhoto?.deviceMake, activePhoto?.deviceModel].filter(Boolean).join(" ") || "EXIF Sensor"}`
          );
      }

      // 3. Connect line & distance if both present
      if (hasCentroid && hasPhotoGps) {
        const cLat = Number(centroidLat);
        const cLng = Number(centroidLng);
        const pLat = Number(photoLat);
        const pLng = Number(photoLng);

        L.polyline([[cLat, cLng], [pLat, pLng]], {
          color: activePhoto?.verificationStatus === "ACCEPTED" ? "#047857" : "#ef4444",
          weight: 3,
          dashArray: "5, 8",
        }).addTo(map);
      }

      if (boundsPoints.length > 1) {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [45, 45], maxZoom: 17 });
      }
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centroidLat, centroidLng, photoLat, photoLng, activePhoto?.verificationStatus, mapType, selectedPhotoIndex]);

  // Handle uploading an additional photo to this crop-loss case
  const handleAddPhotoFile = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size exceeds 15MB limit." });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const uploadPayload = {
          farmerId: record.farmerId,
          farmId: record.farmId,
          parcelId: record.parcelId,
          damageReportId: record.id,
          originalFileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || "image/jpeg",
          base64Data: base64,
        };

        const res = await fetch("/api/photo-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploadPayload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload photo to case");
        }

        const created = await res.json();

        // Auto verify newly uploaded photo
        await fetch(`/api/photo-verification/${created.id}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data: base64, thresholdMeters: 500 }),
        });

        // Refresh dossier from server
        const refreshRes = await fetch(`/api/photo-verification/${record.id}`);
        if (refreshRes.ok) {
          const updatedDossier = await refreshRes.json();
          setRecord(updatedDossier);
          setSelectedPhotoIndex(0);
        }

        setIsAddingPhoto(false);
        setImageVersion(Date.now());
        setMessage({
          type: "success",
          text: `Photo "${file.name}" attached to crop-loss case and verified successfully!`,
        });
      } catch (err: any) {
        setMessage({ type: "error", text: err?.message || "Failed to attach photo." });
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunVerification = async () => {
    if (!activePhoto) return;
    setVerifying(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/photo-verification/${activePhoto.id}/verify`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to execute deterministic verification");
      }
      const updated = await res.json();

      // Refresh case dossier
      const refreshRes = await fetch(`/api/photo-verification/${record.id}`);
      if (refreshRes.ok) {
        const updatedDossier = await refreshRes.json();
        setRecord(updatedDossier);
      }
      setMessage({ type: "success", text: "Deterministic verification re-evaluated successfully." });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Verification failed." });
    } finally {
      setVerifying(false);
    }
  };

  const handleRunAiAssessment = async () => {
    if (!activePhoto) return;
    setAssessingAi(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/photo-verification/${activePhoto.id}/ai-assess`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate AI advisory");
      }

      // Refresh case dossier
      const refreshRes = await fetch(`/api/photo-verification/${record.id}`);
      if (refreshRes.ok) {
        const updatedDossier = await refreshRes.json();
        setRecord(updatedDossier);
      }
      setMessage({ type: "success", text: "AI assessment generated successfully." });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "AI assessment failed." });
    } finally {
      setAssessingAi(false);
    }
  };

  const handleHeadDecision = async (decisionStatus: "CONFIRMED" | "REJECTED") => {
    if (!activePhoto) return;
    if (!reviewNotes.trim()) {
      setMessage({
        type: "error",
        text: `Please enter audit notes before ${decisionStatus === "CONFIRMED" ? "approving" : "rejecting"
          } this verification record.`,
      });
      return;
    }

    setSubmittingReview(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/photo-verification/${activePhoto.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemReviewStatus: decisionStatus,
          systemReviewNotes: reviewNotes.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit decision");
      }

      const refreshRes = await fetch(`/api/photo-verification/${record.id}`);
      if (refreshRes.ok) {
        const updatedDossier = await refreshRes.json();
        setRecord(updatedDossier);
      }

      setReviewStatus(decisionStatus);
      setMessage({
        type: "success",
        text: `Verification record has been ${decisionStatus === "CONFIRMED" ? "APPROVED" : "REJECTED"
          } by Municipal Head.`,
      });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to submit decision." });
    } finally {
      setSubmittingReview(false);
    }
  };


  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ACCEPTED (Within Tolerance)
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> REQUIRES REVIEW
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-900 border border-red-300">
            <XCircle className="w-4 h-4 text-red-600" /> REJECTED (Outside Tolerance)
          </span>
        );
      case "NOT_ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-4 h-4 text-rose-600" /> NOT ACCEPTED (Missing GPS)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-4 h-4 text-slate-500" /> PENDING VERIFICATION
          </span>
        );
    }
  };

  const getPriorityBadge = (level: string | null, rank: number | null) => {
    if (!level) return <span className="text-slate-400 font-mono text-xs">—</span>;

    const rankText = rank ? `Rank #${rank}` : "";

    switch (level) {
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            {rankText ? `${rankText} (HIGH)` : "HIGH PRIORITY"}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            {rankText ? `${rankText} (MEDIUM)` : "MEDIUM PRIORITY"}
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {rankText ? `${rankText} (LOW)` : "LOW PRIORITY"}
          </span>
        );
      default:
        return <span className="text-slate-600 text-xs">{level}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation & Consolidated Header Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Photo Verification Desk</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {getVerificationBadge(record.consolidatedVerificationStatus || activePhoto?.verificationStatus || "PENDING")}
          {isLinkedToClaim ? (
            <>
              {getPriorityBadge(priorityLevel, rankPosition)}
              <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                Case: {caseStatus}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-300">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Unlinked Photo Submission</span>
            </span>
          )}
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "p-4 text-xs font-medium rounded-2xl border flex items-center gap-2.5 shadow-xs",
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* COMBINED WORKFLOW STATUS BANNER */}
      {isLinkedToClaim ? (
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>CONNECTED WORKFLOW</span>
                </span>
                <span className="text-xs font-semibold text-emerald-200">
                  Combined Photo Verification &amp; PCIC Crop-Loss Claim Dossier
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white font-mono">
                  Claim #{claimNumber || "Pending"}
                </h2>
                {reportNumber && (
                  <span className="text-xs text-slate-300 font-mono">
                    (Damage Report: {reportNumber})
                  </span>
                )}
                {priorityLevel && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    {priorityLevel} Priority {rankPosition ? `• Rank #${rankPosition}` : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                This verification dossier is authoritatively connected to the official PCIC monitoring case. Photo verification and claim management remain separate functional records while providing combined view details.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Upload Photo to Verified — routes to PhotoVerificationNewForm with farmerId */}
              {isStaff && farmerId && (
                <Link
                  href={`${basePath}/new?farmerId=${farmerId}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-500/40 transition-all cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500 text-white text-[11px] font-bold">
                  <Camera className="w-3.5 h-3.5" />
                  <span>STANDALONE PHOTO SUBMISSION</span>
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Ready to connect to PCIC Crop-Loss Claim
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Verified Field Photograph — Not Yet Linked to PCIC Claim
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                This photograph has undergone AI-assisted metadata extraction and deterministic cadastral GPS validation. You can use this verified evidence to file a new PCIC crop-loss claim for Beneficiary <strong className="text-slate-800">{farmerName}</strong> (Parcel #{parcelNumber}), or connect it to an existing claim.
              </p>
            </div>

            {isStaff && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Evaluate Farmer: opens CreateCaseModal pre-filled with this verification's parcel context */}
                <button
                  type="button"
                  onClick={() => setIsEvaluateOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 group"
                  title={`File a crop-loss claim for ${farmerName} — Parcel #${parcelNumber}. The form will be pre-filled with the verified parcel context.`}
                >
                  <ClipboardList className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Evaluate Farmer</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: CROP-LOSS CASE INFORMATION (Visible when linked to claim) */}
      {isLinkedToClaim ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <FileText className="w-5 h-5 text-emerald-700" />
              <span>1. Connected PCIC Crop-Loss Claim Information</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                Report #: {reportNumber || "N/A"}
              </span>
              {claimNumber && (
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Claim #: {claimNumber}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Farmer / Beneficiary</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{farmerName}</span>
              <span className="text-[11px] font-mono text-emerald-700 mt-0.5 block">
                RSBSA: {farmerRsbsa}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Damaged Crop &amp; Variety</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{cropType}</span>
              <span className="text-[11px] text-slate-600 mt-0.5 block">Variety: {variety}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Incident Date &amp; Calamity</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {incidentDate ? new Date(incidentDate).toLocaleDateString() : "Recorded Date"}
              </span>
              <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
                Calamity: {calamityType || "General Crop Loss"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Reported Damage Severity</span>
              <span className="text-sm font-black text-slate-900 mt-1 block">
                {reportedDamagePercent !== null ? `${reportedDamagePercent}% Loss` : "—"}
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5 block">
                Affected Area: {reportedAffectedAreaHa || 0} ha
              </span>
            </div>
          </div>

          {narrativeDescription && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Farmer Incident Narrative:</span>
              <p className="text-slate-800 leading-relaxed font-normal">{narrativeDescription}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <User className="w-5 h-5 text-emerald-700" />
              <span>1. Beneficiary &amp; Registered Farmland Information</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Cadastral Record
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Farmer Name</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{farmerName}</span>
              <span className="text-[11px] font-mono text-emerald-700 mt-0.5 block">RSBSA: {farmerRsbsa}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Farm &amp; Barangay</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{farmName}</span>
              <span className="text-[11px] text-slate-600 mt-0.5 block">Brgy. {barangay}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Crop</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{cropType}</span>
              <span className="text-[11px] text-slate-600 mt-0.5 block">Variety: {variety}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FARM & PARCEL INFORMATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
            <MapPin className="w-5 h-5 text-emerald-700" />
            <span>2. Farm &amp; Parcel Information</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Farm / Barangay</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {record.farmName || record.farm?.farmName || "Farm"} (Brgy. {record.barangay || record.farm?.barangay})
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Cadastral Lot Number</span>
            <span className="font-mono font-bold text-slate-900 mt-0.5 block">
              Lot {record.parcelNumber || record.parcel?.parcelNumber} ({record.parcelAreaHa || record.parcel?.areaHa || 0} ha)
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Planted Area / Stage</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {record.plantedAreaHa || record.assessment?.assessedAreaHa || record.parcelAreaHa || 0} ha (Active Crop)
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4, 5, 6: ACTIVE PHOTO METADATA, DETERMINISTIC VERIFICATION & AI ADVISORY */}
      {activePhoto && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Photo Preview & Raw EXIF Telemetry (Section 4) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>3. Active Photograph (#{selectedPhotoIndex + 1})</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {(activePhoto.fileSizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>

              {/* Photo Display Card */}
              <div className="relative group aspect-4/3 rounded-xl overflow-hidden shadow-inner border border-slate-200 bg-slate-900">
                <img
                  src={activeImageUrl}
                  alt={activePhoto.originalFileName}
                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onClick={() => setIsLightboxOpen(true)}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes("default-field-photo.jpg")) {
                      target.src = "/assets/default-field-photo.jpg";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between pointer-events-none">
                  <span className="text-[11px] text-white bg-black/60 px-2 py-1 rounded max-w-[240px] truncate">
                    {activePhoto.originalFileName}
                  </span>
                  <div className="flex items-center justify-between pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom</span>
                    </button>
                    <a
                      href={activeImageUrl}
                      download={activePhoto.originalFileName}
                      className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 shadow-xs"
                      title="Download Photo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Raw EXIF Telemetry Table */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Embedded Camera EXIF Telemetry
                </span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="font-mono font-bold text-slate-900 text-right">
                      {activePhoto.photoLatitude && activePhoto.photoLongitude
                        ? `${activePhoto.photoLatitude.toFixed(6)}, ${activePhoto.photoLongitude.toFixed(6)}`
                        : "Missing embedded GPS"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-500">EXIF Timestamp:</span>
                    <span className="font-mono text-slate-800 text-right" suppressHydrationWarning>
                      {activePhoto.photoTimestamp
                        ? new Date(activePhoto.photoTimestamp).toLocaleString()
                        : "No timestamp header"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-500">Camera Hardware:</span>
                    <span className="text-slate-800 text-right font-medium">
                      {[activePhoto.deviceMake, activePhoto.deviceModel].filter(Boolean).join(" ") || "Unspecified Hardware"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-500">Sensor Altitude:</span>
                    <span className="font-mono text-slate-800 text-right">
                      {activePhoto.photoAltitude ? `${activePhoto.photoAltitude.toFixed(1)}m` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-500">Header Availability:</span>
                    <span className="font-bold text-emerald-800 text-right">
                      {activePhoto.photoLatitude && activePhoto.photoLongitude
                        ? "EXIF GPS & Timestamp Detected"
                        : "Incomplete EXIF Headers"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Municipal System Review & Decision */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Municipal Review &amp; Decision</span>
              </div>

              {userRole === "OMAG_HEAD" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Head Review &amp; Audit Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter official Head findings, parcel corroboration, or remarks..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleHeadDecision("REJECTED")}
                      disabled={submittingReview}
                      className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHeadDecision("CONFIRMED")}
                      disabled={submittingReview}
                      className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Recorded System Review:</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase text-emerald-800">
                        Status: {activePhoto.systemReviewStatus || "PENDING"}
                      </span>
                      {activePhoto.verifiedByName && (
                        <span className="text-slate-500 text-[11px]">By: {activePhoto.verifiedByName}</span>
                      )}
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      {activePhoto.systemReviewNotes || "No specific review remarks recorded."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Section 5 (Deterministic Evidence) & Section 6 (AI Advisory) */}
          <div className="lg:col-span-7 space-y-6">
            {/* SECTION 5: METADATA VERIFICATION (DETERMINISTIC & AUTHORITATIVE) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span>4. Deterministic Verification Engine (Authoritative)</span>
                </div>
                {getVerificationBadge(activePhoto.verificationStatus)}
              </div>

              {/* Checklist Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Rule Inspection</th>
                      <th className="py-2.5 px-3">Telemetry Evaluated</th>
                      <th className="py-2.5 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">1. Embedded GPS</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {activePhoto.photoLatitude && activePhoto.photoLongitude
                          ? `${activePhoto.photoLatitude.toFixed(6)}, ${activePhoto.photoLongitude.toFixed(6)}`
                          : "No GPS metadata"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {activePhoto.photoLatitude && activePhoto.photoLongitude ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            PRESENT
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                            MISSING
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">2. Haversine Distance</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {activePhoto.calculatedDistanceMeters !== null
                          ? `${activePhoto.calculatedDistanceMeters.toFixed(1)}m from parcel (Tolerance: ${activePhoto.thresholdMeters}m)`
                          : "Cannot evaluate distance"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {activePhoto.verificationStatus === "ACCEPTED" ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            WITHIN TOLERANCE
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                            EXCEEDS TOLERANCE
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">3. Camera Timestamp</td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]" suppressHydrationWarning>
                        {activePhoto.photoTimestamp
                          ? new Date(activePhoto.photoTimestamp).toLocaleString()
                          : "No EXIF timestamp recorded"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {activePhoto.photoTimestamp ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            AUTHENTIC
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                            MISSING
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Deterministic Engine Audit Findings:</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 leading-relaxed">
                  {activePhoto.verificationNotes || "Ground truth physically verified against cadastral database."}
                </p>
              </div>
            </div>

            {/* SECTION 6: AI ADVISORY (GEMINI 2.5 FLASH — NON-AUTHORITATIVE) */}
            <div className="bg-white border border-purple-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-100 pb-3.5 gap-2">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-purple-900">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>5. AI Advisory Interpretation</span>
                </div>
                <span className="text-[10px] font-bold font-mono text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                  AI-Assisted Advisory — Non-Authoritative
                </span>
              </div>

              {/* Conflict Guard Notice if triggered */}
              {activePhoto.aiConflict && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">AI Conflict Safeguard Triggered:</strong>
                    <p className="mt-0.5">
                      The AI recommendation differed from the deterministic calculation. Under municipal audit rules, deterministic verification is authoritative and cannot be overridden by AI.
                    </p>
                  </div>
                </div>
              )}

              {activePhoto.aiAssessment ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                      <span className="text-[10px] text-purple-700 uppercase font-bold block">AI Assessment</span>
                      <span className="text-sm font-bold text-purple-950 mt-1 block">{activePhoto.aiAssessment}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Recommendation</span>
                      <span className="text-sm font-bold text-slate-900 mt-1 block">
                        {activePhoto.aiRecommendation || "N/A"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Human Review</span>
                      <span
                        className={cn(
                          "text-sm font-bold mt-1 block",
                          activePhoto.aiReviewRequired ? "text-amber-700" : "text-emerald-700"
                        )}
                      >
                        {activePhoto.aiReviewRequired ? "REQUIRED" : "NOT REQUIRED"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 mb-1 block">AI Explanation:</span>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed">
                      {activePhoto.aiExplanation || "No explanation recorded."}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 mb-1 block">AI Suggested Audit Note:</span>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px]">
                      {activePhoto.aiAuditNote || "No audit note generated."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 space-y-2 border border-dashed border-purple-200 rounded-xl bg-purple-50/20 text-xs">
                  <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="font-bold text-slate-700">AI Advisory has not been evaluated for this photo</p>
                  <p className="text-[11px] text-slate-500">
                    Click &quot;Run AI Advisory&quot; to interpret telemetry using Gemini advisory intelligence.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7 & 8: CROP-LOSS EVALUATION & PCIC COORDINATION (Visible when linked to claim) */}
      {isLinkedToClaim ? (
        <>
          {/* SECTION 7: CROP-LOSS EVALUATION & PRIORITY RANKING */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <span>6. Crop-Loss Evaluation &amp; PCIC Claim Priority Ranking</span>
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Objective #6 Automated Prioritization
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Reported Damage</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {reportedDamagePercent !== null ? `${reportedDamagePercent}%` : "—"}
                </span>
                <span className="text-[10px] text-slate-500">From farmer intake</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Assessed Damage</span>
                <span className="text-base font-black text-emerald-800 mt-1 block">
                  {assessedDamagePercent !== null ? `${assessedDamagePercent}%` : "Pending"}
                </span>
                <span className="text-[10px] text-slate-500">Field assessment</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Priority Score</span>
                <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                  {priorityScore !== null ? Number(priorityScore).toFixed(1) : "—"}
                </span>
                <span className="text-[10px] text-slate-500">70/30 composite score</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Cohort Rank</span>
                <span className="text-base font-black text-purple-900 mt-1 block">
                  {rankPosition ? `Rank #${rankPosition}` : "Unranked"}
                </span>
                <span className="text-[10px] text-slate-500">{priorityLevel || "Pending"} Priority</span>
              </div>
            </div>

            {record.priorityFormula && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Deterministic Prioritization Breakdown:</span>
                <p className="text-slate-800 leading-relaxed font-mono text-[11px]">
                  Basis: {record.priorityFormula.damageBasis} ({record.priorityFormula.applicableDamagePercent}%) •
                  Days Elapsed: {record.priorityFormula.daysElapsed} • Formula: 70% Damage Severity + 30% Elapsed Time
                </p>
                {record.priorityFormula.explanation && (
                  <p className="text-slate-600 text-[11px] mt-1">{record.priorityFormula.explanation}</p>
                )}
              </div>
            )}
          </div>

          {/* SECTION 8: PCIC COORDINATION & MONITORING */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
                <PhoneCall className="w-5 h-5 text-emerald-700" />
                <span>7. PCIC Coordination &amp; Case Monitoring</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Status: {caseStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Insurance Policy Number</span>
                <span className="text-sm font-mono font-bold text-slate-900 block">
                  {insurancePolicyNo || "Pending Assignment by PCIC"}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Adjuster &amp; Coordination Notes</span>
                <p className="text-slate-800 leading-relaxed">
                  {coordinationRemarks || "No adjuster follow-up notes recorded yet."}
                </p>
              </div>
            </div>

            {/* Mandatory Statutory Boundary Notice */}
            <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950 text-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold uppercase tracking-wider text-[11px]">
                  Statutory Boundary &amp; Coordination Scope Notice
                </strong>
                <p className="leading-relaxed text-[11px]">
                  AgriVista is an internal municipal monitoring and case coordination platform for OMAG Polomolok. The system does NOT approve PCIC insurance claims, reject claims as PCIC, adjust official damage findings, or determine official indemnity payouts. Official claim adjustments, inspections, and compensation decisions are executed exclusively by the Philippine Crop Insurance Corporation (PCIC).
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2">
          <TrendingUp className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Objective #6: PCIC Prioritization &amp; Case Coordination Dormant
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            This photograph is not yet connected to an active PCIC crop-loss claim. Click <strong>"Evaluate Farmer"</strong> to file a new claim with this photo as authoritative evidence.
          </p>
          {isStaff && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEvaluateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Evaluate Farmer</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 9: IMMUTABLE AUDIT HISTORY - Consolidated to Activity / Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
            <History className="w-5 h-5 text-emerald-700" />
            <span>8. Activity &amp; Audit Trail Ledger</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
            {record.auditLogs?.length || 0} Registered Events
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800">
              Audit records for this case, linked photos, and field reviews are consolidated in the central ledger.
            </p>
            <p className="text-[11px] text-slate-500">
              Full state transitions, EXIF verification events, and officer reviews are tracked with tamper-evident cryptographic logs.
            </p>
          </div>

          <Link
            href={`${userRole === "OMAG_HEAD" ? "/head" : "/staff"}/audit?module=PHOTO_VERIFICATION&recordId=${record.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start md:self-auto"
          >
            <span>View in Activity / Audit Logs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Lightbox / High-Resolution Zoom Modal */}
      {isLightboxOpen && activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
                    {activePhoto.originalFileName} (Photo #{selectedPhotoIndex + 1} of {photos.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {(activePhoto.fileSizeBytes / 1024).toFixed(1)} KB — {activePhoto.mimeType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeImageUrl}
                  download={activePhoto.originalFileName || "field-photo.jpg"}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
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

            {/* Image Container */}
            <div className="relative flex-1 min-h-[350px] max-h-[72vh] flex items-center justify-center p-3 bg-slate-950 overflow-auto">
              <img
                src={activeImageUrl}
                alt={activePhoto.originalFileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("default-field-photo.jpg")) {
                    target.src = "/assets/default-field-photo.jpg";
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-slate-500 mr-1.5">Case Report:</span>
                  <span className="font-semibold text-white">{reportNumber || "Standalone Photo"}</span>
                </div>
                <div>
                  <span className="text-slate-500 mr-1.5">Farmer:</span>
                  <span className="font-semibold text-white">{farmerName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activePhoto.photoLatitude && activePhoto.photoLongitude && (
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded hidden sm:inline-block">
                    GPS: {activePhoto.photoLatitude.toFixed(6)}, {activePhoto.photoLongitude.toFixed(6)}
                  </span>
                )}
                {getVerificationBadge(activePhoto.verificationStatus)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === EVALUATE FARMER MODAL: CreateCaseModal pre-filled with parcel context === */}
      <CreateCaseModal
        isOpen={isEvaluateOpen}
        onClose={() => setIsEvaluateOpen(false)}
        onCreated={() => {
          setIsEvaluateOpen(false);
          // Refresh the page record to show the newly linked claim
          window.location.reload();
        }}
        initialContext={{
          farmerId: farmerId ? Number(farmerId) : undefined,
          parcelId: parcelId ? Number(parcelId) : undefined,
          cropId: cropId ? Number(cropId) : undefined,
          photoVerificationId: String(record.id),
        }}
      />

      {/* === VIEW CLAIM DETAILS MODAL: CaseDetailModal for linked claim === */}
      <CaseDetailModal
        claimId={claimId ? String(claimId) : null}
        isOpen={isViewClaimOpen}
        onClose={() => setIsViewClaimOpen(false)}
        onStatusUpdated={() => {
          // Optionally refresh to reflect status changes
          window.location.reload();
        }}
        isStaff={isStaff}
      />
    </div>
  );
};