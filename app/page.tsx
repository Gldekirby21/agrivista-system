import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

/**
 * Root page — Thin composition routing
 * Redirects authenticated users to their respective role dashboard,
 * or unauthenticated users to the login portal.
 */
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "OMAG_HEAD") {
    redirect("/head/dashboard");
  }

  redirect("/staff/dashboard");
}
