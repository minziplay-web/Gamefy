"use client";

import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { CountdownBar } from "@/components/ui/countdown-ring";
import { QuestionReveal } from "@/components/daily/question-reveal";
import type { LiveQuestionState } from "@/lib/types/frontend";

export function LobbyLiveReveal({
  state,
  isHost,
  onAdvance,
  onEnd,
}: {
  state: Extract<LiveQuestionState, { phase: "reveal" }>;
  isHost: boolean;
  onAdvance: () => void;
  onEnd: () => void;
}) {
  const { view, result, countdown } = state;

  return (
    <div className="space-y-5">
      <div className="space-y-2 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-500">
          Frage {view.questionIndex + 1} / {view.totalQuestions}
        </p>
        <CategoryBadge category={view.question.category} size="sm" />
        <CountdownBar timing={countdown} />
      </div>

      <section className="space-y-4 rounded-[28px] border border-sand-200/80 bg-white p-5 shadow-lg shadow-sand-900/5 backdrop-blur">
        <h2 className="text-lg font-semibold leading-snug text-sand-900">
          {view.question.text}
        </h2>
        <QuestionReveal result={result} tone="neutral" />
      </section>

      {isHost ? (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={onAdvance}>
            Nächste Frage
          </Button>
          <Button className="flex-1" variant="ghost" onClick={onEnd}>
            Runde beenden
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-sand-500">
          Host führt gleich zur nächsten Frage.
        </p>
      )}
    </div>
  );
}
