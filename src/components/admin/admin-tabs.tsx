"use client";

import type { AdminTab } from "@/lib/types/frontend";

const TABS: Array<{ value: AdminTab; label: string; emoji: string }> = [
  { value: "questions", label: "Fragen", emoji: "📝" },
  { value: "daily", label: "Daily", emoji: "📅" },
  { value: "members", label: "Mitglieder", emoji: "👥" },
  { value: "config", label: "Config", emoji: "⚙️" },
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
      className="grid grid-cols-2 gap-2 rounded-[28px] border border-slate-200 bg-white p-2 shadow-card-flat sm:grid-cols-4"
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
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition ${
              active
                ? "border-brand-primary bg-brand-primary text-white shadow-card-flat"
                : "border-transparent bg-slate-50 text-sand-700 hover:border-slate-200 hover:bg-white"
            }`}
          >
            <span aria-hidden>{tab.emoji}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

