"use client";

import { CategoryBadge } from "@/components/ui/category-badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type { AdminDailyCategoryPlan, Category } from "@/lib/types/frontend";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

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
    <section className="space-y-4 rounded-3xl border border-white/60 bg-white/85 p-4 shadow-card-flat">
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
        <span className="rounded-full bg-coral/10 px-3 py-1 text-coral-strong">
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
              className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 ${
                included
                  ? "border-sand-200 bg-sand-50/80"
                  : "border-sand-100 bg-sand-50/40 opacity-70"
              }`}
            >
              <CategoryBadge category={category} size="sm" />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={included ? "secondary" : "ghost"}
                  onClick={() => toggleIncluded(category)}
                >
                  {included ? "Dabei" : "Raus"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={forced ? "primary" : "ghost"}
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
        <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Wähle mindestens eine Kategorie aus.
        </p>
      ) : null}

      {forcedOverflow ? (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Du hast mehr Pflicht-Kategorien gewählt als Fragen pro Tag eingestellt
          sind.
        </p>
      ) : null}

      {saveStatus === "error" && saveError ? (
        <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {saveError}
        </p>
      ) : null}

      {saveStatus === "saved" && !dirty ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
