"use client";

import Link from "next/link";

import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useAdminSpy } from "@/lib/admin/admin-spy-context";
import { berlinDateKey } from "@/lib/mapping/date";

export function AdminSpyToggle() {
  const { spyEnabled, setSpyEnabled } = useAdminSpy();
  const today = berlinDateKey();

  return (
    <section className="space-y-3 radius-card border border-sand-200/80 bg-white p-4 shadow-card-flat">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-sand-800">Admin-Einblick</p>
          <p className="text-[11px] text-sand-500">
            Zeigt Daily-Antworten ohne dass du selbst antworten musst.
          </p>
        </div>
        <ToggleSwitch
          label="Admin-Einblick"
          checked={spyEnabled}
          onChange={setSpyEnabled}
        />
      </div>

      {spyEnabled ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/past-dailies/${today}`}
            className="inline-flex items-center rounded-xl bg-brand-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
          >
            Heutige Daily ansehen
          </Link>
          <Link
            href="/past-dailies"
            className="inline-flex items-center rounded-xl bg-sand-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sand-800"
          >
            Archiv öffnen
          </Link>
          <Link
            href="/resolved"
            className="inline-flex items-center rounded-xl bg-sand-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sand-800"
          >
            Heute aufgelöst
          </Link>
        </div>
      ) : null}
    </section>
  );
}
