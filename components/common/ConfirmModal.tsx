"use client";

import React from "react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  subtitle?: string;
  itemName?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  subtitle = "Please verify before proceeding",
  itemName,
  message = "Are you sure you want to proceed with this action? This modification will be recorded in the municipal audit trail.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const isDanger = variant === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      subtitle={subtitle}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDanger
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-amber-50 text-amber-600 border border-amber-200"
            }`}
          >
            {isDanger ? (
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            {itemName && (
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target: <span className="text-slate-900 font-bold">{itemName}</span>
              </p>
            )}
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>This action will be attributed to your session in the immutable system audit log.</span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
