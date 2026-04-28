"use client";

import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { CountdownRing } from "@/components/ui/countdown-ring";
import { QuestionInput } from "@/components/daily/question-input";
import type {
  DailyAnswerDraft,
  LiveQuestionState,
} from "@/lib/types/frontend";

export function LobbyLiveQuestion({
  state,
  onDraftChange,
  onSubmit,
}: {
  state: Extract<LiveQuestionState, { phase: "question" }>;
  onDraftChange: (draft: DailyAnswerDraft) => void;
  onSubmit: (draft: DailyAnswerDraft) => void;
}) {
  const { view, draft, countdown, submitStatus } = state;
  const submitted = submitStatus === "submitted";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
            Frage {view.questionIndex + 1} / {view.totalQuestions}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={view.question.category} size="sm" />
          </div>
        </div>
        <CountdownRing timing={countdown} />
      </div>

      <section className="space-y-4 radius-card border border-sand-200/80 bg-white p-5 shadow-card-raised backdrop-blur">
        <h2 className="text-xl font-semibold leading-snug text-sand-900">
          {view.question.text}
        </h2>
        <QuestionInput
          question={view.question}
          draft={draft}
          disabled={submitted}
          onDraftChange={onDraftChange}
        />
        {submitted ? (
          <div className="flex items-center gap-2 rounded-2xl border border-success-text/25 bg-success-soft px-4 py-3 text-sm font-medium text-success-text">
            <span aria-hidden>✓</span>
            Antwort abgegeben. Warte auf Auflösung.
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={!draft || submitStatus === "submitting"}
            onClick={() => draft && onSubmit(draft)}
          >
            {submitStatus === "submitting" ? "Sende..." : "Antwort abschicken"}
          </Button>
        )}
      </section>
    </div>
  );
}

