import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
