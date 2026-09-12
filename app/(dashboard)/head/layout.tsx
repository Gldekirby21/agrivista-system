import React from "react";
import { assertRoleAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

export default async function HeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side role restriction: only OMAG_HEAD can access /head/* routes
  // OMAG_STAFF attempting access is safely redirected to /staff/dashboard
  await assertRoleAccess("OMAG_HEAD");

  return <>{children}</>;
}
