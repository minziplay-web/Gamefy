"use client";

import type { AdminTab } from "@/lib/types/frontend";

const TABS: Array<{ value: AdminTab; label: string }> = [
  { value: "questions", label: "Fragen" },
  { value: "daily", label: "Daily" },
  { value: "members", label: "Mitglieder" },
  { value: "config", label: "Config" },
];

export function AdminTabs({
  value,
  onChange,
}: {
  value: AdminTab;
  onChange: (next: AdminTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Admin-Bereich"
      className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card-flat"
    >
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`flex min-h-10 items-center justify-center rounded-xl px-1.5 text-[11px] font-bold transition min-[380px]:text-xs ${
              active
                ? "bg-brand-primary text-white shadow-card-flat"
                : "bg-transparent text-sand-600 hover:bg-slate-50 hover:text-sand-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

