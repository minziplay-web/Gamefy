"use client";

import { type ReactNode, useMemo, useState } from "react";

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
  helper: string;
}> = [
  {
    type: "open_text",
    label: "Freitext",
    helper: "Alle tippen ihre Antwort selbst ein.",
  },
  {
    type: "single_choice",
    label: "Eine Person",
    helper: "Alle wählen genau ein Mitglied.",
  },
  {
    type: "multi_choice",
    label: "Mehrere Personen",
    helper: "Alle können mehrere Mitglieder auswählen.",
  },
  {
    type: "either_or",
    label: "Zwei Optionen",
    helper: "Alle entscheiden sich zwischen zwei Antworten.",
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

  const helperCopy = `Verfügbar: ${status.availableTrophies}`;

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <HeaderStatBox
            eyebrow="Deine Frage"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-xl">🏆</span>
                <span className="text-base font-semibold">Daily-Slot</span>
              </span>
            }
          />
          <HeaderStatBox
            eyebrow="Freie Trophäen"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-xl">🏆</span>
                <span className="tabular-nums">{status.availableTrophies}</span>
              </span>
            }
          />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-xl font-semibold text-sand-900">Eigene Frage</h2>
          <p className="text-sm text-sand-700">
            Für <strong>{formatBerlinDateLabel(status.targetDateKey)}</strong>
          </p>
        </div>
        <p className="text-xs leading-relaxed text-sand-500">
          Verdient: {status.earnedTrophies}
          {` · Eingesetzt: ${status.spentTrophies} · ${helperCopy}`}
        </p>
      </div>

      {status.pendingQuestion ? (
        <div className="space-y-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-900">
            Deine Frage für {formatBerlinDateLabel(status.targetDateKey)} ist gespeichert.
          </p>
          <div className="space-y-2 rounded-2xl bg-white/80 p-3">
            <p className="text-sm font-semibold text-sand-900">
              {status.pendingQuestion.text}
            </p>
            <p className="text-xs text-sand-500">
              Typ: {labelForType(status.pendingQuestion.type)}
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
        <div className="rounded-2xl border border-dashed border-sand-200 bg-sand-50 px-4 py-3 text-center text-sm text-sand-600">
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
          <div className="grid gap-2 sm:grid-cols-2">
            {QUESTION_TYPE_OPTIONS.map((option) => {
              const active = draft.type === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, type: option.type }))}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-coral bg-coral-soft/35"
                      : "border-sand-200 bg-white hover:border-sand-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-sand-900">{option.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-sand-500">
                    {option.helper}
                  </p>
                </button>
              );
            })}
          </div>

          <TextArea
            label="Deine Frage"
            placeholder="Welche Frage soll morgen im Daily auftauchen?"
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
                placeholder="Erste Antwortmöglichkeit"
                value={draft.optionA}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, optionA: event.target.value }))
                }
                maxLength={60}
              />
              <TextField
                label="Option B"
                placeholder="Zweite Antwortmöglichkeit"
                value={draft.optionB}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, optionB: event.target.value }))
                }
                maxLength={60}
              />
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Speichert..." : "Frage Abschicken"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

function labelForType(type: CustomDailyQuestionDraft["type"]) {
  return QUESTION_TYPE_OPTIONS.find((option) => option.type === type)?.label ?? "Frage";
}

function HeaderStatBox({
  eyebrow,
  value,
}: {
  eyebrow: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-[132px] shrink-0 flex-col items-center justify-center rounded-2xl bg-yellow-100 px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-800">
        {eyebrow}
      </p>
      <div className="mt-0.5 text-2xl font-semibold text-yellow-900">{value}</div>
    </div>
  );
}
