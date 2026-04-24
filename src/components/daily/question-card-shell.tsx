"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { QuestionInput } from "@/components/daily/question-input";
import { QuestionReveal } from "@/components/daily/question-reveal";
import type { DailyAnswerDraft, DailyQuestionCardState } from "@/lib/types/frontend";

interface Props {
  state: DailyQuestionCardState;
  onDraftChange: (next: DailyAnswerDraft) => void;
  onSubmit: (draft: DailyAnswerDraft) => void;
  onRetry?: () => void;
}

function draftIsComplete(draft: DailyAnswerDraft | undefined): draft is DailyAnswerDraft {
  if (!draft) return false;
  switch (draft.type) {
    case "single_choice":
      return Boolean(draft.selectedUserId);
    case "open_text":
      return draft.textAnswer.trim().length > 0;
    case "duel_1v1":
      return Boolean(draft.selectedSide);
    case "duel_2v2":
      return Boolean(draft.selectedTeam);
    case "either_or":
      return draft.selectedOptionIndex !== undefined;
  }
}

export function QuestionCardShell({ state, onDraftChange, onSubmit, onRetry }: Props) {
  const { question } = state;

  return (
    <section className="radius-card border border-white/60 bg-white/85 p-5 shadow-card-raised backdrop-blur">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={question.category} size="sm" />
          {question.anonymous ? <Badge tone="neutral" size="sm">Anonym</Badge> : null}
          <span className="ml-auto text-[11px] font-semibold tabular-nums text-sand-500">
            {question.indexInRun + 1} / {question.totalInRun}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-sand-900">
          {question.text}
        </h3>
      </header>
      <div className="mt-4">
        <CardBody
          state={state}
          onDraftChange={onDraftChange}
          onSubmit={onSubmit}
          onRetry={onRetry}
        />
      </div>
    </section>
  );
}

function CardBody({
  state,
  onDraftChange,
  onSubmit,
  onRetry,
}: Props) {
  if (state.phase === "submitted_waiting_reveal") {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-800">
        Antwort abgegeben. Ergebnis kommt nach Tagesende.
      </div>
    );
  }

  if (state.phase === "revealed") {
    return (
      <div className="space-y-3">
        <QuestionReveal result={state.result} />
      </div>
    );
  }

  const currentDraft =
    state.phase === "submitting"
      ? state.draft
      : state.phase === "error"
        ? state.lastDraft
        : state.draft;
  const loading = state.phase === "submitting";
  const disabled = loading || !draftIsComplete(currentDraft);

  return (
    <div className="space-y-4">
      <QuestionInput
        question={state.question}
        draft={currentDraft}
        disabled={loading}
        onDraftChange={onDraftChange}
      />
      {state.phase === "error" ? (
        <ErrorBanner
          message={state.message}
          action={
            onRetry ? (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Nochmal
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <Button
        className="w-full"
        disabled={disabled}
        onClick={() => {
          if (currentDraft && draftIsComplete(currentDraft)) {
            onSubmit(currentDraft);
          }
        }}
      >
        {loading ? "Wird gesendet..." : "Antwort abschicken"}
      </Button>
    </div>
  );
}

