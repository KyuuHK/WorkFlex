import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <AuthForm mode="login" redirectTo={params?.redirect} />
    </div>
  );
}
