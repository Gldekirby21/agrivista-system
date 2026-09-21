import { redirect, notFound } from "next/navigation";
import { getPcicClaimById } from "@/features/pcic/services/pcicService";
import { requireRole } from "@/lib/auth/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function StaffEvaluationDetailPage({ params }: PageProps) {
  await requireRole(["OMAG_STAFF"]);
  const { id } = await params;
  const claim = await getPcicClaimById(id);

  if (!claim) {
    notFound();
  }

  // Redirect directly to the existing consolidated case dossier
  if (claim.report?.id) {
    redirect(`/staff/photo-verification/${claim.report.id}`);
  }

  notFound();
}
