"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  ShieldCheck,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { SUPPORTING_DOCUMENT_TYPES } from "../types";
import { cn } from "@/lib/utils/cn";

export interface SupportingDocumentUploadProps {
  farmerId: number;
  farmerName: string;
  farmOptions?: Array<{ id: number; farmName: string | null; parcelNumber?: string }>;
  onSuccess: (document: any) => void;
  onCancel: () => void;
}

export const SupportingDocumentUpload: React.FC<SupportingDocumentUploadProps> = ({
  farmerId,
  farmerName,
  farmOptions = [],
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    documentType: "Land Title",
    farmId: farmOptions.length > 0 ? farmOptions[0].id.toString() : "",
    remarks: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a document file to attach.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `rsbsa-docs/farmer-${farmerId}/${Date.now()}-${sanitizedName}`;

      const res = await fetch(`/api/rsbsa/farmers/${farmerId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId,
          farmId: formData.farmId ? parseInt(formData.farmId, 10) : null,
          documentType: formData.documentType,
          fileName: selectedFile.name,
          fileFormat: selectedFile.type || "application/pdf",
          fileSizeBytes: selectedFile.size,
          storageKey,
          remarks: formData.remarks || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to attach supporting document.");
      }

      onSuccess(data.document);
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred while uploading the document.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-semibold text-red-800 animate-in fade-in shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Target Farmer Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
            DOC
          </div>
          <div>
            <span className="font-semibold text-emerald-950">Attaching for:</span>{" "}
            <strong>{farmerName}</strong> (Farmer ID: #{farmerId})
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5" /> Official Annex Document
        </span>
      </div>

      {/* SECTION 1: DOCUMENT CLASSIFICATION */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 shrink-0 shadow-2xs">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Document Classification &amp; Linkage
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select the government document type and link to a specific landholding if applicable.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {/* Document Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentType: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
            >
              {SUPPORTING_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Associated Landholding */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Associated Farm Landholding
            </label>
            <select
              value={formData.farmId}
              onChange={(e) => setFormData((prev) => ({ ...prev, farmId: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs md:text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
            >
              <option value="">None / Farmer General Profile Document</option>
              {farmOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farmName || `Farm Landholding #${f.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: FILE UPLOAD DROPZONE */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800 shrink-0 shadow-2xs">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                File Attachment
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload clear scans or photos (PDF, PNG, JPG up to 10MB).
              </p>
            </div>
          </div>
        </div>

        {/* Dropzone */}
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
              : selectedFile
              ? "border-emerald-400 bg-emerald-50/30"
              : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500"
          )}
        >
          <input
            type="file"
            id="doc-file-input"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
          />
          <label htmlFor="doc-file-input" className="cursor-pointer block">
            {selectedFile ? (
              <div className="space-y-2 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document file"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFile(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline pt-1"
                >
                  <X className="h-3.5 w-3.5" /> Remove &amp; choose another file
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-bold text-slate-800">
                    Click to browse or drag &amp; drop file here
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official Land Title (TCT/OCT), Valid Government ID, Certificate of Land Ownership
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50">
                    Browse Files
                  </span>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Remarks / Reference */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Administrative Remarks / Title Reference Number
          </label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <span className="pl-3.5 text-slate-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. TCT No. 143-2023, Registry of Deeds Koronadal"
              className="w-full bg-transparent px-3 py-2.5 text-xs md:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 -mx-5 -mb-5 md:-mx-6 md:-mb-6 px-5 md:px-6 py-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs md:text-sm px-7 py-2.5 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? "Uploading..." : "Attach Document Record"}</span>
          </button>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium pl-1">
            Polomolok OMAG Archival Store
          </span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Discard & Close"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
