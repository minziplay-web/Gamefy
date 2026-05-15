"use client";

import type { ReactNode } from "react";

import { AdminSpyProvider } from "@/lib/admin/admin-spy-context";
import { AuthProvider } from "@/lib/auth/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminSpyProvider>{children}</AdminSpyProvider>
    </AuthProvider>
  );
}
