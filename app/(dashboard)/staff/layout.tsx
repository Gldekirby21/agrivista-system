import React from "react";
import { assertRoleAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side role restriction: only OMAG_STAFF can access /staff/* routes
  // OMAG_HEAD attempting access is safely redirected to /head/dashboard
  await assertRoleAccess("OMAG_STAFF");

  return <>{children}</>;
}
