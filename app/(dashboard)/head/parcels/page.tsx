import { redirect } from "next/navigation";

export default function HeadParcelsRedirect() {
  redirect("/head/beneficiaries?view=parcels");
}
