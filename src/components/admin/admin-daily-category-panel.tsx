"use client";

import { useState } from "react";

import { CategoryBadge } from "@/components/ui/category-badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
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

  return (
    <section className="space-y-3 rounded-2xl border border-sand-200/80 bg-white p-3 shadow-card-flat">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sand-500">
          Daily-Kategorien
        </p>
        <div className="flex shrink-0 gap-1.5 text-[11px]">
          <span className="rounded-full bg-sand-100 px-2 py-1 font-bold text-sand-600">
          {plan.includedCategories.length} berücksichtigt
        </span>
          <span className="rounded-full bg-brand-soft px-2 py-1 font-bold text-brand-primary">
          {plan.forcedCategories.length} Pflicht
        </span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-sand-50/70 px-3 py-2.5 text-left transition hover:bg-sand-100/70"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-sand-500">
              Kategorien bearbeiten
            </span>
            <span className="block truncate text-sm font-semibold text-sand-800">
              {plan.includedCategories.length > 0
                ? `${plan.includedCategories.length} Kategorien aktiv`
                : "Keine Kategorie aktiv"}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-sand-700 ring-1 ring-sand-200">
            {expanded ? "Zu" : "Auf"}
          </span>
        </button>

        {expanded ? (
          <div className="space-y-2">
            {ALL_CATEGORIES.map((category) => {
              const included = plan.includedCategories.includes(category);
              const forced = plan.forcedCategories.includes(category);

              return (
                <div
                  key={category}
                  className={`grid gap-2 rounded-xl border px-3 py-2.5 min-[430px]:grid-cols-[1fr_auto] min-[430px]:items-center ${
                    included
                      ? "border-sand-200 bg-white"
                      : "border-sand-100 bg-white/65 opacity-70"
                  }`}
                >
                  <div className="min-w-0">
                    <CategoryBadge category={category} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 min-[430px]:flex min-[430px]:items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant={included ? "secondary" : "ghost"}
                      className="w-full rounded-xl text-[12px] min-[430px]:w-auto"
                      onClick={() => toggleIncluded(category)}
                    >
                      {included ? "Dabei" : "Aus"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={forced ? "primary" : "ghost"}
                      className="w-full rounded-xl text-[12px] min-[430px]:w-auto"
                      disabled={!included}
                      onClick={() => toggleForced(category)}
                    >
                      {forced ? "Pflicht" : "Optional"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {plan.includedCategories.length === 0 ? (
        <p className="rounded-2xl bg-danger-soft px-3 py-2 text-sm text-danger-text">
          Wähle mindestens eine Kategorie aus.
        </p>
      ) : null}

      {forcedOverflow ? (
        <p className="rounded-2xl border border-daily-primary/35 bg-white px-3 py-2 text-sm text-daily-text">
          Du hast mehr Pflicht-Kategorien gewählt als Fragen pro Tag eingestellt
          sind.
        </p>
      ) : null}

      {saveStatus === "error" && saveError ? (
        <p className="rounded-2xl bg-danger-soft px-3 py-2 text-sm text-danger-text">
          {saveError}
        </p>
      ) : null}

      {saveStatus === "saved" && !dirty ? (
        <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm text-success-text">
          Daily-Auswahl gespeichert.
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={!dirty || saveStatus === "saving" || forcedOverflow}
        onClick={onSave}
      >
        {saveStatus === "saving" ? "Speichere..." : "Daily-Auswahl speichern"}
      </Button>
    </section>
  );
}
