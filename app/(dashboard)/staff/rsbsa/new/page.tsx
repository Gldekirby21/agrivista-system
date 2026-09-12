import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header/Header";
import { FarmerForm } from "@/features/rsbsa/components/FarmerForm";
import { Badge } from "@/components/common/Badge";

export const metadata = {
  title: "Register New RSBSA Farmer | OMAG Polomolok",
  description: "Official farmer intake and registration form.",
};

export default function NewFarmerPage() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="RSBSA Farmer Registration"
        subtitle="Office of the Municipal Agriculturist — Polomolok Agricultural Operations"
        role="OMAG_STAFF"
      />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/staff/rsbsa"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to RSBSA Records</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="info">PHASE 3 — OBJECTIVE 1</Badge>
              <Badge variant="success">New Registration</Badge>
            </div>
          </div>

          <FarmerForm />
        </div>
      </main>
    </div>
  );
}
