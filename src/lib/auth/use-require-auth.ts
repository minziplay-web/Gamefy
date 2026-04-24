"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";

const AUTH_FREE_ROUTES = new Set(["/login"]);

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.status === "unauthenticated" && !AUTH_FREE_ROUTES.has(pathname)) {
      router.replace("/login");
      return;
    }

    if (
      authState.status === "authenticated" &&
      !authState.user.onboardingCompleted &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
    }
  }, [authState, pathname, router]);

  return authState;
}
