import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Staff Dashboard route — Redirects directly to the primary operational objective page (Objective 01: Agricultural Records)
 */
export default function StaffDashboardPage() {
  redirect("/staff/beneficiaries");
}
