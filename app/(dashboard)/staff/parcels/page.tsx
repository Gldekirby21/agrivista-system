import { redirect } from "next/navigation";

export default function StaffParcelsRedirect() {
  redirect("/staff/beneficiaries?view=parcels");
}
