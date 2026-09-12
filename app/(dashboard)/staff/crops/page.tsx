import { redirect } from "next/navigation";

export default function StaffCropsRedirect() {
  redirect("/staff/predictions");
}
