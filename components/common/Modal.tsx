"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  className?: string;
}

// Proportional compact sizing so it fits cleanly on standard 100% browser displays
const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-4xl",
  "4xl": "max-w-5xl",
  "5xl": "max-w-6xl",
  full: "w-[94vw] h-[90vh] max-w-[94vw]",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title = "New Form",
  subtitle,
  children,
  size = "3xl",
  showCloseButton = true,
  closeOnOutsideClick = true,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isMinimized) {
        onClose();
      }
    };

    if (isOpen && !isMinimized) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isMinimized, onClose]);

  if (!isOpen) return null;

  // Minimized dock (bottom-right pill, Gmail-draft style)
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-6 z-50 w-72 md:w-80 rounded-t-xl bg-white border border-[var(--card-border)] shadow-2xl flex items-center justify-between px-3.5 py-2.5 select-none animate-in slide-in-from-bottom-2">
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--foreground)] truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-[var(--foreground)] hover:bg-slate-100 transition-colors"
            title="Expand"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-[var(--foreground)] hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={closeOnOutsideClick && !isMaximized ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal card — max-h-[90vh] with scrollable body */}
      <div
        ref={modalRef}
        className={`relative w-full bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--card-border)] overflow-hidden z-10 flex flex-col max-h-[90vh] transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isMaximized
            ? "w-[94vw] h-[90vh] max-w-[94vw]"
            : `${sizeClasses[size]}`
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-5 md:py-3 bg-[var(--primary-dark)] select-none shrink-0 border-b border-white/10">
          <div className="min-w-0 flex items-baseline gap-2">
            <h3 className="text-xs md:text-sm font-bold text-white tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <span className="hidden sm:inline-block text-[11px] text-emerald-100/75 truncate max-w-xs md:max-w-md font-normal">
                {subtitle}
              </span>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize"
              className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-100 hover:text-white hover:bg-white/15 transition-colors outline-none"
              title="Minimize"
            >
              <Minus className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              aria-label={isMaximized ? "Exit full screen" : "Full screen"}
              className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-100 hover:text-white hover:bg-white/15 transition-colors outline-none"
              title={isMaximized ? "Exit full screen" : "Full screen"}
            >
              {isMaximized ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </button>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-100 hover:text-white hover:bg-white/15 transition-colors outline-none"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Form body — cleanly scrolls inside modal */}
        <div className="p-4 md:p-5 bg-[var(--card)] flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
