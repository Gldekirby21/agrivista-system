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
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/common/Modal";
import { FarmerFullDetail } from "../types";
import { FarmParcelList } from "./FarmParcelList";
import { CropList } from "./CropList";
import { SupportingDocumentList } from "./SupportingDocumentList";
import { FarmerForm } from "./FarmerForm";
import { FarmParcelForm } from "./FarmParcelForm";
import { CropForm } from "./CropForm";
import { SupportingDocumentUpload } from "./SupportingDocumentUpload";
import { formatDate } from "@/lib/utils";

export interface FarmerDetailsProps {
  farmer: FarmerFullDetail;
  isStaff?: boolean;
  baseBackHref?: string;
}

export const FarmerDetails: React.FC<FarmerDetailsProps> = ({
  farmer: initialFarmer,
  isStaff = false,
  baseBackHref = "/staff/rsbsa",
}) => {
  const router = useRouter();
  const [farmer, setFarmer] = useState<FarmerFullDetail>(initialFarmer);
  const [activeTab, setActiveTab] = useState<"landholdings" | "crops" | "documents">("landholdings");

  // Modal / Drawer state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingParcel, setIsAddingParcel] = useState(false);
  const [recordingCropTarget, setRecordingCropTarget] = useState<{
    parcelId: number;
    parcelNumber: string;
    areaHa: number;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Compute land totals
  let totalHectares = 0;
  let totalParcels = 0;
  const recordedCrops = new Set<string>();

  for (const farm of farmer.farms) {
    totalHectares += farm.totalAreaHa;
    totalParcels += farm.parcels.length;
    for (const p of farm.parcels) {
      for (const c of p.crops) {
        if (c.cropType) recordedCrops.add(c.cropType);
      }
    }
  }

  const handleRefresh = async () => {
    try {
      const res = await fetch(`/api/rsbsa/farmers/${farmer.id}`);
      const data = await res.json();
      if (data.success && data.farmer) {
        setFarmer(data.farmer);
      }
    } catch (e) {
      console.error("Failed to refresh farmer data:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={baseBackHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to RSBSA Masterlist</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="info">PHASE 3 — OBJECTIVE 1</Badge>
          <Badge variant="neutral">Centralized RSBSA Record</Badge>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xl shadow-md shrink-0">
              {farmer.firstName[0]}
              {farmer.lastName[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {farmer.lastName}, {farmer.firstName} {farmer.middleName || ""}{" "}
                  {farmer.extensionName || ""}
                </h1>
                <Badge variant={farmer.status === "Active" ? "success" : "neutral"} size="sm">
                  {farmer.status}
                </Badge>
              </div>

              <p className="text-xs font-medium text-slate-600">
                {farmer.farmerCode || "Agricultural Producer"}
                {farmer.sex && farmer.sex !== "Unspecified" && ` • ${farmer.sex}`}
                {farmer.civilStatus && ` • ${farmer.civilStatus}`}
                {farmer.isSenior && " • Senior Citizen"}
                {farmer.isPwd && " • PWD"}
                {farmer.is4ps && " • 4Ps Beneficiary"}
                {farmer.isIp && " • Indigenous People"}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>
                    Brgy. {farmer.barangay}, {farmer.municipality}, {farmer.province}
                  </span>
                </div>
                {farmer.contactNumber && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>{farmer.contactNumber}</span>
                  </div>
                )}
                {farmer.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>{farmer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    DOB:{" "}
                    {new Date(farmer.dateOfBirth).getFullYear() <= 1970
                      ? "Unspecified"
                      : formatDate(farmer.dateOfBirth)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Identification Badges & Staff Edit Action */}
          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left lg:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RSBSA ID</p>
              <p className="font-mono text-xs font-extrabold text-slate-900">
                {farmer.rsbsaNumber || "Not Issued"}
              </p>
            </div>

            {isStaff && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Aggregate Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Landholdings</span>
            <p className="text-sm font-extrabold text-slate-900">{farmer.farms.length} Farm{farmer.farms.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Farm Parcels</span>
            <p className="text-sm font-extrabold text-slate-900">{totalParcels} Geotagged Plot{totalParcels !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Land Area</span>
            <p className="text-sm font-extrabold text-slate-900">{totalHectares.toFixed(2)} Hectares</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Current Crops</span>
            <p className="text-sm font-extrabold text-slate-900">
              {recordedCrops.size > 0 ? Array.from(recordedCrops).join(", ") : "None Recorded"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal / Form */}
      {isEditingProfile && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Edit RSBSA Farmer Information</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>
              Close
            </Button>
          </div>
          <FarmerForm
            initialData={farmer}
            isEditing
            onSuccess={(updated) => {
              setIsEditingProfile(false);
              handleRefresh();
            }}
            onCancel={() => setIsEditingProfile(false)}
          />
        </div>
      )}

      {/* Add Parcel Modal / Form */}
      {isAddingParcel && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Register Farm Landholding &amp; Parcel</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingParcel(false)}>
              Close
            </Button>
          </div>
          <FarmParcelForm
            farmerId={farmer.id}
            farmerName={`${farmer.firstName} ${farmer.lastName}`}
            defaultBarangay={farmer.barangay}
            onSuccess={() => {
              setIsAddingParcel(false);
              handleRefresh();
            }}
            onCancel={() => setIsAddingParcel(false)}
          />
        </div>
      )}

      {/* Record Crop Modal / Form */}
      {recordingCropTarget && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Record Active Crop Cycle</h3>
            <Button variant="ghost" size="sm" onClick={() => setRecordingCropTarget(null)}>
              Close
            </Button>
          </div>
          <CropForm
            parcelId={recordingCropTarget.parcelId}
            parcelNumber={recordingCropTarget.parcelNumber}
            defaultAreaHa={recordingCropTarget.areaHa}
            onSuccess={() => {
              setRecordingCropTarget(null);
              handleRefresh();
            }}
            onCancel={() => setRecordingCropTarget(null)}
          />
        </div>
      )}

      {/* Upload Document Modal / Form */}
      {isUploadingDoc && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Attach Official Supporting Document</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsUploadingDoc(false)}>
              Close
            </Button>
          </div>
          <SupportingDocumentUpload
            farmerId={farmer.id}
            farmerName={`${farmer.firstName} ${farmer.lastName}`}
            farmOptions={farmer.farms.map((f) => ({ id: f.id, farmName: f.farmName }))}
            onSuccess={() => {
              setIsUploadingDoc(false);
              handleRefresh();
            }}
            onCancel={() => setIsUploadingDoc(false)}
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("landholdings")}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "landholdings"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          <span>Farms &amp; Parcels ({farmer.farms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("crops")}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "crops"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout className="h-4 w-4" aria-hidden="true" />
          <span>Crop Records ({recordedCrops.size})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "documents"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>Supporting Documents ({farmer.documents.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "landholdings" && (
        <FarmParcelList
          farms={farmer.farms}
          isStaff={isStaff}
          onAddParcel={() => setIsAddingParcel(true)}
          onRecordCrop={(parcelId, parcelNumber, areaHa) => {
            setRecordingCropTarget({ parcelId, parcelNumber, areaHa });
          }}
        />
      )}

      {activeTab === "crops" && (
        <CropList farms={farmer.farms} />
      )}

      {activeTab === "documents" && (
        <SupportingDocumentList
          documents={farmer.documents}
          isStaff={isStaff}
          onUploadDocument={() => setIsUploadingDoc(true)}
        />
      )}

      {/* 1. EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        title="Edit Farmer Profile"
        subtitle={`Updating records for ${farmer.firstName} ${farmer.lastName}`}
        size="3xl"
      >
        <FarmerForm
          isEditing={true}
          initialData={farmer}
          onSuccess={() => {
            setIsEditingProfile(false);
            handleRefresh();
          }}
          onCancel={() => setIsEditingProfile(false)}
        />
      </Modal>

      {/* 2. ADD FARM PARCEL MODAL */}
      <Modal
        isOpen={isAddingParcel}
        onClose={() => setIsAddingParcel(false)}
        title="Add Farm Parcel"
        subtitle={`Register farm landholding for ${farmer.firstName} ${farmer.lastName}`}
        size="2xl"
      >
        <FarmParcelForm
          farmerId={farmer.id}
          farmerName={`${farmer.firstName} ${farmer.lastName}`}
          defaultBarangay={farmer.barangay}
          onSuccess={() => {
            setIsAddingParcel(false);
            handleRefresh();
          }}
          onCancel={() => setIsAddingParcel(false)}
        />
      </Modal>

      {/* 3. RECORD CROP MODAL */}
      <Modal
        isOpen={recordingCropTarget !== null}
        onClose={() => setRecordingCropTarget(null)}
        title="Record Standing Crop"
        subtitle={`Recording crop cycle on Parcel ${recordingCropTarget?.parcelNumber || ""}`}
        size="2xl"
      >
        {recordingCropTarget && (
          <CropForm
            parcelId={recordingCropTarget.parcelId}
            parcelNumber={recordingCropTarget.parcelNumber}
            defaultAreaHa={recordingCropTarget.areaHa}
            onSuccess={() => {
              setRecordingCropTarget(null);
              handleRefresh();
            }}
            onCancel={() => setRecordingCropTarget(null)}
          />
        )}
      </Modal>

      {/* 4. UPLOAD SUPPORTING DOCUMENT MODAL */}
      <Modal
        isOpen={isUploadingDoc}
        onClose={() => setIsUploadingDoc(false)}
        title="Upload Supporting Document"
        subtitle="Attach land titles, tax declarations, or IDs."
        size="2xl"
      >
        <SupportingDocumentUpload
          farmerId={farmer.id}
          farmerName={`${farmer.firstName} ${farmer.lastName}`}
          farmOptions={farmer.farms.map((f) => ({ id: f.id, farmName: f.farmName }))}
          onSuccess={() => {
            setIsUploadingDoc(false);
            handleRefresh();
          }}
          onCancel={() => setIsUploadingDoc(false)}
        />
      </Modal>
    </div>
  );
};
