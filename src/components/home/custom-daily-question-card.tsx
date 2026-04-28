"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextArea, TextField } from "@/components/ui/text-field";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import type {
  CustomDailyQuestionDraft,
  CustomDailyQuestionStatus,
} from "@/lib/types/frontend";

const QUESTION_TYPE_OPTIONS: Array<{
  type: CustomDailyQuestionDraft["type"];
  label: string;
  icon: string;
}> = [
  {
    type: "open_text",
    label: "Freitext",
    icon: "Aa",
  },
  {
    type: "single_choice",
    label: "Eine Person",
    icon: "1",
  },
  {
    type: "multi_choice",
    label: "Mehrere Personen",
    icon: "✓✓",
  },
  {
    type: "either_or",
    label: "Zwei Optionen",
    icon: "A/B",
  },
];

const INITIAL_DRAFT: CustomDailyQuestionDraft = {
  type: "open_text",
  text: "",
  optionA: "",
  optionB: "",
};

export function CustomDailyQuestionCard({
  status,
  onSubmit,
}: {
  status: CustomDailyQuestionStatus;
  onSubmit: (draft: CustomDailyQuestionDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<CustomDailyQuestionDraft>(INITIAL_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRedeem = status.availableTrophies > 0 && !status.pendingQuestion;

  const validationError = useMemo(() => {
    if (!canRedeem) {
      return null;
    }

    if (draft.text.trim().length < 8) {
      return "Deine Frage braucht noch ein bisschen mehr Fleisch.";
    }

    if (draft.type === "either_or") {
      if (!draft.optionA.trim() || !draft.optionB.trim()) {
        return "Bitte gib beide Antwortmöglichkeiten an.";
      }
    }

    return null;
  }, [canRedeem, draft]);

  return (
    <Card className="overflow-hidden border-award-primary/35 bg-white !p-0 shadow-[0_18px_42px_-28px_rgba(23,32,49,0.24)]">
      <div className="bg-linear-to-r from-award-primary via-award-soft to-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-award-text">
              Eigene Frage
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-tight text-sand-900">
              Für {formatBerlinDateLabel(status.targetDateKey)}
            </h2>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/85 text-2xl text-award-text shadow-card-flat ring-1 ring-award-primary/30">
            <span aria-hidden>🏆</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-award-primary/25 bg-white px-4 py-3 shadow-card-flat">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-award-text">
              Verfügbar
            </p>
            <p className="mt-0.5 text-xs text-sand-500">
              {status.earnedTrophies} verdient · {status.spentTrophies} eingesetzt
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-award-soft px-3 py-1.5 text-xl font-semibold tabular-nums text-award-text ring-1 ring-award-primary/30">
            <span aria-hidden>🏆</span>
            {status.availableTrophies}
          </div>
        </div>

        {status.pendingQuestion ? (
          <div className="space-y-3 rounded-2xl border border-award-primary/45 bg-award-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-award-text">
                Frage gespeichert
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-award-text ring-1 ring-award-primary/25">
                {labelForType(status.pendingQuestion.type)}
              </span>
            </div>
            <div className="space-y-2 rounded-2xl border border-award-primary/25 bg-white p-3 shadow-card-flat">
              <p className="text-sm font-semibold text-sand-900">
                {status.pendingQuestion.text}
              </p>
              {status.pendingQuestion.options ? (
                <div className="flex flex-wrap gap-2">
                  {status.pendingQuestion.options.map((option) => (
                    <span
                      key={option}
                      className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-sand-700"
                    >
                      {option}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!status.pendingQuestion && status.availableTrophies <= 0 ? (
          <div className="rounded-2xl border border-dashed border-award-primary/35 bg-white px-4 py-3 text-center text-sm text-sand-600">
            Sammle Trophäen, indem du das beste Meme erstellst!
          </div>
        ) : null}

        {canRedeem ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (validationError) {
                setError(validationError);
                return;
              }

              setIsSubmitting(true);
              setError(null);
              try {
                await onSubmit({
                  ...draft,
                  text: draft.text.trim(),
                  optionA: draft.optionA.trim(),
                  optionB: draft.optionB.trim(),
                });
                setDraft(INITIAL_DRAFT);
              } catch (submitError) {
                setError(
                  submitError instanceof Error && submitError.message
                    ? submitError.message
                    : "Die Frage konnte nicht gespeichert werden.",
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TYPE_OPTIONS.map((option) => {
                const active = draft.type === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({ ...current, type: option.type }))
                    }
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-award-primary bg-award-soft"
                        : "border-slate-200 bg-white hover:border-award-primary/45"
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        active
                          ? "bg-award-primary text-award-text"
                          : "bg-sand-100 text-sand-600"
                      }`}
                    >
                      {option.icon}
                    </span>
                    <span className="text-sm font-semibold leading-tight text-sand-900">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <TextArea
              label="Deine Frage"
              placeholder="Welche Frage soll im Daily auftauchen?"
              value={draft.text}
              onChange={(event) =>
                setDraft((current) => ({ ...current, text: event.target.value }))
              }
              maxLength={180}
            />

            {draft.type === "either_or" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Option A"
                  placeholder="Erste Antwort"
                  value={draft.optionA}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      optionA: event.target.value,
                    }))
                  }
                  maxLength={60}
                />
                <TextField
                  label="Option B"
                  placeholder="Zweite Antwort"
                  value={draft.optionB}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      optionB: event.target.value,
                    }))
                  }
                  maxLength={60}
                />
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-danger-text/18 bg-danger-soft px-4 py-3 text-sm font-medium text-danger-text">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              variant="daily"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Speichert..." : "Frage Abschicken"}
            </Button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}

function labelForType(type: CustomDailyQuestionDraft["type"]) {
  return (
    QUESTION_TYPE_OPTIONS.find((option) => option.type === type)?.label ??
    "Frage"
  );
}
