import type { ReactNode } from "react";

import { BottomNav } from "@/components/app-shell/bottom-nav";
import { isTestFirebaseProject } from "@/lib/firebase/config";

export function AppShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-page text-sand-900">
      {isTestFirebaseProject() ? (
        <div className="sticky top-0 z-40 mx-auto w-full max-w-screen-sm px-4 pt-3">
          <div className="rounded-full border border-brand-primary/45 bg-white/95 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary shadow-sm backdrop-blur">
            Testsystem · mijija-test
          </div>
        </div>
      ) : null}
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col px-4 ${
          isTestFirebaseProject() ? "pt-3" : "pt-5"
        } ${
          hideNav ? "pb-8" : "pb-nav"
        }`}
      >
        {children}
      </main>
      {!hideNav ? <BottomNav /> : null}
    </div>
  );
}
