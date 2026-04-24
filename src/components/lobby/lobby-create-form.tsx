"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/mapping/categories";
import type { Category, LobbyConfigDraft } from "@/lib/types/frontend";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function LobbyCreateForm({
  initial,
  submitStatus,
  submitError,
  onCancel,
  onSubmit,
}: {
  initial: LobbyConfigDraft;
  submitStatus: "idle" | "submitting" | "error";
  submitError?: string;
  onCancel: () => void;
  onSubmit: (draft: LobbyConfigDraft) => void;
}) {
  const [draft, setDraft] = useState<LobbyConfigDraft>(initial);

  const toggleCategory = (category: Category) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const canSubmit = draft.categories.length > 0 && draft.questionCount > 0;

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Live"
        title="Lobby einrichten"
        subtitle="Konfigurier Kategorien, Rundenzahl und Timing."
      />

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sand-500">
          Kategorien
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((category) => {
            const active = draft.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`flex min-h-10 items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold transition ${
                  active
                    ? "border-coral bg-coral/10 text-sand-900"
                    : "border-sand-100 bg-white text-sand-600"
                }`}
              >
                <span aria-hidden>{CATEGORY_EMOJI[category]}</span>
                {CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sand-500">
          Runde
        </h2>
        <Stepper
          label="Fragen"
          value={draft.questionCount}
          min={1}
          max={30}
          onChange={(v) => setDraft((prev) => ({ ...prev, questionCount: v }))}
        />
        <Stepper
          label="Sekunden pro Frage"
          value={draft.questionDurationSec}
          min={5}
          max={120}
          step={5}
          onChange={(v) =>
            setDraft((prev) => ({ ...prev, questionDurationSec: v }))
          }
        />
        <Stepper
          label="Sekunden Auflösung"
          value={draft.revealDurationSec}
          min={3}
          max={60}
          step={1}
          onChange={(v) =>
            setDraft((prev) => ({ ...prev, revealDurationSec: v }))
          }
        />
      </Card>

      {submitStatus === "error" && submitError ? (
        <ErrorBanner message={submitError} />
      ) : null}

      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          className="flex-1"
          disabled={!canSubmit || submitStatus === "submitting"}
          onClick={() => onSubmit(draft)}
        >
          {submitStatus === "submitting" ? "Wird erstellt..." : "Lobby starten"}
        </Button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-sand-800">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={dec}
          aria-label={`${label} verringern`}
          className="flex size-12 items-center justify-center rounded-full bg-sand-100 text-xl font-semibold text-sand-800 transition hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={value <= min}
        >
          −
        </button>
        <span className="w-12 text-center text-lg font-semibold tabular-nums text-sand-900">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          aria-label={`${label} erhöhen`}
          className="flex size-12 items-center justify-center rounded-full bg-sand-100 text-xl font-semibold text-sand-800 transition hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}
