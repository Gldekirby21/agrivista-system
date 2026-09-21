import { redirect } from "next/navigation";

/**
 * /staff/pcic — redirects to the Priority Ranking workspace.
 * Claim creation is now integrated into the Priority Ranking page.
 */
export default function StaffPcicPage() {
  redirect("/staff/pcic/ranking");
}
