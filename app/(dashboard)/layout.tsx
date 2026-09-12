import React from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  // Server-side authentication check: unauthenticated requests must be redirected to /login
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell currentRole={session.role} userFullName={session.fullName}>
      {children}
    </DashboardShell>
  );
}
