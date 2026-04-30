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
    label: "Mehrere Optionen",
    icon: "A/B",
  },
];

const INITIAL_DRAFT: CustomDailyQuestionDraft = {
  type: "open_text",
  text: "",
  options: ["", ""],
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
      const options = draft.options.map((option) => option.trim()).filter(Boolean);
      if (options.length < 2) {
        return "Bitte gib mindestens zwei Antwortmöglichkeiten an.";
      }
    }

    return null;
  }, [canRedeem, draft]);

  return (
    <Card className="space-y-4 border-award-primary/25 bg-white shadow-card-flat">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-award-text">
            Eigene Frage
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-tight text-sand-900">
            Für {formatBerlinDateLabel(status.targetDateKey)}
          </h2>
        </div>
        <div className="grid min-w-[5.25rem] justify-items-end gap-1">
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full bg-award-soft px-3 text-sm font-bold tabular-nums text-award-text ring-1 ring-award-primary/25">
            <span aria-hidden>🏆</span>
            {status.availableTrophies}
          </div>
          <p className="text-[10px] font-medium text-sand-500">verfügbar</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-2">
        <TrophyStat label="Verdient" value={status.earnedTrophies} />
        <TrophyStat label="Bonus" value={status.bonusTrophies} />
        <TrophyStat label="Eingesetzt" value={status.spentTrophies} />
      </div>

      <div className="space-y-4">
        {status.pendingQuestion ? (
          <div className="space-y-3 rounded-2xl border border-award-primary/35 bg-award-soft/70 p-4">
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
          <div className="rounded-2xl border border-dashed border-award-primary/35 bg-sand-50 px-4 py-3 text-center text-sm text-sand-600">
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
                  options: draft.options.map((option) => option.trim()).filter(Boolean),
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
                    aria-pressed={active}
                    onClick={() =>
                      setDraft((current) => ({ ...current, type: option.type }))
                    }
                    className={`flex min-h-14 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-award-primary bg-award-soft text-sand-950"
                        : "border-slate-200 bg-white text-sand-800 hover:border-award-primary/45"
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
                    <span className="text-sm font-semibold leading-tight">
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
              <OptionEditor draft={draft} setDraft={setDraft} />
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

function TrophyStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2 text-center ring-1 ring-sand-200">
      <p className="text-sm font-bold tabular-nums text-sand-900">{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-medium text-sand-500">{label}</p>
    </div>
  );
}

function OptionEditor({
  draft,
  setDraft,
}: {
  draft: CustomDailyQuestionDraft;
  setDraft: React.Dispatch<React.SetStateAction<CustomDailyQuestionDraft>>;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-sand-200 bg-sand-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-sand-900">Antwortoptionen</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold tabular-nums text-sand-500 ring-1 ring-sand-200">
          {draft.options.length}/6
        </span>
      </div>
      <div className="grid gap-2">
        {draft.options.map((option, index) => (
          <div key={index} className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-white text-xs font-bold text-award-text ring-1 ring-award-primary/25">
              {String.fromCharCode(65 + index)}
            </span>
            <TextField
              label=""
              placeholder={index === 0 ? "Erste Antwort" : index === 1 ? "Zweite Antwort" : "Weitere Antwort"}
              value={option}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  options: current.options.map((currentOption, optionIndex) =>
                    optionIndex === index ? event.target.value : currentOption,
                  ),
                }))
              }
              maxLength={60}
            />
            <button
              type="button"
              aria-label={`Option ${String.fromCharCode(65 + index)} entfernen`}
              disabled={index < 2}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  options: current.options.filter((_, optionIndex) => optionIndex !== index),
                }))
              }
              className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-sand-600 transition hover:border-danger-text/40 hover:text-danger-text disabled:invisible"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full border border-dashed border-award-primary/35 bg-white text-award-text hover:bg-award-soft"
        disabled={draft.options.length >= 6}
        onClick={() =>
          setDraft((current) => ({
            ...current,
            options: [...current.options, ""],
          }))
        }
      >
        Option hinzufügen
      </Button>
    </div>
  );
}

function labelForType(type: CustomDailyQuestionDraft["type"]) {
  return (
    QUESTION_TYPE_OPTIONS.find((option) => option.type === type)?.label ??
    "Frage"
  );
}
