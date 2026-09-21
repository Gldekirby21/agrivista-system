"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log error details for diagnostics
    console.error("[Dashboard Error Boundary Caught]:", error);

    // Auto-reload if client has stale chunk hashes from an earlier build
    if (
      error.name === "ChunkLoadError" ||
      error.message?.includes("Failed to load chunk") ||
      error.message?.includes("Loading chunk")
    ) {
      console.warn("[Dashboard Error] Stale build chunks detected. Auto-reloading to fetch fresh build assets...");
      window.location.reload();
    }
  }, [error]);

  const isNetworkOrDbError =
    error.message?.includes("Can't reach database server") ||
    error.message?.includes("P1001") ||
    error.message?.includes("P1017") ||
    error.message?.includes("connection closed") ||
    error.message?.includes("fetch failed");

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isNetworkOrDbError
              ? "Database Connection Stutter"
              : "Something went wrong"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isNetworkOrDbError
              ? "A temporary latency spike or connection reset occurred with the cloud database. Retrying will re-establish the connection."
              : error.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>

        {error.digest && (
          <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 py-1.5 px-3 rounded-md">
            Reference ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/staff/beneficiaries"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Agricultural Records
          </Link>
        </div>
      </div>
    </div>
  );
}
