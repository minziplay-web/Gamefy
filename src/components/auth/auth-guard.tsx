"use client";

import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import { useRequireAuth } from "@/lib/auth/use-require-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const authState = useRequireAuth();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return null;
  }

  if (authState.status === "initializing") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-sand-200/80 bg-white p-6 text-center shadow-lg shadow-sand-900/5 backdrop-blur">
          <p className="text-sm font-medium text-sand-700">Session wird geladen...</p>
        </div>
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
