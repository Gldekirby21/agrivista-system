import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Historical Crop Yield & Purchase Modeling is strictly EXCLUSIVE TO OMAG_HEAD.
 * OMAG_STAFF is forbidden from accessing this workspace.
 * If OMAG_STAFF manually navigates to this URL, redirect to authorized landing page.
 */
export default async function StaffResourceDemandPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  // OMAG_HEAD navigating here is directed to their dedicated oversight workspace
  if (session.role === "OMAG_HEAD") {
    redirect("/head/resource-demand");
  }

  // OMAG_STAFF is forbidden from this Head-exclusive module and returned to authorized agricultural records
  redirect("/staff/beneficiaries");
}
