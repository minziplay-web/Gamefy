"use client";

import type { AdminTab } from "@/lib/types/frontend";

const TABS: Array<{ value: AdminTab; label: string; emoji: string }> = [
  { value: "questions", label: "Fragen", emoji: "📝" },
  { value: "daily", label: "Daily", emoji: "📅" },
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
      className="grid grid-cols-3 gap-2"
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
                ? "border-sand-900 bg-sand-900 text-cream shadow-card-flat"
                : "border-sand-100 bg-white/80 text-sand-700 hover:border-sand-200 hover:bg-white"
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

