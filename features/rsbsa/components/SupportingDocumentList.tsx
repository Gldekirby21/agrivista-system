"use client";

import React from "react";
import { FileText, Plus, ShieldCheck, Download, Calendar } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { SupportingDocumentDetail } from "../types";
import { formatDate } from "@/lib/utils";

export interface SupportingDocumentListProps {
  documents: SupportingDocumentDetail[];
  isStaff?: boolean;
  onUploadDocument?: () => void;
}

export const SupportingDocumentList: React.FC<SupportingDocumentListProps> = ({
  documents,
  isStaff = false,
  onUploadDocument,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Supporting Land Documents &amp; Identification
          </h3>
        </div>
        {isStaff && onUploadDocument && (
          <Button variant="outline" size="sm" onClick={onUploadDocument}>
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Attach Document
          </Button>
        )}
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0 mt-0.5">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="info" size="sm">
                      {doc.documentType}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900 truncate">
                    {doc.fileName}
                  </p>
                  {doc.remarks && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {doc.remarks}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Uploaded {formatDate(doc.createdAt)}
                    {doc.uploadedBy && ` by ${doc.uploadedBy.fullName}`}
                  </p>
                </div>
              </div>

              <Badge variant="neutral" size="sm">
                Attached
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <FileText className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
          <p className="mt-1.5 text-xs font-semibold text-slate-700">No Supporting Documents Attached</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Official land titles, government-issued IDs, and cadastral documents will be listed here.
          </p>
          {isStaff && onUploadDocument && (
            <Button variant="outline" size="sm" onClick={onUploadDocument} className="mt-3">
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              Attach First Document
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
