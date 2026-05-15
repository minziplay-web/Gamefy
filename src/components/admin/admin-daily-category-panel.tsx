"use client";

import { useState } from "react";

import {
  ADMIN_ACCENT,
  CategoryChip,
  CountPill,
  DAILY_ACCENT,
  Eyebrow,
  PrimaryButton,
  StatusBanner,
  SubtleButton,
} from "@/components/admin/admin-ui";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
} from "@/lib/mapping/categories";
import type { AdminDailyCategoryPlan, Category } from "@/lib/types/frontend";

const ALL_CATEGORIES = (Object.keys(CATEGORY_LABELS) as Category[]).filter(
  (category) => category !== "custom",
);

export function AdminDailyCategoryPanel({
  plan,
  questionCount,
  dirty,
  saveStatus,
  saveError,
  onChange,
  onSave,
}: {
  plan: AdminDailyCategoryPlan;
  questionCount: number;
  dirty: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError?: string;
  onChange: (next: AdminDailyCategoryPlan) => void;
  onSave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const forcedOverflow = plan.forcedCategories.length > questionCount;

  const toggleIncluded = (category: Category) => {
    const included = plan.includedCategories.includes(category);

    if (included) {
      onChange({
        includedCategories: plan.includedCategories.filter((entry) => entry !== category),
        forcedCategories: plan.forcedCategories.filter((entry) => entry !== category),
      });
      return;
    }

    onChange({
      ...plan,
      includedCategories: [...plan.includedCategories, category],
    });
  };

  const toggleForced = (category: Category) => {
    const forced = plan.forcedCategories.includes(category);

    if (forced) {
      onChange({
        ...plan,
        forcedCategories: plan.forcedCategories.filter((entry) => entry !== category),
      });
      return;
    }

    onChange({
      includedCategories: plan.includedCategories.includes(category)
        ? plan.includedCategories
        : [...plan.includedCategories, category],
      forcedCategories: [...plan.forcedCategories, category],
    });
  };

  const showSavedBanner = saveStatus === "saved" && !dirty;

  return (
    <section className="space-y-3 rounded-2xl bg-[#1A1A1A] p-4 ring-1 ring-[#1F1F1F]">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <Eyebrow>Daily-Kategorien</Eyebrow>
          <p className="text-[13px] text-[#A8A8A8]">
            Pool für den nächsten Run
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <CountPill muted>{plan.includedCategories.length} dabei</CountPill>
          <CountPill accent={ADMIN_ACCENT}>{plan.forcedCategories.length} Pflicht</CountPill>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-xl bg-[#0E0E0E] px-3 py-2.5 text-left ring-1 ring-[#1F1F1F] transition hover:bg-[#1A1A1A]"
      >
        <span className="min-w-0 space-y-0.5">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E6E73]" style={{ fontFamily: "var(--font-mono)" }}>
            {expanded ? "Auswahl klappen" : "Auswahl bearbeiten"}
          </span>
          <span className="block truncate text-[13px] font-semibold text-[#FAFAFA]">
            {plan.includedCategories.length > 0
              ? `${plan.includedCategories.length} aktiv`
              : "Keine Kategorie aktiv"}
          </span>
        </span>
        <span
          className="shrink-0 text-[12px] text-[#6E6E73] transition-transform"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
            fontFamily: "var(--font-mono)",
          }}
          aria-hidden
        >
          ▸
        </span>
      </button>

      {expanded ? (
        <ul className="space-y-1.5">
          {ALL_CATEGORIES.map((category) => {
            const included = plan.includedCategories.includes(category);
            const forced = plan.forcedCategories.includes(category);

            return (
              <li
                key={category}
                className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-[#0E0E0E] px-3 py-2 ring-1 ring-[#1F1F1F]"
                style={{ opacity: included ? 1 : 0.55 }}
              >
                <CategoryChip
                  emoji={CATEGORY_EMOJI[category]}
                  label={CATEGORY_LABELS[category]}
                  accent="#FAFAFA"
                />
                <div className="flex shrink-0 gap-1.5">
                  <SubtleButton
                    onClick={() => toggleIncluded(category)}
                    selected={included}
                    accent={DAILY_ACCENT}
                  >
                    {included ? "Dabei" : "Aus"}
                  </SubtleButton>
                  <SubtleButton
                    onClick={() => toggleForced(category)}
                    selected={forced}
                    accent={ADMIN_ACCENT}
                    disabled={!included}
                  >
                    {forced ? "Pflicht" : "Optional"}
                  </SubtleButton>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {plan.includedCategories.length === 0 ? (
        <StatusBanner status="error" message="Wähle mindestens eine Kategorie aus." />
      ) : null}

      {forcedOverflow ? (
        <p
          className="rounded-xl px-3 py-2 text-[12px] font-medium leading-relaxed"
          style={{ backgroundColor: `${DAILY_ACCENT}14`, color: DAILY_ACCENT }}
        >
          Du hast mehr Pflicht-Kategorien als Fragen pro Tag eingestellt sind.
        </p>
      ) : null}

      {saveStatus === "error" && saveError ? (
        <StatusBanner status="error" message={saveError} />
      ) : null}

      {showSavedBanner ? (
        <StatusBanner status="success" message="Daily-Auswahl gespeichert." />
      ) : null}

      <PrimaryButton
        onClick={onSave}
        disabled={!dirty || saveStatus === "saving" || forcedOverflow}
        fullWidth
      >
        {saveStatus === "saving" ? "Speichere..." : "Daily-Auswahl speichern"}
      </PrimaryButton>
    </section>
  );
}
