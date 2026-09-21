import { redirect } from "next/navigation";

export default function HeadCropsRedirect() {
  redirect("/head/beneficiaries?view=crops");
}
