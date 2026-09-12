import React from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/Header";
import { PredictionDetail } from "@/features/yield-loss/components/PredictionDetail";
import { getPredictionById } from "@/features/yield-loss/services/predictionService";
import { requireRole } from "@/lib/auth/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Prediction Dossier | OMAG Polomolok",
  description: "Executive analytical dossier for crop yield reduction and potential economic loss.",
};

export default async function HeadPredictionDetailPage({ params }: PageProps) {
  await requireRole(["OMAG_HEAD"]);
  const { id } = await params;

  const prediction = await getPredictionById(id);

  if (!prediction) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header
        title="Prediction Dossier"
        subtitle="Individual crop yield and potential economic loss assessment."
        role="OMAG_HEAD"
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <PredictionDetail
          prediction={prediction as any}
          userRole="OMAG_HEAD"
        />
      </main>
    </div>
  );
}
