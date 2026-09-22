import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HeadPhotoVerificationNewPage() {
  await requireRole(["OMAG_HEAD"]);
  redirect("/head/photo-verification");
}
