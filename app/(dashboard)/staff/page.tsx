import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Staff root route — Redirects directly to the primary operational objective page (Objective 01: Agricultural Records)
 */
export default function StaffPage() {
  redirect("/staff/beneficiaries");
}
