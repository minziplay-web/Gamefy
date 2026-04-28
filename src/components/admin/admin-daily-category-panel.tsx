"use client";

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
    <section className="space-y-4 rounded-3xl border border-sand-200/80 bg-white p-4 shadow-card-flat">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-500">
          Daily-Kategorien
        </p>
        <p className="text-sm text-sand-700">
          Lege fest, welche Kategorien heute in den Pool dürfen und welche sicher
          drankommen sollen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-sand-600">
        <span className="rounded-full bg-sand-100 px-3 py-1">
          {plan.includedCategories.length} berücksichtigt
        </span>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-brand-primary">
          {plan.forcedCategories.length} Pflicht
        </span>
      </div>

      <div className="space-y-2">
        {ALL_CATEGORIES.map((category) => {
          const included = plan.includedCategories.includes(category);
          const forced = plan.forcedCategories.includes(category);

          return (
            <div
              key={category}
              className={`grid gap-3 rounded-2xl border px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center ${
                included
                  ? "border-sand-200 bg-sand-50/80"
                  : "border-sand-100 bg-sand-50/40 opacity-70"
              }`}
            >
              <div className="min-w-0">
                <CategoryBadge category={category} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Button
                  type="button"
                  size="sm"
                  variant={included ? "secondary" : "ghost"}
                  className="w-full sm:w-auto"
                  onClick={() => toggleIncluded(category)}
                >
                  {included ? "Dabei" : "Aus"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={forced ? "primary" : "ghost"}
                  className="w-full sm:w-auto"
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
