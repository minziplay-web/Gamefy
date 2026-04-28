"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { EmailPasswordForm } from "@/components/auth/email-password-form";

export default function LoginPage() {
  const router = useRouter();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.status === "authenticated") {
      router.replace(
        authState.user.onboardingCompleted ? "/" : "/onboarding",
      );
    }
  }, [authState, router]);

  return (
    <AppShell hideNav>
      <div className="flex min-h-dvh items-center">
        <Card className="w-full space-y-6 bg-white">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-sand-500">
              Login
            </p>
          <h1 className="text-3xl font-semibold tracking-tight text-sand-950">
            Rein in die Gruppe
          </h1>
          <p className="text-sm leading-6 text-sand-600">
            Melde dich mit Google oder klassisch per E-Mail und Passwort an.
          </p>
        </div>
          <EmailPasswordForm />
        </Card>
      </div>
    </AppShell>
  );
}
