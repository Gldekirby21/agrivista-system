import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "Login | OMAG Polomolok Agricultural System",
  description: "Sign in to the OMAG Polomolok Agricultural Resource Distribution & Production Analytics System.",
};

/**
 * Thin composition login route page
 * If already authenticated, redirects to the user's role-specific dashboard.
 */
export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    if (session.role === "OMAG_HEAD") {
      redirect("/head/dashboard");
    } else {
      redirect("/staff/dashboard");
    }
  }

  return <LoginForm />;
}
