import type { ReactNode } from "react";

import { BottomNav } from "@/components/app-shell/bottom-nav";

export function AppShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-page text-sand-900">
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col px-4 pt-5 ${
          hideNav ? "pb-8" : "pb-nav"
        }`}
      >
        {children}
      </main>
      {!hideNav ? <BottomNav /> : null}
    </div>
  );
}
